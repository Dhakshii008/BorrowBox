import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowUpFromLine,
  Plus,
  Pencil,
  Trash2,
  Inbox,
  CheckCircle2,
  Package,
  History,
  Clock,
  MapPin,
  Sparkles,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import {
  PageHeader,
  Avatar,
  StatusBadge,
  EmptyState,
  ErrorState,
  PageLoader,
  ConfirmDialog,
  ButtonLoader,
  RatingStars,
  StatCard,
} from '../components/index.js';
import { getError, formatDate, formatImagePath } from '../utils/format.js';

export default function MyLending() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    setLoading(true);
    setError('');
    Promise.all([
      api.get(`/items?owner=${user.id}&status=all`),
      api.get('/transactions/owned'),
    ])
      .then(([itemRes, txRes]) => {
        setItems(itemRes.data.items);
        setTransactions(txRes.data.transactions);
      })
      .catch((err) => setError(getError(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [user?.id]);

  const confirmReturn = async (tx) => {
    setBusyId(tx._id);
    try {
      const res = await api.put(`/transactions/${tx._id}/confirm-return`);
      toast.success(res.data.message, 'Return confirmed');
      load();
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await api.delete(`/items/${deleteTarget._id}`);
      toast.success(res.data.message);
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(getError(err));
    }
  };

  const activeTxns = transactions.filter((t) => ['BORROWED', 'RETURN_REQUESTED'].includes(t.status));
  const history = transactions.filter((t) => t.status === 'RETURNED');

  const available = items.filter((i) => i.status === 'AVAILABLE');
  const reserved = items.filter((i) => i.status === 'RESERVED');

  const returnRequested = activeTxns.filter((t) => t.status === 'RETURN_REQUESTED');
  const borrowed = activeTxns.filter((t) => t.status === 'BORROWED');

  if (loading) return <PageLoader />;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="My Lending"
        subtitle="The items you share with your campus community."
        action={
          <Link to="/items/new" className="btn-primary">
            <Plus className="h-4 w-4" /> Add Item
          </Link>
        }
      />

      {error && <ErrorState message={error} onRetry={load} />}

      {!error && (
        <div className="space-y-12">
          <section>
            <div className="mb-4 flex items-center gap-2">
              <span className="eyebrow">Lending totals</span>
              <span className="h-px flex-1 bg-gradient-to-r from-primary-200/80 to-transparent" />
            </div>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard
                icon={Package}
                label="Total lent"
                value={transactions.length}
                sub={`${history.length} completed`}
                tone="primary"
              />
              <StatCard
                icon={ShieldCheck}
                label="Items shared"
                value={items.length}
                sub={`${available.length} available now`}
                tone="accent"
              />
              <StatCard
                icon={Clock}
                label="Reserved"
                value={reserved.length}
                sub="awaiting handover"
                tone="amber"
              />
              <StatCard
                icon={History}
                label="Returns completed"
                value={history.length}
                sub="verified this cycle"
                tone="violet"
              />
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-accent-50 to-emerald-50 text-accent-600 ring-1 ring-inset ring-accent-100">
                <Package className="h-4 w-4" />
              </span>
              <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">My Items</h2>
              <span className="badge bg-slate-100 text-slate-600 ring-1 ring-slate-200">{available.length}</span>
              <span className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent" />
            </div>
            {available.length === 0 ? (
              <EmptyState
                title="Nothing available to lend"
                description="Add an item so other students can borrow it for free."
                icon={Package}
                action={<Link to="/items/new" className="btn-primary"><Plus className="h-4 w-4" /> Add Item</Link>}
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {available.map((item) => (
                  <LendingCard
                    key={item._id}
                    item={item}
                    onEdit={() => navigate(`/items/${item._id}/edit`)}
                    onDelete={() => setDeleteTarget(item)}
                    onRequests={() => navigate('/requests')}
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 text-amber-600 ring-1 ring-inset ring-amber-100">
                <Clock className="h-4 w-4" />
              </span>
              <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">Reserved</h2>
              <span className="badge bg-amber-50 text-amber-700 ring-1 ring-amber-200">{reserved.length}</span>
              <span className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent" />
            </div>
            {reserved.length === 0 ? (
              <EmptyState title="No reserved items" description="When you accept a request, the item becomes reserved until handover." icon={Clock} />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {reserved.map((item) => (
                  <ReserveCard
                    key={item._id}
                    item={item}
                    onEdit={() => navigate(`/items/${item._id}/edit`)}
                    onDelete={() => setDeleteTarget(item)}
                    onRequests={() => navigate('/requests')}
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary-50 to-violet-50 text-primary-600 ring-1 ring-inset ring-primary-100">
                <ArrowUpFromLine className="h-4 w-4" />
              </span>
              <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">Lent out & returns</h2>
              <span className="badge bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200">{activeTxns.length}</span>
              <span className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent" />
            </div>
            {activeTxns.length === 0 ? (
              <EmptyState title="Nothing lent out right now" description="Borrowed items and return requests will appear here." icon={ArrowUpFromLine} />
            ) : (
              <div className="space-y-4">
                {returnRequested.map((tx) => (
                  <AvailTxCard
                    key={tx._id}
                    tx={tx}
                    highlight
                    action={
                      <button
                        onClick={() => confirmReturn(tx)}
                        disabled={busyId === tx._id}
                        className="btn-accent shadow-glow-accent"
                      >
                        {busyId === tx._id ? <ButtonLoader /> : <><CheckCircle2 className="h-4 w-4" /> Confirm Return</>}
                      </button>
                    }
                  />
                ))}
                {borrowed.map((tx) => (
                  <AvailTxCard key={tx._id} tx={tx} />
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 ring-1 ring-inset ring-slate-200">
                <History className="h-4 w-4" />
              </span>
              <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">Completed lending</h2>
              <span className="badge bg-slate-100 text-slate-600 ring-1 ring-slate-200">{history.length}</span>
              <span className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent" />
            </div>
            {history.length === 0 ? (
              <EmptyState title="No completed lending yet" description="Your lending history will appear here once items are returned." icon={History} />
            ) : (
              <div className="space-y-4">
                {history.map((tx) => (
                  <AvailTxCard key={tx._id} tx={tx} done />
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove item"
        message={`Remove "${deleteTarget?.name}" from your lending list? Pending requests will be cancelled.`}
        confirmLabel="Remove"
        danger
      />
    </div>
  );
}

function LendingCard({ item, onEdit, onDelete, onRequests }) {
  return (
    <div className="group card overflow-hidden card-hover">
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
        {item.images?.[0] && (
          <img
            src={formatImagePath(item.images[0])}
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-900/25 to-transparent" />
        <div className="absolute left-3 top-3">
          <span className="badge bg-white/85 !text-accent-700 shadow-soft backdrop-blur-sm ring-accent-200">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-500" /> Available
          </span>
        </div>
        <div className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/85 text-amber-500 shadow-soft backdrop-blur-sm">
          <Sparkles className="h-4 w-4" />
        </div>
      </div>
      <div className="p-4">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary-600">{item.category}</p>
        <h3 className="mt-1 text-sm font-semibold text-slate-900">{item.name}</h3>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
          <MapPin className="h-3 w-3" /> {item.location} · <span className="font-medium text-slate-600">{item.condition}</span>
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button onClick={onEdit} className="btn-secondary !px-2 !py-2 text-xs">
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
          <button onClick={onDelete} className="btn-secondary !px-2 !py-2 text-xs !text-red-600">
            <Trash2 className="h-3.5 w-3.5" /> Remove
          </button>
          <button onClick={onRequests} className="btn-primary-soft col-span-2 !px-2 !py-2 text-xs">
            <Inbox className="h-3.5 w-3.5" /> View Requests
          </button>
        </div>
      </div>
    </div>
  );
}

function ReserveCard({ item, onEdit, onDelete, onRequests }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-5 shadow-soft transition hover:-translate-y-1 hover:shadow-lift">
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-200/40 blur-2xl" />
      <div className="flex items-start gap-3">
        <img
          src={formatImagePath(item.images?.[0]) || ''}
          alt={item.name}
          className="h-14 w-14 shrink-0 rounded-xl object-cover ring-1 ring-amber-200/70"
          onError={(e) => {
            e.currentTarget.src = '';
            e.currentTarget.classList.add('bg-amber-100');
          }}
        />
        <div className="min-w-0 flex-1">
          <span className="badge bg-amber-100 text-amber-700 ring-1 ring-amber-200">
            <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-amber-500" /> Reserved
          </span>
          <h3 className="mt-1.5 truncate text-sm font-semibold text-slate-900">{item.name}</h3>
          <p className="mt-0.5 text-xs text-slate-500">{item.location} · {item.condition}</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button onClick={onEdit} className="btn-secondary !px-2 !py-2 text-xs">
          <Pencil className="h-3.5 w-3.5" /> Edit
        </button>
        <button onClick={onDelete} className="btn-secondary !px-2 !py-2 text-xs !text-red-600">
          <Trash2 className="h-3.5 w-3.5" /> Remove
        </button>
        <button onClick={onRequests} className="btn-accent col-span-2 !px-2 !py-2 text-xs">
          <Inbox className="h-3.5 w-3.5" /> Review Reservation
        </button>
      </div>
    </div>
  );
}

function AvailTxCard({ tx, highlight = false, action, done = false }) {
  const borrower = tx.borrowerId;
  const item = tx.itemId;
  const overdue = tx.expectedReturnDate && new Date(tx.expectedReturnDate).getTime() < Date.now() && tx.status === 'BORROWED';

  return (
    <div className={`relative flex flex-col gap-3 rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-lift sm:flex-row sm:items-center ${
      highlight
        ? 'border-indigo-200 bg-gradient-to-r from-indigo-50/70 to-white shadow-soft'
        : done
          ? 'border-slate-200/80 bg-white shadow-soft'
          : 'border-slate-200/80 bg-white shadow-card'
    }`}>
      {highlight && (
        <span className="absolute -left-px top-6 bottom-6 w-1 rounded-full bg-gradient-to-b from-primary-400 to-accent-400" />
      )}
      <img
        src={formatImagePath(item?.images?.[0]) || ''}
        alt={item?.name}
        className="h-16 w-16 shrink-0 rounded-xl object-cover bg-slate-100 ring-1 ring-slate-900/5"
        onError={(e) => {
          e.currentTarget.src = '';
          e.currentTarget.classList.add('bg-slate-100');
        }}
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-slate-900">{item?.name}</p>
          <StatusBadge status={tx.status} />
          {overdue && (
            <span className="badge bg-red-50 text-red-700 ring-1 ring-red-200"><RotateCcw className="h-3 w-3" /> Overdue</span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          {borrower && (
            <span className="inline-flex items-center gap-1.5">
              <Avatar user={borrower} size="xs" />
              <b className="font-medium text-slate-700">{borrower?.name || '—'}</b>
              <RatingStars rating={borrower?.rating} size={11} />
            </span>
          )}
          <span>
            {tx.borrowedAt ? `Borrowed ${formatDate(tx.borrowedAt)}` : 'Requested'} ·
            {tx.expectedReturnDate ? ` Due ${formatDate(tx.expectedReturnDate)}` : ''}
          </span>
          {tx.returnedAt ? ` · Returned ${formatDate(tx.returnedAt)}` : ''}
        </div>
      </div>
      {action || (
        done ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-accent-600">
            <CheckCircle2 className="h-4 w-4" /> Returned
          </span>
        ) : (
          <span className="shrink-0 text-xs font-medium text-slate-400">In use</span>
        )
      )}
    </div>
  );
}