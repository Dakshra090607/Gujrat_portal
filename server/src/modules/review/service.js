import { createHash } from 'node:crypto';
import { startSession } from '../../config/database.js';
import { newId } from '../../db/model-store.js';
import {
  Authority,
  Chapter,
  Definition,
  Regulation,
  RegulatoryCrossReference,
  RegulatoryNode,
  RegulatoryParameter,
  RegulatoryReviewItem,
  RegulatoryTable,
  ReviewAuditEvent,
  SourceDocument,
  SourcePage,
} from '../../models/index.js';
import { parseApprovalDraft, validateDraftSave } from './draft-schemas.js';

export class ReviewWorkflowError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const conflict = (message = 'This review item changed. Refresh it and try again.') => new ReviewWorkflowError(409, 'REVIEW_CONFLICT', message);
const invalid = (message, details) => new ReviewWorkflowError(422, 'INVALID_REVIEW_DATA', message, details);
const canonicalModels = {
  Chapter,
  Regulation,
  RegulatoryNode,
  RegulatoryTable,
  Definition,
  RegulatoryParameter,
  RegulatoryCrossReference,
};

async function transaction(operation) {
  const session = startSession();
  let result;
  try {
    await session.withTransaction(async () => { result = await operation(session); });
    return result;
  } finally {
    await session.endSession();
  }
}

function idOf(value) {
  return value ? String(value) : null;
}

function recordDetails(item, draft) {
  const sourceDocumentId = item.sourceDocumentId;
  const sourceDocument = item._sourceDocument;
  const verificationProvenance = item._verificationProvenance;
  const base = {
    _id: item._canonicalId,
    regulationSetId: sourceDocument.regulationSetId,
    sourceDocumentId,
    sourcePageIds: item._sourcePageIds,
    verificationStatus: 'VERIFIED',
    verificationProvenance,
  };

  switch (item.recordType) {
    case 'CHAPTER':
      return {
        ...base, part: sourceDocument.part, originalNumber: draft.originalNumber, title: draft.title,
        sequence: draft.sequence, originalText: draft.originalText, sourceLocator: draft.sourceLocator,
      };
    case 'REGULATION':
      return {
        ...base, chapterId: idOf(draft.chapterId), originalNumber: draft.originalNumber, title: draft.title,
        sequence: draft.sequence, originalText: draft.originalText, parentResolution: draft.parentResolution,
        sourceLocators: draft.sourceLocators,
      };
    case 'REGULATORY_NODE':
      return {
        regulationSetId: sourceDocument.regulationSetId, sourceDocumentId, sourcePageIds: item._sourcePageIds,
        regulationId: idOf(draft.regulationId), parentId: idOf(draft.parentId), originalLabel: draft.originalLabel,
        nodeType: draft.nodeType, sequence: draft.sequence, originalText: draft.originalText,
        sourceLocators: draft.sourceLocators, verificationStatus: 'VERIFIED', verificationProvenance,
      };
    case 'CONDITION_EXCEPTION':
      return {
        regulationSetId: sourceDocument.regulationSetId, sourceDocumentId, sourcePageIds: item._sourcePageIds,
        regulationId: idOf(draft.regulationId), parentId: idOf(draft.parentId), originalLabel: draft.originalLabel,
        nodeType: 'note', sequence: draft.sequence, originalText: draft.originalText,
        sourceLocators: draft.sourceLocators, verificationStatus: 'VERIFIED', verificationProvenance,
      };
    case 'TABLE':
      return {
        ...base, regulationId: idOf(draft.regulationId), parentResolution: draft.parentResolution,
        originalIdentifier: draft.originalIdentifier, title: draft.title, headers: draft.headers,
        rows: draft.rows, footnotes: draft.footnotes, conditions: draft.conditions, sourceLocators: draft.sourceLocators,
      };
    case 'DEFINITION':
      return {
        ...base, regulationId: idOf(draft.regulationId), parentResolution: draft.regulationId ? 'LINKED_TO_VERIFIED_REGULATION' : 'SOURCE_STANDALONE',
        term: draft.term, originalText: draft.originalText,
        simplifiedExplanation: draft.simplifiedExplanation, sourceLocators: draft.sourceLocators,
      };
    case 'PARAMETER':
      return {
        ...base, regulationId: idOf(draft.regulationId), tableId: idOf(draft.tableId), key: draft.key,
        value: draft.value, applicability: draft.applicability, sourceLocators: draft.sourceLocators,
      };
    case 'CROSS_REFERENCE':
      return {
        ...base, sourceRegulationId: idOf(draft.sourceRegulationId), targetRegulationId: idOf(draft.targetRegulationId),
        targetReferenceLabel: draft.targetReferenceLabel, originalText: draft.originalText, sourceLocators: draft.sourceLocators,
      };
    default:
      throw invalid('Classify this candidate before approval.');
  }
}

