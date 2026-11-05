import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Choose an existing record.');
const sourceLocator = z.object({
  pdfPageStart: z.number().int().positive(),
  pdfPageEnd: z.number().int().positive().optional(),
  printedPageLabel: z.string().trim().max(80).optional(),
}).strict().refine((value) => value.pdfPageEnd === undefined || value.pdfPageEnd >= value.pdfPageStart, {
  path: ['pdfPageEnd'], message: 'End page must be the same as or after the start page.',
});
const sourceLocators = z.array(sourceLocator).min(1).max(12);
const originalText = z.string().max(120_000).refine((value) => value.trim().length > 0, 'Original source wording is required.');
const label = z.string().trim().min(1).max(300);
const textList = z.array(z.string().trim().min(1).max(3000)).max(100);
export const REVIEW_RECORD_TYPES = [
  'UNCLASSIFIED', 'CHAPTER', 'REGULATION', 'REGULATORY_NODE', 'TABLE', 'DEFINITION',
  'PARAMETER', 'CONDITION_EXCEPTION', 'CROSS_REFERENCE',
];

const schemas = {
  CHAPTER: z.object({
    originalNumber: label,
    title: label,
    sequence: z.number().int().min(0),
    originalText,
    sourceLocator: sourceLocator,
  }).strict(),
  REGULATION: z.object({
    originalNumber: label,
    title: z.string().trim().max(500).default(''),
    sequence: z.number().int().min(0),
    originalText,
    parentResolution: z.enum(['LINKED_TO_VERIFIED_CHAPTER', 'SOURCE_ROOT']),
    chapterId: objectId.nullable().optional(),
    sourceLocators,
  }).strict().refine((draft) => draft.parentResolution === 'LINKED_TO_VERIFIED_CHAPTER'
    ? Boolean(draft.chapterId)
    : !draft.chapterId, { path: ['chapterId'], message: 'Choose a verified chapter or explicitly confirm the regulation is a source root.' }),
  REGULATORY_NODE: z.object({
    regulationId: objectId,
    parentId: objectId.nullable().optional(),
    originalLabel: label,
    nodeType: z.enum(['sub-regulation', 'clause', 'sub-clause', 'item', 'note']),
    sequence: z.number().int().min(0),
    originalText,
    sourceLocators,
  }).strict(),
  TABLE: z.object({
    originalIdentifier: label,
    title: z.string().trim().max(500).default(''),
    parentResolution: z.enum(['LINKED_TO_VERIFIED_REGULATION', 'SOURCE_STANDALONE']),
    regulationId: objectId.nullable().optional(),
    headers: z.array(label).min(1).max(100),
    rows: z.array(z.array(z.string().max(3000))).min(1).max(500),
    footnotes: textList.default([]),
    conditions: textList.default([]),
    sourceLocators,
  }).strict()
    .refine((draft) => draft.parentResolution === 'LINKED_TO_VERIFIED_REGULATION'
      ? Boolean(draft.regulationId)
      : !draft.regulationId, { path: ['regulationId'], message: 'Choose a verified regulation or explicitly confirm the table is standalone in the source.' })
    .refine((draft) => draft.rows.every((row) => row.length === draft.headers.length), {
      path: ['rows'], message: 'Every table row must have the same number of cells as the headers.',
    }),
  DEFINITION: z.object({
    term: label,
    regulationId: objectId.nullable().optional(),
    standaloneInSource: z.boolean(),
    originalText,
    simplifiedExplanation: z.string().max(5000).default(''),
    sourceLocators,
  }).strict().refine((draft) => Boolean(draft.regulationId) || draft.standaloneInSource, {
    path: ['standaloneInSource'], message: 'Link a verified regulation or confirm the definition is standalone in the source.',
  }),
  PARAMETER: z.object({
    regulationId: objectId,
    tableId: objectId.nullable().optional(),
    key: label,
    value: z.discriminatedUnion('kind', [
      z.object({ kind: z.literal('number'), numberValue: z.number().finite(), unit: label }).strict(),
      z.object({ kind: z.literal('range'), minimum: z.number().finite(), maximum: z.number().finite(), unit: label }).strict()
        .refine((value) => value.minimum <= value.maximum, { path: ['maximum'], message: 'Maximum must be at least the minimum.' }),
      z.object({ kind: z.literal('text'), textValue: label, unit: z.string().trim().max(80).default('') }).strict(),
      z.object({ kind: z.literal('boolean'), booleanValue: z.boolean(), unit: z.string().trim().max(80).default('') }).strict(),
    ]),
    applicability: z.object({
      authorityIds: z.array(objectId).max(100).default([]),
      zoneCodes: textList.default([]),
      developmentAreas: textList.default([]),
      buildingUses: textList.default([]),
      minimumRoadWidth: z.number().finite().min(0).optional(),
      maximumRoadWidth: z.number().finite().min(0).optional(),
      conditions: textList.default([]),
      exceptions: textList.default([]),
      conditionsExplicitlyAbsent: z.boolean(),
      sourceScopeStatement: label,
    }).strict().refine((value) => value.conditions.length > 0 || value.conditionsExplicitlyAbsent, {
      path: ['conditions'], message: 'Record the condition or explicitly confirm the source states no additional condition.',
    }).refine((value) => value.conditions.length === 0 || !value.conditionsExplicitlyAbsent, {
      path: ['conditionsExplicitlyAbsent'], message: 'Do not mark conditions absent when a condition is listed.',
    }).refine((value) => value.minimumRoadWidth === undefined || value.maximumRoadWidth === undefined || value.minimumRoadWidth <= value.maximumRoadWidth, {
      path: ['maximumRoadWidth'], message: 'Maximum road width must be at least the minimum.',
    }),
    sourceLocators,
  }).strict(),
  CONDITION_EXCEPTION: z.object({
    regulationId: objectId,
    parentId: objectId.nullable().optional(),
    originalLabel: z.enum(['Condition', 'Exception', 'Note']),
    sequence: z.number().int().min(0),
    originalText,
    sourceLocators,
  }).strict(),
  CROSS_REFERENCE: z.object({
    sourceRegulationId: objectId,
    targetRegulationId: objectId,
    targetReferenceLabel: label,
    originalText,
    sourceLocators,
  }).strict(),
};

export function parseApprovalDraft(recordType, draft) {
  const schema = schemas[recordType];
  if (!schema) throw new Error('Classify this candidate as a supported regulatory record before approval.');
  return schema.parse(draft);
}

const forbiddenDraftKeys = new Set(['verificationStatus', 'verificationProvenance', 'auditHistory', 'passwordHash', 'role', 'sessionVersion']);
function findForbiddenKey(value, prefix = 'draft') {
  if (!value || typeof value !== 'object') return null;
  for (const [key, nested] of Object.entries(value)) {
    if (forbiddenDraftKeys.has(key)) return `${prefix}.${key}`;
    const child = findForbiddenKey(nested, `${prefix}.${key}`);
    if (child) return child;
  }
  return null;
}

export function validateDraftSave(recordType, draft) {
  if (!REVIEW_RECORD_TYPES.includes(recordType)) throw new Error('Unsupported review record type.');
  if (!draft || typeof draft !== 'object' || Array.isArray(draft)) throw new Error('Draft must be a JSON object.');
  const forbidden = findForbiddenKey(draft);
  if (forbidden) throw new Error(`Draft field ${forbidden} is reserved and cannot be edited.`);
  if (Buffer.byteLength(JSON.stringify(draft), 'utf8') > 200_000) throw new Error('Draft is too large.');
  return structuredClone(draft);
}

export function parseSourceLocators(value) {
  return sourceLocators.parse(value);
}
