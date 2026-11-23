import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Router } from 'express';
import { z } from 'zod';
import { db, withTransaction } from '../../config/database.js';
import { authenticate, requireAdministrator } from '../auth/middleware.js';

const directory = path.dirname(fileURLToPath(import.meta.url));
const source = JSON.parse(readFileSync(path.resolve(directory, '../../../data/fsi-schedules.json'), 'utf8'));
const buildingHeightSource = JSON.parse(readFileSync(path.resolve(directory, '../../../data/table-6-23-building-height.json'), 'utf8'));
const marginSource = JSON.parse(readFileSync(path.resolve(directory, '../../../data/margin-schedules.json'), 'utf8'));
const router = Router();
const auditNote = z.string().trim().min(1).max(1000);
const dataSchema = z.object({
  tableNumber: z.string().trim().min(1).max(12), title: z.string().trim().min(1).max(300),
  categoryCodes: z.array(z.string().trim().regex(/^D(?:[1-9]|10|7A|7B)$/)).max(20),
  authorityScope: z.string().trim().max(120).default(''), sourceRow: z.string().trim().min(1).max(80),
  sourceCells: z.array(z.string().max(10000)).min(1).max(20), parsedData: z.record(z.string(), z.unknown()).default({}),
  remarks: z.string().max(10000).default(''), sortOrder: z.number().int().min(0).max(100000).default(0),
}).strict();
const withNote = dataSchema.extend({ note: auditNote }).strict();
const keyFor = (table, index, row) => `source:${table.sourceTableSequence}:${index + 1}:${row.sourceRow}`;

function builtIns() {
  return [...source.tables, buildingHeightSource.table, ...marginSource.tables].flatMap((table) => table.rows.map((row, index) => ({
    key: keyFor(table, index, row), isBuiltIn: true, isCustom: false, isDeleted: false,
    tableNumber: table.tableNumber, title: table.title, categoryCodes: row.categoryCodes ?? table.categoryCodes ?? inferredCategoryCodes(table),
    authorityScope: row.authorityScope ?? table.title.replace(/^Table\s*\d+(?:\.\d+)?[A]?\s*:?\s*/i, ''),
    sourceRow: row.sourceRow, sourceCells: row.sourceCells, parsedData: Object.fromEntries(Object.entries(row).filter(([k]) => !['sourceRow','sourceCells'].includes(k))),
    remarks: row.remarks ?? '', tableNotes: table.notes, columnHeaders: table.columnHeaders,
    secondaryHeaders: table.secondaryHeaders, requiresSourceReview: table.requiresSourceReview,
    sourceLocator: table.sourceLocator, sortOrder: row.sortOrder ?? index + 1,
  })));
}

function inferredCategoryCodes(table) {
  const tableNumber = String(table.tableNumber ?? '');
  const byTable = {
    '6.5A': ['D1', 'D2', 'D4', 'D7A'], '6.5': ['D1'], '6.6': ['D1'], '6.7': ['D1'], '6.8': ['D1'],
    '6.9': ['D1'], '6.10': ['D1'], '6.11': ['D2'], '6.12': ['D2'], '6.13': ['D2'], '6.14': ['D2'],
    '6.15': ['D3', 'D6'], '6.16': ['D4', 'D5', 'D7A'], '6.17': ['D7B'], '6.18': ['D8', 'D10'], '6.19': ['D9'],
  };
  return byTable[tableNumber] ?? [];
}

export function getBuiltInCalculatorScheduleRows() {
  return builtIns();
}

export async function loadCalculatorFsiScheduleRows(client = null) {
  const base = builtIns();
  const overlays = await db.query('SELECT row_key,row_data,is_deleted,is_custom,updated_at FROM calculator_fsi_schedule_rows', [], client);
  const byKey = new Map(base.map((row) => [row.key, row]));
  for (const item of overlays.rows) {
    const original = byKey.get(item.row_key);
    const data = { ...original, ...item.row_data, key: item.row_key, isBuiltIn: Boolean(original), isCustom: item.is_custom, isDeleted: item.is_deleted, updatedAt: item.updated_at };
    byKey.set(item.row_key, data);
  }
  return [...byKey.values()].sort((a,b) => a.tableNumber.localeCompare(b.tableNumber, undefined, { numeric:true }) || a.sortOrder-b.sortOrder);
}

const loadRows = loadCalculatorFsiScheduleRows;

async function lock(client) { await db.query("SELECT pg_advisory_xact_lock(hashtext('buildrule-admin-fsi-schedules'))", [], client); }
async function write(client, { key, data, isDeleted, isCustom, actor, note, action, oldData, newData }) {
  await db.query(`INSERT INTO calculator_fsi_schedule_rows (row_key,row_data,is_deleted,is_custom,updated_by,update_note)
    VALUES ($1,$2::jsonb,$3,$4,$5,$6) ON CONFLICT (row_key) DO UPDATE SET row_data=EXCLUDED.row_data,
    is_deleted=EXCLUDED.is_deleted,is_custom=EXCLUDED.is_custom,updated_by=EXCLUDED.updated_by,updated_at=now(),update_note=EXCLUDED.update_note`,
  [key, JSON.stringify(data), isDeleted, isCustom, actor, note], client);
  await db.query(`INSERT INTO calculator_fsi_schedule_audit (id,row_key,actor_user_id,action,old_data,new_data,note)
    VALUES ($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7)`, [randomUUID(),key,actor,action,oldData?JSON.stringify(oldData):null,newData?JSON.stringify(newData):null,note],client);
}