function canonicalType(recordType) {
  return ({
    CHAPTER: 'Chapter', REGULATION: 'Regulation', REGULATORY_NODE: 'RegulatoryNode',
    CONDITION_EXCEPTION: 'RegulatoryNode', TABLE: 'RegulatoryTable', DEFINITION: 'Definition',
    PARAMETER: 'RegulatoryParameter', CROSS_REFERENCE: 'RegulatoryCrossReference',
  })[recordType];
}

function shorten(value) {
  if (value === undefined) return null;
  const serialized = JSON.stringify(value);
  return serialized.length <= 2000 ? value : `${serialized.slice(0, 1997)}...`;
}

function changedFields(before, after, prefix = '', result = []) {
  if (result.length >= 250) return result;
  const isPlainObject = (value) => value && typeof value === 'object' && !Array.isArray(value);
  if (isPlainObject(before) && isPlainObject(after)) {
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
    for (const key of keys) changedFields(before[key], after[key], prefix ? `${prefix}.${key}` : key, result);
    return result;
  }
  if (JSON.stringify(before) !== JSON.stringify(after)) result.push({ path: prefix, before: shorten(before), after: shorten(after) });
  return result;
}

async function loadReviewItem(id, session) {
  let query = RegulatoryReviewItem.findById(id);
  if (session) query = query.session(session);
  const item = await query;
  if (!item) throw new ReviewWorkflowError(404, 'REVIEW_ITEM_NOT_FOUND', 'Review item not found.');
  return item;
}

function assertVersion(item, expectedVersion) {
  if (item.version !== expectedVersion) throw conflict();
}

function assertReviewerActor(actor) {
  if (!actor?._id || !['REVIEWER', 'ADMIN'].includes(actor.role) || actor.isActive === false) {
    throw new ReviewWorkflowError(403, 'FORBIDDEN', 'An active reviewer or administrator account is required.');
  }
}

function assertAssigned(item, actor) {
  if (actor.role !== 'ADMIN' && String(item.assignedReviewerId) !== String(actor._id)) {
    throw new ReviewWorkflowError(403, 'REVIEW_NOT_ASSIGNED', 'Claim this review item before changing it.');
  }
}

async function writeAudit(session, event) {
  return (await ReviewAuditEvent.create([event], { session }))[0];
}

async function appendTransition({ id, actor, expectedVersion, allowedStatuses, update, action, note = '' }) {
  return transaction(async (session) => {
    const item = await loadReviewItem(id, session);
    assertVersion(item, expectedVersion);
    if (!allowedStatuses.includes(item.workflowStatus)) throw conflict(`Action is unavailable while the item is ${item.workflowStatus}.`);
    assertAssigned(item, actor);
    const fromStatus = item.workflowStatus;
    const nextVersion = item.version + 1;
    const changed = await RegulatoryReviewItem.findOneAndUpdate(
      { _id: item._id, version: item.version, workflowStatus: item.workflowStatus },
      { $set: { ...update, version: nextVersion } },
      { new: true, runValidators: true, session },
    );
    if (!changed) throw conflict();
    await writeAudit(session, {
      reviewItemId: item._id, actorId: actor._id, action, fromStatus,
      toStatus: changed.workflowStatus, version: nextVersion, note,
      changedFields: changedFields(
        { workflowStatus: fromStatus, assignedReviewerId: item.assignedReviewerId },
        { workflowStatus: changed.workflowStatus, assignedReviewerId: changed.assignedReviewerId },
      ),
    });
    return changed.toObject();
  });
}

