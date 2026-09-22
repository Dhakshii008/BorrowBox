export const CATEGORIES = ['Academic', 'Electronics', 'Daily Use', 'Events', 'Other'];

export const CONDITIONS = ['Excellent', 'Good', 'Fair', 'Poor'];

export const LOCATIONS = [
  'Main Block',
  'Library',
  'Canteen',
  'Hostel',
  'Engineering Block',
  'Lab Block',
  'Sports Ground',
  'Other',
];

export const DURATIONS = ['2 hours', '1 day', '2 days', '1 week'];

export const REQUEST_STATUS = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  DECLINED: 'Declined',
  BORROWED: 'Borrowed',
  RETURN_REQUESTED: 'Return Requested',
  RETURNED: 'Returned',
};

export const TRANSACTION_STATUS = {
  BORROWED: 'Borrowed',
  RETURN_REQUESTED: 'Return Requested',
  RETURNED: 'Returned',
};

export const ITEM_STATUS = {
  AVAILABLE: 'Available',
  RESERVED: 'Reserved',
  BORROWED: 'Borrowed',
  UNAVAILABLE: 'Unavailable',
};

export const STATUS_COLORS = {
  PENDING: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  ACCEPTED: 'bg-primary-50 text-primary-700 ring-1 ring-primary-200',
  DECLINED: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  BORROWED: 'bg-accent-50 text-accent-700 ring-1 ring-accent-200',
  RETURN_REQUESTED: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200',
  RETURNED: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  AVAILABLE: 'bg-accent-50 text-accent-700 ring-1 ring-accent-200',
  RESERVED: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  UNAVAILABLE: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200',
};

export const CATEGORY_EMOJI = {
  Academic: '📚',
  Electronics: '🔌',
  'Daily Use': '🎒',
  Events: '🎪',
  Other: '📦',
};