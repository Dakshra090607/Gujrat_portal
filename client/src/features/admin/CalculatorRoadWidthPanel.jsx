import { useEffect, useMemo, useState } from 'react';
import { CircleAlert, Pencil, Plus, RefreshCw, RotateCcw, Route, Search, ShieldCheck, Trash2, X } from 'lucide-react';
import { api, getApiErrorMessage } from '../../lib/api.js';
import AdminCardToggle from './AdminCardToggle.jsx';
import sourceTable from '../../data/table-6-4.json';

function blankDraft() {
  return { key: '', sourceRow: '7', roadWidthMinMeters: '0', roadWidthMaxExclusiveMeters: '9', coreWallGamtalUses: '', coreUseCodes: '', coreInheritedRows: '', coreConditions: '', otherGamtalUses: '', otherUseCodes: '', otherConditionalUseCodes: '', otherInheritedRows: '', otherConditions: '', commercialRestrictionText: '', commercialRestrictionLevels: '', commercialRestrictionNotes: '', auditNote: '' };
}

function toDraft(row) {
  return {
    key: row.key,
    sourceRow: row.sourceRow,
    roadWidthMinMeters: String(row.roadWidthMinMeters),
    roadWidthMaxExclusiveMeters: row.roadWidthMaxExclusiveMeters == null ? '' : String(row.roadWidthMaxExclusiveMeters),
    coreWallGamtalUses: row.coreWallGamtalUses,
    coreUseCodes: row.coreUseCodes.join(', '),
    coreInheritedRows: row.coreInheritedRows.join(', '),
    coreConditions: row.coreConditions.join('\n'),
    otherGamtalUses: row.otherGamtalUses,
    otherUseCodes: row.otherUseCodes.join(', '),
    otherConditionalUseCodes: row.otherConditionalUseCodes.join(', '),
    otherInheritedRows: row.otherInheritedRows.join(', '),
    otherConditions: row.otherConditions.join('\n'),
    commercialRestrictionText: row.commercialRestrictionText,
    commercialRestrictionLevels: row.commercialRestrictionLevels.join(', '),
    commercialRestrictionNotes: row.commercialRestrictionNotes,
    auditNote: '',
  };
}

const list = (value) => value.split(/[\n,]/).map((item) => item.trim()).filter(Boolean);

function UseCell({ codes, conditionalCodes, conditions }) {
  return <div className="admin-road-use-cell">
    {codes.length === 0 && <div>—</div>}
    {codes.length > 0 && <div className="admin-zone-code-tags">{codes.map((code) => <span key={code}>{code}</span>)}</div>}
    {conditionalCodes.length > 0 && <small>Conditional codes: {conditionalCodes.join(', ')}</small>}
    {conditions.length > 0 && <small>{conditions.join(' ')}</small>}
  </div>;
}