export async function claimReviewItem({ id, actor, expectedVersion }) {
  assertReviewerActor(actor);
  return transaction(async (session) => {
    const item = await loadReviewItem(id, session);
    assertVersion(item, expectedVersion);
    if (!['QUEUED', 'RETURNED_FOR_CORRECTION', 'IN_REVIEW'].includes(item.workflowStatus)) throw conflict('This item cannot be claimed in its current state.');
    if (item.workflowStatus === 'IN_REVIEW' && item.assignedReviewerId && String(item.assignedReviewerId) !== String(actor._id) && actor.role !== 'administrator') {
      throw new ReviewWorkflowError(409, 'ALREADY_ASSIGNED', 'Another reviewer has claimed this item.');
    }
    const nextVersion = item.version + 1;
    const fromStatus = item.workflowStatus;
    const updated = await RegulatoryReviewItem.findOneAndUpdate(
      { _id: item._id, version: item.version, workflowStatus: item.workflowStatus },
      { $set: { workflowStatus: 'IN_REVIEW', assignedReviewerId: actor._id, version: nextVersion } },
      { new: true, runValidators: true, session },
    );
    if (!updated) throw conflict();
    await writeAudit(session, {
      reviewItemId: item._id, actorId: actor._id, action: 'CLAIMED', fromStatus,
      toStatus: 'IN_REVIEW', version: nextVersion,
      note: 'Review item claimed.',
      changedFields: changedFields({ workflowStatus: fromStatus, assignedReviewerId: item.assignedReviewerId }, { workflowStatus: 'IN_REVIEW', assignedReviewerId: actor._id }),
    });
    return updated.toObject();
  });
}

export async function saveReviewDraft({ id, actor, expectedVersion, recordType, draft: incomingDraft }) {
  assertReviewerActor(actor);
  let draft;
  try {
    draft = validateDraftSave(recordType, incomingDraft);
  } catch (error) {
    throw invalid(error.message);
  }
  return transaction(async (session) => {
    const item = await loadReviewItem(id, session);
    assertVersion(item, expectedVersion);
    if (item.workflowStatus !== 'IN_REVIEW') throw conflict('Claim this item before saving corrections.');
    assertAssigned(item, actor);
    const nextVersion = item.version + 1;
    const nextFields = { recordType, draft, version: nextVersion };
    const fields = changedFields({ recordType: item.recordType, draft: item.draft }, { recordType, draft });
    const updated = await RegulatoryReviewItem.findOneAndUpdate(
      { _id: item._id, version: item.version, workflowStatus: 'IN_REVIEW' },
      { $set: nextFields },
      { new: true, runValidators: true, session },
    );
    if (!updated) throw conflict();
    await writeAudit(session, {
      reviewItemId: item._id, actorId: actor._id, action: 'DRAFT_SAVED', fromStatus: 'IN_REVIEW',
      toStatus: 'IN_REVIEW', version: nextVersion, changedFields: fields,
      note: 'Review draft correction saved.',
    });
    return updated.toObject();
  });
}

export async function returnReviewItem({ id, actor, expectedVersion, note }) {
  assertReviewerActor(actor);
  if (!note?.trim()) throw invalid('A return note is required.');
  return appendTransition({
    id, actor, expectedVersion, allowedStatuses: ['IN_REVIEW'],
    update: { workflowStatus: 'RETURNED_FOR_CORRECTION', assignedReviewerId: null },
    action: 'RETURNED', note: note.trim(),
  });
}

export async function rejectReviewItem({ id, actor, expectedVersion, note }) {
  assertReviewerActor(actor);
  if (!note?.trim()) throw invalid('A rejection note is required.');
  return appendTransition({
    id, actor, expectedVersion, allowedStatuses: ['IN_REVIEW'],
    update: { workflowStatus: 'REJECTED', assignedReviewerId: null },
    action: 'REJECTED', note: note.trim(),
  });
}

