import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { Router } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { db, withTransaction } from '../../config/database.js';
import { authenticate, requireAdministrator } from '../auth/middleware.js';

const directory = path.dirname(fileURLToPath(import.meta.url));
const zoneTable = JSON.parse(readFileSync(path.resolve(directory, '../../../../data/table-6-2.json'), 'utf8'));
const developmentCategories = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7A', 'D7B', 'D8', 'D9', 'D10'];
const router = Router();

const zoneSchema = z.object({
  sourceRow: z.string().trim().min(1).max(20),
  sourcePage: z.coerce.number().int().positive().max(999).nullable().optional(),
  useZone: z.string().trim().min(1).max(2000),
  conceptualisedZone: z.string().trim().max(240).default(''),
  code: z.string().trim().max(40).default(''),
  permissibleUse: z.string().trim().max(10000).default(''),
  permissibleUseSourceText: z.string().max(10000).default(''),
  inheritedFromCodes: z.array(z.string().trim().max(40)).max(30).default([]),
  permissibleUseExtraUses: z.array(z.string().trim().max(300)).max(100).default([]),
  permissibleUseConditions: z.array(z.string().trim().max(1000)).max(100).default([]),
  appliesToCategories: z.array(z.enum(developmentCategories)).max(developmentCategories.length).default([]),
  authorityScope: z.string().trim().max(500).default(''),
  notes: z.string().trim().max(10000).default(''),
}).strict();
const auditNoteSchema = z.string().trim().min(1).max(1000);

function extractUseCodes(text) {
  return [...new Set(text.match(/SP&L|IN1A|[A-Z]{1,4}\d{1,2}[A-Z]?|\b(?:HO|INST|PI|PU|REG|REC|SCK|SE|ST|TEMP|TO|CW|GIDC)\b/g) ?? [])];
}

function zoneRow(row) {
  return {
    ...row.row_data,
    permissibleUseCodes: row.row_data.permissibleUseCodes ?? extractUseCodes(row.row_data.permissibleUse ?? ''),
    key: row.row_key,
    isBuiltIn: row.is_builtin,
    isDeleted: row.is_deleted,
    updatedAt: row.updated_at,
  };
}

function zoneData(input, sortOrder) {
  return {
    ...input,
    sourcePage: input.sourcePage ?? null,
    permissibleUseCodes: extractUseCodes(input.permissibleUse),
    sourceTable: zoneTable.tableNumber,
    sortOrder,
  };
}

export async function loadCalculatorZoneRows(client = null) {
  const result = await db.query(`SELECT row_key, row_data, is_builtin, is_deleted, updated_at
    FROM calculator_zone_rows
    ORDER BY (row_data->>'sortOrder')::integer, lower(row_data->>'useZone')`, [], client);
  return result.rows.map(zoneRow);
}

const loadRows = loadCalculatorZoneRows;

async function lockChanges(client) {
  await db.query("SELECT pg_advisory_xact_lock(hashtext('buildrule-admin-calculator-zones'))", [], client);
}

async function writeRow(client, { key, data, isDeleted, isBuiltIn = false, actorId, note, action, oldData, newData }) {
  await db.query(`INSERT INTO calculator_zone_rows (row_key, row_data, is_builtin, is_deleted, updated_by, updated_at, update_note)
    VALUES ($1, $2::jsonb, $3, $4, $5, now(), $6)
    ON CONFLICT (row_key) DO UPDATE SET row_data = EXCLUDED.row_data, is_deleted = EXCLUDED.is_deleted,
      updated_by = EXCLUDED.updated_by, updated_at = now(), update_note = EXCLUDED.update_note`,
  [key, JSON.stringify(data), isBuiltIn, isDeleted, actorId, note], client);
  await db.query(`INSERT INTO calculator_zone_table_audit (id, row_key, actor_user_id, action, old_data, new_data, note)
    VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7)`,
  [randomUUID(), key, actorId, action, oldData ? JSON.stringify(oldData) : null, newData ? JSON.stringify(newData) : null, note], client);
}

