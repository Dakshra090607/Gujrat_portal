import { Router } from 'express';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { db } from '../../config/database.js';
import { calculateFsi, getBuiltInFsiRows } from './fsi-calculation.js';
import { loadCalculatorZoneRows } from '../admin/calculator-zones.js';
import { getBuiltInCalculatorScheduleRows, loadCalculatorFsiScheduleRows } from '../admin/calculator-fsi-schedules.js';
import { loadCalculatorRoadWidthRows } from '../admin/calculator-road-width.js';

const router = Router();
const directory = path.dirname(fileURLToPath(import.meta.url));
const authorityTable = JSON.parse(readFileSync(path.resolve(directory, '../../../../data/development-authorities.json'), 'utf8'));
const useCodeTable = JSON.parse(readFileSync(path.resolve(directory, '../../../../data/table-6-3.json'), 'utf8'));
const zoneTable = JSON.parse(readFileSync(path.resolve(directory, '../../../../data/table-6-2.json'), 'utf8'));
const positiveNumber = z.coerce.number().finite().positive();
const fsiSchema = z.object({
  developmentCategory: z.enum(['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7A', 'D7B', 'D8', 'D9', 'D10']).optional(),
  developmentAuthority: z.string().trim().min(1).max(160),
  developmentArea: z.string().trim().max(160).optional(),
  zone: z.string().trim().min(1).max(500),
  conceptualisedZone: z.string().trim().max(120).optional(),
  zoneCode: z.string().trim().max(20).optional(),
  permissibleUse: z.string().trim().max(2000).optional(),
  permissibleUseCode: z.string().trim().max(20).optional(),
  roadWidths: z.object({
    front: positiveNumber.optional(),
    left: positiveNumber.optional(),
    right: positiveNumber.optional(),
    rear: positiveNumber.optional(),
  }).optional(),
  plotArea: positiveNumber,
  roadWidth: positiveNumber,
  distanceFromWideRoad: z.coerce.number().finite().min(0).optional(),
  buildingUse: z.string().trim().max(120).optional(),
  buildingUseCode: z.string().trim().max(40).optional(),
});

const assessmentSchema = z.object({
  projectName: z.string().trim().max(160).optional(),
  developmentAuthority: z.string().trim().max(160).optional(),
  zone: z.string().trim().max(120).optional(),
  plotArea: positiveNumber.optional(),
  roadWidth: positiveNumber.optional(),
  landUse: z.string().trim().max(120).optional(),
  buildingUse: z.string().trim().max(120).optional(),
  buildingHeight: positiveNumber.optional(),
  numberOfFloors: z.coerce.number().int().positive().optional(),
  proposedBuiltUpArea: positiveNumber.optional(),
  groundCoverage: positiveNumber.optional(),
  parkingDetails: z.string().trim().max(500).optional(),
});

router.get('/development-authorities', async (_req, res) => {
  let categories = authorityTable.categories.map((category) => ({
    code: category.code,
    label: category.label,
    authorities: category.authorities.map(({ name, authorityCode, authorityType }) => ({ name, authorityCode, authorityType })),
  }));
  if (await db.isConnected()) {
    try {
      const result = await db.query(`SELECT row_data->>'categoryCode' AS category_code,
          row_data->>'categoryLabel' AS category_label,
          row_data->>'authorityName' AS authority_name,
          row_data->>'authorityCode' AS authority_code,
          row_data->>'authorityType' AS authority_type
        FROM calculator_authority_rows WHERE is_deleted = false
        ORDER BY CASE row_data->>'categoryCode'
          WHEN 'D1' THEN 1 WHEN 'D2' THEN 2 WHEN 'D3' THEN 3 WHEN 'D4' THEN 4 WHEN 'D5' THEN 5
          WHEN 'D6' THEN 6 WHEN 'D7A' THEN 7 WHEN 'D7B' THEN 8 WHEN 'D8' THEN 9 WHEN 'D9' THEN 10 WHEN 'D10' THEN 11 ELSE 99 END,
          (row_data->>'sortOrder')::integer, lower(row_data->>'authorityName')`);
      const categoryMetadata = new Map(authorityTable.categories.map((category) => [category.code, category]));
      const groupedRows = new Map();
      for (const row of result.rows) {
        if (!groupedRows.has(row.category_code)) groupedRows.set(row.category_code, { code: row.category_code, label: row.category_label || categoryMetadata.get(row.category_code)?.label || row.category_code, authorities: [] });
        groupedRows.get(row.category_code).authorities.push({ name: row.authority_name, authorityCode: row.authority_code || '', authorityType: row.authority_type || '' });
      }
      categories = [...groupedRows.values()];
    } catch (error) {
      if (error.code !== '42P01') throw error;
    }
  }
  res.set('Cache-Control', 'no-store');
  res.json({ data: categories, source: 'Table 1.1', table: { number: authorityTable.tableNumber, title: authorityTable.title } });
});