async function validateSources(item, draft, sourceDocument, session) {
  const locators = item.recordType === 'CHAPTER' ? [draft.sourceLocator] : draft.sourceLocators;
  const requestedPages = new Set();
  for (const locator of locators) {
    const start = locator.pdfPageStart;
    const end = locator.pdfPageEnd ?? start;
    if (end < start || end - start > 20 || end > sourceDocument.pageCount) throw invalid('A source page locator is outside the document or spans too many pages.');
    for (let pageNumber = start; pageNumber <= end; pageNumber += 1) requestedPages.add(pageNumber);
  }
  const pageQuery = SourcePage.find({ sourceDocumentId: sourceDocument._id, pdfPageNumber: { $in: [...requestedPages] } }).select('_id pdfPageNumber');
  if (session) pageQuery.session(session);
  const pages = await pageQuery.lean();
  if (pages.length !== requestedPages.size) throw invalid('Every cited PDF page must exist in the selected source document.');
  if (!pages.some((page) => String(page._id) === String(item.sourcePageId))) throw invalid('The candidate source page must remain included in the approved source locators.');
  return pages.sort((left, right) => left.pdfPageNumber - right.pdfPageNumber).map((page) => page._id);
}

async function verifiedReference(Model, id, sourceDocument, session, name) {
  let query = Model.findById(id);
  if (session) query = query.session(session);
  const record = await query;
  if (!record || record.verificationStatus !== 'VERIFIED' || String(record.regulationSetId) !== String(sourceDocument.regulationSetId)) {
    throw invalid(`${name} must reference an existing verified record in this regulation set.`);
  }
  return record;
}

async function validateParents(item, draft, sourceDocument, session) {
  if (item.recordType === 'REGULATION' && draft.parentResolution === 'LINKED_TO_VERIFIED_CHAPTER') {
    const chapter = await verifiedReference(Chapter, draft.chapterId, sourceDocument, session, 'Chapter');
    if (chapter.part !== sourceDocument.part || String(chapter.sourceDocumentId) !== String(sourceDocument._id)) throw invalid('A regulation must use a verified chapter from the same source part.');
  }
  if (item.recordType === 'TABLE' && draft.parentResolution === 'LINKED_TO_VERIFIED_REGULATION') {
    const regulation = await verifiedReference(Regulation, draft.regulationId, sourceDocument, session, 'Table regulation');
    if (String(regulation.sourceDocumentId) !== String(sourceDocument._id)) throw invalid('A table must use a verified regulation from the same source document.');
  }
  if (item.recordType === 'DEFINITION' && draft.regulationId) {
    const regulation = await verifiedReference(Regulation, draft.regulationId, sourceDocument, session, 'Definition regulation');
    if (String(regulation.sourceDocumentId) !== String(sourceDocument._id)) throw invalid('A definition must use a verified regulation from the same source document.');
  }
  if (item.recordType === 'REGULATORY_NODE' || item.recordType === 'CONDITION_EXCEPTION') {
    const regulation = await verifiedReference(Regulation, draft.regulationId, sourceDocument, session, 'Parent regulation');
    if (String(regulation.sourceDocumentId) !== String(sourceDocument._id)) throw invalid('A clause or condition must use a verified regulation from the same source document.');
    if (draft.parentId) {
      const parent = await verifiedReference(RegulatoryNode, draft.parentId, sourceDocument, session, 'Parent clause');
      if (String(parent.regulationId) !== String(regulation._id)) throw invalid('The parent clause must belong to the selected regulation.');
    }
  }
  if (item.recordType === 'PARAMETER') {
    const regulation = await verifiedReference(Regulation, draft.regulationId, sourceDocument, session, 'Parameter regulation');
    if (String(regulation.sourceDocumentId) !== String(sourceDocument._id)) throw invalid('A parameter must use a verified regulation from the same source document.');
    if (draft.tableId) {
      const table = await verifiedReference(RegulatoryTable, draft.tableId, sourceDocument, session, 'Parameter table');
      if (String(table.regulationId) !== String(regulation._id)) throw invalid('The parameter table must belong to the selected regulation.');
    }
    if (draft.applicability.authorityIds.length) {
      const authorities = await Authority.find({ _id: { $in: draft.applicability.authorityIds }, stateId: sourceDocument.stateId, verificationStatus: 'VERIFIED' }).session(session).distinct('_id');
      if (authorities.length !== draft.applicability.authorityIds.length) throw invalid('Every authority condition must reference an existing verified authority in the source state.');
    }
  }
  if (item.recordType === 'CROSS_REFERENCE') {
    const sourceRegulation = await verifiedReference(Regulation, draft.sourceRegulationId, sourceDocument, session, 'Cross-reference source regulation');
    const targetRegulation = await verifiedReference(Regulation, draft.targetRegulationId, sourceDocument, session, 'Cross-reference target regulation');
    if (String(sourceRegulation.sourceDocumentId) !== String(sourceDocument._id)) throw invalid('The source regulation must belong to this source document.');
    if (String(targetRegulation.originalNumber) !== draft.targetReferenceLabel) throw invalid('The selected target regulation number must match the cited source label.');
  }
}

