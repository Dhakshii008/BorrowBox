import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Sparkles,
  CalendarClock,
  CheckCircle2,
  ShieldCheck,
  Flag,
  Pencil,
  Trash2,
  Inbox,
  ImageOff,
  Tag,
  UserRound,
  MessagesSquare,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import {
  PageLoader,
  ErrorState,
  Modal,
  ButtonLoader,
  Avatar,
  RatingStars,
  StatusBadge,
  ConfirmDialog,
  TrustRing,
  Reveal,
  PageTransition,
} from '../components/index.js';
import { DURATIONS, CATEGORY_EMOJI } from '../utils/constants.js';
import { getError, formatImagePath } from '../utils/format.js';

export default function ItemDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requestOpen, setRequestOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const [myRequests, setMyRequests] = useState([]);

  const loadItem = () => {
    setLoading(true);
    setError('');
    api
      .get(`/items/${id}`)
      .then((res) => setItem(res.data.item))
      .catch((err) => setError(getError(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadItem();
    api
      .get('/borrow-requests/my')
      .then((res) => setMyRequests(res.data.requests))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const isOwner = item && user && item.ownerId._id === user.id;
  const existingRequest = item
    ? myRequests.find(
        (r) => r.itemId._id === item._id && ['PENDING', 'ACCEPTED', 'BORROWED'].includes(r.status)
      )
    : null;

  const handleDelete = async () => {
    try {
      await api.delete(`/items/${item._id}`);
      toast.success('Item removed from your lending list.');
      navigate('/lending');
    } catch (err) {
      toast.error(getError(err));
    }
  };

  const handleReport = async () => {
    try {
      await api.post('/reports', { targetType: 'item', targetId: item._id, reason: reportReason });
      toast.success('Issue reported. A moderator will review it.', 'Report submitted');
      setReportOpen(false);
      setReportReason('');
    } catch (err) {
      toast.error(getError(err));
    }
  };

  if (loading) return <PageLoader />;

  if (error) return <ErrorState message={error} onRetry={loadItem} />;

  const available = item.status === 'AVAILABLE' && item.availability !== false;
  const owner = item.ownerId;
  const images = item.images || [];
  const activeIndex = Math.min(activeImage, Math.max(0, images.length - 1));

  return (
    <PageTransition>
      <div className="mx-auto max-w-6xl">
        <Link
          to="/discover"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-primary-600"
        >
          <span aria-hidden>←</span> Back to Discover
        </Link>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.05fr_1fr]">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <Reveal y={18}>
              <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-card">
                <div className="relative">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeIndex}
                      initial={{ opacity: 0, scale: 1.06 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.4, ease: [0.21, 0.55, 0.24, 1] }}
                      className="aspect-[4/3] overflow-hidden bg-slate-100"
                    >
                      {images.length ? (
                        <img
                          src={formatImagePath(images[activeIndex])}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-300">
                          <ImageOff className="h-12 w-12" />
                          <span className="text-sm">No image provided</span>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                  {images.length > 1 && (
                    <span className="badge absolute left-4 top-4 bg-white/85 text-slate-700 shadow-sm ring-1 ring-slate-200/70 backdrop-blur">
                      {activeIndex + 1} / {images.length}
                    </span>
                  )}
                </div>
                {images.length > 1 && (
                  <div className="flex gap-2.5 overflow-x-auto p-4 pt-3">
                    {images.map((img, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActiveImage(i)}
                        className={`relative aspect-[4/3] w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-300 hover:-translate-y-0.5 ${
                          i === activeIndex
                            ? 'border-primary-500 shadow-glow'
                            : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                        aria-label={`View image ${i + 1}`}
                      >
                        <img src={formatImagePath(img)} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Reveal>

            <Reveal delay={0.08} y={18}>
              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-accent-100 bg-gradient-to-r from-accent-50/80 to-white px-4 py-3 text-sm text-accent-700">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-100 text-accent-700">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <p className="text-xs font-medium sm:text-sm">
                  Free campus borrowing — no rental fee, deposit, or payment needed. Ever.
                </p>
              </div>
            </Reveal>
          </div>

          <div className="space-y-5">
            <Reveal y={14}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="badge bg-primary-50 text-primary-700 ring-1 ring-primary-200">
                  <span aria-hidden>{CATEGORY_EMOJI[item.category] || '📦'}</span> {item.category}
                </span>
                <StatusBadge
                  status={item.status}
                  label={item.status === 'AVAILABLE' ? (available ? 'Available' : 'Unavailable') : undefined}
                />
                <span
                  className={`badge-dot badge ${
                    available ? 'bg-accent-50 text-accent-600 ring-1 ring-accent-200' : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200'
                  }`}
                >
                  {available ? 'Free to borrow' : 'Not borrowable'}
                </span>
              </div>
              <h1 className="mt-2.5 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                {item.name}
              </h1>
              <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500">
                <MapPin className="h-4 w-4 text-primary-500" />
                {item.location} on campus
              </p>
            </Reveal>

            <Reveal delay={0.05} y={14}>
              <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/70 p-5 shadow-soft">
                <div className="divider-gradient absolute inset-x-6 top-0" />
                <p className="eyebrow">About this item</p>
                <p className="mt-2 text-[15px] leading-relaxed text-slate-600">
                  {item.description}
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.1} y={14}>
              <div className="grid grid-cols-2 gap-3">
                <FactChip icon={Tag} label="Category" value={item.category} emoji={CATEGORY_EMOJI[item.category]} />
                <FactChip icon={Sparkles} label="Condition" value={item.condition} />
                <FactChip icon={MapPin} label="Location" value={item.location} />
                <FactChip
                  icon={CalendarClock}
                  label="Availability"
                  value={available ? 'Available now' : 'Unavailable'}
                />
              </div>
            </Reveal>

            <Reveal delay={0.15} y={14}>
              <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-card">
                <div className="h-1.5 w-full bg-gradient-to-r from-primary-600 via-indigo-400 to-accent-500" />
                <div className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                      <span
                        aria-hidden
                        className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary-500/40 to-accent-500/40 blur-sm"
                      />
                      <Avatar user={owner} size="lg" className="relative ring-2 ring-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900">{owner.name}</p>
                      <p className="truncate text-xs text-slate-500">
                        {owner.department || 'Student'}
                        {owner.year ? ` · Year ${owner.year}` : ''}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <RatingStars rating={owner.rating} size={13} showValue />
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent-600">
                          <ShieldCheck className="h-3.5 w-3.5" /> Verified lender
                        </span>
                      </div>
                    </div>
                    <TrustRing value={owner.trustScore ?? 50} size={62} stroke={7} label="Trust" />
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {isOwner ? (
                      <>
                        <Link to="/requests" className="btn-primary-soft">
                          <Inbox className="h-4 w-4" /> View requests
                        </Link>
                        <Link to={`/items/${item._id}/edit`} className="btn-secondary">
                          <Pencil className="h-4 w-4" /> Edit listing
                        </Link>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setRequestOpen(true)}
                          disabled={!available}
                          className="btn-primary-soft"
                        >
                          <MessagesSquare className="h-4 w-4" /> Contact owner
                        </button>
                        <Link to={`/reputation?user=${owner._id}`} className="btn-secondary">
                          <UserRound className="h-4 w-4" /> View profile
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.2} y={14}>
              {isOwner ? (
                <div className="relative overflow-hidden rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50/90 to-white px-5 py-4 text-sm shadow-sm">
                  <div className="divider-gradient absolute inset-x-6 top-0" />
                  <p className="font-semibold text-primary-800">This is your item.</p>
                  <p className="mt-0.5 text-primary-700">
                    Manage requests from students or update the listing above.
                  </p>
                  <button
                    onClick={() => setDeleteOpen(true)}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 transition hover:text-red-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove listing
                  </button>
                </div>
              ) : existingRequest ? (
                <div className="relative overflow-hidden rounded-2xl border border-accent-100 bg-gradient-to-br from-accent-50/90 to-white px-5 py-4 text-sm text-accent-800 shadow-sm">
                  <div className="divider-gradient absolute inset-x-6 top-0" />
                  <p className="inline-flex items-center gap-1.5 font-semibold">
                    <CheckCircle2 className="h-4 w-4" /> Request sent
                  </p>
                  <p className="mt-0.5 text-accent-700">
                    Your request is <b>{statusLabel(existingRequest.status)}</b>. Track it in My Borrowings.
                  </p>
                  <Link
                    to="/borrowings"
                    className="mt-2 inline-flex items-center gap-1 font-semibold text-accent-700 transition hover:text-accent-900"
                  >
                    View my borrowings <span aria-hidden>→</span>
                  </Link>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setRequestOpen(true)}
                    disabled={!available}
                    className="btn-primary w-full py-3.5 text-base"
                  >
                    {available ? 'Request to Borrow' : 'Currently unavailable'}
                  </button>
                  <p className="mt-2.5 text-center text-xs text-slate-400">
                    Free of charge — no rental fee, deposit, or payment needed.
                  </p>
                </>
              )}
            </Reveal>

            {!isOwner && (
              <button
                onClick={() => setReportOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 transition hover:text-red-600"
              >
                <Flag className="h-3.5 w-3.5" /> Report this item
              </button>
            )}
          </div>
        </div>

        <BorrowModal
          open={requestOpen}
          onClose={() => {
            setRequestOpen(false);
            setSent(false);
          }}
          item={item}
          sending={sending}
          sent={sent}
          setSending={setSending}
          setSent={setSent}
          toast={toast}
          onSuccess={() => {
            setRequestOpen(true);
            api
              .get('/borrow-requests/my')
              .then((res) => setMyRequests(res.data.requests))
              .catch(() => {});
          }}
        />

        <ConfirmDialog
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          onConfirm={handleDelete}
          title="Remove item"
          message={`Remove "${item.name}" from your lending list? Existing requests will be cancelled.`}
          confirmLabel="Remove item"
          danger
        />

        <Modal open={reportOpen} onClose={() => setReportOpen(false)} title="Report this item" size="sm">
          <p className="text-sm text-slate-500">
            Tell the moderators why this listing is a problem. You can remove your report before it is reviewed.
          </p>
          <textarea
            rows={3}
            className="input mt-3"
            placeholder="e.g. Inappropriate, broken, misuse of the platform…"
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
          />
          <div className="mt-4 flex justify-end gap-3">
            <button onClick={() => setReportOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleReport} className="btn-danger" disabled={!reportReason.trim()}>
              Submit report
            </button>
          </div>
        </Modal>
      </div>
    </PageTransition>
  );
}

function FactChip({ icon: Icon, label, value, emoji }) {
  return (
    <div className="group flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-3.5 py-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-200/60 hover:shadow-soft">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-50 to-accent-50 text-primary-600 ring-1 ring-inset ring-primary-100/70">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="truncate text-sm font-semibold text-slate-800">
          {emoji ? <span aria-hidden className="mr-1">{emoji}</span> : null}
          {value}
        </p>
      </div>
    </div>
  );
}

function statusLabel(status) {
  return String(status || '')
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
}

function BorrowModal({
  open,
  onClose,
  item,
  sending,
  sent,
  setSending,
  setSent,
  toast,
  onSuccess,
}) {
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState('1 day');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setReason('');
      setDuration('1 day');
      setError('');
      setSent(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError('Please tell the owner why you need this item.');
      return;
    }
    setError('');
    setSending(true);
    try {
      await api.post('/borrow-requests', {
        itemId: item._id,
        reason: reason.trim(),
        requestedDuration: duration,
      });
      setSent(true);
      toast.success('Your request has been sent to the owner.', 'Request sent');
      onSuccess();
    } catch (err) {
      setError(getError(err, 'Could not send the request.'));
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Request to Borrow" size="md">
      <AnimatePresence mode="wait">
        {sent ? (
          <motion.div
            key="sent"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center py-4 text-center"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            >
              <svg viewBox="0 0 52 52" className="h-20 w-20">
                <motion.circle
                  cx="26"
                  cy="26"
                  r="23"
                  fill="none"
                  strokeWidth="2.5"
                  stroke="#10B981"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.55, ease: 'easeInOut' }}
                />
                <motion.path
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 27l8 7 14-15"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.4, duration: 0.4, ease: 'easeOut' }}
                />
              </svg>
            </motion.div>
            <h3 className="mt-4 text-lg font-bold text-slate-900">Request sent!</h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              The owner has been notified. Here’s what happens next:
            </p>

            <div className="mt-6 w-full max-w-sm space-y-3 text-left">
              <div className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
                  1
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Owner gets notified</p>
                  <p className="text-xs text-slate-500">
                    {item.ownerId?.name || 'The owner'} will see your request instantly.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
                  2
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">They accept or decline</p>
                  <p className="text-xs text-slate-500">
                    You’ll be updated the moment they respond.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-accent-100 bg-accent-50/70 p-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-600 text-xs font-bold text-white">
                  3
                </span>
                <div>
                  <p className="text-sm font-semibold text-accent-800">Arrange the handover</p>
                  <p className="text-xs text-accent-600">
                    Meet on campus to pick the item up — completely free.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-center">
              <Link to="/borrowings" className="btn-primary sm:w-auto">View My Borrowings</Link>
              <button onClick={onClose} className="btn-secondary sm:w-auto">Continue browsing</button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mb-4 overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-3 p-3">
                {item.images?.length ? (
                  <img
                    src={formatImagePath(item.images[0])}
                    alt=""
                    className="h-12 w-12 rounded-xl object-cover"
                  />
                ) : (
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-200 text-slate-400">
                    <ImageOff className="h-5 w-5" />
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{item.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {item.ownerId?.name} · {item.location}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="label" htmlFor="reason">Why do you need this item?</label>
              <textarea
                id="reason"
                rows="3"
                className="input"
                placeholder="e.g. I need it for tomorrow's mathematics exam."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <div className="mt-4">
              <label className="label">How long do you need it?</label>
              <div className="flex flex-wrap gap-2">
                {DURATIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDuration(d)}
                    className={`pill ${duration === d ? 'pill-active' : 'pill-idle'}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 text-sm font-medium text-red-600"
              >
                {error}
              </motion.p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={onClose} className="btn-secondary">Cancel</button>
              <button onClick={handleSubmit} disabled={sending} className="btn-primary">
                {sending ? <ButtonLoader>Sending…</ButtonLoader> : 'Send Request'}
              </button>
            </div>
            <p className="mt-3 text-center text-xs text-slate-400">
              This is a free borrowing — no payment, deposit or fee is involved.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}