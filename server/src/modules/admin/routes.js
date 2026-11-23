import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { db, withTransaction } from '../../config/database.js';
import { authenticate, requireAdministrator } from '../auth/middleware.js';
import { getBuiltInFsiRows, getFsiRowKey } from '../compliance/fsi-calculation.js';
import calculatorAuthoritiesRouter from './calculator-authorities.js';
import calculatorZonesRouter from './calculator-zones.js';
import calculatorUseCodesRouter from './calculator-use-codes.js';
import calculatorRoadWidthRouter from './calculator-road-width.js';
import calculatorFsiSchedulesRouter from './calculator-fsi-schedules.js';

const router = Router();
router.use(calculatorAuthoritiesRouter);
router.use(calculatorZonesRouter);
router.use(calculatorUseCodesRouter);
router.use(calculatorRoadWidthRouter);
router.use(calculatorFsiSchedulesRouter);
const workflowStatuses = ['QUEUED', 'IN_REVIEW', 'RETURNED_FOR_CORRECTION', 'REJECTED', 'APPROVED'];
const userRoles = ['GENERAL_USER', 'PROFESSIONAL_USER', 'REVIEWER', 'ADMIN'];
const canonicalModels = ['Chapter', 'Regulation', 'RegulatoryNode', 'RegulatoryTable', 'Definition', 'RegulatoryParameter', 'RegulatoryCrossReference'];
const developmentCategories = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7A', 'D7B', 'D8', 'D9', 'D10'];
const fsiUseConditions = ['ALL', 'RESIDENTIAL_COMMERCIAL', 'INDUSTRIAL', 'AGRICULTURAL'];
const calculatorFsiRowSchema = z.object({
  categoryCode: z.enum(developmentCategories),
  authorityScope: z.string().trim().regex(/^[A-Z0-9][A-Z0-9_-]{0,49}$/),
  tableNumber: z.string().trim().regex(/^\d{1,2}\.\d{1,2}[A-Z]?$/),
  zoneCode: z.string().trim().regex(/^(?:\*|[A-Z0-9][A-Z0-9_-]{0,19})$/),
  useCondition: z.enum(fsiUseConditions).default('ALL'),
  baseFsi: z.number().finite().min(0).max(100),
  chargeableFsi: z.number().finite().min(0).max(100),
  maximumFsi: z.number().finite().min(0).max(100),
  notes: z.array(z.string().trim().min(1).max(1000)).max(30).default([]),
}).strict();
const calculatorTableNoteSchema = z.string().trim().min(1).max(1000);

async function lockAdminChanges(client) {
  await db.query("SELECT pg_advisory_xact_lock(hashtext('buildrule-admin-account-changes'))", [], client);
}

async function lockCalculatorTableChanges(client) {
  await db.query("SELECT pg_advisory_xact_lock(hashtext('buildrule-admin-calculator-fsi'))", [], client);
}

async function loadCalculatorOverrides(client = null) {
  const result = await db.query('SELECT row_key, row_data, is_deleted, updated_at FROM calculator_fsi_overrides', [], client);
  const builtInKeys = new Set(getBuiltInFsiRows().map((row) => row.key));
  return result.rows.map(({ row_key: key, row_data: data, is_deleted: isDeleted, updated_at: updatedAt }) => ({ ...data, key, isDeleted, updatedAt, isBuiltIn: builtInKeys.has(key) }));
}

async function loadCalculatorTableRows(client = null) {
  const rows = new Map(getBuiltInFsiRows().map((row) => [row.key, row]));
  for (const override of await loadCalculatorOverrides(client)) {
    const original = rows.get(override.key);
    rows.set(override.key, { ...original, ...override, isBuiltIn: Boolean(original) });
  }
  return [...rows.values()];
}

function calculatorRowData(row) {
  return {
    categoryCode: row.categoryCode,
    authorityScope: row.authorityScope,
    tableNumber: row.tableNumber,
    zoneCode: row.zoneCode,
    useCondition: row.useCondition ?? 'ALL',
    baseFsi: row.baseFsi,
    chargeableFsi: row.chargeableFsi,
    maximumFsi: row.maximumFsi,
    notes: row.notes ?? [],
  };
}