export async function approveReviewItem({ id, actor, expectedVersion, note }) {
  assertReviewerActor(actor);
  if (!note?.trim()) throw invalid('An approval note is required.');
  return transaction(async (session) => {
    const item = await loadReviewItem(id, session);
    if (item.workflowStatus === 'APPROVED') {
      const Model = canonicalModels[item.canonicalRecordType];
      const canonical = Model ? await Model.findById(item.canonicalRecordId).session(session).lean() : null;
      return { item: item.toObject(), canonical, alreadyApproved: true };
    }
    assertVersion(item, expectedVersion);
    if (item.workflowStatus !== 'IN_REVIEW') throw conflict('Claim this item before approving it.');
    assertAssigned(item, actor);

    let draft;
    try {
      draft = parseApprovalDraft(item.recordType, item.draft);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        throw invalid('The draft does not meet the regulatory schema requirements.', error.issues.map(({ path, message }) => ({ path: path.join('.'), message })));
      }
      throw invalid(error.message);
    }
    const sourceDocument = await SourceDocument.findById(item.sourceDocumentId).session(session);
    if (!sourceDocument) throw invalid('The candidate source document no longer exists.');
    const sourcePageIds = await validateSources(item, draft, sourceDocument, session);
    await validateParents(item, draft, sourceDocument, session);

    const type = canonicalType(item.recordType);
    const Model = canonicalModels[type];
    if (!Model) throw invalid('This candidate type does not map to a canonical regulatory model.');
    const canonicalId = newId();
    const auditId = newId();
    const approvedAt = new Date();
    const newVersion = item.version + 1;
    const canonicalPayload = recordDetails({
      ...item.toObject(),
      _canonicalId: canonicalId,
      _sourcePageIds: sourcePageIds,
      _sourceDocument: sourceDocument,
      _verificationProvenance: {
        reviewItemId: item._id, reviewedById: actor._id, approvedAt, auditEventId: auditId,
      },
    }, draft);

    await session.client.query("SET LOCAL buildrule.approval_transaction = 'on'");
    await writeAudit(session, {
      _id: auditId, reviewItemId: item._id, actorId: actor._id, action: 'APPROVED',
      fromStatus: 'IN_REVIEW', toStatus: 'APPROVED', version: newVersion, note: note.trim(),
      canonicalRecordType: type, canonicalRecordId: canonicalId,
      changedFields: changedFields(
        { workflowStatus: 'IN_REVIEW', assignedReviewerId: item.assignedReviewerId, verificationStatus: 'NEEDS_REVIEW' },
        { workflowStatus: 'APPROVED', assignedReviewerId: actor._id, verificationStatus: 'VERIFIED' },
      ),
    });
    const canonicalRecord = (await Model.create([canonicalPayload], { session }))[0];
    const updated = await RegulatoryReviewItem.findOneAndUpdate(
      { _id: item._id, version: item.version, workflowStatus: 'IN_REVIEW', assignedReviewerId: item.assignedReviewerId },
      { $set: {
        workflowStatus: 'APPROVED', canonicalRecordType: type, canonicalRecordId: canonicalRecord._id,
        approvedById: actor._id, approvedAt, assignedReviewerId: actor._id, version: newVersion,
      } },
      { new: true, runValidators: true, session },
    );
    if (!updated) throw conflict();
    return { item: updated.toObject(), canonical: canonicalRecord.toObject(), alreadyApproved: false };
  });
}

