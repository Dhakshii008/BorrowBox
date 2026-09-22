export function Spinner({ className = 'h-5 w-5' }) {
  return (
    <svg className={`animate-spin text-current ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-85"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <Spinner className="h-8 w-8 text-primary-600" />
        <p className="text-sm font-medium text-slate-500">Loading…</p>
      </div>
    </div>
  );
}

export function ButtonLoader({ children = 'Please wait…', className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Spinner className="h-4 w-4" /> {children}
    </span>
  );
}