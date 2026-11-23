import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { Router } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { db, withTransaction } from '../../config/database.js';
import { authenticate, requireAdministrator } from '../auth/middleware.js';

const directory = path.dirname(fileURLToPath(import.meta.url));
const authorityTable = JSON.parse(readFileSync(path.resolve(directory, '../../../data/development-authorities.json'), 'utf8'));
const categoryCodes = authorityTable.categories.map(({ code }) => code);
const categoryByCode = new Map(authorityTable.categories.map((category) => [category.code, category]));
const authorityTypes = ['Development authority', 'Municipality', 'Designated area', 'Industrial area', 'Other area'];
const router = Router();

const authoritySchema = z.object({
  categoryCode: z.enum(categoryCodes),
  authorityName: z.string().trim().min(1).max(240),
  authorityCode: z.string().trim().max(40).default(''),
  authorityType: z.enum(authorityTypes),
  notes: z.string().trim().max(5000).default(''),
}).strict();
const auditNoteSchema = z.string().trim().min(1).max(1000);

function rowFromDatabase(row) {
  const category = categoryByCode.get(row.row_data.categoryCode);
  return { ...row.row_data, categoryCount: row.row_data.categoryCount ?? category?.sourceCount ?? null, key: row.row_key, isBuiltIn: row.is_builtin, isDeleted: row.is_deleted, updatedAt: row.updated_at };
}

function rowData(input, sortOrder) {
  const category = categoryByCode.get(input.categoryCode);
  return {
    categoryCode: input.categoryCode,
    categoryLabel: category.label,
    categoryCount: category.sourceCount,
    categoryDescription: category.description,
    categorySpecialNote: category.specialNote,
    authorityName: input.authorityName,
    authorityCode: input.authorityCode,
    authorityType: input.authorityType,
    notes: input.notes,
    sourceTable: authorityTable.tableNumber,
    sortOrder,
  };
}

async function loadRows(client = null, { includeDeleted = true } = {}) {
  const result = await db.query(
    `SELECT row_key, row_data, is_builtin, is_deleted, updated_at
       FROM calculator_authority_rows
       ${includeDeleted ? '' : 'WHERE is_deleted = false'}
       ORDER BY CASE row_data->>'categoryCode'
          WHEN 'D1' THEN 1 WHEN 'D2' THEN 2 WHEN 'D3' THEN 3 WHEN 'D4' THEN 4 WHEN 'D5' THEN 5
          WHEN 'D6' THEN 6 WHEN 'D7A' THEN 7 WHEN 'D7B' THEN 8 WHEN 'D8' THEN 9 WHEN 'D9' THEN 10 WHEN 'D10' THEN 11 ELSE 99 END,
         (row_data->>'sortOrder')::integer, lower(row_data->>'authorityName')`,
    [], client,
  );
  return result.rows.map(rowFromDatabase);
}

async function lockChanges(client) {
  await db.query("SELECT pg_advisory_xact_lock(hashtext('buildrule-admin-calculator-authorities'))", [], client);
}

async function writeRow(client, { key, data, isDeleted, actorId, note, action, oldData, newData, isBuiltIn = false }) {
  await db.query(`INSERT INTO calculator_authority_rows (row_key, row_data, is_builtin, is_deleted, updated_by, updated_at, update_note)
    VALUES ($1, $2::jsonb, $3, $4, $5, now(), $6)
    ON CONFLICT (row_key) DO UPDATE SET row_data = EXCLUDED.row_data, is_deleted = EXCLUDED.is_deleted,
      updated_by = EXCLUDED.updated_by, updated_at = now(), update_note = EXCLUDED.update_note`,
  [key, JSON.stringify(data), isBuiltIn, isDeleted, actorId, note], client);
  await db.query(`INSERT INTO calculator_authority_table_audit (id, row_key, actor_user_id, action, old_data, new_data, note)
    VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7)`,
  [randomUUID(), key, actorId, action, oldData ? JSON.stringify(oldData) : null, newData ? JSON.stringify(newData) : null, note], client);
}

