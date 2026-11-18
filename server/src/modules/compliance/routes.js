import { Router } from 'express';
import { z } from 'zod';
import { calculateFsi } from './fsi-calculation.js';

const router = Router();
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
  buildingUse: z.string().trim().max(120).optional(),
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

router.post('/calculations/fsi', (req, res) => {
  const parsed = fsiSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'INVALID_FSI_INPUT', message: 'Enter a positive plot area and at least one road width, then specify the development authority and zone. Building use is optional unless the applicable table requires it.', details: parsed.error.issues } });
  }
  res.status(200).json(calculateFsi(parsed.data));
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
