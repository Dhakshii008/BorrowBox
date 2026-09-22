import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  ShieldAlert,
  Star,
  Package,
} from 'lucide-react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import {
  PageHeader,
  Avatar,
  EmptyState,
  ErrorState,
  Skeleton,
  Reveal,
  PageTransition,
  TrustRing,
  AnimatedNumber,
  RatingStars,
  TimelineSkeleton,
  StatsSkeleton,
} from '../components/index.js';
import { getError, formatDate } from '../utils/format.js';

const tileTones = {
  Rating: 'bg-amber-50 text-amber-600',
  'Trust Score': 'bg-primary-50 text-primary-600',
  'Items Lent': 'bg-accent-50 text-accent-600',
  'Items Borrowed': 'bg-indigo-50 text-indigo-600',
  'Successful Returns': 'bg-emerald-50 text-emerald-600',
  'Late Returns': 'bg-red-50 text-red-600',
};

export default function Reputation() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const viewedUserId = searchParams.get('user') || user.id;
  const isSelf = viewedUserId === user.id;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    api
      .get(`/users/${viewedUserId}/reputation`)
      .then((res) => setData(res.data))
      .catch((err) => setError(getError(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [viewedUserId]);

  if (loading)
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader title={isSelf ? 'My Reputation' : 'Community Reputation'} subtitle="Building trust from real borrowings." />
        <div className="space-y-3">
          <Skeleton className="h-3.5 w-56" />
          <Skeleton className="h-3 w-80" />
        </div>
        <div className="card mt-6 flex flex-col items-center gap-6 p-6 sm:flex-row">
          <div className="flex items-center gap-5">
            <Skeleton className="h-20 w-20 rounded-full" />
            <Skeleton className="h-36 w-36 rounded-full" />
          </div>
          <div className="flex-1 space-y-3">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-60" />
            <Skeleton className="h-4 w-52" />
          </div>
        </div>
        <StatsSkeleton count={6} />
        <div className="card mt-8 space-y-4 p-6">
          <Skeleton className="h-5 w-44" />
          <TimelineSkeleton />
        </div>
      </div>
    );

  if (error) return <ErrorState message={error} onRetry={load} />;

  const profile = data.user;
  const rep = data.reputation;

  const metrics = [
    { icon: Star, label: 'Rating', value: rep.rating > 0 ? rep.rating.toFixed(1) : 'New', num: null, max: 5, sub: `${rep.ratingCount} review${rep.ratingCount === 1 ? '' : 's'}` },
    { icon: ShieldCheck, label: 'Trust Score', value: rep.trustScore, num: rep.trustScore, max: 100, sub: 'out of 100' },
    { icon: ArrowUpFromLine, label: 'Items Lent', value: rep.itemsLent, num: rep.itemsLent, max: Math.max(rep.itemsLent, 1), sub: 'completed loans' },
    { icon: ArrowDownToLine, label: 'Items Borrowed', value: rep.itemsBorrowed, num: rep.itemsBorrowed, max: Math.max(rep.itemsBorrowed, 1), sub: 'borrowings' },
    { icon: CheckCircle2, label: 'Successful Returns', value: rep.successfulReturns, num: rep.successfulReturns, max: Math.max(rep.successfulReturns, 1), sub: 'returned on time' },
    { icon: ShieldAlert, label: 'Late Returns', value: rep.lateReturns, num: rep.lateReturns, max: Math.max(rep.lateReturns, 1), sub: 'returned late' },
  ];

  const reliabilityPct = rep.reliability ?? 100;

  return (
    <PageTransition>
      <div className="mx-auto max-w-4xl">
        <PageHeader
          title={isSelf ? 'My Reputation' : profile.name}
          subtitle="Built from real, completed borrowings — no payments involved."
        />

        <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/70 shadow-soft">
          <div className="pointer-events-none absolute -right-14 -top-14 h-52 w-52 rounded-full bg-primary-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-accent-500/10 blur-3xl" />
          <div className="relative flex flex-col items-center gap-7 p-6 sm:p-8 lg:flex-row lg:items-center">
            <div className="flex items-center gap-6">
              <Avatar user={profile} size="xl" className="ring-4 ring-primary-100" />
              <TrustRing value={rep.trustScore} size={150} label="Trust score" />
            </div>
            <div className="min-w-0 flex-1 text-center lg:text-left">
              <p className="eyebrow">Student trust profile</p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">{profile.name}</h2>
              <p className="mt-0.5 text-sm text-slate-500">
                {profile.department || 'Student'}
                {profile.year ? ` · Year ${profile.year}` : ''}
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <RatingStars rating={rep.rating} size={17} showValue />
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-sm font-semibold text-primary-700 ring-1 ring-inset ring-primary-200">
                  <ShieldCheck className="h-4 w-4" /> {rep.trustScore}/100
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
                  <Package className="h-3.5 w-3.5" /> {data.itemsCount} {data.itemsCount === 1 ? 'item' : 'items'} listed
                </span>
              </div>
            </div>
            <div className="w-full rounded-2xl border border-slate-200/80 bg-white/80 p-4 lg:w-60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Reliability</span>
                <span className="inline-flex items-baseline gap-0.5 text-sm font-bold text-accent-600">
                  <AnimatedNumber value={reliabilityPct} />%
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent-500 to-accent-400 transition-[width] duration-1000"
                  style={{ width: `${reliabilityPct}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-slate-400">on-time returns across all borrowings</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
          {metrics.map((m, i) => (
            <Reveal key={m.label} delay={i * 0.05} className="card p-5 hover:border-primary-200/70 hover:shadow-lift">
              <div className="flex items-center justify-between">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tileTones[m.label] || 'bg-slate-50 text-slate-500'}`}>
                  <m.icon className="h-5 w-5" strokeWidth={2} />
                </span>
                </div>
              <p className="mt-3 flex items-baseline text-2xl font-bold text-slate-900">
                {m.num != null ? <AnimatedNumber value={m.num} /> : m.value}
                {m.max && m.max > 1 && m.label !== 'Rating' && m.label !== 'Trust Score' && (
                  <span className="text-sm font-medium text-slate-300"> / {m.max}</span>
                )}
              </p>
              <p className="text-sm font-medium text-slate-600">{m.label}</p>
              <p className="text-xs text-slate-400">{m.sub}</p>
              {(m.label === 'Trust Score' || m.label === 'Rating') && (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${m.label === 'Trust Score' ? 'bg-gradient-to-r from-primary-600 to-primary-400' : 'bg-gradient-to-r from-amber-500 to-amber-300'}`}
                    style={{ width: `${Math.min(100, ((m.label === 'Trust Score' ? rep.trustScore : rep.rating) / m.max) * 100)}%` }}
                  />
                </div>
              )}
              {m.label === 'Successful Returns' && (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent-600 to-accent-400"
                    style={{ width: `${Math.min(100, (rep.successfulReturns / Math.max(rep.successfulReturns, 1)) * 100)}%` }}
                  />
                </div>
              )}
            </Reveal>
          ))}
        </div>

        <div className="mt-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="eyebrow flex items-center gap-2">
              <Star className="h-4 w-4" /> Reviews received
            </h2>
            <div className="flex items-center gap-3">
              <span className="badge bg-violet-50 text-violet-700 ring-1 ring-violet-200">
                {rep.ratingCount} review{rep.ratingCount === 1 ? '' : 's'}
              </span>
              {isSelf && (
                <Link to="/settings" className="text-sm font-medium text-primary-600 hover:text-primary-700">
                  Manage profile
                </Link>
              )}
            </div>
          </div>

          {data.reviews.length === 0 ? (
            <EmptyState
              title="No reviews yet"
              description={`Once students complete borrowings with ${profile.name}, their reviews will appear here.`}
              icon={Star}
            />
          ) : (
            <div className="space-y-3">
              {data.reviews.map((rev, i) => (
                <Reveal key={rev._id} delay={Math.min(i, 4) * 0.04} className="card p-4 hover:shadow-lift">
                  <div className="flex items-center gap-3">
                    <Avatar user={rev.reviewerId} size="sm" className="ring-2 ring-primary-100" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <p className="text-sm font-semibold text-slate-900">{rev.reviewerId?.name}</p>
                        {rev.transactionId?.itemId?.name && (
                          <span className="input-chip">
                            <Package className="h-3 w-3" /> {rev.transactionId.itemId.name}
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2">
                        <RatingStars rating={rev.rating} size={13} />
                        <span className="text-xs text-slate-400">{formatDate(rev.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  {rev.comment && (
                    <p className="mt-3 border-l-2 border-primary-100 pl-3 text-sm italic leading-relaxed text-slate-600">
                      “{rev.comment}”
                    </p>
                  )}
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}