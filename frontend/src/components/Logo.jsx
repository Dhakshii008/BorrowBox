import { Link } from 'react-router-dom';

export default function Logo({ className = 'h-9 w-9', textClass = 'text-lg' }) {
  return (
    <Link to="/" className="group flex items-center gap-2.5">
      <span className={`flex items-center justify-center rounded-xl bg-primary-600 shadow-sm ${className}`}>
        <svg viewBox="0 0 64 64" className="h-[70%] w-[70%]" fill="none">
          <path
            d="M21 44V28a11 11 0 1 1 22 0v16"
            stroke="white"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path d="M20 34h8v10h-8zM36 34h8v10h-8z" fill="white" />
          <circle cx="32" cy="20" r="4.5" fill="#6EE7B7" />
        </svg>
      </span>
      <span className={`font-semibold tracking-tight text-slate-900 ${textClass}`}>
        Borrow<span className="text-primary-600">Box</span>
      </span>
    </Link>
  );
}