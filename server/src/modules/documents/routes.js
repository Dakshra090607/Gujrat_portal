import { Router } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SourceDocument, SourcePage } from '../../models/index.js';

const router = Router();
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../');

router.get('/', async (_req, res) => {
  const documents = await SourceDocument.find()
    .select('part partTitle filename sha256 byteSize mimeType pageCount metadata extractionTool extractionVersion extractionStatus version framework')
    .sort({ part: 1 })
    .lean();
  res.json({ data: documents, total: documents.length });
});

router.get('/:id/pages', async (req, res) => {
  const document = await SourceDocument.findById(req.params.id).select('_id pageCount part filename').lean();
  if (!document) return res.status(404).json({ error: { code: 'DOCUMENT_NOT_FOUND', message: 'Source document not found.' } });
  const requestedPage = Number(req.query.page ?? 1);
  if (!Number.isInteger(requestedPage) || requestedPage < 1 || requestedPage > document.pageCount) {
    return res.status(400).json({ error: { code: 'INVALID_PAGE', message: `Page must be between 1 and ${document.pageCount}.` } });
  }
  const page = await SourcePage.findOne({ sourceDocumentId: document._id, pdfPageNumber: requestedPage }).lean();
  if (!page) return res.status(404).json({ error: { code: 'PAGE_NOT_EXTRACTED', message: 'Text for this PDF page is not available.' } });
  res.json({
    data: {
      document: { id: document._id, part: document.part, filename: document.filename, pageCount: document.pageCount },
      page: { pdfPageNumber: page.pdfPageNumber, printedPageLabel: page.printedPageLabel, text: page.extractedText, status: page.textExtractionStatus },
    },
  });
});

router.get('/:id/pdf', async (req, res) => {
  const document = await SourceDocument.findById(req.params.id).select('filename').lean();
  if (!document) return res.status(404).json({ error: { code: 'DOCUMENT_NOT_FOUND', message: 'Source document not found.' } });
  const knownName = ['CGDCR-2017 PART-I PROCEDURE REGULATIONS.pdf', 'CGDCR-2017 PART-II PLANNING REGULATIONS.pdf', 'CGDCR-2017 PART-III PERFORMANCE REGULATION.pdf'].includes(document.filename);
  if (!knownName) return res.status(404).json({ error: { code: 'SOURCE_FILE_UNAVAILABLE', message: 'The source PDF is unavailable.' } });
  res.type('application/pdf').sendFile(path.join(rootDir, document.filename));
});

router.get('/:id', async (req, res) => {
  const document = await SourceDocument.findById(req.params.id)
    .select('part partTitle filename sha256 byteSize mimeType pageCount metadata extractionTool extractionVersion extractionStatus version framework')
    .lean();
  if (!document) return res.status(404).json({ error: { code: 'DOCUMENT_NOT_FOUND', message: 'Source document not found.' } });
  const extractedPageCount = await SourcePage.countDocuments({ sourceDocumentId: document._id, textExtractionStatus: 'EXTRACTED' });
  res.json({ data: { ...document, extractedPageCount } });
});

export default router;
