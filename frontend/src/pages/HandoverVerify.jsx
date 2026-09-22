import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  BadgeCheck,
  Clock,
  Loader2,
  Package,
  QrCode,
  ScanLine,
  ShieldCheck,
  UserCheck,
  XCircle,
} from 'lucide-react';
import api from '../api/client.js';
import { Logo, RatingStars, StatusBadge } from '../components/index.js';
import { formatDateTime } from '../utils/format.js';
import { formatCountdown } from '../utils/handover.js';

function BrandShell({ children }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-primary-500/10 blur-3xl animate-blob-a" />
        <div className="absolute -bottom-32 -right-24 h-[28rem] w-[28rem] rounded-full bg-accent-500/10 blur-3xl animate-blob-b" />
        <div className="absolute left-1/3 top-1/3 h-72 w-72 rounded-full bg-primary-300/10 blur-3xl animate-blob-c" />
        <div className="absolute inset-0 opacity-[0.35]" style={{ backgroundImage: 'radial-gradient(rgb(79 70 229 / 0.12) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      </div>
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-2">
          <Logo />
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Handover Verification</p>
        </div>
        {children}
      </div>
    </div>
  );
}

function DetailRow({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      <span className="min-w-0 text-right text-sm font-semibold text-slate-800">{children}</span>
    </div>
  );
}

function ActiveScreen({ info, secondsLeft }) {
  const item = info?.request?.item;
  const owner = info?.request?.owner;
  const borrower = info?.request?.borrower;
  const handoverId = String(info?.handoverId || info?.request?.id || '');

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-primary-500/5 ring-1 ring-slate-200">
      <div className="relative overflow-hidden bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 px-5 pb-6 pt-5">
        <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
        <div className="relative">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 rounded-full bg-accent-400/20 px-3 py-1.5 text-accent-100 ring-1 ring-inset ring-accent-300/40">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-300 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-200" />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider">Active</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-2 backdrop-blur">
              <Clock className="h-4 w-4 text-white" />
              <span className="font-mono text-lg font-bold tabular-nums text-white">{formatCountdown(secondsLeft)}</span>
            </div>
          </div>
          <h1 className="mt-4 text-2xl font-extrabold text-white">✓ ACTIVE HANDOVER</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-primary-100">
            <BadgeCheck className="h-4 w-4" /> Handover Verified
          </p>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-center gap-2.5 rounded-2xl border border-accent-200 bg-accent-50 px-4 py-3">
          <ShieldCheck className="h-5 w-5 shrink-0 text-accent-600" />
          <p className="text-sm font-medium text-accent-800">
            This QR is valid and active. The handover is ready to be completed.
          </p>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white text-primary-600 shadow-sm ring-1 ring-slate-200">
            <Package className="h-7 w-7" strokeWidth={1.8} />
          </div>
          <div className="min-w-0">
            <p className="truncate font-bold text-slate-900">{item?.name || 'Item'}</p>
            <div className="mt-0.5 flex flex-wrap gap-2 text-xs font-medium text-slate-500">
              {item?.category && <span className="input-chip">{item.category}</span>}
              {item?.condition && <span className="input-chip">{item.condition}</span>}
              {item?.location && <span className="input-chip">Located · {item.location}</span>}
            </div>
          </div>
        </div>

        <div className="mt-3 divide-y divide-slate-100 rounded-2xl border border-slate-200 px-4">
          <DetailRow label="Lender">
            <span className="flex items-center justify-end gap-1.5">
              {owner?.name || '—'}
              {owner && (
                <RatingStars
                  rating={owner.rating}
                  size={13}
                  showValue
                  className="shrink-0 text-amber-400"
                />
              )}
            </span>
          </DetailRow>
          <DetailRow label="Borrower">
            <span className="flex items-center justify-end gap-1.5">
              <UserCheck className="h-3.5 w-3.5 text-slate-400" />
              {borrower?.name || '—'}
            </span>
          </DetailRow>
          <DetailRow label="Duration">{info?.request?.duration || '—'}</DetailRow>
          <DetailRow label="Status"><StatusBadge status={info?.status} /></DetailRow>
          {handoverId && (
            <DetailRow label="Handover ID">
              <span className="font-mono text-xs break-all">{handoverId}</span>
            </DetailRow>
          )}
          <DetailRow label="Created">{formatDateTime(info?.createdAt)}</DetailRow>
          <DetailRow label="Expires">{formatDateTime(info?.expiresAt)}</DetailRow>
        </div>

        <div className="mt-4 rounded-2xl border border-primary-100 bg-primary-50/60 p-4">
          <div className="flex items-center gap-2">
            <ScanLine className="h-4 w-4 text-primary-600" />
            <h2 className="text-sm font-bold text-primary-900">Scan to Verify Handover</h2>
          </div>
          <ol className="mt-3 list-none space-y-2 text-sm text-slate-600">
            <li className="flex gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-600 text-[11px] font-bold text-white">1</span>
              Meet the lender <span className="font-semibold text-slate-800">{owner?.name || 'at the pick-up location'}</span> with this screen open.
            </li>
            <li className="flex gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-600 text-[11px] font-bold text-white">2</span>
              Confirm the item and lender match this verified handover below.
            </li>
            <li className="flex gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-600 text-[11px] font-bold text-white">3</span>
              The lender then confirms the handover in the BorrowBox app to complete the transfer.
            </li>
          </ol>
        </div>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5" /> Public verification · no sign-in required · never share your handover code
        </p>
      </div>
    </motion.div>
  );
}

