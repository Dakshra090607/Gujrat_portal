import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { Router } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { db, withTransaction } from '../../config/database.js';
import { authenticate, requireAdministrator } from '../auth/middleware.js';

const directory = path.dirname(fileURLToPath(import.meta.url));
const sourceTable = JSON.parse(readFileSync(path.resolve(directory, '../../../../data/table-6-3.json'), 'utf8'));
const router = Router();
const rowSchema = z.object({
  sourceRow: z.string().trim().min(1).max(20),
  classification: z.string().trim().min(1).max(240),
  code: z.string().trim().min(1).max(40).transform((value) => value.toUpperCase()),
  permittedUses: z.string().trim().min(1).max(10000),
}).strict();
const auditNoteSchema = z.string().trim().min(1).max(1000);

function toRow(row) {
  return { ...row.row_data, key: row.row_key, isBuiltIn: row.is_builtin, isDeleted: row.is_deleted, updatedAt: row.updated_at };
}

function rowData(input, sortOrder) {
  return { ...input, tableNumber: sourceTable.tableNumber, sortOrder };
}

async function loadRows(client = null) {
  const result = await db.query(`SELECT row_key, row_data, is_builtin, is_deleted, updated_at
    FROM calculator_use_code_rows
    ORDER BY (row_data->>'sortOrder')::integer, lower(row_data->>'classification')`, [], client);
  return result.rows.map(toRow);
}

async function lockChanges(client) {
  await db.query("SELECT pg_advisory_xact_lock(hashtext('buildrule-admin-calculator-use-codes'))", [], client);
}

async function writeRow(client, { key, data, isDeleted, actorId, note, action, oldData, newData, isBuiltIn = false }) {
  await db.query(`INSERT INTO calculator_use_code_rows (row_key, row_data, is_builtin, is_deleted, updated_by, updated_at, update_note)
    VALUES ($1, $2::jsonb, $3, $4, $5, now(), $6)
    ON CONFLICT (row_key) DO UPDATE SET row_data = EXCLUDED.row_data, is_deleted = EXCLUDED.is_deleted,
      updated_by = EXCLUDED.updated_by, updated_at = now(), update_note = EXCLUDED.update_note`,
  [key, JSON.stringify(data), isBuiltIn, isDeleted, actorId, note], client);
  await db.query(`INSERT INTO calculator_use_code_table_audit (id, row_key, actor_user_id, action, old_data, new_data, note)
    VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7)`,
  [randomUUID(), key, actorId, action, oldData ? JSON.stringify(oldData) : null, newData ? JSON.stringify(newData) : null, note], client);
}

router.get('/calculator-use-codes', authenticate, requireAdministrator, async (_req, res) => {
  const rows = await loadRows();
  res.set('Cache-Control', 'no-store');
  res.json({ data: rows, total: rows.length, table: { number: sourceTable.tableNumber, title: sourceTable.title, transcriptionNote: sourceTable.transcriptionNote } });
});

router.post('/calculator-use-codes', authenticate, requireAdministrator, async (req, res) => {
  const parsed = rowSchema.extend({ note: auditNoteSchema }).strict().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { code: 'INVALID_USE_CODE_ROW', message: 'Enter a source row number, use classification, code, permitted uses, and audit note.' } });
  const { note, ...input } = parsed.data;
  const key = `custom:${randomUUID()}`;
  const created = await withTransaction(async (client) => {
    await lockChanges(client);
    const duplicate = await db.query("SELECT 1 FROM calculator_use_code_rows WHERE is_deleted = false AND (row_data->>'sourceRow' = $1 OR upper(row_data->>'code') = upper($2))", [input.sourceRow, input.code], client);
    if (duplicate.rowCount) throw Object.assign(new Error('An active Table 6.3 row already uses this source number or use code.'), { status: 409, code: 'USE_CODE_ROW_EXISTS' });
    const rows = await loadRows(client);
    const sortOrder = rows.reduce((max, row) => Math.max(max, Number(row.sortOrder) || 0), 0) + 1;
    const data = rowData(input, sortOrder);
    await writeRow(client, { key, data, isDeleted: false, actorId: req.user._id, note, action: 'CREATED', oldData: null, newData: data });
    return { ...data, key, isBuiltIn: false, isDeleted: false };
  });
  res.status(201).json({ data: created });
});

router.patch('/calculator-use-codes/:key', authenticate, requireAdministrator, async (req, res) => {
  const key = z.string().min(1).max(180).safeParse(req.params.key);
  const parsed = rowSchema.extend({ note: auditNoteSchema }).strict().safeParse(req.body);
  if (!key.success) return res.status(400).json({ error: { code: 'INVALID_USE_CODE_KEY', message: 'The Table 6.3 row identifier is invalid.' } });
  if (!parsed.success) return res.status(400).json({ error: { code: 'INVALID_USE_CODE_ROW', message: 'Check the source number, classification, code, permitted uses, and audit note.' } });
  const { note, ...input } = parsed.data;
  const updated = await withTransaction(async (client) => {
    await lockChanges(client);
    const current = (await loadRows(client)).find((row) => row.key === key.data);
    if (!current || current.isDeleted) return null;
    const duplicate = await db.query("SELECT 1 FROM calculator_use_code_rows WHERE row_key <> $1 AND is_deleted = false AND (row_data->>'sourceRow' = $2 OR upper(row_data->>'code') = upper($3))", [key.data, input.sourceRow, input.code], client);
    if (duplicate.rowCount) throw Object.assign(new Error('Another active Table 6.3 row already uses this source number or use code.'), { status: 409, code: 'USE_CODE_ROW_EXISTS' });
    const data = rowData(input, Number(current.sortOrder) || 1);
    await writeRow(client, { key: key.data, data, isDeleted: false, isBuiltIn: current.isBuiltIn, actorId: req.user._id, note, action: 'UPDATED', oldData: current, newData: data });
    return { ...data, key: key.data, isBuiltIn: current.isBuiltIn, isDeleted: false, updatedAt: new Date().toISOString() };
  });
  if (!updated) return res.status(404).json({ error: { code: 'USE_CODE_ROW_NOT_FOUND', message: 'The Table 6.3 row was not found.' } });
  res.json({ data: updated });
});

