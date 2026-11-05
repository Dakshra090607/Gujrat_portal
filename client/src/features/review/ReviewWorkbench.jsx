import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BookOpenCheck, Check, ChevronRight, CircleAlert, FileText, LogOut, RefreshCw, Save, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api, getApiErrorMessage, setAccessToken } from '../../lib/api.js';
import { authClient } from '../../lib/auth.js';
import './review.css';

const recordTypes = [
  ['UNCLASSIFIED', 'Unclassified'], ['CHAPTER', 'Chapter'], ['REGULATION', 'Regulation'],
  ['REGULATORY_NODE', 'Clause / sub-regulation'], ['TABLE', 'Table / schedule'],
  ['DEFINITION', 'Definition'], ['PARAMETER', 'Numeric or other parameter'],
  ['CONDITION_EXCEPTION', 'Condition / exception'], ['CROSS_REFERENCE', 'Cross-reference'],
];
const workflowStatuses = ['QUEUED', 'IN_REVIEW', 'RETURNED_FOR_CORRECTION', 'REJECTED', 'APPROVED'];

function defaultDraft(recordType, item) {
  const sourceText = item?.sourceSnapshot?.sourceSnippet ?? item?.sourceSnapshot?.sourceLine ?? '';
  const locator = { pdfPageStart: item?.pdfPageNumber ?? 1, printedPageLabel: item?.sourcePage?.printedPageLabel ?? '' };
  const locators = [locator];
  switch (recordType) {
    case 'CHAPTER': return { originalNumber: '', title: '', sequence: 0, originalText: sourceText, sourceLocator: locator };
    case 'REGULATION': return { originalNumber: '', title: '', sequence: 0, originalText: sourceText, parentResolution: 'LINKED_TO_VERIFIED_CHAPTER', chapterId: '', sourceLocators: locators };
    case 'REGULATORY_NODE': return { regulationId: '', parentId: null, originalLabel: '', nodeType: 'clause', sequence: 0, originalText: sourceText, sourceLocators: locators };
    case 'TABLE': return { originalIdentifier: '', title: '', parentResolution: 'LINKED_TO_VERIFIED_REGULATION', regulationId: '', headers: [], rows: [[]], footnotes: [], conditions: [], sourceLocators: locators };
    case 'DEFINITION': return { term: '', regulationId: null, standaloneInSource: false, originalText: sourceText, simplifiedExplanation: '', sourceLocators: locators };
    case 'PARAMETER': return { regulationId: '', tableId: null, key: '', value: { kind: 'number', numberValue: 0, unit: '' }, applicability: { authorityIds: [], zoneCodes: [], developmentAreas: [], buildingUses: [], conditions: [], exceptions: [], conditionsExplicitlyAbsent: false, sourceScopeStatement: '' }, sourceLocators: locators };
    case 'CONDITION_EXCEPTION': return { regulationId: '', parentId: null, originalLabel: 'Condition', sequence: 0, originalText: sourceText, sourceLocators: locators };
    case 'CROSS_REFERENCE': return { sourceRegulationId: '', targetRegulationId: '', targetReferenceLabel: '', originalText: sourceText, sourceLocators: locators };
    default: return { originalText: sourceText, sourceLocators: locators };
  }
}

function displayType(type) { return recordTypes.find(([value]) => value === type)?.[1] ?? type; }
function idValue(value) { return typeof value === 'object' && value ? value._id : value; }
function multiline(value) { return Array.isArray(value) ? value.join('\n') : ''; }

function TextField({ label, value, onChange, multiline: multi = false, type = 'text', required = false, help }) {
  const common = { value: value ?? '', onChange: (event) => onChange(type === 'number' ? (event.target.value === '' ? undefined : Number(event.target.value)) : event.target.value), required, 'aria-label': label };
  return <label className="review-field"><span>{label}{required && <b aria-hidden="true"> *</b>}</span>
    {multi ? <textarea rows={4} {...common} /> : <input type={type} min={type === 'number' ? 0 : undefined} step={type === 'number' ? 'any' : undefined} {...common} />}
    {help && <small>{help}</small>}
  </label>;
}

