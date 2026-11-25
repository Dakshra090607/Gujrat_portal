import { useState } from 'react';
import { ChevronDown, ShieldCheck } from 'lucide-react';
import policy from '../../data/tall-building-policy.json';

export default function TallBuildingPolicyPanel() {
  const [open, setOpen] = useState(true);
  return <section className={`admin-calculator-panel tall-policy-panel${open ? '' : ' admin-card-collapsed'}`}>
    <div className="admin-calculator-heading">
      <div><span className="admin-section-label">D1 · CGDCR CHAPTER 12</span><h2>Tall building policy</h2><p>Source: {policy.source}. Applicable to the listed D1 authorities and qualifying zones.</p></div>
      <span className="admin-panel-icon"><ShieldCheck size={18}/></span>
      <button type="button" className="admin-card-toggle" aria-label="Show or hide tall building policy tables" aria-expanded={open} onClick={()=>setOpen(value=>!value)}><ChevronDown size={16}/></button>
    </div>
    {open&&<>
      <div className="admin-calculator-note"><span>{policy.notes[0]}</span></div>
      {policy.tables.map(table=><div className="admin-fsi-table-wrap tall-policy-table" key={table.tableNumber}>
        <h3>Table {table.tableNumber}: {table.title}</h3>
        <table className="admin-fsi-table"><thead><tr>{table.headers.map((header,index)=><th key={index}>{header}</th>)}</tr></thead><tbody>{table.rows.map((row,index)=><tr key={index}>{row.map((cell,column)=><td key={column}>{cell}</td>)}</tr>)}</tbody></table>
      </div>)}
      <ul className="tall-policy-notes">{policy.notes.slice(1).map(note=><li key={note}>{note}</li>)}</ul>
    </>}
  </section>;
}
