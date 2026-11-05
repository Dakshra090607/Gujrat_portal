import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { db, withTransaction } from '../../config/database.js';
import { authenticate, requireAdministrator } from '../auth/middleware.js';

const router = Router();
const workflowStatuses = ['QUEUED', 'IN_REVIEW', 'RETURNED_FOR_CORRECTION', 'REJECTED', 'APPROVED'];
const userRoles = ['GENERAL_USER', 'PROFESSIONAL_USER', 'REVIEWER', 'ADMIN'];
const canonicalModels = ['Chapter', 'Regulation', 'RegulatoryNode', 'RegulatoryTable', 'Definition', 'RegulatoryParameter', 'RegulatoryCrossReference'];

async function lockAdminChanges(client) {
  await db.query("SELECT pg_advisory_xact_lock(hashtext('buildrule-admin-account-changes'))", [], client);
}

router.get('/overview', authenticate, requireAdministrator, async (_req, res) => {
  const [sourceResult, workflowResult, verifiedResult] = await Promise.all([
    db.query(`SELECT
      (SELECT count(*)::integer FROM buildrule_records WHERE model = 'SourceDocument') AS documents,
      count(*)::integer AS pages,
      count(*) FILTER (WHERE data->>'textExtractionStatus' = 'EXTRACTED')::integer AS extracted_pages,
      COALESCE(sum(
        jsonb_array_length(CASE WHEN jsonb_typeof(data->'candidateSnippets') = 'array' THEN data->'candidateSnippets' ELSE '[]'::jsonb END) +
        jsonb_array_length(CASE WHEN jsonb_typeof(data->'tableCandidates') = 'array' THEN data->'tableCandidates' ELSE '[]'::jsonb END)
      ), 0)::integer AS candidates
      FROM buildrule_records WHERE model = 'SourcePage'`),
    db.query("SELECT data->>'workflowStatus' AS status, count(*)::integer AS count FROM buildrule_records WHERE model = 'RegulatoryReviewItem' GROUP BY data->>'workflowStatus'"),
    db.query('SELECT model, count(*)::integer AS count FROM buildrule_records WHERE model = ANY($1::text[]) AND data->>\'verificationStatus\' = \'VERIFIED\' GROUP BY model', [canonicalModels]),
  ]);
  const source = sourceResult.rows[0];
  const workflow = Object.fromEntries(workflowStatuses.map((status) => [status, 0]));
  for (const item of workflowResult.rows) if (Object.hasOwn(workflow, item.status)) workflow[item.status] = item.count;
  const verifiedByModel = Object.fromEntries(verifiedResult.rows.map((row) => [row.model, row.count]));
  const verifiedRecords = Object.values(verifiedByModel).reduce((sum, count) => sum + count, 0);
  const pendingCount = workflow.QUEUED + workflow.IN_REVIEW + workflow.RETURNED_FOR_CORRECTION;
  const totalCount = Object.values(workflow).reduce((sum, count) => sum + count, 0);
  res.set('Cache-Control', 'no-store');
  res.json({ data: {
    source: { documentCount: source.documents, pageCount: source.pages, extractedPageCount: source.extracted_pages, candidateCount: source.candidates },
    review: { workflow, pendingCount, totalCount, backfillRequired: source.candidates > 0 && totalCount === 0 },
    verified: { recordCount: verifiedRecords, parameterCount: verifiedByModel.RegulatoryParameter ?? 0 },
  } });
});

router.get('/users', authenticate, requireAdministrator, async (req, res) => {
  const parsed = z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(25),
    role: z.enum(userRoles).optional(),
    q: z.string().trim().max(120).optional(),
  }).safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: { code: 'INVALID_USER_QUERY', message: 'Check the role, search text, or page values.' } });
  const { page, pageSize, role, q } = parsed.data;
  const values = [];
  const where = [];
  if (role) where.push(`role = $${values.push(role)}`);
  if (q) where.push(`(name ILIKE $${values.push(`%${q.replace(/[%_\\]/g, '\\$&')}%`)} ESCAPE '\\' OR email ILIKE $${values.length} ESCAPE '\\')`);
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const count = await db.query(`SELECT count(*)::integer AS total FROM app_users ${clause}`, values);
  const records = await db.query(`SELECT id, name, email, role, is_active, created_at, last_login_at FROM app_users ${clause} ORDER BY created_at DESC LIMIT $${values.push(pageSize)} OFFSET $${values.push((page - 1) * pageSize)}`, values);
  res.set('Cache-Control', 'no-store');
  res.json({ data: records.rows.map(adminUser), pagination: { page, pageSize, total: count.rows[0].total, pages: Math.ceil(count.rows[0].total / pageSize) } });
});