router.get('/calculator-zones', authenticate, requireAdministrator, async (_req, res) => {
  const rows = await loadRows();
  res.set('Cache-Control', 'no-store');
  res.json({ data: rows, total: rows.length, table: { number: zoneTable.tableNumber, title: zoneTable.title, notes: zoneTable.notes } });
});

router.post('/calculator-zones', authenticate, requireAdministrator, async (req, res) => {
  const parsed = zoneSchema.extend({ note: auditNoteSchema }).strict().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { code: 'INVALID_ZONE_ROW', message: 'Enter a source row number, use zone, code, permissible use, and audit note.' } });
  const { note, ...input } = parsed.data;
  const key = `custom:${randomUUID()}`;
  const created = await withTransaction(async (client) => {
    await lockChanges(client);
    const duplicate = await db.query("SELECT 1 FROM calculator_zone_rows WHERE is_deleted = false AND row_data->>'sourceRow' = $1", [input.sourceRow], client);
    if (duplicate.rowCount) throw Object.assign(new Error('An active Table 6.2 row already uses this source row number.'), { status: 409, code: 'ZONE_ROW_EXISTS' });
    const rows = await loadRows(client);
    const sortOrder = rows.reduce((max, row) => Math.max(max, Number(row.sortOrder) || 0), 0) + 1;
    const data = zoneData(input, sortOrder);
    await writeRow(client, { key, data, isDeleted: false, actorId: req.user._id, note, action: 'CREATED', oldData: null, newData: data });
    return { ...data, key, isBuiltIn: false, isDeleted: false };
  });
  res.status(201).json({ data: created });
});

router.patch('/calculator-zones/:key', authenticate, requireAdministrator, async (req, res) => {
  const key = z.string().min(1).max(180).safeParse(req.params.key);
  const parsed = zoneSchema.extend({ note: auditNoteSchema }).strict().safeParse(req.body);
  if (!key.success) return res.status(400).json({ error: { code: 'INVALID_ZONE_KEY', message: 'The zone row identifier is invalid.' } });
  if (!parsed.success) return res.status(400).json({ error: { code: 'INVALID_ZONE_ROW', message: 'Check the use zone, conceptualised zone, code, and permissible use fields.' } });
  const { note, ...input } = parsed.data;
  const updated = await withTransaction(async (client) => {
    await lockChanges(client);
    const current = (await loadRows(client)).find((row) => row.key === key.data);
    if (!current || current.isDeleted) return null;
    const duplicate = await db.query("SELECT 1 FROM calculator_zone_rows WHERE row_key <> $1 AND is_deleted = false AND row_data->>'sourceRow' = $2", [key.data, input.sourceRow], client);
    if (duplicate.rowCount) throw Object.assign(new Error('Another active Table 6.2 row already uses this source row number.'), { status: 409, code: 'ZONE_ROW_EXISTS' });
    const data = zoneData(input, Number(current.sortOrder) || 1);
    await writeRow(client, { key: key.data, data, isDeleted: false, isBuiltIn: current.isBuiltIn, actorId: req.user._id, note, action: 'UPDATED', oldData: current, newData: data });
    return { ...data, key: key.data, isBuiltIn: current.isBuiltIn, isDeleted: false, updatedAt: new Date().toISOString() };
  });
  if (!updated) return res.status(404).json({ error: { code: 'ZONE_ROW_NOT_FOUND', message: 'The zone row was not found.' } });
  res.json({ data: updated });
});

