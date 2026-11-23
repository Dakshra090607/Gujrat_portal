import { useEffect, useMemo, useState } from 'react';
import { BookOpenCheck, CircleAlert, Pencil, Plus, RefreshCw, RotateCcw, Search, ShieldCheck, Trash2, X } from 'lucide-react';
import { api, getApiErrorMessage } from '../../lib/api.js';
import AdminCardToggle from './AdminCardToggle.jsx';
import sourceTable from '../../data/table-6-3.json';

function blankDraft() {
  return { key: '', sourceRow: '', classification: '', code: '', permittedUses: '', auditNote: '' };
}

function toDraft(row) {
  return { key: row.key, sourceRow: row.sourceRow, classification: row.classification, code: row.code, permittedUses: row.permittedUses, auditNote: '' };
}

export default function CalculatorUseCodesPanel() {
  const [collapsed, setCollapsed] = useState(true);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionKey, setActionKey] = useState('');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  const [draft, setDraft] = useState(null);

  const loadRows = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/admin/calculator-use-codes');
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
      && (!query || `${row.sourceRow} ${row.classification} ${row.code} ${row.permittedUses}`.toLocaleLowerCase().includes(query)));
  }, [rows, search, showDeleted]);

  const changeDraft = (field) => (event) => setDraft((current) => ({ ...current, [field]: event.target.value }));

  const saveDraft = async (event) => {
    event.preventDefault();
    if (!draft) return;
    setSaving(true);
    setError('');
    const data = {
      sourceRow: draft.sourceRow.trim(),
      classification: draft.classification.trim(),
      code: draft.code.trim().toUpperCase(),
      permittedUses: draft.permittedUses.trim(),
      note: draft.auditNote.trim(),
    };
    try {
      if (draft.key) await api.patch(`/admin/calculator-use-codes/${encodeURIComponent(draft.key)}`, data);
      else await api.post('/admin/calculator-use-codes', data);
      setDraft(null);
      await loadRows();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const removeRow = async (row) => {
    if (!window.confirm(`Remove Table 6.3 row ${row.sourceRow}: ${row.classification} (${row.code})? It can be restored later.`)) return;
    const note = window.prompt('Add an audit note for removing this permitted-use row:');
    if (note === null) return;
    setActionKey(row.key);
    setError('');
    try {
      await api.delete(`/admin/calculator-use-codes/${encodeURIComponent(row.key)}`, { data: { note } });
      await loadRows();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setActionKey('');
    }
  };

  const restoreRow = async (row) => {
    const note = window.prompt('Add an audit note for restoring this permitted-use row:');
    if (note === null) return;
    setActionKey(row.key);
    setError('');
    try {
      await api.post(`/admin/calculator-use-codes/${encodeURIComponent(row.key)}/restore`, { note });
      await loadRows();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setActionKey('');
    }
  };

  return <section className={`admin-calculator-panel admin-zone-panel${collapsed ? ' admin-card-collapsed' : ''}`} id="calculator-use-codes">
    <div className="admin-calculator-heading">
      <div><span className="admin-section-label">CALCULATOR CONFIGURATION</span><h2>Table 6.3: Uses permitted in each category</h2><p>{rows.filter((row) => !row.isDeleted).length.toLocaleString('en-IN')} use codes connect Table 6.2 zones to their permitted-use descriptions.</p></div>
      <div className="admin-calculator-actions">
        <button type="button" className="admin-toolbar-button" onClick={loadRows} disabled={loading}><RefreshCw size={14} className={loading ? 'admin-spin' : ''} /> Refresh</button>
        <button type="button" className="admin-toolbar-button admin-calculator-add" onClick={() => setDraft(blankDraft())}><Plus size={14} /> Add use code</button>
        <AdminCardToggle collapsed={collapsed} onClick={() => setCollapsed(value => !value)} label="Table 6.3" />
      </div>
    </div>
    <div className="admin-calculator-note"><ShieldCheck size={15} /><span>Each Table 6.3 code is stored separately so permitted uses can be matched to the codes listed in Table 6.2. Changes are audited and can be restored.</span></div>
    <div className="admin-zone-notes"><b>Source transcription</b><p>{sourceTable.transcriptionNote}</p></div>
    {error && <div className="admin-login-error" role="alert"><CircleAlert size={15} />{error}</div>}
    <div className="admin-calculator-filters">
      <label className="admin-calculator-search"><Search size={14} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search source number, classification, code, or use" /></label>
      <label className="admin-deleted-toggle"><input type="checkbox" checked={showDeleted} onChange={(event) => setShowDeleted(event.target.checked)} /> Include removed rows</label>
    </div>
    <div className="admin-calculator-table-wrap"><table className="admin-calculator-table admin-zone-table"><thead><tr><th>Sr. no.</th><th>Use classification</th><th>Code</th><th>Permitted uses</th><th>Actions</th></tr></thead><tbody>
      {filteredRows.map((row) => <tr key={row.key} className={row.isDeleted ? 'admin-calculator-row-deleted' : ''}>
        <td><strong>{row.sourceRow}</strong><small>{row.isDeleted ? 'Removed' : row.isBuiltIn ? 'Table 6.3' : 'Added'}</small></td>
        <td className="admin-zone-use">{row.classification}</td>
        <td><strong>{row.code}</strong></td>
        <td className="admin-zone-permissible">{row.permittedUses}</td>
        <td><div className="admin-user-actions">{row.isDeleted ? <button type="button" className="admin-user-action" disabled={actionKey === row.key} onClick={() => restoreRow(row)}><RotateCcw size={12} /> Restore</button> : <><button type="button" className="admin-user-action" onClick={() => setDraft(toDraft(row))}><Pencil size={12} /> Edit</button><button type="button" className="admin-user-action admin-user-remove" disabled={actionKey === row.key} onClick={() => removeRow(row)}><Trash2 size={12} /> Remove</button></>}</div></td>
      </tr>)}
      {loading && <tr><td colSpan="5" className="admin-users-empty">Loading Table 6.3 rows…</td></tr>}
      {!loading && !filteredRows.length && <tr><td colSpan="5" className="admin-users-empty">No Table 6.3 rows match this search.</td></tr>}
    </tbody></table></div>
    {!loading && <div className="admin-calculator-count">Showing {filteredRows.length.toLocaleString('en-IN')} of {rows.length.toLocaleString('en-IN')} rows</div>}
    {draft && <div className="admin-calculator-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setDraft(null); }}>
      <form className="admin-calculator-modal admin-zone-modal" role="dialog" aria-modal="true" aria-labelledby="use-code-modal-title" onSubmit={saveDraft}>
        <div className="admin-calculator-modal-heading"><div><span className="admin-section-label">{draft.key ? 'EDIT TABLE 6.3 ROW' : 'NEW TABLE 6.3 ROW'}</span><h2 id="use-code-modal-title">{draft.key ? 'Edit permitted use' : 'Add permitted use'}</h2></div><button type="button" className="admin-toolbar-button" aria-label="Close" onClick={() => setDraft(null)} disabled={saving}><X size={15} /></button></div>
        <div className="admin-calculator-form-grid">
          <label>Source row<input required value={draft.sourceRow} onChange={changeDraft('sourceRow')} placeholder="40 or 21A" maxLength={20} /></label>
          <label>Use code<input required value={draft.code} onChange={changeDraft('code')} placeholder="DW1" maxLength={40} /></label>
          <label className="admin-calculator-wide">Use classification<input required value={draft.classification} onChange={changeDraft('classification')} maxLength={240} /></label>
          <label className="admin-calculator-wide">Permitted uses<textarea rows="7" required value={draft.permittedUses} onChange={changeDraft('permittedUses')} maxLength={10000} /></label>
          <label className="admin-calculator-wide">Audit note<input required value={draft.auditNote} onChange={changeDraft('auditNote')} placeholder="Why is this Table 6.3 row changing?" maxLength={1000} /></label>
        </div>
        <div className="admin-calculator-modal-actions"><button type="button" className="admin-toolbar-button" onClick={() => setDraft(null)} disabled={saving}>Cancel</button><button type="submit" className="admin-toolbar-button admin-calculator-add" disabled={saving}><BookOpenCheck size={14} /> {saving ? 'Saving…' : draft.key ? 'Save changes' : 'Add use code'}</button></div>
      </form>
    </div>}
  </section>;
}
