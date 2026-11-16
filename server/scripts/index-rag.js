import '../src/config/env.js';
import { db, disconnectDatabase } from '../src/config/database.js';
import { DEFAULT_EMBEDDING_MODEL, embedTexts } from '../src/modules/search/cloudflare-ai.js';

const embeddingModel = process.env.CLOUDFLARE_EMBEDDING_MODEL || DEFAULT_EMBEDDING_MODEL;
const TARGET_CHARS = 1400;
const OVERLAP_CHARS = 220;
const BATCH_SIZE = 12;

function cleanText(text) {
  return String(text ?? '')
    .replace(/[\uE000-\uF8FF]/g, ' ')
    .replace(/[\t\u00a0]+/g, ' ')
    .replace(/[ ]{2,}/g, ' ')
    .replace(/\r/g, '')
    .trim();
}

function splitLongParagraph(paragraph, maxChars) {
  const parts = [];
  let remaining = paragraph;
  while (remaining.length > maxChars) {
    let cut = remaining.lastIndexOf(' ', maxChars);
    if (cut < maxChars * 0.6) cut = maxChars;
    parts.push(remaining.slice(0, cut).trim());
    remaining = remaining.slice(cut).trim();
  }
  if (remaining) parts.push(remaining);
  return parts;
}

function makeChunks(page) {
  const tableText = (page.tableCandidates ?? []).map((table, index) => {
    const rows = (table.rows ?? []).map((row) => row.filter(Boolean).join(' | ')).filter(Boolean);
    return rows.length ? `Unverified table candidate ${index + 1}:\n${rows.join('\n')}` : '';
  }).filter(Boolean).join('\n\n');
  const text = cleanText([page.extractedText, tableText].filter(Boolean).join('\n\n'));
  if (!text) return [];

  const paragraphs = text.split(/\n\s*\n|\n/).map((part) => part.trim()).filter(Boolean);
  const segments = paragraphs.flatMap((paragraph) => splitLongParagraph(paragraph, TARGET_CHARS));
  const chunks = [];
  let current = '';
  for (const segment of segments) {
    if (current && current.length + segment.length + 1 > TARGET_CHARS) {
      chunks.push(current);
      current = current.slice(-OVERLAP_CHARS);
    }
    current = current ? `${current}\n${segment}` : segment;
    while (current.length > TARGET_CHARS) {
      chunks.push(current.slice(0, TARGET_CHARS));
      current = current.slice(TARGET_CHARS - OVERLAP_CHARS);
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

function vectorLiteral(vector) {
  return `[${vector.join(',')}]`;
}

async function main() {
  const pages = await db.query(`
    SELECT p.id AS source_document_id,
      p.data->>'part' AS part,
      p.data->>'filename' AS filename,
      s.data->>'pdfPageNumber' AS pdf_page_number,
      s.data->>'extractedText' AS extracted_text,
      s.data->'tableCandidates' AS table_candidates
    FROM buildrule_records s
    JOIN buildrule_records p ON p.id = s.source_document_ref AND p.model = 'SourceDocument'
    WHERE s.model = 'SourcePage'
    ORDER BY p.data->>'part', (s.data->>'pdfPageNumber')::integer
  `);
  if (!pages.rowCount) throw new Error('No extracted source pages found. Run `npm run seed:source` first.');

  let indexed = 0;
  for (const page of pages.rows) {
    const chunks = makeChunks({ extractedText: page.extracted_text, tableCandidates: page.table_candidates ?? [] });
    for (let offset = 0; offset < chunks.length; offset += BATCH_SIZE) {
      const batch = chunks.slice(offset, offset + BATCH_SIZE);
      const vectors = await embedTexts(batch);
      for (let index = 0; index < batch.length; index += 1) {
        await db.query(`
          INSERT INTO rag_chunks
            (source_document_id, source_page_number, part, filename, chunk_index, content, verification_status, embedding_model, embedding)
          VALUES ($1::uuid, $2, $3, $4, $5, $6, 'NEEDS_REVIEW', $7, $8::vector)
          ON CONFLICT (source_document_id, source_page_number, chunk_index, embedding_model)
          DO UPDATE SET part = EXCLUDED.part, filename = EXCLUDED.filename, content = EXCLUDED.content,
            verification_status = EXCLUDED.verification_status, embedding = EXCLUDED.embedding, created_at = now()
        `, [page.source_document_id, Number(page.pdf_page_number), page.part, page.filename, offset + index, batch[index], embeddingModel, vectorLiteral(vectors[index])]);
        indexed += 1;
      }
    }
    await db.query(`
      DELETE FROM rag_chunks
      WHERE source_document_id = $1::uuid AND source_page_number = $2 AND embedding_model = $3 AND chunk_index >= $4
    `, [page.source_document_id, Number(page.pdf_page_number), embeddingModel, chunks.length]);
  }

  console.log(`Indexed ${indexed} source chunks with ${embeddingModel} from ${pages.rowCount} PDF pages. All passages remain marked NEEDS_REVIEW.`);
}

main().catch((error) => {
  const providerDetails = error.providerStatus
    ? ` (Cloudflare HTTP ${error.providerStatus}${error.providerCode ? `, code ${error.providerCode}` : ''}${error.providerMessage ? `: ${error.providerMessage}` : ''})`
    : '';
  console.error(`RAG indexing failed: ${error.code ?? 'unknown error'} ${error.message}${providerDetails}`);
  process.exitCode = 1;
}).finally(disconnectDatabase);
