import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { Router } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { db, withTransaction } from '../../config/database.js';
import { authenticate, requireAdministrator } from '../auth/middleware.js';

const directory = path.dirname(fileURLToPath(import.meta.url));
const sourceTable = JSON.parse(readFileSync(path.resolve(directory, '../../../../data/table-6-4.json'), 'utf8'));
const router = Router();
const useCodeList = z.array(z.string().trim().toUpperCase().regex(/^[A-Z0-9&+_-]{1,40}$/)).max(100);
const rowSchema = z.object({
  sourceRow: z.string().trim().min(1).max(20),
  roadWidthMinMeters: z.number().finite().min(0).max(1000),
  roadWidthMaxExclusiveMeters: z.number().finite().positive().max(1000).nullable(),
  coreWallGamtalUses: z.string().trim().min(1).max(5000),
  coreUseCodes: useCodeList,
  coreInheritedRows: z.array(z.string().trim().min(1).max(20)).max(20),
  coreConditions: z.array(z.string().trim().min(1).max(1000)).max(30),
  otherGamtalUses: z.string().trim().min(1).max(5000),
  otherUseCodes: useCodeList,
  otherConditionalUseCodes: useCodeList,
  otherInheritedRows: z.array(z.string().trim().min(1).max(20)).max(20),
  otherConditions: z.array(z.string().trim().min(1).max(1000)).max(30),
  commercialRestrictionText: z.string().trim().max(5000).default(''),
  commercialRestrictionLevels: z.array(z.enum(['GROUND', 'FIRST', 'ALL'])).max(3).default([]),
  commercialRestrictionNotes: z.string().trim().max(2000).default(''),
}).strict();
function validateRoadWidthRow(row, context) {
  if (row.roadWidthMaxExclusiveMeters !== null && row.roadWidthMaxExclusiveMeters <= row.roadWidthMinMeters) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['roadWidthMaxExclusiveMeters'], message: 'The exclusive upper bound must be greater than the lower bound.' });
  }
}
const auditNoteSchema = z.string().trim().min(1).max(1000);
const rowWithAuditNoteSchema = rowSchema.extend({ note: auditNoteSchema }).strict().superRefine(validateRoadWidthRow);

function toRow(row) {
  const min = Number(row.row_data.roadWidthMinMeters);
  const max = row.row_data.roadWidthMaxExclusiveMeters === null ? null : Number(row.row_data.roadWidthMaxExclusiveMeters);
  const maxLabel = max === null ? 'and above' : `${(max - 0.1).toFixed(1)} m`;
  return { ...row.row_data, roadWidthLabel: max === null ? `${min.toFixed(0)} m and above` : `${min.toFixed(min % 1 ? 1 : 0)}–${maxLabel}`, key: row.row_key, isBuiltIn: row.is_builtin, isDeleted: row.is_deleted, updatedAt: row.updated_at };
}

function addEffectiveUseCodes(rows) {
  const bySourceRow = new Map(rows.map((row) => [row.sourceRow, row]));
  const resolve = (row, side, visited = new Set()) => {
    if (visited.has(row.sourceRow)) return [];
    const nextVisited = new Set(visited).add(row.sourceRow);
    const inheritedField = side === 'core' ? 'coreInheritedRows' : 'otherInheritedRows';
    const directFields = side === 'core' ? ['coreUseCodes'] : ['otherUseCodes', 'otherConditionalUseCodes'];
    const inherited = (row[inheritedField] ?? []).flatMap((sourceRow) => {
      const source = bySourceRow.get(sourceRow);
      return source ? resolve(source, side, nextVisited) : [];
    });
    return [...new Set([...inherited, ...directFields.flatMap((field) => row[field] ?? [])])];
  };
  return rows.map((row) => ({
    ...row,
    coreEffectiveUseCodes: resolve(row, 'core'),
    otherEffectiveUseCodes: resolve(row, 'other'),
  }));
}

function rowData(input, sortOrder) {
  return { ...input, tableNumber: sourceTable.tableNumber, sortOrder };
}

export async function loadCalculatorRoadWidthRows(client = null) {
  const result = await db.query(`SELECT row_key, row_data, is_builtin, is_deleted, updated_at
    FROM calculator_road_width_rows
    ORDER BY (row_data->>'sortOrder')::integer, (row_data->>'roadWidthMinMeters')::numeric`, [], client);
  return addEffectiveUseCodes(result.rows.map(toRow));
}

const loadRows = loadCalculatorRoadWidthRows;

async function lockChanges(client) {
  await db.query("SELECT pg_advisory_xact_lock(hashtext('buildrule-admin-calculator-road-width'))", [], client);
}