function ExpiredScreen() {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-white px-6 py-10 text-center shadow-xl shadow-amber-500/5 ring-1 ring-slate-200">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
        <Clock className="h-8 w-8" strokeWidth={1.8} />
      </div>
      <h1 className="text-2xl font-extrabold text-slate-900">QR EXPIRED</h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">
        This handover QR has expired. Handover codes are short-lived for your security, so the transfer can no longer be verified from this QR.
      </p>
      <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
        Ask the item owner to generate a fresh QR to continue the handover.
      </div>
    </motion.div>
  );
}

function InvalidScreen({ used = false, reason = '' }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-white px-6 py-10 text-center shadow-xl shadow-red-500/5 ring-1 ring-slate-200">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600">
        {used ? <QrCode className="h-8 w-8" strokeWidth={1.8} /> : <XCircle className="h-8 w-8" strokeWidth={1.8} />}
      </div>
      <h1 className="text-2xl font-extrabold text-slate-900">{used ? 'QR ALREADY USED' : 'INVALID QR'}</h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">
        {used
          ? 'This handover QR was already used to complete a handover and can only be used once.'
          : reason || 'This verification link is not a valid BorrowBox handover QR, or it no longer exists.'}
      </p>
      <div className="mt-5 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm font-medium text-red-700">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>Do not hand over the item. Ask the owner to share a fresh handover QR before proceeding.</span>
      </div>
    </motion.div>
  );
}

export default function HandoverVerify() {
  const { token } = useParams();
  const [state, setState] = useState('loading');
  const [info, setInfo] = useState({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const timerRef = useRef(null);

  const loadInfo = useCallback(async () => {
    try {
      const res = await api.get(`/transactions/handover/info/${token}`);
      const data = res.data || {};
      setInfo(data);
      setSecondsLeft(data.secondsLeft || 0);
      setState(data.state === 'active' ? 'active' : data.state === 'expired' ? 'expired' : data.state === 'used' ? 'used' : 'invalid');
    } catch {
      setState('invalid');
      setInfo({});
    }
  }, [token]);

  useEffect(() => {
    loadInfo();
  }, [loadInfo]);

  useEffect(() => {
    if (state !== 'active') return undefined;
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current);
          setState('expired');
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [state]);

  if (state === 'loading') {
    return (
      <BrandShell>
        <div className="card flex flex-col items-center px-8 py-14 text-center">
          <Loader2 className="h-9 w-9 animate-spin text-primary-600" />
          <p className="mt-4 text-sm font-medium text-slate-500">Verifying handover link…</p>
        </div>
      </BrandShell>
    );
  }

  return (
    <BrandShell>
      {state === 'active' && <ActiveScreen info={info} secondsLeft={secondsLeft} />}
      {state === 'expired' && <ExpiredScreen />}
      {state === 'used' && <InvalidScreen used reason={info?.reason} />}
      {state === 'invalid' && <InvalidScreen reason={info?.reason} />}
      <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
        <ShieldCheck className="h-3.5 w-3.5" /> BorrowBox · verified QR handovers
      </p>
    </BrandShell>
  );
}