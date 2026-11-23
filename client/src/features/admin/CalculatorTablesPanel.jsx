import { useEffect, useMemo, useState } from 'react';
import { Calculator, CircleAlert, Pencil, Plus, RefreshCw, RotateCcw, Search, ShieldCheck, Trash2, X } from 'lucide-react';
import { api, getApiErrorMessage } from '../../lib/api.js';
import AdminCardToggle from './AdminCardToggle.jsx';

const categories = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7A', 'D7B', 'D8', 'D9', 'D10'];
const useConditions = ['ALL', 'RESIDENTIAL_COMMERCIAL', 'INDUSTRIAL', 'AGRICULTURAL'];

function blankDraft() {
  return { key: '', categoryCode: 'D1', authorityScope: 'DEFAULT', tableNumber: '6.5', zoneCode: 'R1', useCondition: 'ALL', baseFsi: '1.8', chargeableFsi: '0.9', maximumFsi: '2.7', notesText: '', auditNote: '' };
}

function toDraft(row) {
  return { key: row.key, categoryCode: row.categoryCode, authorityScope: row.authorityScope, tableNumber: row.tableNumber, zoneCode: row.zoneCode, useCondition: row.useCondition ?? 'ALL', baseFsi: String(row.baseFsi), chargeableFsi: String(row.chargeableFsi), maximumFsi: String(row.maximumFsi), notesText: (row.notes ?? []).join('\n'), auditNote: '' };
}

function displayScope(scope) {
  return scope === 'DEFAULT' ? 'All authorities in category' : scope;
}