async function writeCalculatorOverride(client, { row, isDeleted, actorId, note, action, oldData, newData }) {
  await db.query(`INSERT INTO calculator_fsi_overrides (row_key, row_data, is_deleted, updated_by, update_note)
    VALUES ($1, $2::jsonb, $3, $4, $5)
    ON CONFLICT (row_key) DO UPDATE SET row_data = EXCLUDED.row_data, is_deleted = EXCLUDED.is_deleted,
      updated_by = EXCLUDED.updated_by, update_note = EXCLUDED.update_note, updated_at = now()`,
  [row.key, JSON.stringify(calculatorRowData(row)), isDeleted, actorId, note], client);
  await db.query(`INSERT INTO calculator_fsi_table_audit (id, row_key, actor_user_id, action, old_data, new_data, note)
    VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7)`,
  [randomUUID(), row.key, actorId, action, oldData ? JSON.stringify(oldData) : null, newData ? JSON.stringify(newData) : null, note], client);
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

router.get('/calculator-tables', authenticate, requireAdministrator, async (_req, res) => {
  const rows = await loadCalculatorTableRows();
  res.set('Cache-Control', 'no-store');
  res.json({ data: rows, total: rows.length });
});

router.post('/calculator-tables', authenticate, requireAdministrator, async (req, res) => {
  const parsed = calculatorFsiRowSchema.extend({ note: calculatorTableNoteSchema }).strict().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { code: 'INVALID_CALCULATOR_TABLE_ROW', message: 'Enter a valid category, authority scope, source table, zone code, FSI values, and audit note.' } });
  const { note, ...data } = parsed.data;
  const key = getFsiRowKey(data);
  const row = { ...data, key, isBuiltIn: false, isDeleted: false };
  const saved = await withTransaction(async (client) => {
    await lockCalculatorTableChanges(client);
    const current = (await loadCalculatorTableRows(client)).find((item) => item.key === key);
    if (current && !current.isDeleted) throw Object.assign(new Error('A table row already exists for this category, authority, zone, and use.'), { status: 409, code: 'CALCULATOR_TABLE_ROW_EXISTS' });
    const action = current?.isDeleted ? 'RESTORED' : 'CREATED';
    await writeCalculatorOverride(client, { row, isDeleted: false, actorId: req.user._id, note, action, oldData: current ? calculatorRowData(current) : null, newData: data });
    return { ...row, isBuiltIn: Boolean(current?.isBuiltIn) };
  });
  res.status(201).json({ data: saved });
});

router.patch('/calculator-tables/:key', authenticate, requireAdministrator, async (req, res) => {
  const key = z.string().min(1).max(180).safeParse(req.params.key);
  const editableFields = calculatorFsiRowSchema.pick({ tableNumber: true, baseFsi: true, chargeableFsi: true, maximumFsi: true, notes: true });
  const parsed = editableFields.extend({ note: calculatorTableNoteSchema }).strict().safeParse(req.body);
  if (!key.success) return res.status(400).json({ error: { code: 'INVALID_CALCULATOR_TABLE_KEY', message: 'The table row identifier is invalid.' } });
  if (!parsed.success) return res.status(400).json({ error: { code: 'INVALID_CALCULATOR_TABLE_ROW', message: 'Enter valid table values and an audit note.' } });
  const { note, ...changes } = parsed.data;
  const updated = await withTransaction(async (client) => {
    await lockCalculatorTableChanges(client);
    const current = (await loadCalculatorTableRows(client)).find((item) => item.key === key.data);
    if (!current || current.isDeleted) return null;
    const row = { ...current, ...changes };
    await writeCalculatorOverride(client, { row, isDeleted: false, actorId: req.user._id, note, action: 'UPDATED', oldData: calculatorRowData(current), newData: calculatorRowData(row) });
    return { ...row, updatedAt: new Date().toISOString() };
  });
  if (!updated) return res.status(404).json({ error: { code: 'CALCULATOR_TABLE_ROW_NOT_FOUND', message: 'The calculator table row was not found.' } });
  res.json({ data: updated });
});