export async function listReviewItems(query) {
  const page = Number(query.page ?? 1);
  const pageSize = Number(query.pageSize ?? 25);
  const filter = {};
  if (query.recordType) filter.recordType = query.recordType;
  if (query.workflowStatus) filter.workflowStatus = query.workflowStatus;
  if (query.assignee === 'me' && query.userId) filter.assignedReviewerId = query.userId;
  else if (query.assignee === 'unassigned') filter.assignedReviewerId = null;
  else if (query.assignee && query.assignee !== 'me') filter.assignedReviewerId = query.assignee;
  if (query.sourceDocumentId) filter.sourceDocumentId = query.sourceDocumentId;
  if (query.pdfPageNumber) filter.pdfPageNumber = Number(query.pdfPageNumber);
  if (query.part) {
    const documents = await SourceDocument.find({ part: query.part }).distinct('_id');
    filter.sourceDocumentId = { $in: documents };
  }
  const [data, total] = await Promise.all([
    RegulatoryReviewItem.find(filter)
      .select('-sourceSnapshot')
      .populate('sourceDocumentId', 'part partTitle filename pageCount')
      .populate('assignedReviewerId', 'name email role')
      .sort({ workflowStatus: 1, sourceDocumentId: 1, pdfPageNumber: 1, _id: 1 })
      .skip((page - 1) * pageSize).limit(pageSize).lean(),
    RegulatoryReviewItem.countDocuments(filter),
  ]);
  return { data, pagination: { page, pageSize, total, pages: Math.ceil(total / pageSize) } };
}

export async function getReviewItem(id) {
  const item = await RegulatoryReviewItem.findById(id)
    .populate('sourceDocumentId', 'part partTitle filename pageCount sha256')
    .populate('assignedReviewerId', 'name email role')
    .populate('approvedById', 'name email role')
    .lean();
  if (!item) throw new ReviewWorkflowError(404, 'REVIEW_ITEM_NOT_FOUND', 'Review item not found.');
  const page = await SourcePage.findById(item.sourcePageId).select('pdfPageNumber printedPageLabel extractedText textExtractionStatus').lean();
  if (!page) throw invalid('The candidate source page is unavailable.');
  const audit = await ReviewAuditEvent.find({ reviewItemId: item._id }).populate('actorId', 'name email role').sort({ createdAt: 1 }).lean();
  return { ...item, sourcePage: page, audit };
}

export async function listReviewAudit(id) {
  if (!await RegulatoryReviewItem.exists({ _id: id })) throw new ReviewWorkflowError(404, 'REVIEW_ITEM_NOT_FOUND', 'Review item not found.');
  return ReviewAuditEvent.find({ reviewItemId: id }).populate('actorId', 'name email role').sort({ createdAt: 1 }).lean();
}

export async function listReviewReferences(type, sourceDocumentId) {
  const source = await SourceDocument.findById(sourceDocumentId).select('regulationSetId part').lean();
  if (!source) throw new ReviewWorkflowError(404, 'DOCUMENT_NOT_FOUND', 'Source document not found.');
  if (type === 'chapters') return Chapter.find({ regulationSetId: source.regulationSetId, sourceDocumentId, verificationStatus: 'VERIFIED' }).select('originalNumber title part').sort({ sequence: 1 }).limit(500).lean();
  if (type === 'regulations') return Regulation.find({ regulationSetId: source.regulationSetId, sourceDocumentId, verificationStatus: 'VERIFIED' }).select('originalNumber title').sort({ sequence: 1 }).limit(1000).lean();
  if (type === 'all-regulations') return Regulation.find({ regulationSetId: source.regulationSetId, verificationStatus: 'VERIFIED' }).select('originalNumber title sourceDocumentId').populate('sourceDocumentId', 'part').sort({ sourceDocumentId: 1, sequence: 1 }).limit(2000).lean();
  if (type === 'tables') return RegulatoryTable.find({ regulationSetId: source.regulationSetId, sourceDocumentId, verificationStatus: 'VERIFIED' }).select('originalIdentifier title regulationId').sort({ originalIdentifier: 1 }).limit(1000).lean();
  if (type === 'nodes') {
    const regulations = await Regulation.find({ regulationSetId: source.regulationSetId, sourceDocumentId, verificationStatus: 'VERIFIED' }).distinct('_id');
    return RegulatoryNode.find({ regulationId: { $in: regulations }, verificationStatus: 'VERIFIED' }).select('originalLabel originalText regulationId').sort({ sequence: 1 }).limit(1500).lean();
  }
  throw invalid('Unsupported reference type.');
}

