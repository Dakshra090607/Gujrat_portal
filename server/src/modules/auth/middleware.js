import { createRemoteJWKSet, decodeJwt, jwtVerify } from 'jose';
import { db, withTransaction } from '../../config/database.js';

let remoteJwks;
function authSettings() {
  const baseUrl = process.env.NEON_AUTH_BASE_URL;
  const jwksUrl = process.env.NEON_AUTH_JWKS_URL;
  if (!baseUrl || !jwksUrl) throw new Error('Neon Auth is not configured. Run `neon env pull` from the project root.');
  remoteJwks ??= createRemoteJWKSet(new URL(jwksUrl));
  // Neon Auth endpoints include the database path, while JWT `iss` is the
  // Auth service origin. Pin to that origin and to this branch's JWKS URL.
  return { issuer: new URL(baseUrl).origin, remoteJwks };
}

export async function verifyNeonAccessToken(token) {
  const { issuer, remoteJwks: jwks } = authSettings();
  const { payload } = await jwtVerify(token, jwks, { issuer, algorithms: ['EdDSA'] });
  if (typeof payload.sub !== 'string' || typeof payload.email !== 'string') throw new Error('The Neon Auth token is missing user identity claims.');
  return payload;
}

async function getOrCreateAppUser(claims) {
  const authUserId = claims.sub;
  const email = claims.email.trim().toLowerCase();
  const name = String(claims.name ?? email.split('@')[0]).trim().slice(0, 120) || 'BuildRule user';
  const user = await withTransaction(async (client) => {
    let result = await db.query('SELECT * FROM app_users WHERE auth_user_id = $1 FOR UPDATE', [authUserId], client);
    let current = result.rows[0];
    if (!current) {
      result = await db.query('SELECT * FROM app_users WHERE lower(email) = $1 FOR UPDATE', [email], client);
      current = result.rows[0];
    }
    if (current?.auth_user_id && current.auth_user_id !== authUserId) {
      throw Object.assign(new Error('This email is already linked to another sign-in identity.'), { status: 403, code: 'ACCOUNT_ALREADY_LINKED' });
    }
    if (current && current.role !== 'GENERAL_USER' && claims.email_verified !== true && claims.emailVerified !== true) {
      throw Object.assign(new Error('Verify this email before its existing review or administrator role can be linked.'), { status: 403, code: 'EMAIL_VERIFICATION_REQUIRED' });
    }
    if (current) {
      const updated = await db.query(
        `UPDATE app_users SET auth_user_id = $2, email = $3,
           name = CASE WHEN $4 <> '' THEN $4 ELSE name END, updated_at = now()
         WHERE id = $1 AND (auth_user_id IS NULL OR auth_user_id = $2)
         RETURNING id, name, email, role, is_active, auth_user_id, last_login_at, terms_accepted_at, created_at, updated_at`,
        [current.id, authUserId, email, name], client,
      );
      if (!updated.rowCount) throw Object.assign(new Error('This email is already linked to another sign-in identity.'), { status: 403, code: 'ACCOUNT_ALREADY_LINKED' });
      return updated.rows[0];
    }
    const inserted = await db.query(
      `INSERT INTO app_users (id, auth_user_id, name, email, role)
       VALUES (gen_random_uuid(), $1, $2, $3, 'GENERAL_USER')
       RETURNING id, name, email, role, is_active, auth_user_id, last_login_at, terms_accepted_at, created_at, updated_at`,
      [authUserId, name, email], client,
    );
    return inserted.rows[0];
  });
  if (!user.is_active) throw Object.assign(new Error('This account is disabled.'), { status: 403, code: 'ACCOUNT_DISABLED' });
  return user;
}

function toAppUser(row) {
  return {
    _id: String(row.id),
    authUserId: row.auth_user_id,
    name: row.name,
    email: row.email,
    role: row.role,
    isActive: row.is_active,
    termsAcceptedAt: row.terms_accepted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function authenticate(req, res, next) {
  const header = req.get('authorization') ?? '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Sign in to continue.' } });
  let claims;
  try {
    claims = await verifyNeonAccessToken(match[1]);
  } catch (error) {
    const failedClaim = typeof error.claim === 'string' ? `; claim=${error.claim}` : '';
    let issuers = '';
    try {
      const safeIssuer = (value) => typeof value === 'string' ? value.replace(/[\r\n\t]/g, '').slice(0, 220) : '<missing>';
      issuers = `; actual_iss=${safeIssuer(decodeJwt(match[1]).iss)}; expected_iss=${safeIssuer(process.env.NEON_AUTH_BASE_URL)}`;
    } catch { /* Keep diagnostics bounded when an untrusted token has no valid issuer. */ }
    console.error(`Neon Auth token verification failed: ${error.code ?? error.name ?? 'unknown error'}${failedClaim}${issuers}`);
    return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Your Neon Auth session is invalid or expired. Sign in again.' } });
  }
  try {
    const row = await getOrCreateAppUser(claims);
    req.authClaims = claims;
    req.user = toAppUser(row);
    return next();
  } catch (error) {
    if (error.status === 403) return res.status(403).json({ error: { code: error.code, message: error.message } });
    if (error.code === '23505') return res.status(403).json({ error: { code: 'ACCOUNT_ALREADY_LINKED', message: 'This email is already linked to another sign-in identity.' } });
    console.error(`Neon Auth profile lookup failed: ${error.code ?? 'database error'}`);
    return res.status(503).json({ error: { code: 'DATABASE_UNAVAILABLE', message: 'The account service is temporarily unavailable.' } });
  }
}

export function requireReviewer(req, res, next) {
  if (!['REVIEWER', 'ADMIN'].includes(req.user?.role)) {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'A reviewer or administrator account is required.' } });
  }
  next();
}

export function requireAdministrator(req, res, next) {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'An administrator account is required.' } });
  }
  next();
}

export function publicUser(user) {
  return { id: String(user._id), name: user.name, email: user.email, role: user.role };
}