router.delete('/calculator-tables/:key', authenticate, requireAdministrator, async (req, res) => {
  const key = z.string().min(1).max(180).safeParse(req.params.key);
  const body = z.object({ note: calculatorTableNoteSchema }).strict().safeParse(req.body);
  if (!key.success) return res.status(400).json({ error: { code: 'INVALID_CALCULATOR_TABLE_KEY', message: 'The table row identifier is invalid.' } });
  if (!body.success) return res.status(400).json({ error: { code: 'AUDIT_NOTE_REQUIRED', message: 'Add an audit note to remove a calculator table row.' } });
  const removed = await withTransaction(async (client) => {
    await lockCalculatorTableChanges(client);
    const current = (await loadCalculatorTableRows(client)).find((item) => item.key === key.data);
    if (!current || current.isDeleted) return null;
    const row = { ...current, isDeleted: true };
    await writeCalculatorOverride(client, { row, isDeleted: true, actorId: req.user._id, note: body.data.note, action: 'DELETED', oldData: calculatorRowData(current), newData: null });
    return row;
  });
  if (!removed) return res.status(404).json({ error: { code: 'CALCULATOR_TABLE_ROW_NOT_FOUND', message: 'The calculator table row was not found.' } });
  res.json({ data: removed });
});

router.post('/calculator-tables/:key/restore', authenticate, requireAdministrator, async (req, res) => {
  const key = z.string().min(1).max(180).safeParse(req.params.key);
  const body = z.object({ note: calculatorTableNoteSchema }).strict().safeParse(req.body);
  if (!key.success) return res.status(400).json({ error: { code: 'INVALID_CALCULATOR_TABLE_KEY', message: 'The table row identifier is invalid.' } });
  if (!body.success) return res.status(400).json({ error: { code: 'AUDIT_NOTE_REQUIRED', message: 'Add an audit note to restore a calculator table row.' } });
  const restored = await withTransaction(async (client) => {
    await lockCalculatorTableChanges(client);
    const current = (await loadCalculatorTableRows(client)).find((item) => item.key === key.data);
    if (!current || !current.isDeleted) return null;
    const row = { ...current, isDeleted: false };
    await writeCalculatorOverride(client, { row, isDeleted: false, actorId: req.user._id, note: body.data.note, action: 'RESTORED', oldData: null, newData: calculatorRowData(row) });
    return row;
  });
  if (!restored) return res.status(404).json({ error: { code: 'DELETED_CALCULATOR_TABLE_ROW_NOT_FOUND', message: 'No deleted calculator table row was found.' } });
  res.json({ data: restored });
});

router.get('/calculator-tables/:key/audit', authenticate, requireAdministrator, async (req, res) => {
  const key = z.string().min(1).max(180).safeParse(req.params.key);
  if (!key.success) return res.status(400).json({ error: { code: 'INVALID_CALCULATOR_TABLE_KEY', message: 'The table row identifier is invalid.' } });
  const result = await db.query(`SELECT a.id, a.action, a.old_data, a.new_data, a.note, a.created_at,
      COALESCE(actor.name, '') AS actor_name, actor.email AS actor_email
    FROM calculator_fsi_table_audit a LEFT JOIN app_users actor ON actor.id = a.actor_user_id
    WHERE a.row_key = $1 ORDER BY a.created_at DESC LIMIT 100`, [key.data]);
  res.set('Cache-Control', 'no-store');
  res.json({ data: result.rows });
});

router.get('/users', authenticate, requireAdministrator, async (req, res) => {
  const parsed = z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(25),
    role: z.enum(userRoles).optional(),
    status: z.enum(['ALL', 'ACTIVE', 'DISABLED']).default('ALL'),
    q: z.string().trim().max(120).optional(),
  }).safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: { code: 'INVALID_USER_QUERY', message: 'Check the role, search text, or page values.' } });
  const { page, pageSize, role, q, status } = parsed.data;
  const values = [];
  const where = [];
  if (role) where.push(`role = $${values.push(role)}`);
  if (status === 'ACTIVE') where.push('is_active = true');
  if (status === 'DISABLED') where.push('is_active = false');
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