router.get('/users/:id', authenticate, requireAdministrator, async (req, res) => {
  const id = z.string().uuid().safeParse(req.params.id);
  if (!id.success) return res.status(400).json({ error: { code: 'INVALID_USER_ID', message: 'User id is invalid.' } });
  const result = await db.query('SELECT id, name, email, role, is_active, created_at, updated_at, last_login_at FROM app_users WHERE id = $1', [id.data]);
  if (!result.rowCount) return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found.' } });
  const audits = await db.query(`SELECT a.id, a.action, a.old_value, a.new_value, a.note, a.created_at,
      COALESCE(actor.name, a.actor_label) AS actor_name, actor.email AS actor_email
    FROM role_change_audit a LEFT JOIN app_users actor ON actor.id = a.actor_user_id
    WHERE a.target_user_id = $1 ORDER BY a.created_at DESC LIMIT 100`, [id.data]);
  res.set('Cache-Control', 'no-store');
  res.json({ data: { ...adminUser(result.rows[0]), updatedAt: result.rows[0].updated_at, roleAudit: audits.rows } });
});

router.patch('/users/:id/role', authenticate, requireAdministrator, async (req, res) => {
  const id = z.string().uuid().safeParse(req.params.id);
  const body = z.object({ role: z.enum(userRoles), note: z.string().trim().min(1).max(1000) }).strict().safeParse(req.body);
  if (!id.success) return res.status(400).json({ error: { code: 'INVALID_USER_ID', message: 'User id is invalid.' } });
  if (!body.success) return res.status(400).json({ error: { code: 'INVALID_ROLE', message: 'Choose a valid account role.' } });
  const user = await withTransaction(async (client) => {
    await lockAdminChanges(client);
    const existing = await db.query('SELECT id, name, email, role, is_active FROM app_users WHERE id = $1 FOR UPDATE', [id.data], client);
    if (!existing.rowCount) return null;
    const target = existing.rows[0];
    if (String(target.id) === req.user._id && body.data.role !== 'ADMIN') throw Object.assign(new Error('You cannot remove your own administrator access.'), { status: 409, code: 'CANNOT_CHANGE_OWN_ROLE' });
    if (target.role === 'ADMIN' && body.data.role !== 'ADMIN' && target.is_active) {
      const count = await db.query("SELECT count(*)::integer AS count FROM app_users WHERE role = 'ADMIN' AND is_active", [], client);
      if (count.rows[0].count <= 1) throw Object.assign(new Error('The last active administrator cannot be demoted.'), { status: 409, code: 'LAST_ADMIN_REQUIRED' });
    }
    if (target.role === body.data.role) return target;
    const updated = await db.query('UPDATE app_users SET role = $2, updated_at = now() WHERE id = $1 RETURNING id, name, email, role, is_active', [id.data, body.data.role], client);
    await db.query(`INSERT INTO role_change_audit (id, actor_user_id, target_user_id, action, old_value, new_value, note)
      VALUES ($1, $2, $3, 'ROLE_CHANGED', $4, $5, $6)`, [randomUUID(), req.user._id, id.data, target.role, body.data.role, body.data.note], client);
    return updated.rows[0];
  });
  if (!user) return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found.' } });
  res.json({ data: adminUser(user) });
});

router.patch('/users/:id/status', authenticate, requireAdministrator, async (req, res) => {
  const id = z.string().uuid().safeParse(req.params.id);
  const body = z.object({ isActive: z.boolean(), note: z.string().trim().min(1).max(1000) }).strict().safeParse(req.body);
  if (!id.success) return res.status(400).json({ error: { code: 'INVALID_USER_ID', message: 'User id is invalid.' } });
  if (!body.success) return res.status(400).json({ error: { code: 'INVALID_ACCOUNT_STATUS', message: 'Account status must be enabled or disabled.' } });
  const user = await withTransaction(async (client) => {
    await lockAdminChanges(client);
    const existing = await db.query('SELECT id, name, email, role, is_active FROM app_users WHERE id = $1 FOR UPDATE', [id.data], client);
    if (!existing.rowCount) return null;
    const target = existing.rows[0];
    if (String(target.id) === req.user._id && !body.data.isActive) throw Object.assign(new Error('You cannot disable your own account.'), { status: 409, code: 'CANNOT_DISABLE_SELF' });
    if (target.role === 'ADMIN' && target.is_active && !body.data.isActive) {
      const count = await db.query("SELECT count(*)::integer AS count FROM app_users WHERE role = 'ADMIN' AND is_active", [], client);
      if (count.rows[0].count <= 1) throw Object.assign(new Error('The last active administrator cannot be disabled.'), { status: 409, code: 'LAST_ADMIN_REQUIRED' });
    }
    if (target.is_active === body.data.isActive) return target;
    const updated = await db.query('UPDATE app_users SET is_active = $2, updated_at = now() WHERE id = $1 RETURNING id, name, email, role, is_active', [id.data, body.data.isActive], client);
    await db.query(`INSERT INTO role_change_audit (id, actor_user_id, target_user_id, action, old_value, new_value, note)
      VALUES ($1, $2, $3, 'ACCOUNT_STATUS_CHANGED', $4, $5, $6)`, [randomUUID(), req.user._id, id.data, String(target.is_active), String(body.data.isActive), body.data.note], client);
    return updated.rows[0];
  });
  if (!user) return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found.' } });
  res.json({ data: adminUser(user) });
});

function adminUser(user) {
  return { id: String(user.id), name: user.name, email: user.email, role: user.role, isActive: user.is_active, createdAt: user.created_at, lastLoginAt: user.last_login_at };
}

export default router;
