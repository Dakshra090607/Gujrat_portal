import { Router } from 'express';
import { Chapter, Regulation, SourceDocument } from '../../models/index.js';

const router = Router();
const parts = [
  { part: 'Part I', partTitle: 'Procedure Regulations', order: 1 },
  { part: 'Part II', partTitle: 'Planning Regulations', order: 2 },
  { part: 'Part III', partTitle: 'Performance Regulation', order: 3 },
];

router.get('/parts', async (_req, res) => {
  const docs = await SourceDocument.find().select('part pageCount extractionStatus').lean();
  const chapterRecords = await Chapter.find().select('part').lean();
  const chapterCounts = Object.fromEntries(parts.map(({ part }) => [part, chapterRecords.filter((chapter) => chapter.part === part).length]));
  res.json({ data: parts.map((item) => {
    const doc = docs.find((source) => source.part === item.part);
    return { ...item, pageCount: doc?.pageCount ?? 0, chapterCount: chapterCounts[item.part] ?? 0, sourceAvailable: Boolean(doc), extractionStatus: doc?.extractionStatus ?? 'NOT_STARTED' };
  }) });
});

router.get('/chapters', async (req, res) => {
  const filter = {};
  if (req.query.part) filter.part = req.query.part;
  const data = await Chapter.find(filter).sort({ part: 1, sequence: 1 }).lean();
  res.json({ data, total: data.length });
});

router.get('/chapters/:id/regulations', async (req, res) => {
  const chapter = await Chapter.findById(req.params.id).lean();
  if (!chapter) return res.status(404).json({ error: { code: 'CHAPTER_NOT_FOUND', message: 'Chapter not found.' } });
  const data = await Regulation.find({ chapterId: chapter._id }).sort({ sequence: 1 }).lean();
  res.json({ data, total: data.length });
});

router.get('/regulations', async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page ?? '1', 10) || 1);
  const pageSize = Math.min(50, Math.max(1, Number.parseInt(req.query.pageSize ?? '20', 10) || 20));
  const filter = {};
  if (req.query.part) filter.sourceDocumentId = { $in: await SourceDocument.find({ part: req.query.part }).distinct('_id') };
  if (req.query.chapterId) filter.chapterId = req.query.chapterId;
  if (req.query.category) filter.categories = req.query.category;
  const [data, total] = await Promise.all([
    Regulation.find(filter).sort({ sequence: 1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
    Regulation.countDocuments(filter),
  ]);
  res.json({ data, pagination: { page, pageSize, total, pages: Math.ceil(total / pageSize) } });
});

router.get('/regulations/:id/related', async (req, res) => {
  const regulation = await Regulation.findById(req.params.id).select('relatedRegulationIds').lean();
  if (!regulation) return res.status(404).json({ error: { code: 'REGULATION_NOT_FOUND', message: 'Regulation not found.' } });
  const data = await Regulation.find({ _id: { $in: regulation.relatedRegulationIds } }).select('originalNumber title verificationStatus sourceLocators').lean();
  res.json({ data, total: data.length });
});

router.get('/regulations/:id', async (req, res) => {
  const data = await Regulation.findById(req.params.id)
    .populate('chapterId', 'originalNumber title part sequence')
    .populate('sourceDocumentId', 'filename part version pageCount')
    .populate('tableIds')
    .lean();
  if (!data) return res.status(404).json({ error: { code: 'REGULATION_NOT_FOUND', message: 'Regulation not found.' } });
  res.json({ data });
});

export default router;