function mapInitialRecordType(candidateType, isTableCandidate) {
  if (isTableCandidate || candidateType === 'table_or_schedule_candidate') return 'TABLE';
  return ({
    chapter_toc_candidate: 'CHAPTER',
    definition_candidate: 'DEFINITION',
    numeric_parameter_candidate: 'PARAMETER',
    condition_or_exception_candidate: 'CONDITION_EXCEPTION',
    cross_reference_candidate: 'CROSS_REFERENCE',
  })[candidateType] ?? 'UNCLASSIFIED';
}

export async function backfillReviewQueue() {
  const documents = await SourceDocument.find().select('_id sha256').lean();
  let queued = 0;
  for (const document of documents) {
    const pages = await SourcePage.find({ sourceDocumentId: document._id })
      .select('_id sourceDocumentId pdfPageNumber candidateSnippets tableCandidates').lean();
    for (const page of pages) {
      const candidates = [
        ...(page.candidateSnippets ?? []).map((candidate, index) => ({ candidate, index, field: 'candidateSnippets', isTable: false })),
        ...(page.tableCandidates ?? []).map((candidate, index) => ({ candidate, index, field: 'tableCandidates', isTable: true })),
      ];
      if (!candidates.length) continue;
      const operations = candidates.map(({ candidate, index, field, isTable }) => {
        const candidateId = String(candidate.candidateId ?? `${field}-${index}`);
        const candidateType = isTable ? 'table_candidate' : String(candidate.kind ?? 'unclassified_candidate');
        const sourceCandidateKey = createHash('sha256').update(`${document.sha256}:${page.pdfPageNumber}:${field}:${candidateId}`).digest('hex');
        const snippet = candidate.sourceSnippet ?? candidate.sourceLine ?? '';
        const locator = { pdfPageStart: page.pdfPageNumber, printedPageLabel: page.printedPageLabel ?? '' };
        const draft = {};
        if (mapInitialRecordType(candidateType, isTable) !== 'TABLE') draft.originalText = typeof snippet === 'string' ? snippet : '';
        if (mapInitialRecordType(candidateType, isTable) === 'CHAPTER') draft.sourceLocator = locator;
        else draft.sourceLocators = [locator];
        return {
          updateOne: {
            filter: { sourceCandidateKey },
            update: { $setOnInsert: {
              sourceCandidateKey,
              sourceDocumentId: document._id,
              sourcePageId: page._id,
              pdfPageNumber: page.pdfPageNumber,
              sourceCandidatePath: `${field}.${index}`,
              sourceCandidateId: candidateId,
              candidateType,
              sourceSnapshot: candidate,
              recordType: mapInitialRecordType(candidateType, isTable),
              workflowStatus: 'QUEUED',
              draft,
              version: 0,
            } },
            upsert: true,
          },
        };
      });
      const result = await RegulatoryReviewItem.bulkWrite(operations, { ordered: false });
      queued += result.upsertedCount ?? 0;
    }
  }
  return { sourceDocuments: documents.length, insertedReviewItems: queued, totalReviewItems: await RegulatoryReviewItem.countDocuments() };
}

export async function ensureReviewIndexes() {
  await Promise.all([
    RegulatoryReviewItem.createIndexes(),
    ReviewAuditEvent.createIndexes(),
    Definition.createIndexes(),
    RegulatoryCrossReference.createIndexes(),
  ]);
}