function SelectField({ label, value, onChange, options, placeholder = 'Select…', required = false }) {
  return <label className="review-field"><span>{label}{required && <b aria-hidden="true"> *</b>}</span>
    <select value={value ?? ''} onChange={(event) => onChange(event.target.value || null)} required={required} aria-label={label}>
      <option value="">{placeholder}</option>{options.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
    </select>
  </label>;
}

function SourceLocators({ recordType, draft, update }) {
  const key = recordType === 'CHAPTER' ? 'sourceLocator' : 'sourceLocators';
  const locator = recordType === 'CHAPTER' ? (draft.sourceLocator ?? {}) : (draft.sourceLocators?.[0] ?? {});
  const set = (field, value) => {
    const next = { ...locator, [field]: value };
    if (recordType === 'CHAPTER') update(key, next);
    else update(key, [next]);
  };
  return <section className="review-subsection"><h4>Source locator</h4><p className="review-muted">PDF page numbers identify the supplied file. Enter a printed page label only when it appears on the page.</p>
    <div className="review-fields-grid">
      <TextField label="PDF page start" type="number" required value={locator.pdfPageStart} onChange={(value) => set('pdfPageStart', value)} />
      {recordType !== 'CHAPTER' && <TextField label="PDF page end (optional)" type="number" value={locator.pdfPageEnd ?? ''} onChange={(value) => set('pdfPageEnd', value || undefined)} />}
      <TextField label="Printed page label" value={locator.printedPageLabel ?? ''} onChange={(value) => set('printedPageLabel', value)} />
    </div>
  </section>;
}

function ReferenceSelect({ label, value, onChange, records, required = false }) {
  return <SelectField label={label} value={value} onChange={onChange} required={required} placeholder="Choose a verified record"
    options={records.map((record) => ({ value: record._id, label: `${record.sourceDocumentId?.part ? `${record.sourceDocumentId.part} · ` : ''}${record.originalNumber ?? record.originalLabel ?? record.originalIdentifier ?? ''} ${record.title ?? record.originalText?.slice(0, 90) ?? ''}`.trim() }))} />;
}

function DraftFields({ item, recordType, draft, update, references, setTableRowsText, tableRowsText }) {
  const field = (name, label, props = {}) => <TextField key={name} label={label} value={name.split('.').reduce((value, part) => value?.[part], draft)}
    onChange={(value) => update(name, value)} {...props} />;
  const listField = (name, label, props = {}) => <TextField key={name} label={label} multiline value={multiline(name.split('.').reduce((value, part) => value?.[part], draft))}
    help="Enter one source-supported item per line." onChange={(value) => update(name, value.split('\n').map((line) => line.trim()).filter(Boolean))} {...props} />;
  const source = <SourceLocators key="source-locators" recordType={recordType} draft={draft} update={update} />;
  const regulationSelect = (key, label = 'Parent regulation') => <ReferenceSelect key={key} label={label} value={draft[key]} onChange={(value) => update(key, value)} records={references.regulations ?? []} required />;
  const chapterSelect = <ReferenceSelect key="chapterId" label="Verified parent chapter" value={draft.chapterId} onChange={(value) => update('chapterId', value)} records={references.chapters ?? []} required />;
  switch (recordType) {
    case 'CHAPTER': return <>
      <div className="review-fields-grid">{field('originalNumber', 'Original chapter number', { required: true })}{field('title', 'Original chapter title', { required: true })}{field('sequence', 'Order in source', { type: 'number', required: true })}</div>
      {field('originalText', 'Original wording', { multiline: true, required: true })}{source}
    </>;
    case 'REGULATION': return <>
      <div className="review-fields-grid">{field('originalNumber', 'Original regulation number', { required: true })}{field('title', 'Original title')}{field('sequence', 'Order in source', { type: 'number', required: true })}</div>
      <SelectField label="Parent decision" value={draft.parentResolution} onChange={(value) => { update('parentResolution', value); if (value === 'SOURCE_ROOT') update('chapterId', null); }} options={[
        { value: 'LINKED_TO_VERIFIED_CHAPTER', label: 'Source places it under a chapter' }, { value: 'SOURCE_ROOT', label: 'Source explicitly has no chapter parent' },
      ]} required />
      {draft.parentResolution === 'LINKED_TO_VERIFIED_CHAPTER' && chapterSelect}
      {field('originalText', 'Original wording', { multiline: true, required: true })}{source}
    </>;
    case 'REGULATORY_NODE': case 'CONDITION_EXCEPTION': return <>
      {regulationSelect('regulationId')}
      {(references.nodes?.length > 0) && <ReferenceSelect label="Parent clause (optional)" value={draft.parentId} onChange={(value) => update('parentId', value)} records={references.nodes} />}
      <div className="review-fields-grid">
        {recordType === 'CONDITION_EXCEPTION'
          ? <SelectField label="Record kind" value={draft.originalLabel} onChange={(value) => update('originalLabel', value)} options={['Condition', 'Exception', 'Note'].map((value) => ({ value, label: value }))} required />
          : field('originalLabel', 'Original clause label', { required: true })}
        {recordType === 'REGULATORY_NODE' && <SelectField label="Clause type" value={draft.nodeType} onChange={(value) => update('nodeType', value)} options={['sub-regulation', 'clause', 'sub-clause', 'item', 'note'].map((value) => ({ value, label: value }))} required />}
        {field('sequence', 'Order in source', { type: 'number', required: true })}
      </div>
      {field('originalText', 'Original wording', { multiline: true, required: true })}{source}
    </>;
    case 'TABLE': return <>
      <div className="review-fields-grid">{field('originalIdentifier', 'Table / schedule identifier', { required: true })}{field('title', 'Original title')}</div>
      <SelectField label="Parent decision" value={draft.parentResolution} onChange={(value) => { update('parentResolution', value); if (value === 'SOURCE_STANDALONE') update('regulationId', null); }} options={[
        { value: 'LINKED_TO_VERIFIED_REGULATION', label: 'Source links it to a regulation' }, { value: 'SOURCE_STANDALONE', label: 'Source explicitly presents it standalone' },
      ]} required />
      {draft.parentResolution === 'LINKED_TO_VERIFIED_REGULATION' && regulationSelect('regulationId')}
      {listField('headers', 'Column headings', { required: true })}
      <label className="review-field"><span>Table rows as JSON *</span><textarea rows={7} required aria-label="Table rows as JSON" value={tableRowsText} onChange={(event) => setTableRowsText(event.target.value)} /><small>Use an array of row arrays, for example [["A", "B"], ["1", "2"]].</small></label>
      {listField('footnotes', 'Footnotes')}{listField('conditions', 'Table conditions')}{source}
    </>;
    case 'DEFINITION': return <>
      {field('term', 'Defined term', { required: true })}
      <SelectField label="Parent decision" value={draft.regulationId ? 'LINKED' : draft.standaloneInSource ? 'STANDALONE' : ''} onChange={(value) => { update('regulationId', value === 'LINKED' ? draft.regulationId : null); update('standaloneInSource', value === 'STANDALONE'); }} options={[
        { value: 'LINKED', label: 'Source places it under a regulation' }, { value: 'STANDALONE', label: 'Source explicitly presents it standalone' },
      ]} required />
      {!draft.standaloneInSource && regulationSelect('regulationId')}
      {field('originalText', 'Original definition', { multiline: true, required: true })}
      {field('simplifiedExplanation', 'Separate plain-language explanation', { multiline: true })}{source}
    </>;
    case 'PARAMETER': return <>
      {regulationSelect('regulationId')}
      {(references.tables?.length > 0) && <ReferenceSelect label="Verified table (optional)" value={draft.tableId} onChange={(value) => update('tableId', value)} records={references.tables.filter((row) => !row.regulationId || String(row.regulationId) === String(draft.regulationId))} />}
      <div className="review-fields-grid">{field('key', 'Parameter name', { required: true })}
        <SelectField label="Value kind" value={draft.value?.kind} onChange={(value) => update('value.kind', value)} options={['number', 'range', 'text', 'boolean'].map((value) => ({ value, label: value }))} required />
      </div>
      {draft.value?.kind === 'number' && <div className="review-fields-grid">{field('value.numberValue', 'Value', { type: 'number', required: true })}{field('value.unit', 'Unit', { required: true })}</div>}
      {draft.value?.kind === 'range' && <div className="review-fields-grid">{field('value.minimum', 'Minimum', { type: 'number', required: true })}{field('value.maximum', 'Maximum', { type: 'number', required: true })}{field('value.unit', 'Unit', { required: true })}</div>}
      {draft.value?.kind === 'text' && <div className="review-fields-grid">{field('value.textValue', 'Text value', { required: true })}{field('value.unit', 'Unit')}</div>}
      {draft.value?.kind === 'boolean' && <SelectField label="Boolean value" value={String(draft.value.booleanValue)} onChange={(value) => update('value.booleanValue', value === 'true')} options={[{ value: 'true', label: 'True' }, { value: 'false', label: 'False' }]} required />}
      <section className="review-subsection"><h4>Applicability</h4>
        {field('applicability.sourceScopeStatement', 'Source-supported applicability scope', { multiline: true, required: true })}
        <div className="review-fields-grid">{listField('applicability.zoneCodes', 'Zone codes')}{listField('applicability.developmentAreas', 'Development areas')}{listField('applicability.buildingUses', 'Building uses')}
          {field('applicability.minimumRoadWidth', 'Minimum road width', { type: 'number' })}{field('applicability.maximumRoadWidth', 'Maximum road width', { type: 'number' })}</div>
        {listField('applicability.conditions', 'Conditions')}{listField('applicability.exceptions', 'Exceptions')}
        <label className="review-check"><input type="checkbox" checked={Boolean(draft.applicability?.conditionsExplicitlyAbsent)} onChange={(event) => update('applicability.conditionsExplicitlyAbsent', event.target.checked)} />The source explicitly states that no additional applicability condition applies.</label>
      </section>{source}
    </>;
    case 'CROSS_REFERENCE': return <>
      {regulationSelect('sourceRegulationId', 'Source regulation')}
      <ReferenceSelect label="Verified target regulation" value={draft.targetRegulationId} onChange={(value) => update('targetRegulationId', value)} records={references['all-regulations'] ?? []} required />
      {field('targetReferenceLabel', 'Exact target label in source', { required: true })}{field('originalText', 'Original cross-reference wording', { multiline: true, required: true })}{source}
    </>;
    default: return <div className="review-unclassified"><CircleAlert size={18} /><p>Classify this candidate before editing a regulatory record. The extracted category is a suggestion; confirm its type from the source page.</p></div>;
  }
}

function initialDraft(item) {
  const defaults = defaultDraft(item.recordType, item);
  const result = { ...defaults, ...(item.draft ?? {}) };
  if (item.recordType === 'TABLE') result.rowsJson = JSON.stringify(item.draft?.rows ?? defaults.rows, null, 2);
  return result;
}

function toApiDraft(recordType, draft) {
  const clean = structuredClone(draft);
  if (recordType === 'TABLE') {
    try { clean.rows = JSON.parse(clean.rowsJson ?? '[]'); }
    catch { throw new Error('Table rows must be valid JSON.'); }
    delete clean.rowsJson;
    clean.headers = Array.isArray(clean.headers) ? clean.headers : [];
    clean.footnotes = Array.isArray(clean.footnotes) ? clean.footnotes : [];
    clean.conditions = Array.isArray(clean.conditions) ? clean.conditions : [];
  }
  for (const key of ['chapterId', 'regulationId', 'tableId', 'parentId', 'sourceRegulationId', 'targetRegulationId']) {
    if (clean[key] === '') clean[key] = null;
  }
  if (recordType === 'PARAMETER') {
    for (const key of ['authorityIds', 'zoneCodes', 'developmentAreas', 'buildingUses', 'conditions', 'exceptions']) {
      if (!Array.isArray(clean.applicability[key])) clean.applicability[key] = [];
    }
  }
  if (recordType === 'DEFINITION') clean.standaloneInSource = Boolean(clean.standaloneInSource);
  return clean;
}

export default function ReviewWorkbench() {
  const [authState, setAuthState] = useState('loading');
  const [user, setUser] = useState(null);
  const [filters, setFilters] = useState({ recordType: '', workflowStatus: '', part: '', pdfPageNumber: '', assignee: '' });
  const [queue, setQueue] = useState({ data: [], pagination: { page: 1, pages: 0, total: 0 } });
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState('');
  const [item, setItem] = useState(null);
  const [recordType, setRecordType] = useState('UNCLASSIFIED');
  const [draft, setDraft] = useState({});
  const [references, setReferences] = useState({ chapters: [], regulations: [], 'all-regulations': [], tables: [], nodes: [] });
  const [note, setNote] = useState('');
  const [tableRowsText, setTableRowsText] = useState('[[]]');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadQueue = useCallback(async (nextPage = page) => {
    setError('');
    const params = { page: nextPage, pageSize: 25 };
    for (const [key, value] of Object.entries(filters)) if (value) params[key] = value;
    if (!params.assignee) delete params.assignee;
    try {
      const response = await api.get('/admin/review-items', { params });
      setQueue(response.data);
      if (response.data.data.length && !response.data.data.some((candidate) => candidate._id === selectedId)) setSelectedId(response.data.data[0]._id);
      else if (!response.data.data.length && selectedId) setSelectedId('');
    } catch (exception) { setError(getApiErrorMessage(exception)); }
  }, [filters, page, selectedId]);

  const loadItem = useCallback(async (id = selectedId) => {
    if (!id) { setItem(null); return; }
    setError('');
    try {
      const response = await api.get(`/admin/review-items/${id}`);
      const loaded = response.data.data;
      setItem(loaded);
      setRecordType(loaded.recordType);
      const nextDraft = initialDraft(loaded);
      setDraft(nextDraft);
      setTableRowsText(nextDraft.rowsJson ?? JSON.stringify(nextDraft.rows ?? [[]], null, 2));
      setNote('');
    } catch (exception) { setError(getApiErrorMessage(exception)); }
  }, [selectedId]);

  useEffect(() => {
    let alive = true;
    api.get('/auth/me').then((response) => {
      if (alive) { setUser(response.data.data.user); setAuthState('ready'); }
    }).catch((exception) => {
      if (alive) setAuthState(exception.response?.status === 401 ? 'login' : 'error');
      if (alive && exception.response?.status !== 401) setError(getApiErrorMessage(exception));
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => { if (authState === 'ready') loadQueue(page); }, [authState, page, filters, loadQueue]);
  useEffect(() => { if (authState === 'ready' && selectedId) loadItem(selectedId); }, [authState, selectedId, loadItem]);

  const sourceDocumentId = useMemo(() => idValue(item?.sourceDocumentId), [item]);
  useEffect(() => {
    if (!item || authState !== 'ready') return;
    const requiredTypes = recordType === 'REGULATION' ? ['chapters']
      : ['REGULATORY_NODE', 'CONDITION_EXCEPTION'].includes(recordType) ? ['regulations', 'nodes']
        : recordType === 'TABLE' ? ['regulations']
          : recordType === 'DEFINITION' ? ['regulations']
            : recordType === 'PARAMETER' ? ['regulations', 'tables']
              : recordType === 'CROSS_REFERENCE' ? ['regulations', 'all-regulations'] : [];
    if (!requiredTypes.length) { setReferences({ chapters: [], regulations: [], 'all-regulations': [], tables: [], nodes: [] }); return; }
    Promise.all(requiredTypes.map(async (type) => {
      const response = await api.get('/admin/references', { params: { type, sourceDocumentId } });
      return [type, response.data.data];
    })).then((pairs) => setReferences((current) => ({ ...current, ...Object.fromEntries(pairs) }))).catch((exception) => setError(getApiErrorMessage(exception)));
  }, [item, recordType, sourceDocumentId, authState]);

  const logout = async () => {
    try { await authClient?.signOut(); } catch { /* Clear in-memory request state if Neon Auth is unavailable. */ }
    setAccessToken(null); setUser(null); setItem(null); setQueue({ data: [], pagination: { page: 1, pages: 0, total: 0 } }); setAuthState('login');
  };

  const updateDraft = (path, value) => {
    setDraft((current) => {
      const copy = structuredClone(current);
      const parts = path.split('.'); let target = copy;
      for (const part of parts.slice(0, -1)) target = target[part] ??= {};
      target[parts.at(-1)] = value;
      return copy;
    });
  };

  const changeRecordType = (nextType) => {
    setRecordType(nextType);
    setDraft(defaultDraft(nextType, item));
    setTableRowsText(JSON.stringify(nextType === 'TABLE' ? [[]] : [], null, 2));
  };

  const act = async (action) => {
    if (!item) return;
    setBusy(true); setError(''); setNotice('');
    try {
      let response;
      if (action === 'claim') response = await api.post(`/admin/review-items/${item._id}/claim`, { expectedVersion: item.version });
      else if (action === 'save') response = await api.put(`/admin/review-items/${item._id}/draft`, { expectedVersion: item.version, recordType, draft: toApiDraft(recordType, draft) });
      else response = await api.post(`/admin/review-items/${item._id}/${action}`, { expectedVersion: item.version, note });
      setNotice(action === 'approve' ? 'Approved. A verified canonical record and audit entry were created.' : action === 'reject' ? 'Candidate rejected and the decision was recorded.' : action === 'return' ? 'Candidate returned for correction.' : action === 'claim' ? 'Candidate assigned to you.' : 'Draft saved to the review history.');
      await loadItem(item._id); await loadQueue(page);
    } catch (exception) { setError(getApiErrorMessage(exception)); }
    finally { setBusy(false); }
  };

  const canEdit = user?.role === 'ADMIN' || String(idValue(item?.assignedReviewerId)) === String(user?.id);
  const isTerminal = ['APPROVED', 'REJECTED'].includes(item?.workflowStatus);
  const appRoot = api.defaults.baseURL;

  if (authState === 'loading') return <div className="review-full-state">Loading reviewer session…</div>;
  if (authState === 'error') return <div className="review-full-state"><CircleAlert /><p>{error || 'Authentication service is unavailable.'}</p><button className="review-button secondary" onClick={() => window.location.reload()}>Try again</button></div>;
  if (authState === 'login') return <main className="review-login-page"><Link to="/app" className="review-back"><ArrowLeft size={16} /> Return to BuildRule Gujarat</Link><section className="review-login-card"><div className="review-brand-icon"><ShieldCheck size={23} /></div><span className="review-eyebrow">REGULATORY ADMINISTRATION</span><h1>Reviewer sign in</h1><p>Sign in using your standard BuildRule Gujarat account. Access is granted only to active reviewers and administrators.</p><Link className="review-button primary wide" to="/login">Continue to sign in</Link><small>Public registration cannot create reviewer or administrator accounts.</small></section></main>;
  if (!['ADMIN', 'REVIEWER'].includes(user?.role)) return <div className="review-full-state"><CircleAlert /><p>Your account cannot access regulatory review.</p><button className="review-button secondary" onClick={logout}>Sign out</button></div>;

  return <main className="review-workbench">
    <header className="review-topbar"><div><Link to="/app" className="review-brand"><span><BookOpenCheck size={19} /></span> BuildRule Gujarat <i>/</i> Review</Link><p>Source-linked regulatory candidate review</p></div><div className="review-user"><div><b>{user.name}</b><small>{user.role}</small></div><button className="review-icon-button" onClick={logout} aria-label="Sign out"><LogOut size={18} /></button></div></header>
    <section className="review-hero"><div><span className="review-eyebrow">MILESTONE 5A · SOURCE REVIEW</span><h1>Regulatory review workbench</h1><p>Corrections are kept separate from extracted source text. Approval creates a verified record only after source and schema checks pass.</p></div><div className="review-hero-stat"><b>{queue.pagination.total}</b><span>matching candidates</span><small>All queued data remains unverified</small></div></section>
    {error && <div className="review-alert error" role="alert"><CircleAlert size={17} />{error}<button onClick={() => setError('')} aria-label="Dismiss error">×</button></div>}
    {notice && <div className="review-alert success" role="status"><Check size={17} />{notice}<button onClick={() => setNotice('')} aria-label="Dismiss notice">×</button></div>}
    <section className="review-main-grid">
      <aside className="review-queue-panel" aria-label="Candidate review queue">
        <div className="review-panel-heading"><div><h2>Candidate queue</h2><span>{queue.pagination.total} results</span></div><button className="review-icon-button" onClick={() => loadQueue(page)} aria-label="Refresh queue"><RefreshCw size={16} /></button></div>
        <div className="review-filter-grid">
          <SelectField label="Candidate type" value={filters.recordType} onChange={(value) => { setFilters((current) => ({ ...current, recordType: value ?? '' })); setPage(1); }} options={recordTypes.map(([value, label]) => ({ value, label }))} placeholder="All types" />
          <SelectField label="Workflow status" value={filters.workflowStatus} onChange={(value) => { setFilters((current) => ({ ...current, workflowStatus: value ?? '' })); setPage(1); }} options={workflowStatuses.map((value) => ({ value, label: value.replaceAll('_', ' ') }))} placeholder="All statuses" />
          <SelectField label="Part" value={filters.part} onChange={(value) => { setFilters((current) => ({ ...current, part: value ?? '' })); setPage(1); }} options={['Part I', 'Part II', 'Part III'].map((value) => ({ value, label: value }))} placeholder="All parts" />
          <TextField label="PDF page" type="number" value={filters.pdfPageNumber} onChange={(value) => { setFilters((current) => ({ ...current, pdfPageNumber: value ? String(value) : '' })); setPage(1); }} />
          <SelectField label="Assignment" value={filters.assignee} onChange={(value) => { setFilters((current) => ({ ...current, assignee: value ?? '' })); setPage(1); }} options={[{ value: 'me', label: 'Assigned to me' }, { value: 'unassigned', label: 'Unassigned' }]} placeholder="All reviewers" />
        </div>
        <div className="review-queue-list" aria-live="polite">
          {queue.data.map((candidate) => <button key={candidate._id} className={`review-queue-item ${selectedId === candidate._id ? 'selected' : ''}`} onClick={() => setSelectedId(candidate._id)}>
            <span className="review-queue-item-top"><span className={`review-status status-${candidate.workflowStatus.toLowerCase()}`}>{candidate.workflowStatus.replaceAll('_', ' ')}</span><span>{candidate.sourceDocumentId?.part}</span></span>
            <b>{displayType(candidate.recordType)}</b><span>{candidate.sourceSnapshot?.sourceSnippet ?? candidate.sourceSnapshot?.sourceLine ?? candidate.candidateType}</span>
            <small>PDF page {candidate.pdfPageNumber} · v{candidate.version}{candidate.assignedReviewerId?.name ? ` · ${candidate.assignedReviewerId.name}` : ''}</small>
          </button>)}
          {!queue.data.length && <div className="review-empty"><FileText size={20} /><b>No candidates match these filters</b><span>Change a filter or run the review queue backfill.</span></div>}
        </div>
        <div className="review-pagination"><button className="review-button secondary small" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button><span>Page {page} of {Math.max(1, queue.pagination.pages)}</span><button className="review-button secondary small" disabled={page >= queue.pagination.pages} onClick={() => setPage((current) => current + 1)}>Next</button></div>
      </aside>

      <section className="review-detail-panel" aria-label="Selected candidate review">
        {!item ? <div className="review-empty detail-empty"><FileText size={24} /><b>Select a candidate to review</b><span>Source evidence and the review form will appear here.</span></div> : <>
          <div className="review-detail-heading"><div><div className="review-detail-kicker">{item.sourceDocumentId?.part} · PDF PAGE {item.pdfPageNumber}</div><h2>{item.sourceDocumentId?.filename}</h2><div className="review-detail-meta"><span>Candidate {item.sourceCandidateId}</span><span>Workflow: {item.workflowStatus.replaceAll('_', ' ')}</span><span>Version {item.version}</span></div></div>
            {!['APPROVED', 'REJECTED'].includes(item.workflowStatus) && <button className="review-button primary" disabled={busy || (item.workflowStatus === 'IN_REVIEW' && String(idValue(item.assignedReviewerId)) !== String(user.id) && user.role !== 'ADMIN')} onClick={() => act('claim')}>{item.workflowStatus === 'IN_REVIEW' ? 'Claim / reassign' : 'Claim candidate'}</button>}
          </div>
          <div className="review-evidence-grid">
            <section className="review-evidence-card"><div className="review-subhead"><b>Original PDF page</b><a href={`${appRoot}/documents/${sourceDocumentId}/pdf#page=${item.pdfPageNumber}`} target="_blank" rel="noreferrer">Open PDF <ChevronRight size={14} /></a></div>
              <iframe title={`Original PDF page ${item.pdfPageNumber}`} src={`${appRoot}/documents/${sourceDocumentId}/pdf#page=${item.pdfPageNumber}`} />
              <details><summary>Extracted source-page text</summary><pre>{item.sourcePage?.text}</pre></details>
            </section>
            <section className="review-evidence-card candidate-evidence"><div className="review-subhead"><b>Immutable extracted candidate</b><span className="review-status status-queued">NEEDS REVIEW</span></div>
              <div className="candidate-type-line">{item.candidateType} · {item.sourceCandidatePath}</div><pre>{JSON.stringify(item.sourceSnapshot, null, 2)}</pre>
              <small>The source page and candidate snapshot are read-only.</small>
            </section>
          </div>

          <section className="review-editor-card">
            <div className="review-editor-heading"><div><span className="review-eyebrow">REVIEWED STRUCTURED DRAFT</span><h3>Correct and classify</h3></div><span className="review-status status-queued">CANONICAL STATUS: {item.workflowStatus === 'APPROVED' ? 'VERIFIED' : 'NOT VERIFIED'}</span></div>
            <label className="review-field record-type-picker"><span>Record classification</span><select value={recordType} disabled={!canEdit || isTerminal} onChange={(event) => changeRecordType(event.target.value)}>{recordTypes.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
            {recordType === 'UNCLASSIFIED' && <div className="review-alert warning"><CircleAlert size={16} />Choose the record type from the original PDF before saving a structured correction.</div>}
            <DraftFields item={item} recordType={recordType} draft={draft} update={updateDraft} references={references} tableRowsText={tableRowsText} setTableRowsText={setTableRowsText} />
            <div className="review-decision-note"><TextField label="Reviewer note (required for return, reject, and approve)" value={note} onChange={setNote} multiline /></div>
            <div className="review-action-bar">
              <button className="review-button secondary" disabled={busy || !canEdit || isTerminal || item.workflowStatus !== 'IN_REVIEW' || recordType === 'UNCLASSIFIED'} onClick={() => act('save')}><Save size={15} />Save corrections</button>
              <div className="review-decision-actions">
                <button className="review-button warning-button" disabled={busy || !canEdit || isTerminal || item.workflowStatus !== 'IN_REVIEW' || !note.trim()} onClick={() => act('return')}>Return</button>
                <button className="review-button danger-button" disabled={busy || !canEdit || isTerminal || item.workflowStatus !== 'IN_REVIEW' || !note.trim()} onClick={() => act('reject')}>Reject</button>
                <button className="review-button success-button" disabled={busy || !canEdit || isTerminal || item.workflowStatus !== 'IN_REVIEW' || !note.trim() || recordType === 'UNCLASSIFIED'} onClick={() => act('approve')}><Check size={15} />Approve</button>
              </div>
            </div>
          </section>

          <section className="review-audit-card"><div className="review-subhead"><b>Decision and correction history</b><span>{item.audit?.length ?? 0} events</span></div>
            {!item.audit?.length ? <p className="review-muted">No reviewer actions yet.</p> : <ol className="review-audit-list">{item.audit.map((event) => <li key={event._id}><span className="audit-dot" /><div><b>{event.action.replaceAll('_', ' ')}</b><small>{event.actorId?.name ?? 'Reviewer'} · {new Date(event.createdAt).toLocaleString()}</small>{event.note && <p>{event.note}</p>}{event.changedFields?.length > 0 && <details><summary>Changed fields</summary><pre>{JSON.stringify(event.changedFields, null, 2)}</pre></details>}</div></li>)}</ol>}
          </section>
        </>}
      </section>
    </section>
    <footer className="review-footer"><ShieldCheck size={15} /> Extraction candidates are not verified law. FSI and compliance calculations remain unresolved until approved parameters and applicability are available.</footer>
  </main>;
}
