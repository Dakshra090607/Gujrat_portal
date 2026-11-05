import { Router } from 'express';
import { z } from 'zod';
import { db } from '../../config/database.js';
import { authenticate, publicUser } from './middleware.js';

const router = Router();
router.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// Registration, sign-in, email verification, and password recovery are handled
// directly by Neon Managed Auth. This API maps the verified identity to the
// app-specific role record used by regulatory authorization.
router.post('/accept-terms', authenticate, async (req, res) => {
  const parsed = z.object({ accepted: z.literal(true) }).strict().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { code: 'TERMS_REQUIRED', message: 'Accept the terms to create a BuildRule workspace profile.' } });
  const result = await db.query(
    'UPDATE app_users SET terms_accepted_at = COALESCE(terms_accepted_at, now()), updated_at = now() WHERE id = $1 RETURNING terms_accepted_at',
    [req.user._id],
  );
  res.json({ data: { acceptedAt: result.rows[0].terms_accepted_at } });
});

router.get('/me', authenticate, async (req, res) => {
  const result = await db.query('UPDATE app_users SET last_login_at = now() WHERE id = $1 RETURNING id, name, email, role', [req.user._id]);
  res.json({ data: { user: publicUser({ ...result.rows[0], _id: result.rows[0].id }) } });
});

router.post('/logout', authenticate, (_req, res) => {
  // Neon Auth revokes the browser session. Existing signed JWTs can remain
  // valid until their short 15-minute expiry, as documented by Neon.
  res.json({ data: { loggedOut: true } });
});

export default router;
