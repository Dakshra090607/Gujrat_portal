import { Router } from 'express';
import { z } from 'zod';
import { db } from '../../config/database.js';
import { DEFAULT_EMBEDDING_MODEL, embedTexts, generateGroundedAnswer } from './cloudflare-ai.js';

const router = Router();
const querySchema = z.object({
  q: z.string().trim().min(1).max(120),
  part: z.enum(['Part I', 'Part II', 'Part III']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

const askSchema = z.object({
  q: z.string().trim().min(1).max(500),
  part: z.enum(['Part I', 'Part II', 'Part III']).optional(),
});

router.post('/ask', async (req, res) => {
  const parsed = askSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'INVALID_SEARCH', message: 'Provide a question up to 500 characters and a valid part filter.', details: parsed.error.issues } });
  }

  try {
    const { q, part } = parsed.data;
    const [queryVector] = await embedTexts([q]);
    const embedding = `[${queryVector.join(',')}]`;
    const values = [embedding, process.env.CLOUDFLARE_EMBEDDING_MODEL || DEFAULT_EMBEDDING_MODEL];
    const partClause = part ? `AND part = $${values.push(part)}` : '';
    const retrieved = await db.query(`
      WITH ranked AS (
        SELECT id, source_document_id, source_page_number, part, filename, content, verification_status,
          1 - (embedding <=> $1::vector) AS similarity,
          row_number() OVER (
            PARTITION BY source_document_id, source_page_number
            ORDER BY embedding <=> $1::vector
          ) AS page_rank
        FROM rag_chunks
        WHERE embedding_model = $2 ${partClause}
      )
      SELECT id, source_document_id, source_page_number, part, filename, content, verification_status, similarity
      FROM ranked
      WHERE page_rank <= 2
      ORDER BY similarity DESC
      LIMIT 8
    `, values);

    if (!retrieved.rowCount) {
      return res.status(503).json({ error: { code: 'RAG_INDEX_EMPTY', message: 'The semantic search index is empty. Run the database migration, import the source pages, and build the RAG index.' } });
    }

    const sources = retrieved.rows.map((row, index) => ({
      citationId: `S${index + 1}`,
      id: String(row.id),
      sourceDocumentId: row.source_document_id,
      part: row.part,
      filename: row.filename,
      pdfPageNumber: row.source_page_number,
      verificationStatus: row.verification_status,
      similarity: Number(row.similarity),
      content: row.content,
    }));

    if (sources[0].similarity < 0.15) {
      return res.json({
        answer: 'I could not find a sufficiently relevant passage in the indexed source documents to answer this question.',
        sources: [],
        query: q,
        status: 'NO_RELEVANT_SOURCE',
      });
    }

    const answer = await generateGroundedAnswer(q, sources);
    res.json({ answer, sources, query: q, status: 'ANSWERED', verificationStatus: 'NEEDS_REVIEW' });
  } catch (error) {
    const status = Number.isInteger(error.status) ? error.status : 502;
    res.status(status).json({
      error: {
        code: error.code ?? 'RAG_SEARCH_FAILED',
        message: error.message || 'AI search could not complete. Please retry shortly.',
      },
    });
  }
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
