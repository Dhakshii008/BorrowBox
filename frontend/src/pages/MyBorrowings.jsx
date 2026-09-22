import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownToLine,
  Package,
  QrCode,
  Undo2,
  Clock,
  CheckCircle2,
  Star,
  Check,
  ShieldCheck,
  CalendarClock,
  X,
  Sparkles,
} from 'lucide-react';
import api from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import {
  PageHeader,
  Avatar,
  StatusBadge,
  EmptyState,
  ErrorState,
  PageLoader,
  Modal,
  ButtonLoader,
  ProgressBar,
  RatingInput,
} from '../components/index.js';
import QrScanner from '../components/QrScanner.jsx';
import { extractHandoverToken } from '../utils/handover.js';
import { getError, formatDate, formatImagePath } from '../utils/format.js';

const LIFECYCLE_STEPS = [
  { key: 'PENDING', label: 'Requested' },
  { key: 'ACCEPTED', label: 'Accepted' },
  { key: 'BORROWED', label: 'Borrowed' },
  { key: 'RETURNED', label: 'Returned' },
];

function lifecycleIndex(status) {
  if (status === 'RETURN_REQUESTED') return 2;
  const i = LIFECYCLE_STEPS.findIndex((s) => s.key === status);
  return i >= 0 ? i : 0;
}