async function validateTable63Codes(client, row) {
  const requested = [...new Set([...row.coreUseCodes, ...row.otherUseCodes, ...row.otherConditionalUseCodes])];
  if (!requested.length) return;
  const result = await db.query("SELECT DISTINCT upper(row_data->>'code') AS code FROM calculator_use_code_rows WHERE is_deleted = false", [], client);
  const available = new Set(result.rows.map(({ code }) => code));
  const missing = requested.filter((code) => !available.has(code));
  if (missing.length) throw Object.assign(new Error(`Add these code(s) to Table 6.3 before using them here: ${missing.join(', ')}.`), { status: 400, code: 'UNKNOWN_TABLE_63_USE_CODE' });
}

async function assertNoOverlappingRoadRanges(client, row, excludeKey = '') {
  const rows = await loadRows(client);
  const overlaps = rows.some((existing) => {
    if (existing.isDeleted || existing.key === excludeKey) return false;
    const leftOfExistingEnd = existing.roadWidthMaxExclusiveMeters === null || row.roadWidthMinMeters < existing.roadWidthMaxExclusiveMeters;
    const leftOfNewEnd = row.roadWidthMaxExclusiveMeters === null || existing.roadWidthMinMeters < row.roadWidthMaxExclusiveMeters;
    return leftOfExistingEnd && leftOfNewEnd;
  });
  if (overlaps) throw Object.assign(new Error('This road-width band overlaps an active Table 6.4 band. Adjust the inclusive lower and exclusive upper bounds.'), { status: 409, code: 'ROAD_WIDTH_RANGE_OVERLAP' });
}

async function writeRow(client, { key, data, isDeleted, actorId, note, action, oldData, newData, isBuiltIn = false }) {
  await db.query(`INSERT INTO calculator_road_width_rows (row_key, row_data, is_builtin, is_deleted, updated_by, updated_at, update_note)
    VALUES ($1, $2::jsonb, $3, $4, $5, now(), $6)
    ON CONFLICT (row_key) DO UPDATE SET row_data = EXCLUDED.row_data, is_deleted = EXCLUDED.is_deleted,
      updated_by = EXCLUDED.updated_by, updated_at = now(), update_note = EXCLUDED.update_note`,
  [key, JSON.stringify(data), isBuiltIn, isDeleted, actorId, note], client);
  await db.query(`INSERT INTO calculator_road_width_table_audit (id, row_key, actor_user_id, action, old_data, new_data, note)
    VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7)`,
  [randomUUID(), key, actorId, action, oldData ? JSON.stringify(oldData) : null, newData ? JSON.stringify(newData) : null, note], client);
}

router.get('/calculator-road-width', authenticate, requireAdministrator, async (_req, res) => {
  const rows = await loadRows();
  res.set('Cache-Control', 'no-store');
  res.json({ data: rows, total: rows.length, table: { number: sourceTable.tableNumber, title: sourceTable.title, notes: sourceTable.notes, rangeSemantics: sourceTable.rangeSemantics } });
});

router.post('/calculator-road-width', authenticate, requireAdministrator, async (req, res) => {
  const parsed = rowWithAuditNoteSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { code: 'INVALID_ROAD_WIDTH_ROW', message: 'Check the width range, use codes, restrictions, and audit note.' } });
  const { note, ...input } = parsed.data;
  const key = `custom:${randomUUID()}`;
  const created = await withTransaction(async (client) => {
    await lockChanges(client);
    await validateTable63Codes(client, input);
    await assertNoOverlappingRoadRanges(client, input);
    const duplicate = await db.query("SELECT 1 FROM calculator_road_width_rows WHERE is_deleted = false AND row_data->>'sourceRow' = $1", [input.sourceRow], client);
    if (duplicate.rowCount) throw Object.assign(new Error('An active Table 6.4 row already uses this source number.'), { status: 409, code: 'ROAD_WIDTH_ROW_EXISTS' });
    const rows = await loadRows(client);
    const sortOrder = rows.reduce((max, row) => Math.max(max, Number(row.sortOrder) || 0), 0) + 1;
    const data = rowData(input, sortOrder);
    await writeRow(client, { key, data, isDeleted: false, actorId: req.user._id, note, action: 'CREATED', oldData: null, newData: data });
    return { ...data, key, isBuiltIn: false, isDeleted: false };
  });
  res.status(201).json({ data: created });
});

