import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  X,
  QrCode,
  CalendarClock,
  Inbox,
  ArrowLeftRight,
  RefreshCw,
  Timer,
  ShieldCheck,
  Eye,
  EyeOff,
  Link2,
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
  ConfirmDialog,
  RatingStars,
} from '../components/index.js';
import { getError, formatDate, formatImagePath, timeAgo } from '../utils/format.js';
import { formatCountdown } from '../utils/handover.js';

const tabs = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'HISTORY', label: 'History' },
];

export default function Requests() {
  const toast = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('PENDING');
  const [busyId, setBusyId] = useState(null);
  const [qrRequest, setQrRequest] = useState(null);
  const [qr, setQr] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);

  const load = () => {
    setLoading(true);
    setError('');
    api
      .get('/borrow-requests/received')
      .then((res) => setRequests(res.data.requests))
      .catch((err) => setError(getError(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const act = async (action, id, successMessage) => {
    setBusyId(id);
    try {
      const res = await api.put(`/borrow-requests/${id}/${action}`);
      toast.success(res.data.message);
      load();
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setBusyId(null);
    }
  };

  const generateQR = async () => {
    setQrLoading(true);
    try {
      const res = await api.post(`/transactions/handover/${qrRequest._id}/generate`, {
        verifyBaseUrl: `${window.location.protocol}//${window.location.host}`,
      });
      setQr(res.data);
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setQrLoading(false);
    }
  };

  const filtered =
    tab === 'PENDING'
      ? requests.filter((r) => r.status === 'PENDING')
      : tab === 'ACTIVE'
        ? requests.filter((r) => ['ACCEPTED', 'BORROWED', 'RETURN_REQUESTED'].includes(r.status))
        : requests.filter((r) => ['DECLINED', 'RETURNED'].includes(r.status));

  const counts = {
    PENDING: requests.filter((r) => r.status === 'PENDING').length,
    ACTIVE: requests.filter((r) => ['ACCEPTED', 'BORROWED', 'RETURN_REQUESTED'].includes(r.status)).length,
    HISTORY: requests.filter((r) => ['DECLINED', 'RETURNED'].includes(r.status)).length,
  };

  const closeQR = () => {
    setQrRequest(null);
    setQr(null);
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Requests"
        subtitle="Review requests from students who want to borrow your items."
      />

      <div className="mb-6 inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-soft">
        {tabs.map((t) => {
          const isActive = tab === t.value;
          return (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className="relative rounded-xl px-4 py-2 text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-primary-500 sm:px-5"
            >
              {isActive && (
                <motion.span
                  layoutId="requests-tab"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 shadow-glow"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <span className={`relative z-10 flex items-center gap-2 ${isActive ? 'text-white' : 'text-slate-600 hover:text-slate-900'}`}>
                {t.label}
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {counts[t.value]}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {loading && <PageLoader />}

      {!loading && error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && filtered.length === 0 && (
        <EmptyState
          title={tab === 'PENDING' ? 'No pending requests' : tab === 'ACTIVE' ? 'No active requests' : 'No history yet'}
          description={
            tab === 'PENDING'
              ? 'When a student wants to borrow one of your items, their request will show up here.'
              : 'Requests you have accepted, declined or completed will appear here.'
          }
          icon={Inbox}
        />
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="space-y-4">
          {filtered.map((req) => (
            <RequestCard
              key={req._id}
              req={req}
              busy={busyId === req._id}
              onAccept={() => setConfirmTarget({ action: 'accept', request: req })}
              onDecline={() => setConfirmTarget({ action: 'decline', request: req })}
              onQR={() => setQrRequest(req)}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirmTarget)}
        onClose={() => setConfirmTarget(null)}
        onConfirm={() => {
          const target = confirmTarget;
          setConfirmTarget(null);
          return act(target.action, target.request._id, target.action === 'accept' ? 'Request accepted' : 'Request declined');
        }}
        title={confirmTarget?.action === 'accept' ? 'Accept request' : 'Decline request'}
        message={
          confirmTarget?.action === 'accept'
            ? `Accept ${confirmTarget?.request?.borrowerId?.name}'s request for ${confirmTarget?.request?.itemId?.name}? The item will be reserved for them.`
            : `Decline ${confirmTarget?.request?.borrowerId?.name}'s request for ${confirmTarget?.request?.itemId?.name}?`
        }
        confirmLabel={confirmTarget?.action === 'accept' ? 'Accept' : 'Decline'}
        danger={confirmTarget?.action === 'decline'}
      />

      <Modal
        open={Boolean(qrRequest)}
        onClose={closeQR}
        title="Premium Handover QR"
        size="lg"
      >
        {!qr ? (
          <div className="py-4 text-center">
            <div className="relative mx-auto flex h-28 w-28 items-center justify-center">
              <span className="absolute inset-0 animate-blob-a rounded-3xl bg-primary-200/50 blur-2xl" />
              <span className="absolute inset-0 animate-blob-b rounded-3xl bg-accent-200/40 blur-2xl" />
              <span className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-primary-600 to-accent-500 text-white shadow-glow">
                <QrCode className="h-12 w-12" />
              </span>
            </div>
            <h3 className="mt-5 text-base font-bold text-slate-900">One-time handover pass</h3>
            <p className="mx-auto mt-1.5 max-w-sm text-sm text-slate-500">
              Generate a transaction-specific QR for{' '}
              <b className="text-slate-700">{qrRequest?.borrowerId?.name}</b> to verify when
              handing over <b className="text-slate-700">{qrRequest?.itemId?.name}</b>.
            </p>
            <button onClick={generateQR} disabled={qrLoading} className="btn-primary mt-6 shadow-glow">
              {qrLoading ? <ButtonLoader>Generating…</ButtonLoader> : (
                <>
                  <QrCode className="h-4 w-4" /> Generate Handover QR
                </>
              )}
            </button>
          </div>
        ) : (
          <HandoverPanel
            qr={qr}
            regenerating={qrLoading}
            onRegenerate={generateQR}
            onClose={closeQR}
          />
        )}
      </Modal>
    </div>
  );
}

function RequestCard({ req, busy, onAccept, onDecline, onQR }) {
  const item = req.itemId;
  const borrower = req.borrowerId;
  const pending = req.status === 'PENDING';
  const active = ['ACCEPTED', 'BORROWED', 'RETURN_REQUESTED'].includes(req.status);

  return (
    <div className="relative flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-primary-200/70 hover:shadow-lift sm:flex-row sm:items-start">
      <span className={`absolute -left-px top-5 bottom-5 w-1 rounded-full bg-gradient-to-b ${
        pending
          ? 'from-amber-400 to-amber-300'
          : active
            ? 'from-primary-500 to-accent-400'
            : 'from-slate-300 to-slate-200'
      }`} />
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
          <h3 className="text-sm font-semibold text-slate-900">{item?.name}</h3>
          <StatusBadge status={req.status} />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <Avatar user={borrower} size="xs" />
            <b className="font-medium text-slate-700">{borrower?.name || '—'}</b>
            {borrower?.year ? ` · Yr ${borrower.year}` : ''}
            <RatingStars rating={borrower?.rating} size={11} />
          </span>
          <span className="inline-flex items-center gap-1">
            <CalendarClock className="h-4 w-4" /> {formatDate(req.createdAt)}
          </span>
          <span className="inline-flex items-center gap-1">
            <ArrowLeftRight className="h-4 w-4" /> for {req.requestedDuration}
          </span>
        </div>
        <div className="relative mt-3 rounded-xl border-l-2 border-primary-200 bg-gradient-to-r from-slate-50 to-white px-3 py-2 text-sm text-slate-600">
          “{req.reason}”
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-2 sm:items-end">
        {req.status === 'PENDING' && (
          <div className="flex gap-2">
            <button onClick={onAccept} disabled={busy} className="btn-accent shadow-glow-accent">
              {busy ? <ButtonLoader className="!h-3.5 !w-3.5" /> : <><Check className="h-4 w-4" /> Accept</>}
            </button>
            <button onClick={onDecline} disabled={busy} className="btn-secondary !text-red-600">
              <X className="h-4 w-4" /> Decline
            </button>
          </div>
        )}
        {req.status === 'ACCEPTED' && (
          <button onClick={onQR} className="btn-primary shadow-glow">
            <QrCode className="h-4 w-4" /> Generate Handover QR
          </button>
        )}
        {req.status === 'BORROWED' && (
          <span className="badge bg-accent-50 text-accent-700 ring-1 ring-accent-200">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-500" /> In use
          </span>
        )}
        {req.status === 'RETURN_REQUESTED' && (
          <span className="badge bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200">
            <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-indigo-500" /> Return requested
          </span>
        )}
        {req.status === 'RETURNED' && (
          <span className="badge bg-slate-100 text-slate-600 ring-1 ring-slate-200">
            Completed {formatDate(req.returnedAt)}
          </span>
        )}
        {['PENDING', 'ACCEPTED'].includes(req.status) && (
          <p className="text-[11px] text-slate-400">Requested {timeAgo(req.createdAt)}</p>
        )}
      </div>
    </div>
  );
}

function secondsLeft(expiresAt) {
  if (!expiresAt) return 0;
  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
}

function HandoverPanel({ qr, regenerating, onRegenerate, onClose }) {
  const toast = useToast();
  const [left, setLeft] = useState(() => secondsLeft(qr.expiresAt));
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (import.meta.env.DEV) console.log('[BorrowBox] Handover QR URL: ' + qr.verifyUrl);
  }, [qr.verifyUrl]);

  useEffect(() => {
    const tick = () => setLeft(secondsLeft(qr.expiresAt));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [qr.expiresAt]);

  const expired = left <= 0;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(qr.verifyUrl || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy the link.');
    }
  };

  return (
    <div className="text-center">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-left">
          <h3 className="text-sm font-bold text-slate-900">Show this to {qr.request.borrowerName} at handover</h3>
          <p className="text-xs text-slate-500">
            {qr.request.itemName} · Duration {qr.request.duration}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`badge ${expired ? 'bg-red-50 text-red-700 ring-1 ring-red-200' : 'bg-accent-50 text-accent-700 ring-1 ring-accent-200'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${expired ? 'bg-red-500' : 'animate-pulse-soft bg-accent-500'}`} />
            {expired ? 'Expired' : 'Active'}
          </span>
          <span className={`badge ${expired ? 'bg-red-50 text-red-700 ring-1 ring-red-200' : 'bg-slate-100 text-slate-700 ring-1 ring-slate-200'}`}>
            <Timer className="h-3.5 w-3.5" /> {formatCountdown(left)}
          </span>
        </div>
      </div>

      <div className={`relative mx-auto mt-5 w-fit overflow-hidden rounded-3xl bg-white p-4 shadow-lift ring-1 ring-slate-100 ${expired ? 'opacity-70' : ''}`}>
        <div className="relative overflow-hidden rounded-2xl">
          <img src={qr.qr} alt="Handover QR code" className="h-56 w-56 bg-white sm:h-64 sm:w-64" />
          <div
            aria-hidden
            className="animate-scan-line pointer-events-none absolute inset-x-3 h-0.5 rounded-full bg-gradient-to-r from-transparent via-accent-400 to-transparent shadow-[0_0_16px_2px_rgba(16,185,129,0.55)]"
          />
        </div>
        <span className="absolute left-2.5 top-2.5 h-4 w-4 rounded-tl-xl border-l-2 border-t-2 border-primary-300" />
        <span className="absolute right-2.5 top-2.5 h-4 w-4 rounded-tr-xl border-r-2 border-t-2 border-primary-300" />
        <span className="absolute bottom-2.5 left-2.5 h-4 w-4 rounded-bl-xl border-b-2 border-l-2 border-primary-300" />
        <span className="absolute bottom-2.5 right-2.5 h-4 w-4 rounded-br-xl border-b-2 border-r-2 border-primary-300" />
      </div>

      {!expired && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <button onClick={() => setShowCode((v) => !v)} className="pill pill-idle">
            {showCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showCode ? 'Hide' : 'Show'} 6-digit code
          </button>
          <button onClick={copyLink} disabled={!qr.verifyUrl} className="pill pill-idle">
            {copied ? <Check className="h-4 w-4 text-accent-600" /> : <Link2 className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Copy verify link'}
          </button>
          <button onClick={onRegenerate} disabled={regenerating} className="pill pill-idle">
            {regenerating ? <ButtonLoader className="!h-4 !w-4" /> : <RefreshCw className="h-4 w-4" />}
            Generate new QR
          </button>
        </div>
      )}

      {showCode && !expired && (
        <div className="mx-auto mt-4 w-fit rounded-2xl border border-slate-100 bg-gradient-to-b from-primary-50/70 to-white px-6 py-4 shadow-soft">
          <p className="flex items-center justify-center gap-2 text-xs font-medium text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-primary-500" /> One-time handover code
          </p>
          <p className="mt-1 text-4xl font-bold tracking-[0.45em] text-primary-700">{qr.code}</p>
        </div>
      )}

      {expired && (
        <p className="mt-4 text-sm text-red-600">
          This QR has expired. Generate a fresh one to continue the handover.
        </p>
      )}

      <button onClick={onClose} className="btn-secondary mt-6">
        Done
      </button>
    </div>
  );
}