router.get('/calculator-use-codes', async (_req, res) => {
  let rows = useCodeTable.rows;
  if (await db.isConnected()) {
    try {
      const result = await db.query(`SELECT row_key, row_data FROM calculator_use_code_rows
        WHERE is_deleted = false
        ORDER BY (row_data->>'sortOrder')::integer, lower(row_data->>'classification')`);
      rows = result.rows.map(({ row_key: key, row_data: data }) => ({ ...data, key }));
    } catch (error) {
      if (error.code !== '42P01') throw error;
    }
  }
  res.set('Cache-Control', 'no-store');
  res.json({ data: rows, total: rows.length, source: 'Table 6.3', table: { number: useCodeTable.tableNumber, title: useCodeTable.title } });
});

router.get('/calculator-configuration', async (_req, res) => {
  let zones = zoneTable.rows.map((row, index) => ({ ...row, sortOrder: row.sortOrder ?? index + 1 }));
  let zoneSource = 'built-in';
  let roadWidths = [];
  let schedules = getBuiltInCalculatorScheduleRows();
  let fsiRows = getBuiltInFsiRows();
  if (await db.isConnected()) {
    zoneSource = 'dashboard';
    const [zoneRows, roadWidthRows, scheduleRows, overrides] = await Promise.all([
      loadCalculatorZoneRows(),
      loadCalculatorRoadWidthRows(),
      loadCalculatorFsiScheduleRows(),
      db.query('SELECT row_key, row_data, is_deleted FROM calculator_fsi_overrides'),
    ]);
    zones = zoneRows.filter((row) => !row.isDeleted);
    roadWidths = roadWidthRows.filter((row) => !row.isDeleted);
    schedules = scheduleRows;
    const byKey = new Map(fsiRows.map((row) => [row.key, row]));
    for (const { row_key: key, row_data: data, is_deleted: isDeleted } of overrides.rows) {
      byKey.set(key, { ...byKey.get(key), ...data, key, isDeleted });
    }
    fsiRows = [...byKey.values()];
  }
  res.set('Cache-Control', 'no-store');
  res.json({ data: { zones, roadWidths, schedules, fsiRows }, zoneSource });
});

router.post('/calculations/fsi', async (req, res) => {
  const parsed = fsiSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'INVALID_FSI_INPUT', message: 'Enter a positive plot area and at least one road width, then specify the development authority and zone. Building use is optional unless the applicable table requires it.', details: parsed.error.issues } });
  }
  let tableRows = [];
  let scheduleRows = getBuiltInCalculatorScheduleRows();
  if (await db.isConnected()) {
    try {
      const [result, activeSchedules] = await Promise.all([
        db.query('SELECT row_key, row_data, is_deleted FROM calculator_fsi_overrides'),
        loadCalculatorFsiScheduleRows(),
      ]);
      tableRows = result.rows.map(({ row_key: key, row_data: data, is_deleted: isDeleted }) => ({ ...data, key, isDeleted }));
      scheduleRows = activeSchedules;
    } catch (error) {
      if (error.code !== '42P01') throw error;
    }
  }
  res.status(200).json(calculateFsi(parsed.data, tableRows, scheduleRows));
});

router.post('/assessments', (req, res) => {
  const parsed = assessmentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'INVALID_ASSESSMENT_INPUT', message: 'Check the project and building details, then try again.', details: parsed.error.issues } });
  }
  const missingInformation = [
    'Verified applicability rules and required parameter values are not yet available.',
    'No compliance finding can be established until the relevant provisions are reviewed and linked to this authority and zone.',
  ];
  if (!parsed.data.developmentAuthority) missingInformation.push('Development authority is missing.');
  if (!parsed.data.zone) missingInformation.push('Zone is missing.');
  res.status(200).json({ status: 'INSUFFICIENT_INFORMATION', findings: [], summary: { compliant: 0, nonCompliant: 0, requiresVerification: 0, insufficientInformation: missingInformation.length }, missingInformation, inputs: parsed.data });
});

router.get('/permission-guide', (_req, res) => {
  res.json({
    status: 'NEEDS_REVIEW',
    part: 'Part I',
    sourceDocument: 'CGDCR-2017 PART-I PROCEDURE REGULATIONS.pdf',
    stages: [],
    message: 'Procedural stages will be listed after their source provisions and page references are reviewed.',
  });
});

export default router;