function dueInfo(expectedReturnDate) {
  if (!expectedReturnDate) return null;
  const diff = new Date(expectedReturnDate).getTime() - Date.now();
  if (diff < 0) return { label: 'Overdue', cls: 'bg-red-50 text-red-700 ring-1 ring-red-200' };
  const days = Math.ceil(diff / 86400000);
  if (days <= 1) {
    const hours = Math.max(1, Math.ceil(diff / 3600000));
    return { label: `${hours}h left`, cls: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' };
  }
  return { label: `${days}d left`, cls: 'bg-accent-50 text-accent-700 ring-1 ring-accent-200' };
}

export default function MyBorrowings() {
  const toast = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [reviewTarget, setReviewTarget] = useState(null);

  const load = () => {
    setLoading(true);
    setError('');
    api
      .get('/borrow-requests/my')
      .then((reqRes) => {
        const requests = reqRes.data.requests;
        return api.get('/transactions/my').then((txRes) => {
          const txns = txRes.data.transactions;
          const byRequest = {};
          txns.forEach((t) => {
            byRequest[t.requestId?._id || t.requestId] = t;
          });
          return requests
            .map((r) => ({ ...r, transaction: byRequest[r._id] || null }))
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        });
      })
      .then((merged) => {
        setRequests(merged);
        return api.get('/reviews/mine');
      })
      .then((revRes) => {
        const reviewedIds = new Set(revRes.data.reviews.map((rev) => String(rev.transactionId?._id || rev.transactionId || '')));
        setRequests((prev) =>
          prev.map((r) => ({
            ...r,
            reviewedByMe: Boolean(r.transaction && reviewedIds.has(String(r.transaction._id))),
          }))
        );
      })
      .catch((err) => setError(getError(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const requestReturn = async (requestId, transactionId) => {
    setBusyId(transactionId || requestId);
    try {
      const res = await api.post(`/transactions/${transactionId}/request-return`);
      toast.success(res.data.message, 'Return requested');
      load();
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setBusyId(null);
    }
  };

  const active = requests.filter((r) => ['BORROWED', 'RETURN_REQUESTED'].includes(r.status));
  const pending = requests.filter((r) => ['PENDING', 'ACCEPTED'].includes(r.status));
  const completed = requests.filter((r) => ['RETURNED', 'DECLINED'].includes(r.status));

  if (loading) return <PageLoader />;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="My Borrowings"
        subtitle="Every item you've borrowed from your campus community."
      />

      {error && <ErrorState message={error} onRetry={load} />}

      {!error && (
        <div className="space-y-12">
          <BorrowSection
            title="Currently borrowing"
            icon={ArrowDownToLine}
            requests={active}
            emptyMessage="You don't have any active borrowings right now."
            emptyAction={<Link to="/discover" className="btn-secondary">Discover items</Link>}
            rail
            renderActions={(r) => (
              <ActionBar>
                <span className="badge bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200">{statusLabel(r.status)}</span>
                {r.status === 'BORROWED' && (
                  <button
                    onClick={() => requestReturn(r._id, r.transaction?._id)}
                    disabled={busyId === r.transaction?._id}
                    className="btn-primary"
                  >
                    {busyId === r.transaction?._id ? <ButtonLoader /> : <><Undo2 className="h-4 w-4" /> Request Return</>}
                  </button>
                )}
              </ActionBar>
            )}
            meta={({ optional }) =>
              optional.borrowedAt ? (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
                  <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
                  Borrowed {formatDate(optional.borrowedAt)} · Due {formatDate(optional.expectedReturnDate)}
                </p>
              ) : null
            }
          />

          <BorrowSection
            title="Pending requests"
            icon={Clock}
            requests={pending}
            emptyMessage="You haven't sent any requests. Check what's available."
            emptyAction={<Link to="/discover" className="btn-secondary">Discover items</Link>}
            rail
            renderActions={(r) => (
              <ActionBar>
                <StatusBadge status={r.status} />
                {r.status === 'ACCEPTED' && (
                  <HandoverButton request={r} onDone={load} toast={toast} />
                )}
              </ActionBar>
            )}
          />

          <BorrowSection
            title="Completed borrowings"
            icon={CheckCircle2}
            requests={completed}
            emptyMessage="Your completed borrowing history will appear here."
            completed
            renderActions={(r) => (
              <ActionBar>
                <StatusBadge status={r.status} />
                {r.status === 'RETURNED' && r.reviewedByMe === false && (
                  <button onClick={() => setReviewTarget({ request: r })} className="btn-secondary">
                    <Star className="h-4 w-4" /> Review
                  </button>
                )}
              </ActionBar>
            )}
          />
        </div>
      )}

      {reviewTarget && (
        <ReviewModal
          request={reviewTarget.request}
          onClose={() => setReviewTarget(null)}
          onDone={() => {
            setReviewTarget(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function BorrowSection({ title, icon: Icon, requests, emptyMessage, emptyAction, renderActions, meta, rail = false, completed = false }) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary-50 to-accent-50 text-primary-600 ring-1 ring-inset ring-primary-100">
          <Icon className="h-4 w-4" />
        </span>
        <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">{title}</h2>
        <span className="badge bg-slate-100 text-slate-600 ring-1 ring-slate-200">{requests.length}</span>
        <span className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent" />
      </div>
      {requests.length === 0 ? (
        <EmptyState title={title} description={emptyMessage} action={emptyAction} icon={Package} />
      ) : (
        <div className="space-y-4">
          {requests.map((r) =>
            completed ? (
              <CompletedRow key={r._id} r={r} renderActions={renderActions} />
            ) : (
              <BorrowRow key={r._id} r={r} renderActions={renderActions} meta={meta} rail={rail} />
            )
          )}
        </div>
      )}
    </section>
  );
}

function BorrowRow({ r, renderActions, meta, rail }) {
  const item = r.itemId;
  const owner = r.ownerId;
  const due = dueInfo(r.expectedReturnDate);

  return (
    <div className="card overflow-hidden card-hover">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <div className="relative shrink-0">
          <img
            src={formatImagePath(item?.images?.[0]) || ''}
            alt={item?.name}
            className="h-20 w-20 rounded-2xl object-cover ring-1 ring-slate-900/10"
            onError={(e) => {
              e.currentTarget.src = '';
              e.currentTarget.classList.add('bg-slate-100');
            }}
          />
          <span className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-500/0 via-transparent to-accent-500/10 ring-1 ring-inset ring-slate-900/5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/items/${item?._id}`} className="text-sm font-semibold text-slate-900 hover:text-primary-700">
              {item?.name || 'Item'}
            </Link>
            {due && <span className={`badge ${due.cls}`}>{due.label}</span>}
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            <Avatar user={owner} size="xs" />
            from <b className="font-medium text-slate-700">{owner?.name || '—'}</b> · {item?.location || '—'}
          </p>
          {meta && meta({ ...r, optional: r.transaction || null })}
          <p className="mt-1 text-[11px] text-slate-400">Requested {formatDate(r.createdAt)}</p>
        </div>
        {renderActions && renderActions(r)}
      </div>
      {rail && (
        <div className="border-t border-slate-100 bg-gradient-to-b from-slate-50/80 to-white px-5 py-4">
          <LifecycleRail status={r.status} />
        </div>
      )}
    </div>
  );
}

function LifecycleRail({ status }) {
  const idx = lifecycleIndex(status);
  const pct = Math.round((idx / (LIFECYCLE_STEPS.length - 1)) * 100);

  return (
    <div>
      <ProgressBar value={pct} color="bg-gradient-to-r from-primary-500 to-accent-500" className="h-1.5" />
      <div className="mt-3 flex items-start">
        {LIFECYCLE_STEPS.map((step, i) => {
          const done = i < idx;
          const current = i === idx;
          const dot = done
            ? 'bg-accent-500 text-white ring-4 ring-accent-100'
            : current
              ? 'animate-pulse-soft bg-primary-600 text-white ring-4 ring-primary-100'
              : 'bg-slate-200 text-transparent ring-4 ring-slate-100';
          return (
            <div key={step.key} className={`flex items-center ${i < LIFECYCLE_STEPS.length - 1 ? 'flex-1' : 'flex-none'}`}>
              <div className="flex flex-col items-center">
                <span className={`flex h-4 w-4 items-center justify-center rounded-full transition ${dot}`}>
                  {done && <Check className="h-2.5 w-2.5" strokeWidth={3.5} />}
                </span>
                <span className={`mt-1.5 whitespace-nowrap text-[10px] font-semibold ${current ? 'text-primary-700' : done ? 'text-slate-600' : 'text-slate-400'}`}>
                  {step.label}
                </span>
              </div>
              {i < LIFECYCLE_STEPS.length - 1 && (
                <span className={`mx-2 mb-4 h-0.5 flex-1 rounded-full ${done ? 'bg-accent-400' : 'bg-slate-200'}`} />
              )}
            </div>
          );
        })}
      </div>
      {status === 'RETURN_REQUESTED' && (
        <p className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-indigo-600">
          <Clock className="h-3 w-3" /> Return requested — awaiting owner confirmation.
        </p>
      )}
    </div>
  );
}

function CompletedRow({ r, renderActions }) {
  const item = r.itemId;
  const owner = r.ownerId;
  const done = r.status === 'RETURNED';
  const note = done
    ? `Returned on ${formatDate(r.returnedAt)}`
    : `Declined on ${formatDate(r.declinedAt)}`;

  return (
    <div className="relative flex gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft">
      <div className="flex flex-col items-center">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${done ? 'bg-accent-100 text-accent-600' : 'bg-red-50 text-red-500'}`}>
          {done ? <CheckCircle2 className="h-5 w-5" /> : <X className="h-5 w-5" />}
        </span>
        <span className="mt-2 w-px flex-1 bg-gradient-to-b from-slate-200 to-transparent" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
        <img
          src={formatImagePath(item?.images?.[0]) || ''}
          alt={item?.name}
          className="h-14 w-14 shrink-0 rounded-xl object-cover bg-slate-100"
          onError={(e) => {
            e.currentTarget.src = '';
            e.currentTarget.classList.add('bg-slate-100');
          }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/items/${item?._id}`} className="text-sm font-semibold text-slate-900 hover:text-primary-700">
              {item?.name || 'Item'}
            </Link>
            <StatusBadge status={r.status} />
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            from {owner?.name || '—'} · {item?.location || '—'}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            <CalendarClock className="h-3.5 w-3.5 text-slate-400" /> {note}
          </p>
        </div>
        {renderActions && renderActions(r)}
      </div>
    </div>
  );
}

function ActionBar({ children }) {
  return <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">{children}</div>;
}

function HandoverButton({ request, onDone, toast }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');

  const verify = async (payload) => {
    setVerifying(true);
    setError('');
    try {
      const res = await api.post(`/transactions/handover/${request._id}/verify`, payload);
      toast.success(res.data.message, 'Handover complete');
      setOpen(false);
      onDone();
    } catch (err) {
      setError(getError(err));
    } finally {
      setVerifying(false);
    }
  };

  const handleScan = async (raw) => {
    const token = extractHandoverToken(raw);
    if (!token) {
      setError("That QR doesn't look like a BorrowBox handover code. Scan the owner's QR.");
      return;
    }
    try {
      await api.post(`/transactions/handover/${request._id}/verify`, { token });
      toast.success('Handover verified by QR.', 'Handover complete');
      setOpen(false);
      onDone();
    } catch (err) {
      setError(getError(err));
    }
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary shadow-glow">
        <QrCode className="h-4 w-4" /> Handover
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Verify handover" size="md">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-50 via-white to-accent-50 p-4 ring-1 ring-inset ring-primary-100">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-primary-600 shadow-soft">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">Scan the owner's QR at handover</p>
              <p className="text-xs text-slate-500">
                Borrowing <b>{request.itemId?.name}</b> from <b>{request.ownerId?.name}</b>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-soft">
          <QrScanner onScan={handleScan} />
        </div>

        <div className="my-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-slate-200" />
          <span className="text-xs font-medium text-slate-400">or enter the 6-digit code</span>
          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-slate-200" />
        </div>

        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="6-digit code"
            className="input text-center text-lg font-bold tracking-[0.35em]"
            inputMode="numeric"
          />
          <button
            onClick={() => verify({ code })}
            disabled={code.length !== 6 || verifying}
            className="btn-primary"
          >
            {verifying ? <ButtonLoader /> : <>Verify</>}
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </Modal>
    </>
  );
}

function ReviewModal({ request, onClose, onDone }) {
  const toast = useToast();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      const res = await api.post('/reviews', {
        transactionId: request.transaction?._id,
        rating,
        comment,
      });
      toast.success(res.data.message, 'Review submitted');
      onDone();
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Review your experience" size="md">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 to-accent-500 p-5 text-white shadow-glow">
        <Sparkles className="h-6 w-6 opacity-80" />
        <p className="mt-2 text-sm text-white/90">
          Rate your borrowing of <b>{request.itemId?.name}</b> from{' '}
          <b>{request.ownerId?.name}</b>.
        </p>
      </div>
      <div className="mt-5">
        <label className="label">Your rating</label>
        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
          <RatingInput value={rating} onChange={setRating} size={34} />
        </div>
      </div>
      <div className="mt-4">
        <label className="label" htmlFor="review-comment">Comment (optional)</label>
        <textarea
          id="review-comment"
          rows={3}
          className="input"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="How was the item and the handover?"
        />
      </div>
      <div className="mt-5 flex justify-end gap-3">
        <button onClick={onClose} className="btn-secondary">Cancel</button>
        <button onClick={submit} disabled={submitting} className="btn-primary">
          {submitting ? <ButtonLoader>Submitting…</ButtonLoader> : 'Submit review'}
        </button>
      </div>
    </Modal>
  );
}

function statusLabel(status) {
  return String(status || '')
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
}