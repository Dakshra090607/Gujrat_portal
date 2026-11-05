import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { assertIsolatedTestDatabase, connectDatabase, db, disconnectDatabase } from '../src/config/database.js';
import { Chapter, RegulationSet, RegulatoryReviewItem, ReviewAuditEvent, SourceDocument, SourcePage, State } from '../src/models/index.js';
import { approveReviewItem, claimReviewItem, saveReviewDraft } from '../src/modules/review/service.js';

const testUrl = process.env.TEST_DATABASE_URL;
if (testUrl) assertIsolatedTestDatabase(testUrl, process.env.TEST_APPLICATION_DATABASE_URL);

test('Neon PostgreSQL stores source rows and enforces the audited verification workflow', {
  skip: !testUrl && 'Set TEST_DATABASE_URL to a migrated, disposable Neon branch before running the database integration check.',
}, async (t) => {
  const database = await connectDatabase();
  assert.equal(database.schema, 'public');
  const tables = await db.query("SELECT to_regclass('public.app_users') AS users, to_regclass('public.buildrule_records') AS records");
  assert.ok(tables.rows[0].users);
  assert.ok(tables.rows[0].records);

  const suffix = randomUUID();
  const state = await State.create({ name: 'Isolated integration test', countryCode: 'ZZ', code: `T${suffix.slice(0, 7)}` });
  const regulationSet = await RegulationSet.create({
    countryCode: 'ZZ', stateId: state._id, framework: 'TEST', version: suffix.slice(0, 8), title: 'Disposable branch fixture',
  });
  const sourceDocument = await SourceDocument.create({
    regulationSetId: regulationSet._id, stateId: state._id, countryCode: 'ZZ', framework: 'TEST', version: regulationSet.version,
    part: 'Part I', partTitle: 'Integration fixture', filename: `integration-${suffix}.pdf`, storagePath: 'test-only',
    sha256: suffix.replaceAll('-', '').padEnd(64, '0').slice(0, 64), byteSize: 1, pageCount: 1,
  });
  const sourcePage = await SourcePage.create({
    sourceDocumentId: sourceDocument._id, pdfPageNumber: 1, printedPageLabel: '1', extractedText: 'Chapter 77 Test chapter wording.',
    textCharacterCount: 32, textExtractionStatus: 'EXTRACTED', candidateSnippets: [], tableCandidates: [],
  });
  const fetchedPage = await SourcePage.find({ sourceDocumentId: sourceDocument._id, extractedText: { $regex: 'test chapter', $options: 'i' } }).lean();
  assert.equal(fetchedPage.length, 1);
  assert.equal(String(fetchedPage[0]._id), String(sourcePage._id));

  const reviewerId = randomUUID();
  await db.query("INSERT INTO app_users (id, name, email, role) VALUES ($1, 'Integration Reviewer', $2, 'REVIEWER')", [reviewerId, `reviewer-${suffix}@example.test`]);
  const review = await RegulatoryReviewItem.create({
    sourceCandidateKey: suffix.replaceAll('-', ''), sourceDocumentId: sourceDocument._id, sourcePageId: sourcePage._id,
    pdfPageNumber: 1, sourceCandidatePath: 'candidateSnippets.0', sourceCandidateId: suffix,
    candidateType: 'chapter_toc_candidate', recordType: 'CHAPTER', workflowStatus: 'QUEUED', version: 0,
    draft: { originalNumber: '77', title: 'Test chapter', sequence: 77, originalText: 'Chapter 77 Test chapter wording.', sourceLocator: { pdfPageStart: 1, printedPageLabel: '1' } },
  });
  const actor = { _id: reviewerId, role: 'REVIEWER', isActive: true };
  const claimed = await claimReviewItem({ id: review._id, actor, expectedVersion: 0 });
  const saved = await saveReviewDraft({
    id: review._id, actor, expectedVersion: claimed.version, recordType: 'CHAPTER',
    draft: { originalNumber: '77', title: 'Test chapter', sequence: 77, originalText: 'Chapter 77 Test chapter wording.', sourceLocator: { pdfPageStart: 1, printedPageLabel: '1' } },
  });
  const approved = await approveReviewItem({ id: review._id, actor, expectedVersion: saved.version, note: 'Confirmed against the isolated source page.' });
  assert.equal(approved.item.workflowStatus, 'APPROVED');
  assert.equal(approved.canonical.verificationStatus, 'VERIFIED');
  assert.deepEqual(approved.canonical.sourcePageIds, [sourcePage._id]);
  assert.equal(await Chapter.countDocuments({ _id: approved.canonical._id }), 1);
  const audits = await ReviewAuditEvent.find({ reviewItemId: review._id }).sort({ createdAt: 1 }).lean();
  assert.deepEqual(audits.map((event) => event.action), ['CLAIMED', 'DRAFT_SAVED', 'APPROVED']);
  await assert.rejects(
    ReviewAuditEvent.updateOne({ _id: audits[0]._id }, { $set: { note: 'tampered' } }),
    /append-only/,
  );
  await assert.rejects(
    Chapter.create({
      regulationSetId: regulationSet._id, sourceDocumentId: sourceDocument._id, part: 'Part I',
      originalNumber: '78', title: 'Unreviewed', sequence: 78, originalText: 'Unreviewed text',
      sourceLocator: { pdfPageStart: 1 }, sourcePageIds: [sourcePage._id], verificationStatus: 'VERIFIED',
    }),
    /reviewer, review item, timestamp, and audit provenance/,
  );

  t.after(disconnectDatabase);
});
