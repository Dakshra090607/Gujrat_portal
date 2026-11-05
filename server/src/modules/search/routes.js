import { Router } from 'express';
import { z } from 'zod';
import { db } from '../../config/database.js';

const router = Router();
const querySchema = z.object({
  q: z.string().trim().min(1).max(120),
  part: z.enum(['Part I', 'Part II', 'Part III']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

router.get('/', async (req, res) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'INVALID_SEARCH', message: 'Provide a search term up to 120 characters and valid filters.', details: parsed.error.issues } });
  }
  const { q, part, page, pageSize } = parsed.data;
  const values = [q.toLocaleLowerCase()];
  const partClause = part ? `AND d.data->>'part' = $${values.push(part)}` : '';
  const fromWhere = `FROM buildrule_records p JOIN buildrule_records d ON d.id = p.source_document_ref AND d.model = 'SourceDocument'
    WHERE p.model = 'SourcePage' AND position($1 in lower(COALESCE(p.data->>'extractedText',''))) > 0 ${partClause}`;
  const pageValues = [...values, pageSize, (page - 1) * pageSize];
  const [pageResult, countResult] = await Promise.all([
    db.query(`SELECT p.id, p.data AS page, d.data AS document ${fromWhere}
      ORDER BY d.data->>'part', (p.data->>'pdfPageNumber')::integer
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}`, pageValues),
    db.query(`SELECT count(*)::integer AS total ${fromWhere}`, values),
  ]);
  const data = pageResult.rows.map(({ page: result, document }) => {
    const text = result.extractedText ?? '';
    const position = text.toLocaleLowerCase().indexOf(q.toLocaleLowerCase());
    const start = Math.max(0, position - 100);
    const end = Math.min(text.length, position + q.length + 180);
    return {
      type: 'source_page',
      sourceDocument: { _id: result.sourceDocumentId, part: document.part, partTitle: document.partTitle, filename: document.filename, version: document.version },
      pdfPageNumber: result.pdfPageNumber,
      printedPageLabel: result.printedPageLabel,
      verificationStatus: 'EXTRACTED',
      snippet: `${start > 0 ? '…' : ''}${text.slice(start, end).trim()}${end < text.length ? '…' : ''}`,
      matchIndex: position,
    };
  });
  const total = countResult.rows[0].total;
  res.json({ data, pagination: { page, pageSize, total, pages: Math.ceil(total / pageSize) }, query: q });
});

router.get('/categories', async (_req, res) => {
  const result = await db.query("SELECT DISTINCT jsonb_array_elements_text(data->'categories') AS category FROM buildrule_records WHERE model = 'Regulation' ORDER BY category");
  const categories = result.rows.map((row) => row.category);
  res.json({ data: categories, total: categories.length });
});

export default router;
