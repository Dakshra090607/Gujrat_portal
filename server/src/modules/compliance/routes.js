import { Router } from 'express';
import { z } from 'zod';

const router = Router();
const positiveNumber = z.coerce.number().finite().positive();
const fsiSchema = z.object({
  developmentAuthority: z.string().trim().min(1).max(160),
  developmentArea: z.string().trim().max(160).optional(),
  zone: z.string().trim().min(1).max(120),
  plotArea: positiveNumber,
  roadWidth: positiveNumber,
  buildingUse: z.string().trim().min(1).max(120),
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
    return res.status(400).json({ error: { code: 'INVALID_FSI_INPUT', message: 'Enter a positive plot area and road width, and specify the authority, zone, and building use.', details: parsed.error.issues } });
  }
  res.status(200).json({
    status: 'UNRESOLVED',
    message: 'Unable to establish a verified FSI result with the currently available regulatory data.',
    inputs: parsed.data,
    missingInformation: [
      'No verified FSI parameters are currently available in the regulatory database.',
      'The applicable authority, zone, building use, and road-width conditions have not been linked to reviewed source provisions.',
    ],
    sources: [],
    calculation: null,
  });
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