export default function CalculatorTablesPanel() {
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
      const response = await api.get('/admin/calculator-tables');
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
      && (!query || `${row.categoryCode} ${row.authorityScope} ${row.tableNumber} ${row.zoneCode} ${row.useCondition} ${row.notes.join(' ')}`.toLocaleLowerCase().includes(query)));
  }, [rows, search, categoryFilter, showDeleted]);

  const changeDraft = (field) => (event) => setDraft((current) => ({ ...current, [field]: event.target.value }));

  const saveDraft = async (event) => {
    event.preventDefault();
    if (!draft) return;
    setSaving(true);
    setError('');
    const data = {
      categoryCode: draft.categoryCode,
      authorityScope: draft.authorityScope.trim().toUpperCase(),
      tableNumber: draft.tableNumber.trim().toUpperCase(),
      zoneCode: draft.zoneCode.trim().toUpperCase(),
      useCondition: draft.useCondition,
      baseFsi: Number(draft.baseFsi),
      chargeableFsi: Number(draft.chargeableFsi),
      maximumFsi: Number(draft.maximumFsi),
      notes: draft.notesText.split('\n').map((line) => line.trim()).filter(Boolean),
      note: draft.auditNote.trim(),
    };
    try {
      if (draft.key) await api.patch(`/admin/calculator-tables/${encodeURIComponent(draft.key)}`, data);
      else await api.post('/admin/calculator-tables', data);
      setDraft(null);
      await loadRows();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const deleteRow = async (row) => {
    if (!window.confirm(`Remove ${row.categoryCode} ${row.authorityScope} ${row.zoneCode} from calculator results? The change will be recorded and can be restored.`)) return;
    const note = window.prompt('Add an audit note for removing this FSI row:');
    if (note === null) return;
    setActionKey(row.key);
    setError('');
    try {
      await api.delete(`/admin/calculator-tables/${encodeURIComponent(row.key)}`, { data: { note } });
      await loadRows();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setActionKey('');
    }
  };

  const restoreRow = async (row) => {
    const note = window.prompt('Add an audit note for restoring this FSI row:');
    if (note === null) return;
    setActionKey(row.key);
    setError('');
    try {
      await api.post(`/admin/calculator-tables/${encodeURIComponent(row.key)}/restore`, { note });
      await loadRows();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setActionKey('');
    }
  };

  return <section className={`admin-calculator-panel${collapsed ? ' admin-card-collapsed' : ''}`} id="calculator-tables">
    <div className="admin-calculator-heading">
      <div><span className="admin-section-label">CALCULATOR CONFIGURATION</span><h2>FSI table rows</h2><p>{rows.length.toLocaleString('en-IN')} existing schedule rows. Changes are audited and take effect in FSI results.</p></div>
      <div className="admin-calculator-actions">
        <button type="button" className="admin-toolbar-button" onClick={loadRows} disabled={loading}><RefreshCw size={14} className={loading ? 'admin-spin' : ''} /> Refresh</button>
        <button type="button" className="admin-toolbar-button admin-calculator-add" onClick={() => setDraft(blankDraft())}><Plus size={14} /> Add table row</button>
        <AdminCardToggle collapsed={collapsed} onClick={() => setCollapsed(value => !value)} label="calculator FSI rows" />
      </div>
    </div>
    <div className="admin-calculator-note"><ShieldCheck size={15} /><span>Built-in FSI schedule rows are shown below. Add, edit, and removal actions require an audit note; removals can be restored.</span></div>
    {error && <div className="admin-login-error" role="alert"><CircleAlert size={15} />{error}</div>}
    <div className="admin-calculator-filters">
      <label className="admin-calculator-search"><Search size={14} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search table, authority, zone, or note" /></label>
      <label>Category<select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="">All categories</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
      <label className="admin-deleted-toggle"><input type="checkbox" checked={showDeleted} onChange={(event) => setShowDeleted(event.target.checked)} /> Include removed rows</label>
    </div>
    <div className="admin-calculator-table-wrap"><table className="admin-calculator-table"><thead><tr><th>Category</th><th>Authority scope</th><th>Source table</th><th>Zone</th><th>Use</th><th>Base FSI</th><th>Chargeable</th><th>Maximum</th><th>Notes</th><th>Actions</th></tr></thead><tbody>
      {filteredRows.map((row) => <tr key={row.key} className={row.isDeleted ? 'admin-calculator-row-deleted' : ''}>
        <td><strong>{row.categoryCode}</strong><small>{row.isDeleted ? 'Removed' : row.isBuiltIn ? 'Built in' : 'Added'}</small></td>
        <td>{displayScope(row.authorityScope)}</td><td>Table {row.tableNumber}</td><td>{row.zoneCode}</td><td>{row.useCondition === 'ALL' ? 'All uses' : row.useCondition.replaceAll('_', ' ').toLocaleLowerCase()}</td>
        <td>{row.baseFsi}</td><td>{row.chargeableFsi}</td><td>{row.maximumFsi}</td><td className="admin-calculator-notes">{row.notes.length ? row.notes.join(' · ') : '—'}</td>
        <td><div className="admin-user-actions">{row.isDeleted ? <button type="button" className="admin-user-action" disabled={actionKey === row.key} onClick={() => restoreRow(row)}><RotateCcw size={12} /> Restore</button> : <><button type="button" className="admin-user-action" onClick={() => setDraft(toDraft(row))}><Pencil size={12} /> Edit</button><button type="button" className="admin-user-action admin-user-remove" disabled={actionKey === row.key} onClick={() => deleteRow(row)}><Trash2 size={12} /> Remove</button></>}</div></td>
      </tr>)}
      {loading && <tr><td colSpan="10" className="admin-users-empty">Loading FSI table rows…</td></tr>}
      {!loading && !filteredRows.length && <tr><td colSpan="10" className="admin-users-empty">No FSI table rows match these filters.</td></tr>}
    </tbody></table></div>
    {!loading && <div className="admin-calculator-count">Showing {filteredRows.length.toLocaleString('en-IN')} of {rows.length.toLocaleString('en-IN')} rows</div>}
    {draft && <div className="admin-calculator-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setDraft(null); }}>
      <form className="admin-calculator-modal" role="dialog" aria-modal="true" aria-labelledby="calculator-modal-title" onSubmit={saveDraft}>
        <div className="admin-calculator-modal-heading"><div><span className="admin-section-label">{draft.key ? 'EDIT EXISTING ROW' : 'NEW FSI ROW'}</span><h2 id="calculator-modal-title">{draft.key ? 'Edit FSI table row' : 'Add FSI table row'}</h2></div><button type="button" className="admin-toolbar-button" aria-label="Close" onClick={() => setDraft(null)} disabled={saving}><X size={15} /></button></div>
        <div className="admin-calculator-form-grid">
          <label>Development category<select required disabled={Boolean(draft.key)} value={draft.categoryCode} onChange={changeDraft('categoryCode')}>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
          <label>Authority scope<input required disabled={Boolean(draft.key)} value={draft.authorityScope} onChange={changeDraft('authorityScope')} placeholder="AUDA or DEFAULT" maxLength={50} /><small>Use DEFAULT for a category-wide row.</small></label>
          <label>Source table<input required value={draft.tableNumber} onChange={changeDraft('tableNumber')} placeholder="6.5" /></label>
          <label>Zone code<input required disabled={Boolean(draft.key)} value={draft.zoneCode} onChange={changeDraft('zoneCode')} placeholder="R1 or *" maxLength={20} /></label>
          <label>Use condition<select disabled={Boolean(draft.key)} value={draft.useCondition} onChange={changeDraft('useCondition')}>{useConditions.map((condition) => <option key={condition} value={condition}>{condition.replaceAll('_', ' ')}</option>)}</select></label>
          <label>Base FSI<input type="number" min="0" max="100" step="0.01" required value={draft.baseFsi} onChange={changeDraft('baseFsi')} /></label>
          <label>Chargeable FSI<input type="number" min="0" max="100" step="0.01" required value={draft.chargeableFsi} onChange={changeDraft('chargeableFsi')} /></label>
          <label>Maximum FSI<input type="number" min="0" max="100" step="0.01" required value={draft.maximumFsi} onChange={changeDraft('maximumFsi')} /></label>
          <label className="admin-calculator-wide">Notes<textarea rows="3" value={draft.notesText} onChange={changeDraft('notesText')} placeholder="One note per line" maxLength={30000} /></label>
          <label className="admin-calculator-wide">Audit note<input required value={draft.auditNote} onChange={changeDraft('auditNote')} placeholder="Why is this table row changing?" maxLength={1000} /></label>
        </div>
        <div className="admin-calculator-modal-actions"><button type="button" className="admin-toolbar-button" onClick={() => setDraft(null)} disabled={saving}>Cancel</button><button type="submit" className="admin-toolbar-button admin-calculator-add" disabled={saving}><Calculator size={14} /> {saving ? 'Saving…' : draft.key ? 'Save changes' : 'Add row'}</button></div>
      </form>
    </div>}
  </section>;
}
