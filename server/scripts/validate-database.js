import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { db } from '../src/config/database.js';
import {
  Chapter,
  Regulation,
  RegulationSet,
  RegulatoryParameter,
  SourceDocument,
  SourcePage,
  State,
} from '../src/models/index.js';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '../..');
const manifestPath = path.join(rootDir, 'data/extracted/manifest.json');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  await connectDatabase();

  const [states, sets, documents, parameters] = await Promise.all([
    State.find({ countryCode: 'IN', code: 'GJ' }).lean(),
    RegulationSet.find({ countryCode: 'IN', framework: 'CGDCR', version: '2017' }).lean(),
    SourceDocument.find({ framework: 'CGDCR', version: '2017' }).lean(),
    RegulatoryParameter.find().lean(),
  ]);
  assert(states.length === 1, `Expected one Gujarat state record, found ${states.length}.`);
  assert(sets.length === 1, `Expected one CGDCR-2017 regulation set, found ${sets.length}.`);
  assert(documents.length === 3, `Expected three source documents, found ${documents.length}.`);
  const [chapters, regulations] = await Promise.all([
    Chapter.countDocuments({ regulationSetId: sets[0]._id }),
    Regulation.countDocuments({ regulationSetId: sets[0]._id }),
  ]);

  let totalPages = 0;
  let totalReviewCandidates = 0;
  const sourceSummary = [];
  for (const source of documents) {
    const expected = manifest.documents.find((item) => item.sha256 === source.sha256);
    assert(expected, `Seeded source ${source.filename} does not match a source hash in the manifest.`);
    assert(source.pageCount === expected.pdfPageCount, `Page count mismatch for ${source.filename}.`);
    assert(source.part === expected.part, `Part mismatch for ${source.filename}.`);

    const pages = await SourcePage.find({ sourceDocumentId: source._id }).sort({ pdfPageNumber: 1 }).lean();
    assert(pages.length === source.pageCount, `Expected ${source.pageCount} page records for ${source.filename}, found ${pages.length}.`);
    let extracted = 0;
    let tables = 0;
    for (let index = 0; index < pages.length; index += 1) {
      const page = pages[index];
      assert(page.pdfPageNumber === index + 1, `Page gap or duplicate at ${source.filename}, PDF page ${index + 1}.`);
      assert(page.textExtractionStatus === 'EXTRACTED', `Page ${page.pdfPageNumber} needs review in ${source.filename}.`);
      assert(page.textCharacterCount === page.extractedText.length, `Character count mismatch at ${source.filename}, PDF page ${page.pdfPageNumber}.`);
      extracted += 1;
      tables += page.tableCandidates.length;
      for (const candidate of [...page.candidateSnippets, ...page.tableCandidates]) {
        assert(candidate.verificationStatus === 'NEEDS_REVIEW', `A candidate was incorrectly promoted in ${source.filename}, page ${page.pdfPageNumber}.`);
        assert(candidate.sourceLocator?.pdfPageNumber === page.pdfPageNumber, `Candidate page locator mismatch in ${source.filename}, page ${page.pdfPageNumber}.`);
        totalReviewCandidates += 1;
      }
    }
    totalPages += pages.length;
    sourceSummary.push({ part: source.part, pages: pages.length, extractedPages: extracted, tableCandidates: tables });
  }

  const cgdcrParameters = parameters.filter((item) => String(item.regulationSetId) === String(sets[0]._id));
  const reviewOnlyParameters = cgdcrParameters.filter((item) => item.verificationStatus !== 'VERIFIED').length;
  assert(totalPages === manifest.totals.pdfPages, `Imported page total ${totalPages} does not match manifest ${manifest.totals.pdfPages}.`);
  assert(totalReviewCandidates === manifest.totals.candidateObjectsForReview, `Candidate count ${totalReviewCandidates} does not match extraction manifest.`);
  assert(cgdcrParameters.length === 0, 'No unreviewed parameter candidates should be stored as RegulatoryParameter records.');

  const indexes = await db.query(`SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'buildrule_records'`);
  assert(indexes.rows.some((index) => index.indexname === 'buildrule_records_data_gin'), 'PostgreSQL source-record JSONB index is missing.');
  const matches = await db.query(`SELECT count(*)::integer AS count FROM buildrule_records
    WHERE model = 'SourcePage' AND position('space ind' in lower(COALESCE(data->>'extractedText', ''))) > 0`);
  const substringMatches = matches.rows[0].count;
  assert(substringMatches > 0, 'Case-insensitive partial source-page search check returned no results.');

  console.log(JSON.stringify({
    status: 'PASS',
    stateRecords: states.length,
    regulationSets: sets.length,
    sourceDocuments: documents.length,
    sourcePages: totalPages,
    reviewCandidates: totalReviewCandidates,
    verifiedChapters: chapters,
    verifiedRegulations: regulations,
    verifiedParameters: cgdcrParameters.length - reviewOnlyParameters,
    caseInsensitivePartialSearchMatches: substringMatches,
    sources: sourceSummary,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(`Database validation failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(disconnectDatabase);
