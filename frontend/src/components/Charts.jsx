import { useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const W = 100;
const H = 100;

function buildPath(data, pad = 8) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (W - pad * 2);
    const y = pad + (1 - (v - min) / range) * (H - pad * 2);
    return [x, y];
  });
  return pts;
}

export function LineChart({ data, height = 160, stroke = '#6366F1', fill = true, label }) {
  const id = useId();
  const reduceMotion = useReducedMotion();
  const pts = buildPath(data);
  if (!pts) return null;

  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ');
  const area = `${line} L${pts[pts.length - 1][0].toFixed(2)},${H} L${pts[0][0].toFixed(2)},${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ height }} className="w-full" role="img" aria-label={label || 'Trend chart'}>
      <defs>
        <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#${id}-fill)`} />}
      <motion.path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: reduceMotion ? 1 : 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      />
      {!reduceMotion &&
        pts.slice(0, -1).map((p, i) =>
          i === pts.length - 2 ? (
            <circle key={i} cx={p[0]} cy={p[1]} r="2.6" fill="white" stroke={stroke} strokeWidth="2" vectorEffect="non-scaling-stroke" className="animate-pulse-soft" />
          ) : null
        )}
    </svg>
  );
}

export function Donut({ segments, size = 180, thickness = 22, centerLabel, centerValue }) {
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((s, d) => s + d.value, 0) || 1;
  let acc = 0;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgb(241 245 249)" strokeWidth={thickness} />
        {segments.map((seg, i) => {
          const frac = seg.value / total;
          const dash = frac * circumference;
          const offset = -acc * circumference;
          acc += frac;
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={thickness}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={offset}
              strokeLinecap="butt"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-slate-900">{centerValue}</span>
        <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">{centerLabel}</span>
      </div>
    </div>
  );
}

export function BarMini({ rows }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="space-y-3.5">
      {rows.map((r, i) => (
        <div key={r.label}>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-600">{r.label}</span>
            <span className="font-semibold text-slate-900">{r.value}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <motion.div
              className="h-full rounded-full"
              style={{ background: r.color || 'linear-gradient(90deg,#6366F1,#818CF8)' }}
              initial={{ width: 0 }}
              whileInView={{ width: `${(r.value / max) * 100}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}