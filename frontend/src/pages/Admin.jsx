import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Package,
  ArrowRightLeft,
  CheckCircle2,
  Inbox,
  Flag,
  Trash2,
  Search,
  TrendingUp,
  ShieldCheck,
  ArrowUpRight,
  Activity,
  PieChart,
} from 'lucide-react';
import api from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import {
  PageHeader,
  StatCard,
  EmptyState,
  ErrorState,
  Skeleton,
  TimelineSkeleton,
  StatsSkeleton,
  StatusBadge,
  Avatar,
  ConfirmDialog,
  AnimatedNumber,
  PageTransition,
  Reveal,
  LineChart,
  Donut,
  BarMini,
} from '../components/index.js';
import { getError, formatDate, formatImagePath } from '../utils/format.js';
import { CATEGORIES } from '../utils/constants.js';

const tabs = [
  { value: 'stats', label: 'Overview' },
  { value: 'users', label: 'Users' },
  { value: 'items', label: 'Items' },
  { value: 'transactions', label: 'Transactions' },
  { value: 'reports', label: 'Reports' },
];

const dayKey = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

export default function Admin() {
  const toast = useToast();
  const [tab, setTab] = useState('stats');
  const [data, setData] = useState(null);
  const [lists, setLists] = useState({ users: [], items: [], transactions: [], reports: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removeTarget, setRemoveTarget] = useState(null);
  const [search, setSearch] = useState('');

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [stats, users, items, transactions, reports] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/items?status=all'),
        api.get('/admin/transactions'),
        api.get('/admin/reports?status=all'),
      ]);
      setData(stats.data);
      setLists({ users: users.data.users, items: items.data.items, transactions: transactions.data.transactions, reports: reports.data.reports });
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const removeItem = async () => {
    try {
      await api.delete(`/admin/items/${removeTarget._id}`);
      toast.success(`Removed "${removeTarget.name}" from the platform.`);
      setRemoveTarget(null);
      loadAll();
    } catch (err) {
      toast.error(getError(err));
    }
  };

  const resolveReport = async (id) => {
    try {
      await api.put(`/admin/reports/${id}/resolve`);
      toast.success('Report resolved.');
      loadAll();
    } catch (err) {
      toast.error(getError(err));
    }
  };

  if (loading && !data) return <AdminSkeleton tab={tab} />;

  if (error) return <ErrorState message={error} onRetry={loadAll} />;

  const cards = data
    ? [
        { icon: Users, label: 'Total Users', value: data.stats.totalUsers, tone: 'primary' },
        { icon: Package, label: 'Total Items', value: data.stats.totalItems, tone: 'accent' },
        { icon: ArrowRightLeft, label: 'Active Borrowings', value: data.stats.activeBorrowings, tone: 'amber' },
        { icon: CheckCircle2, label: 'Completed Transactions', value: data.stats.completedTransactions, tone: 'violet' },
        { icon: Inbox, label: 'Pending Requests', value: data.stats.pendingRequests, tone: 'slate' },
        { icon: Flag, label: 'Reported Issues', value: data.stats.reportedIssues, tone: 'amber' },
      ]
    : [];

  const heroStats = [
    { icon: Users, label: 'Active members', value: data.stats.totalUsers },
    { icon: Package, label: 'Items on the platform', value: data.stats.totalItems },
    { icon: CheckCircle2, label: 'Completed transactions', value: data.stats.completedTransactions },
  ];

  const queueStats = [
    { icon: Flag, label: 'Open reports', value: data.stats.openReports, tone: 'bg-red-50 text-red-600' },
    { icon: Inbox, label: 'Pending requests', value: data.stats.pendingRequests, tone: 'bg-amber-50 text-amber-600' },
    { icon: Activity, label: 'Reported issues', value: data.stats.reportedIssues, tone: 'bg-slate-100 text-slate-600' },
  ];

  const trendDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return dayKey(d);
  });
  const userTrend = trendDays.map((day) => lists.users.filter((u) => u.createdAt && dayKey(new Date(u.createdAt)) === day).length);

  const txnStatus = lists.transactions.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});
  const donutSegments = [
    { label: 'Borrowed', value: txnStatus.BORROWED || 0, color: '#10B981' },
    { label: 'Return requested', value: txnStatus.RETURN_REQUESTED || 0, color: '#6366F1' },
    { label: 'Returned', value: txnStatus.RETURNED || 0, color: '#CBD5E1' },
  ].filter((s) => s.value > 0);

  const catCounts = lists.items.reduce((acc, it) => {
    acc[it.category] = (acc[it.category] || 0) + 1;
    return acc;
  }, {});
  const catPalette = ['#6366F1', '#10B981', '#F59E0B', '#8B5CF6', '#94A3B8'];
  const catRows = CATEGORIES.filter((c) => catCounts[c] > 0).map((c, i) => ({
    label: c,
    value: catCounts[c],
    color: catPalette[i % catPalette.length],
  }));

  return (
    <PageTransition>
      <div className="mx-auto max-w-6xl">
        <PageHeader title="Admin" subtitle="Platform control center — overview, moderation and growth." />

        <div className="mb-6 inline-flex flex-wrap gap-1 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-sm">
          {tabs.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                tab === t.value ? 'bg-slate-900 text-white shadow-soft' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'stats' && (
          <>
            <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-6 text-white shadow-lift sm:p-8">
              <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary-600/25 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 right-40 h-48 w-48 rounded-full bg-accent-500/20 blur-3xl" />
              <div className="relative">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-300">Enterprise overview</p>
                <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-3">
                  {heroStats.map((h) => (
                    <div key={h.label} className="rounded-2xl bg-white/[0.06] p-4 ring-1 ring-inset ring-white/10">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-primary-200">
                        <h.icon className="h-5 w-5" />
                      </span>
                      <p className="mt-3 text-3xl font-bold tracking-tight">
                        <AnimatedNumber value={h.value} />
                      </p>
                      <p className="text-sm text-slate-300">{h.label}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-200 ring-1 ring-inset ring-red-400/30">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                    {data.stats.openReports} open {data.stats.openReports === 1 ? 'report' : 'reports'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 ring-1 ring-inset ring-white/10">
                    <TrendingUp className="h-3.5 w-3.5" /> {lists.users.length} members loaded
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
              {cards.map((c) => <StatCard key={c.label} {...c} />)}
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Reveal className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">New member signups</h3>
                    <p className="text-xs text-slate-400">Trailing 7 days · counted from live records</p>
                  </div>
                  <span className="badge bg-primary-50 text-primary-700 ring-1 ring-primary-200">
                    <TrendingUp className="h-3.5 w-3.5" /> Daily
                  </span>
                </div>
                <div className="mt-5">
                  {lists.users.length < 2 ? (
                    <div className="py-12 text-center text-sm text-slate-400">
                      Member records are still sparse — the trend line fills in as students join.
                    </div>
                  ) : (
                    <>
                      <LineChart data={userTrend} height={150} stroke="#6366F1" label="Member signups" />
                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                        <span>7 days ago</span>
                        <span>{userTrend.reduce((a, b) => a + b, 0)} new record{userTrend.reduce((a, b) => a + b, 0) === 1 ? '' : 's'}</span>
                        <span>today</span>
                      </div>
                    </>
                  )}
                </div>
              </Reveal>

              <Reveal delay={0.05} className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Transactions by status</h3>
                    <p className="text-xs text-slate-400">{lists.transactions.length} total records</p>
                  </div>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                    <PieChart className="h-5 w-5" />
                  </span>
                </div>
                {lists.transactions.length === 0 ? (
                  <div className="py-12 text-center text-sm text-slate-400">
                    No transactions yet — the donut will populate as activity begins.
                  </div>
                ) : (
                  <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row">
                    <Donut
                      segments={donutSegments}
                      size={170}
                      thickness={20}
                      centerValue={lists.transactions.length}
                      centerLabel="total"
                    />
                    <div className="w-full space-y-3">
                      {donutSegments.map((s) => (
                        <div key={s.label} className="flex items-center gap-2.5 text-sm">
                          <span className="h-3 w-3 rounded-full" style={{ background: s.color }} />
                          <span className="text-slate-600">{s.label}</span>
                          <span className="ml-auto rounded-lg bg-slate-50 px-2 py-0.5 font-bold text-slate-900">{s.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Reveal>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Reveal className="card p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">Items by category</h3>
                  <span className="badge bg-accent-50 text-accent-700 ring-1 ring-accent-200">
                    <Package className="h-3.5 w-3.5" /> {lists.items.length} listed
                  </span>
                </div>
                <div className="mt-5">
                  {lists.items.length === 0 ? (
                    <div className="py-12 text-center text-sm text-slate-400">
                      Items haven't been listed yet — the category breakdown will appear here.
                    </div>
                  ) : (
                    <BarMini rows={catRows} />
                  )}
                </div>
              </Reveal>

              <Reveal delay={0.05} className="surface-section p-6">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary-600" />
                  <h3 className="text-sm font-semibold text-slate-900">Moderation queue</h3>
                </div>
                <div className="mt-4 space-y-3">
                  {queueStats.map((q) => (
                    <div key={q.label} className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/80 p-4">
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${q.tone}`}>
                        <q.icon className="h-5 w-5" />
                      </span>
                      <div className="flex-1">
                        <p className="text-lg font-bold leading-tight text-slate-900">
                          <AnimatedNumber value={q.value} />
                        </p>
                        <p className="text-xs font-medium text-slate-500">{q.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => setTab('reports')} className="btn-primary-soft mt-5 w-full">
                  Review reports <ArrowUpRight className="h-4 w-4" />
                </button>
              </Reveal>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="card p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">Newest members</h3>
                  <button onClick={() => setTab('users')} className="btn-ghost !py-1.5 text-xs">
                    View all <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="space-y-2.5">
                  {data.recentUsers.length === 0 && (
                    <p className="py-6 text-center text-sm text-slate-400">No members yet.</p>
                  )}
                  {data.recentUsers.map((u) => (
                    <div key={u.id} className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-slate-50">
                      <Avatar user={u} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800">{u.name}</p>
                        <p className="truncate text-xs text-slate-400">{u.email}</p>
                      </div>
                      <span className={`badge ${u.role === 'admin' ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200' : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'}`}>
                        {u.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">Recent transactions</h3>
                  <button onClick={() => setTab('transactions')} className="btn-ghost !py-1.5 text-xs">
                    View all <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="space-y-2.5">
                  {data.recentTransactions.length === 0 && (
                    <p className="py-6 text-center text-sm text-slate-400">No transactions yet.</p>
                  )}
                  {data.recentTransactions.map((t) => (
                    <div key={t._id} className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-slate-50">
                      {t.itemId?.images?.[0] ? (
                        <img src={formatImagePath(t.itemId.images[0])} alt="" className="h-9 w-9 rounded-lg object-cover ring-1 ring-slate-200" />
                      ) : (
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
                          <Package className="h-4 w-4" />
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800">{t.itemId?.name}</p>
                        <p className="text-xs text-slate-400">by {t.borrowerId?.name}</p>
                      </div>
                      <StatusBadge status={t.status} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {tab === 'users' && (
          <div className="card overflow-hidden">
            <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                    <Users className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">All members</h3>
                    <p className="text-xs text-slate-400">{lists.users.length} registered</p>
                  </div>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input className="input !pl-9 max-w-xs" placeholder="Search name or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
              </div>
            </div>
            <UserTable users={lists.users.filter((u) => !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))} />
          </div>
        )}

        {tab === 'items' && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lists.items.length === 0 && <EmptyState title="No items" message="Students haven't listed anything yet." icon={Package} />}
            {lists.items.map((item) => (
              <Reveal key={item._id} className="card group overflow-hidden">
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                  {item.images?.[0] && <img src={formatImagePath(item.images[0])} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent" />
                  <div className="absolute left-3 top-3"><StatusBadge status={item.status} /></div>
                  <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-700 backdrop-blur">
                    {item.category}
                  </span>
                </div>
                <div className="p-4">
                  <p className="truncate text-sm font-semibold text-slate-900">{item.name}</p>
                  <p className="truncate text-xs text-slate-500">by {item.ownerId?.name}</p>
                  <div className="mt-3 flex gap-2">
                    <Link to={`/items/${item._id}`} className="btn-secondary flex-1 !py-2 text-xs">View</Link>
                    <button onClick={() => setRemoveTarget(item)} className="btn-secondary flex-1 !py-2 text-xs !text-red-600 hover:!border-red-200 hover:!bg-red-50">
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        )}

        {tab === 'transactions' && (
          <div className="card overflow-hidden">
            <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <ArrowRightLeft className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Transaction ledger</h3>
                <p className="text-xs text-slate-400">{lists.transactions.length} transactions on record</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Item</th>
                    <th className="px-4 py-3 font-semibold">Borrower</th>
                    <th className="px-4 py-3 font-semibold">Borrowed</th>
                    <th className="px-4 py-3 font-semibold">Due</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {lists.transactions.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">No transactions yet.</td></tr>
                  )}
                  {lists.transactions.map((t) => (
                    <tr key={t._id} className="transition hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {t.itemId?.images?.[0] ? (
                            <img src={formatImagePath(t.itemId.images[0])} alt="" className="h-9 w-9 rounded-lg object-cover ring-1 ring-slate-200" />
                          ) : (
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
                              <Package className="h-4 w-4" />
                            </span>
                          )}
                          <span className="font-medium text-slate-800">{t.itemId?.name || '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{t.borrowerId?.name || '—'}</td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(t.borrowedAt)}</td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(t.expectedReturnDate)}</td>
                      <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'reports' && (
          <div className="space-y-3">
            {lists.reports.length === 0 && (
              <EmptyState title="No reported issues" message="The community is in good shape." icon={Flag} />
            )}
            {lists.reports.map((report) => (
              <div key={report._id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500">
                  <Flag className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">
                    Report on {report.targetType}
                    <span className="ml-2 text-xs font-medium normal-case text-slate-400">#{String(report._id).slice(-5)}</span>
                  </p>
                  <p className="text-sm text-slate-600">{report.reason}</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    by {report.reporterId?.name} · {formatDate(report.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge status={report.status} />
                  {report.status === 'OPEN' && (
                    <button onClick={() => resolveReport(report._id)} className="btn-accent !py-2 text-xs">
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <ConfirmDialog
          open={Boolean(removeTarget)}
          onClose={() => setRemoveTarget(null)}
          onConfirm={removeItem}
          title="Remove item"
          message={`Remove "${removeTarget?.name}" listed by ${removeTarget?.ownerId?.name || 'a student'}? This cannot be undone.`}
          confirmLabel="Remove item"
          danger
        />
      </div>
    </PageTransition>
  );
}

function AdminSkeleton({ tab }) {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 space-y-2">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="mb-5 flex gap-1 rounded-2xl border border-slate-200/80 bg-white p-1.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-20 rounded-xl" />
        ))}
      </div>
      {tab === 'stats' ? (
        <>
          <Skeleton className="h-44 rounded-3xl" />
          <StatsSkeleton count={6} />
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="card p-6">
              <Skeleton className="mb-4 h-4 w-36" />
              <Skeleton className="h-40 w-full" />
            </div>
            <div className="card p-6">
              <Skeleton className="mb-4 h-4 w-36" />
              <div className="flex flex-col items-center gap-6 sm:flex-row">
                <Skeleton className="h-40 w-40 rounded-full" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="card p-6">
              <Skeleton className="mb-4 h-4 w-36" />
              <TimelineSkeleton />
            </div>
            <div className="card p-6">
              <Skeleton className="mb-4 h-4 w-40" />
              <TimelineSkeleton />
            </div>
          </div>
        </>
      ) : (
        <div className="card overflow-hidden p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-9 w-56" />
          </div>
          <TimelineSkeleton />
        </div>
      )}
    </div>
  );
}

function UserTable({ users }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
          <tr>
            <th className="px-4 py-3 font-semibold">User</th>
            <th className="px-4 py-3 font-semibold">Department</th>
            <th className="px-4 py-3 font-semibold">Role</th>
            <th className="px-4 py-3 font-semibold">Trust</th>
            <th className="px-4 py-3 font-semibold">Joined</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {users.length === 0 && (
            <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">No users found.</td></tr>
          )}
          {users.map((u) => (
            <tr key={u.id} className="transition hover:bg-slate-50/60">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar user={u} size="sm" />
                  <div>
                    <p className="font-medium text-slate-800">{u.name}</p>
                    <p className="text-xs text-slate-400">{u.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-slate-600">{u.department || '—'}</td>
              <td className="px-4 py-3">
                <span className={`badge ${u.role === 'admin' ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200' : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'}`}>
                  {u.role}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                  <ShieldCheck className="h-3.5 w-3.5 text-accent-600" /> {u.trustScore}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-500">{formatDate(u.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}