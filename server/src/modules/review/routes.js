import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireReviewer } from '../auth/middleware.js';
import { REVIEW_RECORD_TYPES } from './draft-schemas.js';
import {
  approveReviewItem,
  claimReviewItem,
  getReviewItem,
  listReviewAudit,
  listReviewItems,
  listReviewReferences,
  rejectReviewItem,
  returnReviewItem,
  saveReviewDraft,
} from './service.js';

const router = Router();
const objectId = z.string().regex(/^[a-f\d]{24}$/i);
const listSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  recordType: z.enum(REVIEW_RECORD_TYPES).optional(),
  workflowStatus: z.enum(['QUEUED', 'IN_REVIEW', 'RETURNED_FOR_CORRECTION', 'REJECTED', 'APPROVED']).optional(),
  part: z.enum(['Part I', 'Part II', 'Part III']).optional(),
  sourceDocumentId: objectId.optional(),
  pdfPageNumber: z.coerce.number().int().positive().optional(),
  assignee: z.union([z.literal('me'), z.literal('unassigned'), objectId]).optional(),
}).strict();
const versionSchema = z.object({ expectedVersion: z.number().int().min(0) }).strict();
const decisionSchema = versionSchema.extend({ note: z.string().trim().min(1).max(2000) }).strict();
const saveDraftSchema = z.object({
  expectedVersion: z.number().int().min(0),
  recordType: z.enum(REVIEW_RECORD_TYPES),
  draft: z.record(z.string(), z.unknown()),
}).strict();
const referenceSchema = z.object({
  type: z.enum(['chapters', 'regulations', 'all-regulations', 'tables', 'nodes']),
  sourceDocumentId: objectId,
}).strict();

router.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});
router.use(authenticate, requireReviewer);

router.get('/review-items', async (req, res) => {
  const parsed = listSchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: { code: 'INVALID_REVIEW_FILTER', message: 'Review queue filters are invalid.', details: parsed.error.issues } });
  const query = { ...parsed.data, userId: req.user._id };
  res.json(await listReviewItems(query));
});

router.get('/review-items/:id/audit', async (req, res) => {
  if (!objectId.safeParse(req.params.id).success) return res.status(400).json({ error: { code: 'INVALID_ID', message: 'Review item ID is invalid.' } });
  res.json({ data: await listReviewAudit(req.params.id) });
});

router.get('/review-items/:id', async (req, res) => {
  if (!objectId.safeParse(req.params.id).success) return res.status(400).json({ error: { code: 'INVALID_ID', message: 'Review item ID is invalid.' } });
  res.json({ data: await getReviewItem(req.params.id) });
});

router.post('/review-items/:id/claim', async (req, res) => {
  if (!objectId.safeParse(req.params.id).success) return res.status(400).json({ error: { code: 'INVALID_ID', message: 'Review item ID is invalid.' } });
  const parsed = versionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { code: 'INVALID_REVIEW_ACTION', message: 'A valid expectedVersion is required.' } });
  res.json({ data: await claimReviewItem({ id: req.params.id, actor: req.user, expectedVersion: parsed.data.expectedVersion }) });
});

router.put('/review-items/:id/draft', async (req, res) => {
  if (!objectId.safeParse(req.params.id).success) return res.status(400).json({ error: { code: 'INVALID_ID', message: 'Review item ID is invalid.' } });
  const parsed = saveDraftSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { code: 'INVALID_REVIEW_DRAFT', message: 'Draft fields or version are invalid.', details: parsed.error.issues } });
  res.json({ data: await saveReviewDraft({ id: req.params.id, actor: req.user, ...parsed.data }) });
});

router.post('/review-items/:id/return', async (req, res) => {
  if (!objectId.safeParse(req.params.id).success) return res.status(400).json({ error: { code: 'INVALID_ID', message: 'Review item ID is invalid.' } });
  const parsed = decisionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { code: 'INVALID_REVIEW_ACTION', message: 'A return note and valid expectedVersion are required.', details: parsed.error.issues } });
  res.json({ data: await returnReviewItem({ id: req.params.id, actor: req.user, ...parsed.data }) });
});

router.post('/review-items/:id/reject', async (req, res) => {
  if (!objectId.safeParse(req.params.id).success) return res.status(400).json({ error: { code: 'INVALID_ID', message: 'Review item ID is invalid.' } });
  const parsed = decisionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { code: 'INVALID_REVIEW_ACTION', message: 'A rejection note and valid expectedVersion are required.', details: parsed.error.issues } });
  res.json({ data: await rejectReviewItem({ id: req.params.id, actor: req.user, ...parsed.data }) });
});

router.post('/review-items/:id/approve', async (req, res) => {
  if (!objectId.safeParse(req.params.id).success) return res.status(400).json({ error: { code: 'INVALID_ID', message: 'Review item ID is invalid.' } });
  const parsed = decisionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { code: 'INVALID_REVIEW_ACTION', message: 'An approval note and valid expectedVersion are required.', details: parsed.error.issues } });
  res.json({ data: await approveReviewItem({ id: req.params.id, actor: req.user, ...parsed.data }) });
});

router.get('/references', async (req, res) => {
  const parsed = referenceSchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: { code: 'INVALID_REFERENCE_QUERY', message: 'A source document and valid reference type are required.' } });
  res.json({ data: await listReviewReferences(parsed.data.type, parsed.data.sourceDocumentId) });
});

export default router;