router.get('/calculator-authorities', authenticate, requireAdministrator, async (_req, res) => {
  const rows = await loadRows();
  res.set('Cache-Control', 'no-store');
  res.json({ data: rows, total: rows.length, table: { number: authorityTable.tableNumber, title: authorityTable.title } });
});

router.post('/calculator-authorities', authenticate, requireAdministrator, async (req, res) => {
  const parsed = authoritySchema.extend({ note: auditNoteSchema }).strict().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { code: 'INVALID_AUTHORITY_ROW', message: 'Enter a category, authority or area name, type, and audit note.' } });
  const { note, ...input } = parsed.data;
  const key = `custom:${randomUUID()}`;
  const saved = await withTransaction(async (client) => {
    await lockChanges(client);
    const existing = await db.query("SELECT 1 FROM calculator_authority_rows WHERE is_deleted = false AND row_data->>'categoryCode' = $1 AND lower(row_data->>'authorityName') = lower($2)", [input.categoryCode, input.authorityName], client);
    if (existing.rowCount) throw Object.assign(new Error('This authority already exists in the selected category.'), { status: 409, code: 'AUTHORITY_ROW_EXISTS' });
    const rows = await loadRows(client);
    const sortOrder = rows.filter((row) => row.categoryCode === input.categoryCode).reduce((max, row) => Math.max(max, Number(row.sortOrder) || 0), 0) + 1;
    const data = rowData(input, sortOrder);
    await writeRow(client, { key, data, isDeleted: false, actorId: req.user._id, note, action: 'CREATED', oldData: null, newData: data });
    return { ...data, key, isBuiltIn: false, isDeleted: false };
  });
  res.status(201).json({ data: saved });
});

router.patch('/calculator-authorities/:key', authenticate, requireAdministrator, async (req, res) => {
  const key = z.string().min(1).max(180).safeParse(req.params.key);
  const parsed = authoritySchema.extend({ note: auditNoteSchema }).strict().safeParse(req.body);
  if (!key.success) return res.status(400).json({ error: { code: 'INVALID_AUTHORITY_KEY', message: 'The authority row identifier is invalid.' } });
  if (!parsed.success) return res.status(400).json({ error: { code: 'INVALID_AUTHORITY_ROW', message: 'Enter a category, authority or area name, type, and audit note.' } });
  const { note, ...input } = parsed.data;
  const updated = await withTransaction(async (client) => {
    await lockChanges(client);
    const current = (await loadRows(client)).find((row) => row.key === key.data);
    if (!current || current.isDeleted) return null;
    const duplicate = await db.query("SELECT 1 FROM calculator_authority_rows WHERE row_key <> $1 AND is_deleted = false AND row_data->>'categoryCode' = $2 AND lower(row_data->>'authorityName') = lower($3)", [key.data, input.categoryCode, input.authorityName], client);
    if (duplicate.rowCount) throw Object.assign(new Error('This authority already exists in the selected category.'), { status: 409, code: 'AUTHORITY_ROW_EXISTS' });
    const data = rowData(input, Number(current.sortOrder) || 1);
    await writeRow(client, { key: key.data, data, isDeleted: false, isBuiltIn: current.isBuiltIn, actorId: req.user._id, note, action: 'UPDATED', oldData: current, newData: data });
    return { ...data, key: key.data, isBuiltIn: current.isBuiltIn, isDeleted: false, updatedAt: new Date().toISOString() };
  });
  if (!updated) return res.status(404).json({ error: { code: 'AUTHORITY_ROW_NOT_FOUND', message: 'The authority row was not found.' } });
  res.json({ data: updated });
});

