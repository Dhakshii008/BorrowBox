import { Search } from 'lucide-react';

export default function SearchBar({ placeholder = 'Search…', value, onChange, onSubmit, className = '', size = 'md' }) {
  const handleKey = (e) => {
    if (e.key === 'Enter' && onSubmit) {
      e.preventDefault();
      onSubmit(e.target.value);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (onSubmit) onSubmit(value ?? '');
      }}
      className={`relative ${className}`}
    >
      <Search
        className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 ${
          size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
        }`}
      />
      <input
        type="search"
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={handleKey}
        placeholder={placeholder}
        className={`input ${size === 'lg' ? 'pl-11 py-3 text-base' : 'pl-10'} w-full rounded-full border-slate-200`}
      />
    </form>
  );
}