router.get('/calculator-fsi-schedules', authenticate, requireAdministrator, async (_req,res) => {
  const rows = await loadRows();
  res.set('Cache-Control','no-store');
  res.json({ data: rows, total: rows.length, analysisRules: source.analysisRules, missingReferencedClauses: source.missingReferencedClauses, generalProvisions: source.generalProvisions, buildingHeight: { analysisRules: buildingHeightSource.analysisRules, generalProvisions: buildingHeightSource.generalProvisions }, margins: { analysisRules: marginSource.analysisRules, generalProvisions: marginSource.generalProvisions } });
});

router.post('/calculator-fsi-schedules', authenticate, requireAdministrator, async (req,res) => {
  const parsed = withNote.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error:{code:'INVALID_FSI_SCHEDULE_ROW',message:'Check the table, categories, source cells, parsed fields, and audit note.'} });
  const {note,...input}=parsed.data; const key=`custom:${randomUUID()}`;
  const data={...input,columnHeaders:['Source cells'],secondaryHeaders:[],tableNotes:[],sourceLocator:'Admin added',requiresSourceReview:false};
  const result=await withTransaction(async(client)=>{ await lock(client); await write(client,{key,data,isDeleted:false,isCustom:true,actor:req.user._id,note,action:'CREATED',oldData:null,newData:data}); return {...data,key,isBuiltIn:false,isCustom:true,isDeleted:false}; });
  res.status(201).json({data:result});
});

router.patch('/calculator-fsi-schedules/:key', authenticate, requireAdministrator, async (req,res) => {
  const key=z.string().min(1).max(180).safeParse(req.params.key), parsed=withNote.safeParse(req.body);
  if(!key.success||!parsed.success) return res.status(400).json({error:{code:'INVALID_FSI_SCHEDULE_ROW',message:'Check the row identifier and schedule fields.'}});
  const {note,...input}=parsed.data;
  const result=await withTransaction(async(client)=>{await lock(client);const current=(await loadRows(client)).find(r=>r.key===key.data);if(!current||current.isDeleted)return null;const data={...input,columnHeaders:current.columnHeaders??['Source cells'],secondaryHeaders:current.secondaryHeaders??[],tableNotes:current.tableNotes??[],sourceLocator:current.sourceLocator??'Admin added',requiresSourceReview:current.requiresSourceReview??false};await write(client,{key:key.data,data,isDeleted:false,isCustom:current.isCustom,actor:req.user._id,note,action:'UPDATED',oldData:current,newData:data});return {...data,key:key.data,isBuiltIn:current.isBuiltIn,isCustom:current.isCustom,isDeleted:false};});
  if(!result)return res.status(404).json({error:{code:'FSI_SCHEDULE_ROW_NOT_FOUND',message:'The schedule row was not found.'}});res.json({data:result});
});

router.delete('/calculator-fsi-schedules/:key', authenticate, requireAdministrator, async (req,res) => {
  const key=z.string().min(1).max(180).safeParse(req.params.key), body=z.object({note:auditNote}).strict().safeParse(req.body);
  if(!key.success||!body.success)return res.status(400).json({error:{code:'AUDIT_NOTE_REQUIRED',message:'A valid row and audit note are required.'}});
  const result=await withTransaction(async(client)=>{await lock(client);const current=(await loadRows(client)).find(r=>r.key===key.data);if(!current||current.isDeleted)return null;const data=Object.fromEntries(Object.entries(current).filter(([k])=>!['key','isBuiltIn','isCustom','isDeleted','updatedAt'].includes(k)));await write(client,{key:key.data,data,isDeleted:true,isCustom:current.isCustom,actor:req.user._id,note:body.data.note,action:'DELETED',oldData:data,newData:null});return {...current,isDeleted:true};});
  if(!result)return res.status(404).json({error:{code:'FSI_SCHEDULE_ROW_NOT_FOUND',message:'The schedule row was not found.'}});res.json({data:result});
});

router.post('/calculator-fsi-schedules/:key/restore', authenticate, requireAdministrator, async (req,res) => {
  const key=z.string().min(1).max(180).safeParse(req.params.key), body=z.object({note:auditNote}).strict().safeParse(req.body);
  if(!key.success||!body.success)return res.status(400).json({error:{code:'AUDIT_NOTE_REQUIRED',message:'A valid row and audit note are required.'}});
  const result=await withTransaction(async(client)=>{await lock(client);const current=(await loadRows(client)).find(r=>r.key===key.data);if(!current||!current.isDeleted)return null;const data=Object.fromEntries(Object.entries(current).filter(([k])=>!['key','isBuiltIn','isCustom','isDeleted','updatedAt'].includes(k)));await write(client,{key:key.data,data,isDeleted:false,isCustom:current.isCustom,actor:req.user._id,note:body.data.note,action:'RESTORED',oldData:null,newData:data});return {...current,isDeleted:false};});
  if(!result)return res.status(404).json({error:{code:'DELETED_FSI_SCHEDULE_ROW_NOT_FOUND',message:'No deleted schedule row was found.'}});res.json({data:result});
});

export default router;
