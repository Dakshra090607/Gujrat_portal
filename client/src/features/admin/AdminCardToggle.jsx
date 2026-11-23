import { ChevronDown, ChevronRight } from 'lucide-react';

export default function AdminCardToggle({ collapsed, onClick, label }) {
  const Icon = collapsed ? ChevronRight : ChevronDown;
  return <button type="button" className="admin-card-toggle" onClick={onClick} aria-expanded={!collapsed} aria-label={`${collapsed ? 'Expand' : 'Collapse'} ${label}`} title={`${collapsed ? 'Expand' : 'Collapse'} ${label}`}><Icon size={15}/></button>;
}