router.delete('/calculator-use-codes/:key', authenticate, requireAdministrator, async (req, res) => {
  const key = z.string().min(1).max(180).safeParse(req.params.key);
  const parsed = z.object({ note: auditNoteSchema }).strict().safeParse(req.body);
  if (!key.success) return res.status(400).json({ error: { code: 'INVALID_USE_CODE_KEY', message: 'The Table 6.3 row identifier is invalid.' } });
  if (!parsed.success) return res.status(400).json({ error: { code: 'AUDIT_NOTE_REQUIRED', message: 'Add an audit note to remove this Table 6.3 row.' } });
  const removed = await withTransaction(async (client) => {
    await lockChanges(client);
    const current = (await loadRows(client)).find((row) => row.key === key.data);
    if (!current || current.isDeleted) return null;
    const data = Object.fromEntries(Object.entries(current).filter(([field]) => !['key', 'isBuiltIn', 'isDeleted', 'updatedAt'].includes(field)));
    await writeRow(client, { key: key.data, data, isDeleted: true, isBuiltIn: current.isBuiltIn, actorId: req.user._id, note: parsed.data.note, action: 'DELETED', oldData: data, newData: null });
    return { ...data, key: key.data, isBuiltIn: current.isBuiltIn, isDeleted: true };
  });
  if (!removed) return res.status(404).json({ error: { code: 'USE_CODE_ROW_NOT_FOUND', message: 'The Table 6.3 row was not found.' } });
  res.json({ data: removed });
});

router.post('/calculator-use-codes/:key/restore', authenticate, requireAdministrator, async (req, res) => {
  const key = z.string().min(1).max(180).safeParse(req.params.key);
  const parsed = z.object({ note: auditNoteSchema }).strict().safeParse(req.body);
  if (!key.success) return res.status(400).json({ error: { code: 'INVALID_USE_CODE_KEY', message: 'The Table 6.3 row identifier is invalid.' } });
  if (!parsed.success) return res.status(400).json({ error: { code: 'AUDIT_NOTE_REQUIRED', message: 'Add an audit note to restore this Table 6.3 row.' } });
  const restored = await withTransaction(async (client) => {
    await lockChanges(client);
    const current = (await loadRows(client)).find((row) => row.key === key.data);
    if (!current || !current.isDeleted) return null;
    const data = Object.fromEntries(Object.entries(current).filter(([field]) => !['key', 'isBuiltIn', 'isDeleted', 'updatedAt'].includes(field)));
    const duplicate = await db.query("SELECT 1 FROM calculator_use_code_rows WHERE row_key <> $1 AND is_deleted = false AND (row_data->>'sourceRow' = $2 OR upper(row_data->>'code') = upper($3))", [key.data, data.sourceRow, data.code], client);
    if (duplicate.rowCount) throw Object.assign(new Error('Another active row already uses this Table 6.3 code.'), { status: 409, code: 'USE_CODE_ROW_EXISTS' });
    await writeRow(client, { key: key.data, data, isDeleted: false, isBuiltIn: current.isBuiltIn, actorId: req.user._id, note: parsed.data.note, action: 'RESTORED', oldData: null, newData: data });
    return { ...data, key: key.data, isBuiltIn: current.isBuiltIn, isDeleted: false, updatedAt: new Date().toISOString() };
  });
  if (!restored) return res.status(404).json({ error: { code: 'DELETED_USE_CODE_ROW_NOT_FOUND', message: 'No removed Table 6.3 row was found.' } });
  res.json({ data: restored });
});

router.get('/calculator-use-codes/:key/audit', authenticate, requireAdministrator, async (req, res) => {
  const key = z.string().min(1).max(180).safeParse(req.params.key);
  if (!key.success) return res.status(400).json({ error: { code: 'INVALID_USE_CODE_KEY', message: 'The Table 6.3 row identifier is invalid.' } });
  const result = await db.query(`SELECT a.id, a.action, a.old_data, a.new_data, a.note, a.created_at,
      COALESCE(actor.name, '') AS actor_name, actor.email AS actor_email
    FROM calculator_use_code_table_audit a LEFT JOIN app_users actor ON actor.id = a.actor_user_id
    WHERE a.row_key = $1 ORDER BY a.created_at DESC LIMIT 100`, [key.data]);
  res.set('Cache-Control', 'no-store');
  res.json({ data: result.rows });
});

export default router;