router.delete('/calculator-authorities/:key', authenticate, requireAdministrator, async (req, res) => {
  const key = z.string().min(1).max(180).safeParse(req.params.key);
  const parsed = z.object({ note: auditNoteSchema }).strict().safeParse(req.body);
  if (!key.success) return res.status(400).json({ error: { code: 'INVALID_AUTHORITY_KEY', message: 'The authority row identifier is invalid.' } });
  if (!parsed.success) return res.status(400).json({ error: { code: 'AUDIT_NOTE_REQUIRED', message: 'Add an audit note to remove an authority row.' } });
  const removed = await withTransaction(async (client) => {
    await lockChanges(client);
    const current = (await loadRows(client)).find((row) => row.key === key.data);
    if (!current || current.isDeleted) return null;
    const data = Object.fromEntries(Object.entries(current).filter(([field]) => !['key', 'isBuiltIn', 'isDeleted', 'updatedAt'].includes(field)));
    await writeRow(client, { key: key.data, data, isDeleted: true, isBuiltIn: current.isBuiltIn, actorId: req.user._id, note: parsed.data.note, action: 'DELETED', oldData: data, newData: null });
    return { ...data, key: key.data, isBuiltIn: current.isBuiltIn, isDeleted: true };
  });
  if (!removed) return res.status(404).json({ error: { code: 'AUTHORITY_ROW_NOT_FOUND', message: 'The authority row was not found.' } });
  res.json({ data: removed });
});

router.post('/calculator-authorities/:key/restore', authenticate, requireAdministrator, async (req, res) => {
  const key = z.string().min(1).max(180).safeParse(req.params.key);
  const parsed = z.object({ note: auditNoteSchema }).strict().safeParse(req.body);
  if (!key.success) return res.status(400).json({ error: { code: 'INVALID_AUTHORITY_KEY', message: 'The authority row identifier is invalid.' } });
  if (!parsed.success) return res.status(400).json({ error: { code: 'AUDIT_NOTE_REQUIRED', message: 'Add an audit note to restore an authority row.' } });
  const restored = await withTransaction(async (client) => {
    await lockChanges(client);
    const current = (await loadRows(client)).find((row) => row.key === key.data);
    if (!current || !current.isDeleted) return null;
    const data = Object.fromEntries(Object.entries(current).filter(([field]) => !['key', 'isBuiltIn', 'isDeleted', 'updatedAt'].includes(field)));
    const duplicate = await db.query("SELECT 1 FROM calculator_authority_rows WHERE row_key <> $1 AND is_deleted = false AND row_data->>'categoryCode' = $2 AND lower(row_data->>'authorityName') = lower($3)", [key.data, data.categoryCode, data.authorityName], client);
    if (duplicate.rowCount) throw Object.assign(new Error('Another active row already uses this authority name in the category.'), { status: 409, code: 'AUTHORITY_ROW_EXISTS' });
    await writeRow(client, { key: key.data, data, isDeleted: false, isBuiltIn: current.isBuiltIn, actorId: req.user._id, note: parsed.data.note, action: 'RESTORED', oldData: null, newData: data });
    return { ...data, key: key.data, isBuiltIn: current.isBuiltIn, isDeleted: false, updatedAt: new Date().toISOString() };
  });
  if (!restored) return res.status(404).json({ error: { code: 'DELETED_AUTHORITY_ROW_NOT_FOUND', message: 'No deleted authority row was found.' } });
  res.json({ data: restored });
});

router.get('/calculator-authorities/:key/audit', authenticate, requireAdministrator, async (req, res) => {
  const key = z.string().min(1).max(180).safeParse(req.params.key);
  if (!key.success) return res.status(400).json({ error: { code: 'INVALID_AUTHORITY_KEY', message: 'The authority row identifier is invalid.' } });
  const result = await db.query(`SELECT a.id, a.action, a.old_data, a.new_data, a.note, a.created_at,
      COALESCE(actor.name, '') AS actor_name, actor.email AS actor_email
    FROM calculator_authority_table_audit a LEFT JOIN app_users actor ON actor.id = a.actor_user_id
    WHERE a.row_key = $1 ORDER BY a.created_at DESC LIMIT 100`, [key.data]);
  res.set('Cache-Control', 'no-store');
  res.json({ data: result.rows });
});

export default router;
