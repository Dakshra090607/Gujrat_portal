import { useEffect, useMemo, useState } from 'react';
import { CircleAlert, Layers3, Pencil, Plus, RefreshCw, RotateCcw, Search, ShieldCheck, Trash2, X } from 'lucide-react';
import { api, getApiErrorMessage } from '../../lib/api.js';
import AdminCardToggle from './AdminCardToggle.jsx';
import zoneTable from '../../data/table-6-2.json';
import authorityClassification from '../../data/development-authorities.json';

const categoryOptions = authorityClassification.categories.map(({ code, label }) => ({ code, label }));
const allCategories = categoryOptions.map(({ code }) => code);

function blankDraft() {
  return { key: '', sourceRow: '52', sourcePage: '', useZone: '', conceptualisedZone: '', code: '', permissibleUse: '', permissibleUseSourceText: '', inheritedFromCodes: [], permissibleUseExtraUses: [], permissibleUseConditions: [], appliesToCategories: [], authorityScope: '', notes: '', auditNote: '' };
}

function toDraft(row) {
  return { key: row.key, sourceRow: row.sourceRow, sourcePage: row.sourcePage ? String(row.sourcePage) : '', useZone: row.useZone, conceptualisedZone: row.conceptualisedZone ?? '', code: row.code ?? '', permissibleUse: row.permissibleUse ?? '', permissibleUseSourceText: row.permissibleUseSourceText ?? '', inheritedFromCodes: row.inheritedFromCodes ?? [], permissibleUseExtraUses: row.permissibleUseExtraUses ?? [], permissibleUseConditions: row.permissibleUseConditions ?? [], appliesToCategories: row.appliesToCategories ?? [], authorityScope: row.authorityScope ?? '', notes: row.notes ?? '', auditNote: '' };
}

