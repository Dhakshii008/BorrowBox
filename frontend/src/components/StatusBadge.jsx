import { STATUS_COLORS } from '../utils/constants.js';

export default function StatusBadge({ status, label }) {
  const text = label || String(status || '')
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');

  return (
    <span className={`badge ${STATUS_COLORS[status] || 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'}`}>
      {text}
    </span>
  );
}