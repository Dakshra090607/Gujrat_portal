import test from 'node:test';
import assert from 'node:assert/strict';
import { parseApprovalDraft, validateDraftSave } from '../src/modules/review/draft-schemas.js';

const locator = [{ pdfPageStart: 8, printedPageLabel: '6' }];

test('chapter approval requires exact source text and a valid source locator', () => {
  const draft = { originalNumber: '4', title: 'Chapter Four', sequence: 3, originalText: 'Chapter Four', sourceLocator: { pdfPageStart: 8 } };
  assert.equal(parseApprovalDraft('CHAPTER', draft).sourceLocator.pdfPageStart, 8);
  assert.throws(() => parseApprovalDraft('CHAPTER', { ...draft, sourceLocator: { pdfPageStart: 0 } }));
  assert.throws(() => parseApprovalDraft('CHAPTER', { ...draft, originalText: ' ' }));
});

test('numeric parameter approval requires a unit, scope, and explicit applicability decision', () => {
  const draft = {
    regulationId: '0123456789abcdef01234567', key: 'road-width-limit',
    value: { kind: 'number', numberValue: 12, unit: 'm' },
    applicability: {
      authorityIds: [], zoneCodes: [], developmentAreas: [], buildingUses: [], conditions: [], exceptions: [],
      conditionsExplicitlyAbsent: true, sourceScopeStatement: 'Source states the applicable development class.',
    },
    sourceLocators: locator,
  };
  assert.equal(parseApprovalDraft('PARAMETER', draft).value.unit, 'm');
  assert.throws(() => parseApprovalDraft('PARAMETER', { ...draft, value: { kind: 'number', numberValue: 12, unit: '' } }));
  assert.throws(() => parseApprovalDraft('PARAMETER', { ...draft, applicability: { ...draft.applicability, conditionsExplicitlyAbsent: false } }));
  assert.throws(() => parseApprovalDraft('PARAMETER', { ...draft, applicability: { ...draft.applicability, conditions: ['Only for a stated zone'], conditionsExplicitlyAbsent: true } }));
});

test('table approval requires consistent headers, cells, and a source-supported parent decision', () => {
  const draft = {
    originalIdentifier: 'Table 2', title: 'Setback table', parentResolution: 'SOURCE_STANDALONE', regulationId: null,
    headers: ['Road', 'Margin'], rows: [['12 m', '3 m']], footnotes: [], conditions: [], sourceLocators: locator,
  };
  assert.equal(parseApprovalDraft('TABLE', draft).rows.length, 1);
  assert.throws(() => parseApprovalDraft('TABLE', { ...draft, rows: [['12 m']] }));
  assert.throws(() => parseApprovalDraft('TABLE', { ...draft, parentResolution: 'UNRESOLVED' }));
});

test('draft save rejects verification and audit fields', () => {
  assert.throws(() => validateDraftSave('CHAPTER', { title: 'A', verificationStatus: 'VERIFIED' }), /reserved/);
  assert.throws(() => validateDraftSave('CHAPTER', { title: 'A', nested: { auditHistory: [] } }), /reserved/);
  assert.deepEqual(validateDraftSave('CHAPTER', { title: 'A' }), { title: 'A' });
});