export default function CalculatorRoadWidthPanel() {
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
      const response = await api.get('/admin/calculator-road-width');
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
      && (!query || `${row.sourceRow} ${row.roadWidthLabel} ${row.coreWallGamtalUses} ${row.otherGamtalUses} ${row.coreEffectiveUseCodes.join(' ')} ${row.otherEffectiveUseCodes.join(' ')} ${row.commercialRestrictionText}`.toLocaleLowerCase().includes(query)));
  }, [rows, search, showDeleted]);

  const changeDraft = (field) => (event) => setDraft((current) => ({ ...current, [field]: event.target.value }));

  const saveDraft = async (event) => {
    event.preventDefault();
    if (!draft) return;
    setSaving(true);
    setError('');
    const data = {
      sourceRow: draft.sourceRow.trim(),
      roadWidthMinMeters: Number(draft.roadWidthMinMeters),
      roadWidthMaxExclusiveMeters: draft.roadWidthMaxExclusiveMeters.trim() === '' ? null : Number(draft.roadWidthMaxExclusiveMeters),
      coreWallGamtalUses: draft.coreWallGamtalUses.trim(),
      coreUseCodes: list(draft.coreUseCodes),
      coreInheritedRows: list(draft.coreInheritedRows),
      coreConditions: draft.coreConditions.split('\n').map((value) => value.trim()).filter(Boolean),
      otherGamtalUses: draft.otherGamtalUses.trim(),
      otherUseCodes: list(draft.otherUseCodes),
      otherConditionalUseCodes: list(draft.otherConditionalUseCodes),
      otherInheritedRows: list(draft.otherInheritedRows),
      otherConditions: draft.otherConditions.split('\n').map((value) => value.trim()).filter(Boolean),
      commercialRestrictionText: draft.commercialRestrictionText.trim(),
      commercialRestrictionLevels: list(draft.commercialRestrictionLevels).map((value) => value.toUpperCase()),
      commercialRestrictionNotes: draft.commercialRestrictionNotes.trim(),
      note: draft.auditNote.trim(),
    };
    try {
      if (draft.key) await api.patch(`/admin/calculator-road-width/${encodeURIComponent(draft.key)}`, data);
      else await api.post('/admin/calculator-road-width', data);
      setDraft(null);
      await loadRows();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const removeRow = async (row) => {
    if (!window.confirm(`Remove Table 6.4 road-width row ${row.sourceRow} (${row.roadWidthLabel})? It can be restored later.`)) return;
    const note = window.prompt('Add an audit note for removing this road-width row:');
    if (note === null) return;
    setActionKey(row.key);
    setError('');
    try {
      await api.delete(`/admin/calculator-road-width/${encodeURIComponent(row.key)}`, { data: { note } });
      await loadRows();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setActionKey('');
    }
  };

  const restoreRow = async (row) => {
    const note = window.prompt('Add an audit note for restoring this road-width row:');
    if (note === null) return;
    setActionKey(row.key);
    setError('');
    try {
      await api.post(`/admin/calculator-road-width/${encodeURIComponent(row.key)}/restore`, { note });
      await loadRows();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setActionKey('');
    }
  };

  return <section className={`admin-calculator-panel admin-zone-panel${collapsed ? ' admin-card-collapsed' : ''}`} id="calculator-road-width">
    <div className="admin-calculator-heading">
      <div><span className="admin-section-label">CALCULATOR CONFIGURATION</span><h2>Table 6.4: Use control by road width</h2><p>{rows.filter((row) => !row.isDeleted).length.toLocaleString('en-IN')} road-width bands with permitted uses and commercial restrictions.</p></div>
      <div className="admin-calculator-actions">
        <button type="button" className="admin-toolbar-button" onClick={loadRows} disabled={loading}><RefreshCw size={14} className={loading ? 'admin-spin' : ''} /> Refresh</button>
        <button type="button" className="admin-toolbar-button admin-calculator-add" onClick={() => setDraft(blankDraft())}><Plus size={14} /> Add road-width band</button>
        <AdminCardToggle collapsed={collapsed} onClick={() => setCollapsed(value => !value)} label="Table 6.4" />
      </div>
    </div>
    <div className="admin-calculator-note"><ShieldCheck size={15} /><span>Road widths are stored in metres as lower-inclusive and upper-exclusive bounds. Permitted-use codes link to Table 6.3; inherited row references remain explicit for future analysis.</span></div>
    <div className="admin-zone-notes"><b>Table notes</b>{sourceTable.notes.map((note) => <p key={note}>{note}</p>)}</div>
    {error && <div className="admin-login-error" role="alert"><CircleAlert size={15} />{error}</div>}
    <div className="admin-calculator-filters">
      <label className="admin-calculator-search"><Search size={14} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search road width, use code, or restriction" /></label>
      <label className="admin-deleted-toggle"><input type="checkbox" checked={showDeleted} onChange={(event) => setShowDeleted(event.target.checked)} /> Include removed rows</label>
    </div>
    <div className="admin-calculator-table-wrap"><table className="admin-calculator-table admin-zone-table admin-road-width-table"><thead><tr><th>Sr. no.</th><th>Road width</th><th>Core Wall (CW) &amp; Gamtal (GM)</th><th>Other than CW &amp; GM</th><th>Commercial use restrictions (M1 &amp; M2)</th><th>Actions</th></tr></thead><tbody>
      {filteredRows.map((row) => <tr key={row.key} className={row.isDeleted ? 'admin-calculator-row-deleted' : ''}>
        <td><strong>{row.sourceRow}</strong><small>{row.isDeleted ? 'Removed' : row.isBuiltIn ? 'Table 6.4' : 'Added'}</small></td>
        <td><strong>{row.roadWidthLabel}</strong><small>{row.roadWidthMinMeters} m to {row.roadWidthMaxExclusiveMeters == null ? 'no upper limit' : `less than ${row.roadWidthMaxExclusiveMeters} m`}</small></td>
        <td><UseCell codes={row.coreEffectiveUseCodes} conditionalCodes={[]} conditions={row.coreConditions} /></td>
        <td><UseCell codes={row.otherEffectiveUseCodes} conditionalCodes={row.otherConditionalUseCodes} conditions={row.otherConditions} /></td>
        <td>{row.commercialRestrictionText || '—'}{row.commercialRestrictionNotes && <small>{row.commercialRestrictionNotes}</small>}</td>
        <td><div className="admin-user-actions">{row.isDeleted ? <button type="button" className="admin-user-action" disabled={actionKey === row.key} onClick={() => restoreRow(row)}><RotateCcw size={12} /> Restore</button> : <><button type="button" className="admin-user-action" onClick={() => setDraft(toDraft(row))}><Pencil size={12} /> Edit</button><button type="button" className="admin-user-action admin-user-remove" disabled={actionKey === row.key} onClick={() => removeRow(row)}><Trash2 size={12} /> Remove</button></>}</div></td>
      </tr>)}
      {loading && <tr><td colSpan="6" className="admin-users-empty">Loading Table 6.4 rows…</td></tr>}
      {!loading && !filteredRows.length && <tr><td colSpan="6" className="admin-users-empty">No Table 6.4 rows match this search.</td></tr>}
    </tbody></table></div>
    {!loading && <div className="admin-calculator-count">Showing {filteredRows.length.toLocaleString('en-IN')} of {rows.length.toLocaleString('en-IN')} rows</div>}
    {draft && <div className="admin-calculator-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setDraft(null); }}>
      <form className="admin-calculator-modal admin-zone-modal" role="dialog" aria-modal="true" aria-labelledby="road-width-modal-title" onSubmit={saveDraft}>
        <div className="admin-calculator-modal-heading"><div><span className="admin-section-label">{draft.key ? 'EDIT TABLE 6.4 ROW' : 'NEW TABLE 6.4 ROW'}</span><h2 id="road-width-modal-title">{draft.key ? 'Edit road-width band' : 'Add road-width band'}</h2></div><button type="button" className="admin-toolbar-button" aria-label="Close" onClick={() => setDraft(null)} disabled={saving}><X size={15} /></button></div>
        <div className="admin-calculator-form-grid">
          <label>Source row<input required value={draft.sourceRow} onChange={changeDraft('sourceRow')} maxLength={20} /></label>
          <label>Minimum width (m, inclusive)<input type="number" min="0" step="0.1" required value={draft.roadWidthMinMeters} onChange={changeDraft('roadWidthMinMeters')} /></label>
          <label>Maximum width (m, exclusive)<input type="number" min="0.1" step="0.1" value={draft.roadWidthMaxExclusiveMeters} onChange={changeDraft('roadWidthMaxExclusiveMeters')} placeholder="Blank means no upper limit" /></label>
          <label className="admin-calculator-wide">Core Wall &amp; Gamtal: source wording<textarea rows="3" required value={draft.coreWallGamtalUses} onChange={changeDraft('coreWallGamtalUses')} maxLength={5000} /></label>
          <label>Core use codes<input value={draft.coreUseCodes} onChange={changeDraft('coreUseCodes')} placeholder="DW1, DW2" /><small>Comma separated; codes must exist in Table 6.3.</small></label>
          <label>Inherits core uses from rows<input value={draft.coreInheritedRows} onChange={changeDraft('coreInheritedRows')} placeholder="1, 2" /></label>
          <label className="admin-calculator-wide">Core use conditions<textarea rows="2" value={draft.coreConditions} onChange={changeDraft('coreConditions')} placeholder="One condition per line" /></label>
          <label className="admin-calculator-wide">Other areas: source wording<textarea rows="4" required value={draft.otherGamtalUses} onChange={changeDraft('otherGamtalUses')} maxLength={5000} /></label>
          <label>Other use codes<input value={draft.otherUseCodes} onChange={changeDraft('otherUseCodes')} placeholder="DW1, M1" /><small>Comma separated; codes must exist in Table 6.3.</small></label>
          <label>Conditional use codes<input value={draft.otherConditionalUseCodes} onChange={changeDraft('otherConditionalUseCodes')} placeholder="M1, RUDA-only codes" /></label>
          <label>Inherits other uses from rows<input value={draft.otherInheritedRows} onChange={changeDraft('otherInheritedRows')} placeholder="1, 2" /></label>
          <label className="admin-calculator-wide">Other use conditions<textarea rows="2" value={draft.otherConditions} onChange={changeDraft('otherConditions')} placeholder="One condition per line" /></label>
          <label className="admin-calculator-wide">Commercial restrictions (M1 &amp; M2)<textarea rows="3" value={draft.commercialRestrictionText} onChange={changeDraft('commercialRestrictionText')} /></label>
          <label>Restricted floors<input value={draft.commercialRestrictionLevels} onChange={changeDraft('commercialRestrictionLevels')} placeholder="GROUND, FIRST or ALL" /></label>
          <label>Restriction conditions<textarea rows="2" value={draft.commercialRestrictionNotes} onChange={changeDraft('commercialRestrictionNotes')} /></label>
          <label className="admin-calculator-wide">Audit note<input required value={draft.auditNote} onChange={changeDraft('auditNote')} placeholder="Why is this Table 6.4 row changing?" maxLength={1000} /></label>
        </div>
        <div className="admin-calculator-modal-actions"><button type="button" className="admin-toolbar-button" onClick={() => setDraft(null)} disabled={saving}>Cancel</button><button type="submit" className="admin-toolbar-button admin-calculator-add" disabled={saving}><Route size={14} /> {saving ? 'Saving…' : draft.key ? 'Save changes' : 'Add road-width band'}</button></div>
      </form>
    </div>}
  </section>;
}
