import { useEffect, useMemo, useState } from 'react';
import { Building2, CircleAlert, Pencil, Plus, RefreshCw, RotateCcw, Search, ShieldCheck, Trash2, X } from 'lucide-react';
import { api, getApiErrorMessage } from '../../lib/api.js';
import AdminCardToggle from './AdminCardToggle.jsx';
import authorityClassification from '../../data/development-authorities.json';

const categories = authorityClassification.categories;
const authorityTypes = ['Development authority', 'Municipality', 'Designated area', 'Industrial area', 'Other area'];

function blankDraft() {
  return { key: '', categoryCode: 'D1', authorityName: '', authorityCode: '', authorityType: 'Development authority', notes: '', auditNote: '' };
}

function toDraft(row) {
  return { key: row.key, categoryCode: row.categoryCode, authorityName: row.authorityName, authorityCode: row.authorityCode ?? '', authorityType: row.authorityType, notes: row.notes ?? '', auditNote: '' };
}

export default function CalculatorAuthoritiesPanel() {
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
      const response = await api.get('/admin/calculator-authorities');
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
      && (!categoryFilter || row.categoryCode === categoryFilter)
      && (!query || `${row.categoryCode} ${row.categoryLabel} ${row.authorityName} ${row.authorityCode} ${row.authorityType} ${row.categoryDescription} ${row.notes}`.toLocaleLowerCase().includes(query)));
  }, [rows, search, categoryFilter, showDeleted]);

  const changeDraft = (field) => (event) => setDraft((current) => ({ ...current, [field]: event.target.value }));

  const saveDraft = async (event) => {
    event.preventDefault();
    if (!draft) return;
    setSaving(true);
    setError('');
    const data = {
      categoryCode: draft.categoryCode,
      authorityName: draft.authorityName.trim(),
      authorityCode: draft.authorityCode.trim().toUpperCase(),
      authorityType: draft.authorityType,
      notes: draft.notes.trim(),
      note: draft.auditNote.trim(),
    };
    try {
      if (draft.key) await api.patch(`/admin/calculator-authorities/${encodeURIComponent(draft.key)}`, data);
      else await api.post('/admin/calculator-authorities', data);
      setDraft(null);
      await loadRows();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const removeRow = async (row) => {
    if (!window.confirm(`Remove ${row.authorityName} from ${row.categoryCode}? It will no longer appear in the FSI authority list and can be restored.`)) return;
    const note = window.prompt('Add an audit note for removing this authority row:');
    if (note === null) return;
    setActionKey(row.key);
    setError('');
    try {
      await api.delete(`/admin/calculator-authorities/${encodeURIComponent(row.key)}`, { data: { note } });
      await loadRows();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setActionKey('');
    }
  };

  const restoreRow = async (row) => {
    const note = window.prompt('Add an audit note for restoring this authority row:');
    if (note === null) return;
    setActionKey(row.key);
    setError('');
    try {
      await api.post(`/admin/calculator-authorities/${encodeURIComponent(row.key)}/restore`, { note });
      await loadRows();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setActionKey('');
    }
  };

  return <section className={`admin-calculator-panel admin-authority-panel${collapsed ? ' admin-card-collapsed' : ''}`} id="calculator-authorities">
    <div className="admin-calculator-heading">
      <div><span className="admin-section-label">CALCULATOR CONFIGURATION</span><h2>Table 1.1: Categories and authorities</h2><p>{rows.filter((row) => !row.isDeleted).length.toLocaleString('en-IN')} authority and area rows from the supplied classification table.</p></div>
      <div className="admin-calculator-actions">
        <button type="button" className="admin-toolbar-button" onClick={loadRows} disabled={loading}><RefreshCw size={14} className={loading ? 'admin-spin' : ''} /> Refresh</button>
        <button type="button" className="admin-toolbar-button admin-calculator-add" onClick={() => setDraft(blankDraft())}><Plus size={14} /> Add authority</button>
        <AdminCardToggle collapsed={collapsed} onClick={() => setCollapsed(value => !value)} label="authority list" />
      </div>
    </div>
    <div className="admin-calculator-note"><ShieldCheck size={15} /><span>One authority or area per row. Changes update the FSI calculator authority list and are recorded in the audit trail.</span></div>
    {error && <div className="admin-login-error" role="alert"><CircleAlert size={15} />{error}</div>}
    <div className="admin-calculator-filters">
      <label className="admin-calculator-search"><Search size={14} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search category, authority, code, or legal basis" /></label>
      <label>Category<select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="">All categories</option>{categories.map((category) => <option key={category.code} value={category.code}>{category.label}</option>)}</select></label>
      <label className="admin-deleted-toggle"><input type="checkbox" checked={showDeleted} onChange={(event) => setShowDeleted(event.target.checked)} /> Include removed rows</label>
    </div>
    <div className="admin-calculator-table-wrap"><table className="admin-calculator-table admin-authority-table"><thead><tr><th>Category</th><th>Authorities</th><th>Code</th><th>Type</th><th>Classification and source notes</th><th>Actions</th></tr></thead><tbody>
      {filteredRows.map((row) => <tr key={row.key} className={row.isDeleted ? 'admin-calculator-row-deleted' : ''}>
        <td><strong>{row.categoryCode}{row.categoryCount ? ` (${row.categoryCount})` : ''}</strong><small>{row.categoryLabel.slice(row.categoryCode.length).trim().replace(/^[-\u2013\u2014]\s*/, '')}</small><small>{row.sourceTable ? `Table ${row.sourceTable}` : 'Added row'}{row.isDeleted ? ' · Removed' : ''}</small></td>
        <td><strong>{row.authorityName}</strong></td><td>{row.authorityCode || '—'}</td><td>{row.authorityType}</td>
        <td className="admin-authority-description">{row.categoryDescription}{row.categorySpecialNote && <small>{row.categorySpecialNote}</small>}{row.notes && <small>{row.notes}</small>}</td>
        <td><div className="admin-user-actions">{row.isDeleted ? <button type="button" className="admin-user-action" disabled={actionKey === row.key} onClick={() => restoreRow(row)}><RotateCcw size={12} /> Restore</button> : <><button type="button" className="admin-user-action" onClick={() => setDraft(toDraft(row))}><Pencil size={12} /> Edit</button><button type="button" className="admin-user-action admin-user-remove" disabled={actionKey === row.key} onClick={() => removeRow(row)}><Trash2 size={12} /> Remove</button></>}</div></td>
      </tr>)}
      {loading && <tr><td colSpan="6" className="admin-users-empty">Loading category and authority rows…</td></tr>}
      {!loading && !filteredRows.length && <tr><td colSpan="6" className="admin-users-empty">No authority rows match these filters.</td></tr>}
    </tbody></table></div>
    {!loading && <div className="admin-calculator-count">Showing {filteredRows.length.toLocaleString('en-IN')} of {rows.length.toLocaleString('en-IN')} rows</div>}
    {draft && <div className="admin-calculator-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setDraft(null); }}>
      <form className="admin-calculator-modal" role="dialog" aria-modal="true" aria-labelledby="authority-modal-title" onSubmit={saveDraft}>
        <div className="admin-calculator-modal-heading"><div><span className="admin-section-label">{draft.key ? 'EDIT AUTHORITY ROW' : 'NEW TABLE 1.1 ROW'}</span><h2 id="authority-modal-title">{draft.key ? 'Edit category and authority' : 'Add category and authority'}</h2></div><button type="button" className="admin-toolbar-button" aria-label="Close" onClick={() => setDraft(null)} disabled={saving}><X size={15} /></button></div>
        <div className="admin-calculator-form-grid">
          <label>Category<select required value={draft.categoryCode} onChange={changeDraft('categoryCode')}>{categories.map((category) => <option key={category.code} value={category.code}>{category.label}</option>)}</select></label>
          <label>Authority type<select required value={draft.authorityType} onChange={changeDraft('authorityType')}>{authorityTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
          <label className="admin-calculator-wide">Authority / area name<input required value={draft.authorityName} onChange={changeDraft('authorityName')} placeholder="Enter the authority or area name" maxLength={240} /></label>
          <label>Short code (optional)<input value={draft.authorityCode} onChange={changeDraft('authorityCode')} placeholder="AUDA" maxLength={40} /></label>
          <label className="admin-calculator-wide">Notes<textarea rows="3" value={draft.notes} onChange={changeDraft('notes')} placeholder="Optional source or applicability note" maxLength={5000} /></label>
          <label className="admin-calculator-wide">Audit note<input required value={draft.auditNote} onChange={changeDraft('auditNote')} placeholder="Why is this table row changing?" maxLength={1000} /></label>
        </div>
        <div className="admin-calculator-modal-actions"><button type="button" className="admin-toolbar-button" onClick={() => setDraft(null)} disabled={saving}>Cancel</button><button type="submit" className="admin-toolbar-button admin-calculator-add" disabled={saving}><Building2 size={14} /> {saving ? 'Saving…' : draft.key ? 'Save changes' : 'Add authority'}</button></div>
      </form>
    </div>}
  </section>;
}