export default function CalculatorZonesPanel() {
  const [collapsed, setCollapsed] = useState(true);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionKey, setActionKey] = useState('');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  const [draft, setDraft] = useState(null);

  const loadRows = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/admin/calculator-zones');
      setRows(response.data.data);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRows(); }, []);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return rows.filter((row) => (showDeleted || !row.isDeleted)
      && (!categoryFilter || row.appliesToCategories.includes(categoryFilter))
      && (!query || `${row.sourceRow} ${row.useZone} ${row.conceptualisedZone} ${row.code} ${row.permissibleUse} ${row.permissibleUseCodes.join(' ')} ${row.authorityScope} ${row.notes}`.toLocaleLowerCase().includes(query)));
  }, [rows, search, categoryFilter, showDeleted]);

  const changeDraft = (field) => (event) => setDraft((current) => ({ ...current, [field]: event.target.value }));
  const toggleCategory = (code) => setDraft((current) => ({
    ...current,
    appliesToCategories: current.appliesToCategories.includes(code)
      ? current.appliesToCategories.filter((item) => item !== code)
      : [...current.appliesToCategories, code],
  }));

  const saveDraft = async (event) => {
    event.preventDefault();
    if (!draft) return;
    setSaving(true);
    setError('');
    const data = {
      sourceRow: draft.sourceRow.trim(),
      sourcePage: draft.sourcePage === '' ? null : Number(draft.sourcePage),
      useZone: draft.useZone.trim(),
      conceptualisedZone: draft.conceptualisedZone.trim(),
      code: draft.code.trim().toUpperCase(),
      permissibleUse: draft.permissibleUse.trim(),
      permissibleUseSourceText: draft.permissibleUseSourceText,
      inheritedFromCodes: draft.inheritedFromCodes,
      permissibleUseExtraUses: draft.permissibleUseExtraUses,
      permissibleUseConditions: draft.permissibleUseConditions,
      appliesToCategories: draft.appliesToCategories,
      authorityScope: draft.authorityScope.trim(),
      notes: draft.notes.trim(),
      note: draft.auditNote.trim(),
    };
    try {
      if (draft.key) await api.patch(`/admin/calculator-zones/${encodeURIComponent(draft.key)}`, data);
      else await api.post('/admin/calculator-zones', data);
      setDraft(null);
      await loadRows();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const removeRow = async (row) => {
    if (!window.confirm(`Remove Table 6.2 row ${row.sourceRow}: ${row.useZone}? It will be hidden from active use and can be restored.`)) return;
    const note = window.prompt('Add an audit note for removing this Table 6.2 row:');
    if (note === null) return;
    setActionKey(row.key);
    setError('');
    try {
      await api.delete(`/admin/calculator-zones/${encodeURIComponent(row.key)}`, { data: { note } });
      await loadRows();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setActionKey('');
    }
  };

  const restoreRow = async (row) => {
    const note = window.prompt('Add an audit note for restoring this Table 6.2 row:');
    if (note === null) return;
    setActionKey(row.key);
    setError('');
    try {
      await api.post(`/admin/calculator-zones/${encodeURIComponent(row.key)}/restore`, { note });
      await loadRows();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setActionKey('');
    }
  };

  return <section className={`admin-calculator-panel admin-zone-panel${collapsed ? ' admin-card-collapsed' : ''}`} id="calculator-zone-table">
    <div className="admin-calculator-heading">
      <div><span className="admin-section-label">CALCULATOR CONFIGURATION</span><h2>Table 6.2: Classification of designated areas</h2><p>{rows.filter((row) => !row.isDeleted).length.toLocaleString('en-IN')} rows, including separate entries for 50a, 50b, and 50c.</p></div>
      <div className="admin-calculator-actions">
        <button type="button" className="admin-toolbar-button" onClick={loadRows} disabled={loading}><RefreshCw size={14} className={loading ? 'admin-spin' : ''} /> Refresh</button>
        <button type="button" className="admin-toolbar-button admin-calculator-add" onClick={() => setDraft(blankDraft())}><Plus size={14} /> Add zone row</button>
        <AdminCardToggle collapsed={collapsed} onClick={() => setCollapsed(value => !value)} label="Table 6.2" />
      </div>
    </div>
    <div className="admin-calculator-note"><ShieldCheck size={15} /><span>Source use codes are stored as text and also indexed as separate references. Detailed code meanings can be added when you provide Table 6.3.</span></div>
    <div className="admin-zone-notes"><b>Table notes</b>{zoneTable.notes.map((note) => <p key={note}>{note}</p>)}</div>
    {error && <div className="admin-login-error" role="alert"><CircleAlert size={15} />{error}</div>}
    <div className="admin-calculator-filters">
      <label className="admin-calculator-search"><Search size={14} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search source row, zone, code, or permissible use" /></label>
      <label>Category<select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="">All categories</option>{categoryOptions.map((category) => <option key={category.code} value={category.code}>{category.label}</option>)}</select></label>
      <label className="admin-deleted-toggle"><input type="checkbox" checked={showDeleted} onChange={(event) => setShowDeleted(event.target.checked)} /> Include removed rows</label>
    </div>
    <div className="admin-calculator-table-wrap"><table className="admin-calculator-table admin-zone-table"><thead><tr><th>Sr. no.</th><th>Use zone / general land use</th><th>Conceptualised zone</th><th>Code</th><th>Permissible use</th><th>Categories</th><th>Actions</th></tr></thead><tbody>
      {filteredRows.map((row) => <tr key={row.key} className={row.isDeleted ? 'admin-calculator-row-deleted' : ''}>
        <td><strong>{row.sourceRow}</strong><small>{row.isDeleted ? 'Removed' : row.isBuiltIn ? 'Table 6.2' : 'Added'}{row.sourcePage ? ` · PDF p. ${row.sourcePage}` : ''}</small></td>
        <td className="admin-zone-use">{row.useZone}{row.authorityScope && <small>Applicability: {row.authorityScope}</small>}</td>
        <td>{row.conceptualisedZone || '—'}</td><td><strong>{row.code || '—'}</strong></td>
        <td className="admin-zone-permissible">{row.permissibleUse || '—'}{row.permissibleUseCodes.length > 0 && <div className="admin-zone-code-tags">{row.permissibleUseCodes.map((code) => <span key={code}>{code}</span>)}</div>}{row.inheritedFromCodes?.length > 0 && <small>Source reference: {row.permissibleUseSourceText || `Inherited from ${row.inheritedFromCodes.join(', ')}`}</small>}{row.notes && <small>{row.notes}</small>}</td>
        <td><div className="admin-zone-category-tags">{row.appliesToCategories.map((code) => <span key={code}>{code}</span>)}</div></td>
        <td><div className="admin-user-actions">{row.isDeleted ? <button type="button" className="admin-user-action" disabled={actionKey === row.key} onClick={() => restoreRow(row)}><RotateCcw size={12} /> Restore</button> : <><button type="button" className="admin-user-action" onClick={() => setDraft(toDraft(row))}><Pencil size={12} /> Edit</button><button type="button" className="admin-user-action admin-user-remove" disabled={actionKey === row.key} onClick={() => removeRow(row)}><Trash2 size={12} /> Remove</button></>}</div></td>
      </tr>)}
      {loading && <tr><td colSpan="7" className="admin-users-empty">Loading Table 6.2 rows…</td></tr>}
      {!loading && !filteredRows.length && <tr><td colSpan="7" className="admin-users-empty">No zone rows match these filters.</td></tr>}
    </tbody></table></div>
    {!loading && <div className="admin-calculator-count">Showing {filteredRows.length.toLocaleString('en-IN')} of {rows.length.toLocaleString('en-IN')} rows</div>}
    {draft && <div className="admin-calculator-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setDraft(null); }}>
      <form className="admin-calculator-modal admin-zone-modal" role="dialog" aria-modal="true" aria-labelledby="zone-modal-title" onSubmit={saveDraft}>
        <div className="admin-calculator-modal-heading"><div><span className="admin-section-label">{draft.key ? 'EDIT TABLE 6.2 ROW' : 'NEW TABLE 6.2 ROW'}</span><h2 id="zone-modal-title">{draft.key ? 'Edit land-use zone' : 'Add land-use zone'}</h2></div><button type="button" className="admin-toolbar-button" aria-label="Close" onClick={() => setDraft(null)} disabled={saving}><X size={15} /></button></div>
        <div className="admin-calculator-form-grid">
          <label>Source row<input required value={draft.sourceRow} onChange={changeDraft('sourceRow')} placeholder="52 or 50d" maxLength={20} /></label>
          <label>Source PDF page<input type="number" min="1" max="999" value={draft.sourcePage} onChange={changeDraft('sourcePage')} placeholder="Optional" /></label>
          <label>Zone code<input value={draft.code} onChange={changeDraft('code')} placeholder="R1" maxLength={40} /></label>
          <label className="admin-calculator-wide">Use zone / general land use<textarea rows="3" required value={draft.useZone} onChange={changeDraft('useZone')} maxLength={2000} /></label>
          <label>Conceptualised zone<input value={draft.conceptualisedZone} onChange={changeDraft('conceptualisedZone')} maxLength={240} /></label>
          <label>Authority applicability<input value={draft.authorityScope} onChange={changeDraft('authorityScope')} placeholder="Optional, e.g. GUDA or VUDA" maxLength={500} /></label>
          <fieldset className="admin-zone-category-fieldset"><legend>Applicable development categories</legend><div>{categoryOptions.map((category) => <label key={category.code}><input type="checkbox" checked={draft.appliesToCategories.includes(category.code)} onChange={() => toggleCategory(category.code)} />{category.code}</label>)}</div></fieldset>
          <label className="admin-calculator-wide">Expanded permissible uses<textarea rows="7" value={draft.permissibleUse} onChange={changeDraft('permissibleUse')} maxLength={10000} placeholder="Enter each permitted use code or named use. These are indexed for future calculator rules." /></label>
          <label className="admin-calculator-wide">Original source wording (traceability)<textarea rows="3" value={draft.permissibleUseSourceText} onChange={changeDraft('permissibleUseSourceText')} maxLength={10000} placeholder="Original text from Table 6.2, including any inherited-use reference." /></label>
          <label className="admin-calculator-wide">Notes / special conditions<textarea rows="3" value={draft.notes} onChange={changeDraft('notes')} maxLength={10000} /></label>
          <label className="admin-calculator-wide">Audit note<input required value={draft.auditNote} onChange={changeDraft('auditNote')} placeholder="Why is this Table 6.2 row changing?" maxLength={1000} /></label>
        </div>
        <div className="admin-calculator-modal-actions"><button type="button" className="admin-toolbar-button" onClick={() => setDraft(null)} disabled={saving}>Cancel</button><button type="submit" className="admin-toolbar-button admin-calculator-add" disabled={saving}><Layers3 size={14} /> {saving ? 'Saving…' : draft.key ? 'Save changes' : 'Add zone row'}</button></div>
      </form>
    </div>}
  </section>;
}
