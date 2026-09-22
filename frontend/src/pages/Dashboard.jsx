import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Inbox,
  ShieldCheck,
  ChevronRight,
  Search,
  Package,
  Plus,
  Bell,
  Clock,
  Compass,
  Layers,
  MapPin,
  Sparkles,
} from 'lucide-react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import {
  SearchBar,
  EmptyState,
  ErrorState,
  Avatar,
  StatusBadge,
  AnimatedNumber,
  StatsSkeleton,
  TimelineSkeleton,
  Skeleton,
  Reveal,
  Spotlight,
} from '../components/index.js';
import { getError, timeAgo, formatImagePath } from '../utils/format.js';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const load = () => {
    setLoading(true);
    setError('');
    api
      .get('/dashboard')
      .then((res) => setData(res.data))
      .catch((err) => setError(getError(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const statCards = data
    ? [
        { icon: ArrowDownToLine, label: 'Active Borrowings', value: data.stats.activeBorrowings, tone: 'primary' },
        { icon: ArrowUpFromLine, label: 'Items Shared', value: data.stats.itemsShared, tone: 'accent' },
        { icon: Inbox, label: 'Pending Requests', value: data.stats.pendingRequests, tone: 'amber' },
        { icon: ShieldCheck, label: 'Trust Score', value: data.stats.trustScore, tone: 'violet' },
      ]
    : [];

  const quickActions = [
    { to: '/items/new', icon: Plus, title: 'Share an item', body: 'Put something you own on the campus shelf.', box: 'bg-primary-50 text-primary-600' },
    { to: '/discover', icon: Compass, title: 'Discover', body: 'Browse what neighbors are lending right now.', box: 'bg-accent-50 text-accent-600' },
    { to: '/borrowings', icon: Layers, title: 'My borrowings', body: 'Track active loans and upcoming returns.', box: 'bg-violet-50 text-violet-600', badge: data?.stats?.activeBorrowings },
  ];

  const timeline = data
    ? [
        ...(data.recentNotifications || []).map((n) => ({
          id: n._id,
          icon: Bell,
          title: n.title,
          meta: n.message,
          time: n.createdAt,
          dot: 'bg-primary-500',
          chip: 'bg-primary-50 text-primary-600',
        })),
        ...(data.recentBorrowed || []).map((b) => ({
          id: b._id,
          icon: ArrowDownToLine,
          title: `Borrowed ${b.itemId?.name || 'an item'}`,
          meta: b.ownerId?.name ? `from ${b.ownerId.name}` : 'from a campus neighbor',
          time: b.createdAt,
          dot: 'bg-accent-500',
          chip: 'bg-accent-50 text-accent-600',
        })),
        ...(data.recentListed || []).map((i) => ({
          id: i._id,
          icon: Package,
          title: `Listed ${i.name || 'an item'}`,
          meta: i.location || 'on campus',
          time: i.createdAt,
          dot: 'bg-violet-500',
          chip: 'bg-violet-50 text-violet-600',
        })),
        ...(data.pendingList || []).map((r) => ({
          id: r._id,
          icon: Inbox,
          title: `${r.borrowerId?.name || 'A neighbor'} wants ${r.itemId?.name || 'an item'}`,
          meta: 'New request waiting for you',
          time: r.createdAt,
          dot: 'bg-amber-500',
          chip: 'bg-amber-50 text-amber-600',
        })),
      ]
      .sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0))
      .slice(0, 6)
    : [];

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl">
        <div className="rounded-3xl border border-slate-200/80 bg-white/70 p-6 shadow-soft sm:p-8">
          <Skeleton className="h-3 w-44" />
          <Skeleton className="mt-4 h-9 w-72 max-w-full" />
          <Skeleton className="mt-2 h-4 w-60 max-w-full" />
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((n) => (
            <Skeleton key={n} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="mt-8">
          <StatsSkeleton />
        </div>
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="card p-6">
              <TimelineSkeleton />
            </div>
            <div className="card p-6">
              <TimelineSkeleton />
            </div>
          </div>
          <div className="card p-6">
            <TimelineSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-700 via-primary-600 to-accent-600 px-6 py-8 text-white shadow-lift sm:px-10 sm:py-10">
        <span aria-hidden="true" className="absolute -right-10 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl animate-blob-a" />
        <span aria-hidden="true" className="absolute -bottom-24 right-32 h-56 w-56 rounded-full bg-white/10 blur-2xl animate-blob-b" />
        <span aria-hidden="true" className="absolute -left-14 bottom-0 h-40 w-40 rounded-full bg-black/10 blur-2xl animate-blob-c" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              {greeting},{' '}
              <span className="font-extrabold underline decoration-white/40 decoration-2 underline-offset-4">
                {user.name}
              </span>
            </h1>
            <p className="mt-2 max-w-lg text-sm text-white/80">
              Here's what's moving on campus today — your items, borrowings, and requests at a glance.
            </p>
            <div className="mt-5">
              <Link to="/items/new" className="btn bg-white text-primary-700 shadow-soft hover:-translate-y-0.5 hover:bg-white/90 hover:shadow-lift">
                <Plus className="h-4 w-4" /> Share an item
              </Link>
            </div>
          </div>
          {data && (
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/15 px-5 py-4 text-center backdrop-blur-md ring-1 ring-white/20">
                <p className="text-2xl font-extrabold leading-none">{data.stats.availableItems}</p>
                <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/70">Available now</p>
              </div>
              <div className="hidden rounded-2xl bg-white/15 px-5 py-4 text-center backdrop-blur-md ring-1 ring-white/20 sm:block">
                <p className="text-2xl font-extrabold leading-none">{data.stats.unreadNotifications}</p>
                <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/70">Unread alerts</p>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {quickActions.map((action, i) => (
          <Reveal key={action.to} delay={i * 0.06}>
            <Spotlight className="h-full rounded-2xl">
              <Link to={action.to} className="card group flex h-full items-start gap-4 p-5">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${action.box}`}>
                  <action.icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 transition group-hover:text-primary-700">{action.title}</span>
                    {action.badge !== undefined && (
                      <span className="badge bg-slate-900 text-white">{action.badge}</span>
                    )}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-slate-500">{action.body}</span>
                </span>
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-primary-600" />
              </Link>
            </Spotlight>
          </Reveal>
        ))}
      </div>

      <div className="mt-6">
        <DashboardSearch />
      </div>

      {error ? (
        <div className="mt-8">
          <ErrorState message={error} onRetry={load} />
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-200/70 shadow-soft lg:grid-cols-4">
            {statCards.map((card, i) => (
              <Reveal key={card.label} delay={i * 0.06} className="bg-white/90 backdrop-blur-sm">
                <div className="flex h-full flex-col justify-between gap-4 p-5">
                  <span
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${
                      card.tone === 'primary'
                        ? 'from-primary-50 to-primary-100 text-primary-600'
                        : card.tone === 'accent'
                          ? 'from-accent-50 to-accent-100 text-accent-600'
                          : card.tone === 'amber'
                            ? 'from-amber-50 to-amber-100 text-amber-600'
                            : 'from-violet-50 to-violet-100 text-violet-600'
                    }`}
                  >
                    <card.icon className="h-5 w-5" />
                  </span>
                  <div className="flex items-baseline gap-1">
                    <AnimatedNumber value={card.value} className="text-3xl font-extrabold tracking-tight text-slate-900" />
                    {card.label === 'Trust Score' && (
                      <span className="text-sm font-semibold text-slate-400">/100</span>
                    )}
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Section title="Recently borrowed" linkTo="/borrowings" linkLabel="All borrowings" count={data.recentBorrowed.length} icon={ArrowDownToLine}>
                {data.recentBorrowed.length === 0 ? (
                  <EmptyState
                    title="Nothing borrowed yet"
                    description="Explore items shared by your campus and start borrowing."
                    icon={ArrowDownToLine}
                    action={<Link to="/discover" className="btn-primary">Explore Items</Link>}
                  />
                ) : (
                  <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/70 bg-white">
                    {data.recentBorrowed.map((item) => (
                      <Link
                        key={item._id}
                        to={`/items/${item.itemId?._id}`}
                        className="group flex items-center gap-4 px-4 py-3.5 transition hover:bg-primary-50/40"
                      >
                        {formatImagePath(item.itemId?.images?.[0]) ? (
                          <img
                            src={formatImagePath(item.itemId?.images?.[0])}
                            alt={item.itemId?.name}
                            className="h-12 w-12 shrink-0 rounded-xl object-cover ring-1 ring-slate-100"
                            loading="lazy"
                          />
                        ) : (
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                            <Package className="h-5 w-5" />
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-900">{item.itemId?.name || 'Item'}</p>
                          <p className="truncate text-xs text-slate-500">from {item.ownerId?.name || '—'}</p>
                        </div>
                        <StatusBadge status={item.status} />
                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-primary-600" />
                      </Link>
                    ))}
                  </div>
                )}
              </Section>

              <Section title="Recently listed by you" linkTo="/lending" linkLabel="All lending" count={data.recentListed.length} icon={Package}>
                {data.recentListed.length === 0 ? (
                  <EmptyState
                    title="You haven't listed items yet"
                    description="Share something you own so others can borrow it at no cost."
                    icon={Package}
                    action={<Link to="/items/new" className="btn-secondary">Add your first item</Link>}
                  />
                ) : (
                  <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/70 bg-white">
                    {data.recentListed.map((item) => (
                      <Link
                        key={item._id}
                        to={`/items/${item._id}`}
                        className="group flex items-center gap-4 px-4 py-3.5 transition hover:bg-primary-50/40"
                      >
                        {formatImagePath(item.images?.[0]) ? (
                          <img
                            src={formatImagePath(item.images?.[0])}
                            alt={item.name}
                            className="h-12 w-12 shrink-0 rounded-xl object-cover ring-1 ring-slate-100"
                            loading="lazy"
                          />
                        ) : (
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                            <Package className="h-5 w-5" />
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-900">{item.name}</p>
                          <p className="truncate text-xs text-slate-500">{item.location}</p>
                        </div>
                        <StatusBadge status={item.status} />
                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-primary-600" />
                      </Link>
                    ))}
                  </div>
                )}
              </Section>
            </div>

            <div className="space-y-6">
              <Section title="Activity timeline" linkTo="/notifications" linkLabel="View all" count={timeline.length} icon={Sparkles}>
                {timeline.length === 0 ? (
                  <EmptyState
                    title="No activity yet"
                    description="Borrowings, listings, requests and alerts will show up here as they happen."
                    icon={Sparkles}
                  />
                ) : (
                  <div className="space-y-5">
                    {timeline.map((event, i) => (
                      <div key={event.id} className="relative flex items-start gap-3.5">
                        {i < timeline.length - 1 && (
                          <span aria-hidden="true" className="absolute -bottom-6 left-[15px] top-10 w-px bg-slate-200" />
                        )}
                        <span className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${event.chip} ring-4 ring-white`}>
                          <event.icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1 pt-0.5">
                          <p className="text-sm font-semibold text-slate-900">{event.title}</p>
                          <p className="mt-0.5 truncate text-xs text-slate-500">{event.meta}</p>
                          <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                            <Clock className="h-3 w-3" /> {timeAgo(event.time)}
                          </p>
                        </div>
                        <span aria-hidden="true" className={`mt-2 h-2 w-2 shrink-0 rounded-full ${event.dot} animate-pulse-soft`} />
                      </div>
                    ))}
                  </div>
                )}
              </Section>

              <Section title="Pending requests" linkTo="/requests" linkLabel="Manage" count={data.pendingList.length} icon={Inbox}>
                {data.pendingList.length === 0 ? (
                  <EmptyState
                    title="No pending requests"
                    description="When someone wants to borrow your item, their request will appear here."
                    icon={Inbox}
                  />
                ) : (
                  <div className="space-y-2.5">
                    {data.pendingList.map((req) => (
                      <Link
                        key={req._id}
                        to="/requests"
                        className="group flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white p-3 transition hover:border-primary-200 hover:shadow-soft"
                      >
                        <Avatar user={req.borrowerId} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-900">{req.borrowerId?.name}</p>
                          <p className="truncate text-xs text-slate-500">wants {req.itemId?.name}</p>
                        </div>
                        <StatusBadge status={req.status} />
                      </Link>
                    ))}
                  </div>
                )}
              </Section>
            </div>
          </div>

          <div className="mt-8">
            <Reveal>
              <div className="surface-section p-5 sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
                      <MapPin className="h-4 w-4" />
                    </span>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">Available near you</h2>
                      <p className="text-xs text-slate-500">Fresh drops from your campus community</p>
                    </div>
                    <span className="badge bg-slate-900 text-white">{data.recommended.length}</span>
                  </div>
                  <Link to="/discover" className="inline-flex shrink-0 items-center gap-0.5 text-sm font-medium text-primary-600 hover:text-primary-700">
                    Discover more <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                {data.recommended.length === 0 ? (
                  <EmptyState
                    title="Nothing near you yet"
                    description="Check back soon — available items shared by your campus will appear here."
                    icon={Search}
                    action={<Link to="/discover" className="btn-secondary">Browse all items</Link>}
                  />
                ) : (
                  <div className="-mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-2">
                    {data.recommended.map((item) => (
                      <Link
                        key={item._id}
                        to={`/items/${item._id}`}
                        className="group w-60 shrink-0 snap-start overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card transition hover:-translate-y-1 hover:shadow-lift"
                      >
                        {formatImagePath(item.images?.[0]) ? (
                          <img
                            src={formatImagePath(item.images?.[0])}
                            alt={item.name}
                            className="h-28 w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-28 w-full items-center justify-center bg-slate-100 text-slate-300">
                            <Package className="h-8 w-8" />
                          </div>
                        )}
                        <div className="p-3.5">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-semibold text-slate-900">{item.name}</p>
                            <StatusBadge status={item.status} />
                          </div>
                          <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                            <MapPin className="h-3 w-3" /> {item.location}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </Reveal>
          </div>
        </>
      )}
    </div>
  );
}

function DashboardSearch() {
  const navigate = useNavigate();
  return (
    <SearchBar
      placeholder="What are you looking for today?"
      size="lg"
      onSubmit={(value) => navigate(value ? `/discover?q=${encodeURIComponent(value)}` : '/discover')}
      className="max-w-2xl"
    />
  );
}

function Section({ title, linkTo, linkLabel, count, icon: Icon, children }) {
  return (
    <section className="surface-section p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Icon className="h-4 w-4" />
            </span>
          )}
          <h2 className="text-sm font-bold text-slate-900">{title}</h2>
          {count !== undefined && (
            <span className="badge bg-primary-50 text-primary-700 ring-primary-100">{count}</span>
          )}
        </div>
        <Link to={linkTo} className="inline-flex shrink-0 items-center gap-0.5 text-sm font-medium text-primary-600 hover:text-primary-700">
          {linkLabel} <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      {children}
    </section>
  );
}