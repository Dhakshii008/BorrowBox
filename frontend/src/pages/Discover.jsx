import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, X, PackageOpen, SearchX } from 'lucide-react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import {
  PageHeader,
  ItemCard,
  GridSkeleton,
  EmptyState,
  ErrorState,
  Pagination,
} from '../components/index.js';
import { CATEGORIES, CONDITIONS, LOCATIONS } from '../utils/constants.js';
import { getError } from '../utils/format.js';

const sortOptions = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'name', label: 'Name A–Z' },
];

export default function Discover() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const location = searchParams.get('location') || '';
  const condition = searchParams.get('condition') || '';
  const onlyAvailable = searchParams.get('available') || 'true';
  const sort = searchParams.get('sort') || 'newest';
  const page = Number(searchParams.get('page')) || 1;

  const [debouncedSearch, setDebouncedSearch] = useState(q);
  const [searchInput, setSearchInput] = useState(q);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (debouncedSearch !== q) {
      const params = new URLSearchParams(searchParams);
      if (debouncedSearch) params.set('q', debouncedSearch);
      else params.delete('q');
      params.set('page', '1');
      setSearchParams(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const setParam = useCallback(
    (key, value) => {
      const params = new URLSearchParams(searchParams);
      if (value) params.set(key, value);
      else params.delete(key);
      params.set('page', '1');
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const resetFilters = () => setSearchParams({});

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (q) params.set('search', q);
    if (category) params.set('category', category);
    if (location) params.set('location', location);
    if (condition) params.set('condition', condition);
    if (onlyAvailable === 'false') params.set('status', 'all');
    if (user) params.set('excludeOwner', user.id);
    params.set('sort', sort);
    params.set('page', String(page));
    params.set('limit', '12');

    api
      .get(`/items?${params.toString()}`)
      .then((res) => setData(res.data))
      .catch((err) => setError(getError(err)))
      .finally(() => setLoading(false));
  }, [q, category, location, condition, onlyAvailable, sort, page, user]);

  useEffect(() => {
    load();
  }, [load]);

  const activeFilters = [category, location, condition].filter(Boolean).length;
  const hasAnyFilter = Boolean(q) || activeFilters > 0 || onlyAvailable === 'false';
  const filterCount = activeFilters + (onlyAvailable === 'false' ? 1 : 0);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Discover"
        subtitle="Find the exact item you need from someone nearby."
        action={
          <Link to="/items/new" className="btn-primary">
            Share an item
          </Link>
        }
      />

      <div className="sticky top-14 z-20 -mx-4 bg-surface/85 px-4 py-2.5 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 md:top-0">
        <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-3 shadow-soft sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search items, categories, keywords…"
                className="input pl-10"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
              <p className="inline-flex items-center gap-1.5 text-sm text-slate-500">
                <SlidersHorizontal className="h-4 w-4" />
                {loading
                  ? 'Searching…'
                  : `${data?.pagination?.total ?? 0} item${data?.pagination?.total === 1 ? '' : 's'} found`}
              </p>
              <span className="flex items-center gap-2">
                {filterCount > 0 && (
                  <span className="badge bg-slate-900 text-white">{filterCount}</span>
                )}
                {hasAnyFilter && (
                  <button onClick={resetFilters} className="btn-ghost !px-2.5 !py-1.5 text-sm">
                    <X className="h-4 w-4" /> Clear filters
                  </button>
                )}
              </span>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2.5 border-t border-slate-100 pt-3">
            <PillGroup label="Category" value={category} onChange={(v) => setParam('category', v)} options={CATEGORIES} />
            <PillGroup label="Condition" value={condition} onChange={(v) => setParam('condition', v)} options={CONDITIONS} />
            <PillGroup label="Location" value={location} onChange={(v) => setParam('location', v)} options={LOCATIONS} />
            <PillGroup
              label="Availability"
              value={onlyAvailable}
              onChange={(v) => setParam('available', v)}
              options={[['true', 'Available only'], ['false', 'All statuses']]}
              hideAll
            />
            <select
              value={sort}
              onChange={(e) => setParam('sort', e.target.value)}
              className="input ml-auto w-full max-w-full sm:w-44"
              aria-label="Sort items"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mt-6">
        {loading && <GridSkeleton count={8} />}

        {!loading && error && <ErrorState message={error} onRetry={load} />}

        {!loading && !error && data && data.items.length === 0 && (
          <EmptyState
            title={hasAnyFilter ? 'No matching items' : 'No items available yet'}
            description={
              hasAnyFilter
                ? 'Try adjusting your search or filters to find what you need.'
                : 'Be the first to share an item with your campus community.'
            }
            icon={hasAnyFilter ? SearchX : PackageOpen}
            action={
              hasAnyFilter && (
                <button onClick={resetFilters} className="btn-secondary">Clear filters</button>
              )
            }
          />
        )}

        {!loading && !error && data && data.items.length > 0 && (
          <>
            <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-4">
              {data.items.map((item, i) => (
                <motion.div
                  key={item._id}
                  layout
                  initial={{ opacity: 0, y: 18, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.35, delay: Math.min(i * 0.03, 0.25), ease: [0.21, 0.55, 0.24, 1] }}
                  className="mb-5 break-inside-avoid"
                >
                  <ItemCard item={item} index={i} />
                </motion.div>
              ))}
            </div>
            <Pagination
              page={data.pagination.page}
              totalPages={data.pagination.totalPages}
              onChange={(p) => {
                const params = new URLSearchParams(searchParams);
                params.set('page', String(p));
                setSearchParams(params);
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}

const Pill = ({ active, onClick, children }) => (
  <motion.button
    type="button"
    layout
    whileTap={{ scale: 0.95 }}
    whileHover={{ y: -1 }}
    onClick={onClick}
    aria-pressed={active}
    className={`pill !px-2.5 !py-1 text-[13px] ${active ? 'pill-active' : 'pill-idle'}`}
  >
    {children}
  </motion.button>
);

const PillGroup = ({ label, value, onChange, options, hideAll }) => (
  <div className="flex min-w-0 flex-wrap items-center gap-1.5">
    <span className="mr-0.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</span>
    {!hideAll && <Pill active={!value} onClick={() => onChange('')}>All</Pill>}
    {options.map((opt) => {
      const val = Array.isArray(opt) ? opt[0] : opt;
      const text = Array.isArray(opt) ? opt[1] : opt;
      return (
        <Pill key={val} active={value === val} onClick={() => onChange(val)}>
          {text}
        </Pill>
      );
    })}
  </div>
);