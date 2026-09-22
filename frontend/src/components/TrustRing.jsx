import { useId } from 'react';
import { useReducedMotion } from 'framer-motion';

export default function TrustRing({ value = 50, size = 168, stroke = 12, label = 'Trust score' }) {
  const id = useId();
  const reduceMotion = useReducedMotion();
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const safe = Math.max(0, Math.min(100, value));
  const offset = circumference * (1 - safe / 100);
  const tone = safe >= 80 ? 'accent' : safe >= 55 ? 'primary' : 'amber';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }} role="img" aria-label={`${label}: ${safe} out of 100`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgb(226 232 240)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={reduceMotion ? 0 : offset}
          style={reduceMotion ? undefined : { transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={tone === 'accent' ? '#10B981' : tone === 'primary' ? '#6366F1' : '#F59E0B'} />
            <stop offset="100%" stopColor={tone === 'accent' ? '#34D399' : tone === 'primary' ? '#818CF8' : '#FBBF24'} />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-4xl font-bold tracking-tight ${tone === 'accent' ? 'text-accent-600' : tone === 'primary' ? 'text-primary-600' : 'text-amber-600'}`}>
          {safe}
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">{label}</span>
      </div>
    </div>
  );
}