router.delete('/calculator-zones/:key', authenticate, requireAdministrator, async (req, res) => {
  const key = z.string().min(1).max(180).safeParse(req.params.key);
  const parsed = z.object({ note: auditNoteSchema }).strict().safeParse(req.body);
  if (!key.success) return res.status(400).json({ error: { code: 'INVALID_ZONE_KEY', message: 'The zone row identifier is invalid.' } });
  if (!parsed.success) return res.status(400).json({ error: { code: 'AUDIT_NOTE_REQUIRED', message: 'Add an audit note to remove this zone row.' } });
  const removed = await withTransaction(async (client) => {
    await lockChanges(client);
    const current = (await loadRows(client)).find((row) => row.key === key.data);
    if (!current || current.isDeleted) return null;
    const data = Object.fromEntries(Object.entries(current).filter(([field]) => !['key', 'isBuiltIn', 'isDeleted', 'updatedAt'].includes(field)));
    await writeRow(client, { key: key.data, data, isDeleted: true, isBuiltIn: current.isBuiltIn, actorId: req.user._id, note: parsed.data.note, action: 'DELETED', oldData: data, newData: null });
    return { ...data, key: key.data, isBuiltIn: current.isBuiltIn, isDeleted: true };
  });
  if (!removed) return res.status(404).json({ error: { code: 'ZONE_ROW_NOT_FOUND', message: 'The zone row was not found.' } });
  res.json({ data: removed });
});

router.post('/calculator-zones/:key/restore', authenticate, requireAdministrator, async (req, res) => {
  const key = z.string().min(1).max(180).safeParse(req.params.key);
  const parsed = z.object({ note: auditNoteSchema }).strict().safeParse(req.body);
  if (!key.success) return res.status(400).json({ error: { code: 'INVALID_ZONE_KEY', message: 'The zone row identifier is invalid.' } });
  if (!parsed.success) return res.status(400).json({ error: { code: 'AUDIT_NOTE_REQUIRED', message: 'Add an audit note to restore this zone row.' } });
  const restored = await withTransaction(async (client) => {
    await lockChanges(client);
    const current = (await loadRows(client)).find((row) => row.key === key.data);
    if (!current || !current.isDeleted) return null;
    const duplicate = await db.query("SELECT 1 FROM calculator_zone_rows WHERE row_key <> $1 AND is_deleted = false AND row_data->>'sourceRow' = $2", [key.data, current.sourceRow], client);
    if (duplicate.rowCount) throw Object.assign(new Error('Another active row already uses this source row number.'), { status: 409, code: 'ZONE_ROW_EXISTS' });
    const data = Object.fromEntries(Object.entries(current).filter(([field]) => !['key', 'isBuiltIn', 'isDeleted', 'updatedAt'].includes(field)));
    await writeRow(client, { key: key.data, data, isDeleted: false, isBuiltIn: current.isBuiltIn, actorId: req.user._id, note: parsed.data.note, action: 'RESTORED', oldData: null, newData: data });
    return { ...data, key: key.data, isBuiltIn: current.isBuiltIn, isDeleted: false, updatedAt: new Date().toISOString() };
  });
  if (!restored) return res.status(404).json({ error: { code: 'DELETED_ZONE_ROW_NOT_FOUND', message: 'No deleted zone row was found.' } });
  res.json({ data: restored });
});

router.get('/calculator-zones/:key/audit', authenticate, requireAdministrator, async (req, res) => {
  const key = z.string().min(1).max(180).safeParse(req.params.key);
  if (!key.success) return res.status(400).json({ error: { code: 'INVALID_ZONE_KEY', message: 'The zone row identifier is invalid.' } });
  const result = await db.query(`SELECT a.id, a.action, a.old_data, a.new_data, a.note, a.created_at,
      COALESCE(actor.name, '') AS actor_name, actor.email AS actor_email
    FROM calculator_zone_table_audit a LEFT JOIN app_users actor ON actor.id = a.actor_user_id
    WHERE a.row_key = $1 ORDER BY a.created_at DESC LIMIT 100`, [key.data]);
  res.set('Cache-Control', 'no-store');
  res.json({ data: result.rows });
});

export default router;
