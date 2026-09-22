import { Initials } from './index.js';
import { formatImagePath } from '../utils/format.js';

export default function Avatar({ user, size = 'md', className = '' }) {
  const sizes = {
    xs: 'h-7 w-7 text-[10px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-base',
    xl: 'h-20 w-20 text-xl',
  };

  if (user?.profileImage) {
    return (
      <img
        src={formatImagePath(user.profileImage)}
        alt={user.name || 'User'}
        className={`rounded-full object-cover ring-1 ring-slate-200 ${sizes[size]} ${className}`}
      />
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-700 ${sizes[size]} ${className}`}
    >
      <Initials name={user?.name} />
    </span>
  );
}