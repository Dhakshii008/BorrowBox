import { Star, StarHalf, User } from 'lucide-react';

export function RatingStars({ rating = 0, size = 16, showValue = false, className = '' }) {
  const value = Number(rating) || 0;
  const full = Math.floor(value);
  const half = value - full >= 0.4;

  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`}>
      {[0, 1, 2, 3, 4].map((i) => {
        if (i < full) {
          return <Star key={i} size={size} className="fill-amber-400 text-amber-400" />;
        }
        if (i === full && half) {
          return (
            <span key={i} className="relative inline-flex">
              <Star size={size} className="text-slate-300" />
              <StarHalf
                size={size}
                className="absolute inset-0 fill-amber-400 text-amber-400"
              />
            </span>
          );
        }
        return <Star key={i} size={size} className="text-slate-300" />;
      })}
      {showValue && (
        <span className="ml-1 text-sm font-semibold text-slate-700">
          {value > 0 ? value.toFixed(1) : 'New'}
        </span>
      )}
    </span>
  );
}

export function RatingInput({ value, onChange, size = 28 }) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          onClick={() => onChange(star)}
          className="rounded transition-transform hover:scale-110 focus:outline-none"
        >
          <Star
            size={size}
            className={`${
              star <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
            } transition-colors`}
          />
        </button>
      ))}
    </div>
  );
}

export function Initials({ name = '' }) {
  const parts = name.split(' ').filter(Boolean);
  const text = parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
  return (
    <span aria-hidden className="leading-none">
      {text || <User size={14} />}
    </span>
  );
}