router.patch('/calculator-road-width/:key', authenticate, requireAdministrator, async (req, res) => {
  const key = z.string().min(1).max(180).safeParse(req.params.key);
  const parsed = rowWithAuditNoteSchema.safeParse(req.body);
  if (!key.success) return res.status(400).json({ error: { code: 'INVALID_ROAD_WIDTH_KEY', message: 'The Table 6.4 row identifier is invalid.' } });
  if (!parsed.success) return res.status(400).json({ error: { code: 'INVALID_ROAD_WIDTH_ROW', message: 'Check the width range, use codes, restrictions, and audit note.' } });
  const { note, ...input } = parsed.data;
  const updated = await withTransaction(async (client) => {
    await lockChanges(client);
    await validateTable63Codes(client, input);
    await assertNoOverlappingRoadRanges(client, input, key.data);
    const current = (await loadRows(client)).find((row) => row.key === key.data);
    if (!current || current.isDeleted) return null;
    const duplicate = await db.query("SELECT 1 FROM calculator_road_width_rows WHERE row_key <> $1 AND is_deleted = false AND row_data->>'sourceRow' = $2", [key.data, input.sourceRow], client);
    if (duplicate.rowCount) throw Object.assign(new Error('Another active Table 6.4 row already uses this source number.'), { status: 409, code: 'ROAD_WIDTH_ROW_EXISTS' });
    const data = rowData(input, Number(current.sortOrder) || 1);
    await writeRow(client, { key: key.data, data, isDeleted: false, isBuiltIn: current.isBuiltIn, actorId: req.user._id, note, action: 'UPDATED', oldData: current, newData: data });
    return { ...data, key: key.data, isBuiltIn: current.isBuiltIn, isDeleted: false, updatedAt: new Date().toISOString() };
  });
  if (!updated) return res.status(404).json({ error: { code: 'ROAD_WIDTH_ROW_NOT_FOUND', message: 'The Table 6.4 row was not found.' } });
  res.json({ data: updated });
});

router.delete('/calculator-road-width/:key', authenticate, requireAdministrator, async (req, res) => {
  const key = z.string().min(1).max(180).safeParse(req.params.key);
  const parsed = z.object({ note: auditNoteSchema }).strict().safeParse(req.body);
  if (!key.success) return res.status(400).json({ error: { code: 'INVALID_ROAD_WIDTH_KEY', message: 'The Table 6.4 row identifier is invalid.' } });
  if (!parsed.success) return res.status(400).json({ error: { code: 'AUDIT_NOTE_REQUIRED', message: 'Add an audit note to remove this Table 6.4 row.' } });
  const removed = await withTransaction(async (client) => {
    await lockChanges(client);
    const current = (await loadRows(client)).find((row) => row.key === key.data);
    if (!current || current.isDeleted) return null;
    const data = Object.fromEntries(Object.entries(current).filter(([field]) => !['key', 'isBuiltIn', 'isDeleted', 'updatedAt', 'roadWidthLabel'].includes(field)));
    await assertNoOverlappingRoadRanges(client, data, key.data);
    await writeRow(client, { key: key.data, data, isDeleted: true, isBuiltIn: current.isBuiltIn, actorId: req.user._id, note: parsed.data.note, action: 'DELETED', oldData: data, newData: null });
    return { ...data, key: key.data, isBuiltIn: current.isBuiltIn, isDeleted: true };
  });
  if (!removed) return res.status(404).json({ error: { code: 'ROAD_WIDTH_ROW_NOT_FOUND', message: 'The Table 6.4 row was not found.' } });
  res.json({ data: removed });
});

router.post('/calculator-road-width/:key/restore', authenticate, requireAdministrator, async (req, res) => {
  const key = z.string().min(1).max(180).safeParse(req.params.key);
  const parsed = z.object({ note: auditNoteSchema }).strict().safeParse(req.body);
  if (!key.success) return res.status(400).json({ error: { code: 'INVALID_ROAD_WIDTH_KEY', message: 'The Table 6.4 row identifier is invalid.' } });
  if (!parsed.success) return res.status(400).json({ error: { code: 'AUDIT_NOTE_REQUIRED', message: 'Add an audit note to restore this Table 6.4 row.' } });
  const restored = await withTransaction(async (client) => {
    await lockChanges(client);
    const current = (await loadRows(client)).find((row) => row.key === key.data);
    if (!current || !current.isDeleted) return null;
    const data = Object.fromEntries(Object.entries(current).filter(([field]) => !['key', 'isBuiltIn', 'isDeleted', 'updatedAt', 'roadWidthLabel'].includes(field)));
    const duplicate = await db.query("SELECT 1 FROM calculator_road_width_rows WHERE row_key <> $1 AND is_deleted = false AND row_data->>'sourceRow' = $2", [key.data, data.sourceRow], client);
    if (duplicate.rowCount) throw Object.assign(new Error('Another active row already uses this Table 6.4 source number.'), { status: 409, code: 'ROAD_WIDTH_ROW_EXISTS' });
    await writeRow(client, { key: key.data, data, isDeleted: false, isBuiltIn: current.isBuiltIn, actorId: req.user._id, note: parsed.data.note, action: 'RESTORED', oldData: null, newData: data });
    return { ...data, key: key.data, isBuiltIn: current.isBuiltIn, isDeleted: false, updatedAt: new Date().toISOString() };
  });
  if (!restored) return res.status(404).json({ error: { code: 'DELETED_ROAD_WIDTH_ROW_NOT_FOUND', message: 'No removed Table 6.4 row was found.' } });
  res.json({ data: restored });
});

export default router;
