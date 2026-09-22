import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  CheckCheck,
  Clock,
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
  PackageCheck,
  Clock3,
  Star,
  ShieldCheck,
  Megaphone,
} from 'lucide-react';
import api from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import {
  PageHeader,
  EmptyState,
  ErrorState,
  Skeleton,
  Reveal,
  PageTransition,
} from '../components/index.js';
import { getError, timeAgo, formatDate } from '../utils/format.js';

const tones = {
  borrow_request: 'bg-primary-50 text-primary-600',
  request_accepted: 'bg-accent-50 text-accent-600',
  request_declined: 'bg-red-50 text-red-600',
  return_requested: 'bg-indigo-50 text-indigo-600',
  return_confirmed: 'bg-accent-50 text-accent-600',
  return_reminder: 'bg-amber-50 text-amber-600',
  review_received: 'bg-violet-50 text-violet-600',
  report_resolved: 'bg-slate-100 text-slate-600',
  system: 'bg-slate-100 text-slate-600',
};

const typeIcons = {
  borrow_request: ArrowRightLeft,
  request_accepted: CheckCircle2,
  request_declined: XCircle,
  return_requested: PackageCheck,
  return_confirmed: CheckCheck,
  return_reminder: Clock3,
  review_received: Star,
  report_resolved: ShieldCheck,
  system: Megaphone,
};

const typeLabels = {
  borrow_request: 'Borrow request',
  request_accepted: 'Request accepted',
  request_declined: 'Request declined',
  return_requested: 'Return requested',
  return_confirmed: 'Return confirmed',
  return_reminder: 'Return reminder',
  review_received: 'Review received',
  report_resolved: 'Report',
  system: 'System',
};

const groupLabel = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'Earlier';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);
  if (day.getTime() === today.getTime()) return 'Today';
  if (day.getTime() === yesterday.getTime()) return 'Yesterday';
  return formatDate(d);
};

export default function Notifications() {
  const toast = useToast();
  const { unreadCount, refreshUnread, onNotification } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = (keep = false) => {
    setLoading(!keep);
    setError('');
    api
      .get('/notifications?limit=50')
      .then((res) => {
        setNotifications(res.data.notifications);
        refreshUnread();
      })
      .catch((err) => setError(getError(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  useEffect(() => {
    return onNotification((n) => {
      if (!n?.type || !n?.title) return;
      setNotifications((prev) => {
        if (prev.some((x) => x.id === n.id || x._id === n.id)) return prev;
        return [{ ...n, _id: n.id }, ...prev].slice(0, 50);
      });
    });
  }, [onNotification]);

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
      refreshUnread();
    } catch (err) {
      /* noop */
    }
  };

  const markAll = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      refreshUnread();
      toast.success('All notifications marked as read.');
    } catch (err) {
      toast.error(getError(err));
    }
  };

  const unread = notifications.filter((n) => !n.read).length;

  const groups = useMemo(() => {
    const map = new Map();
    notifications.forEach((n) => {
      const key = groupLabel(n.createdAt);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(n);
    });
    return [...map.entries()];
  }, [notifications]);

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl">
        <PageHeader
          title="Notifications"
          subtitle={`${unreadCount ?? 0} unread · ${notifications.length} total`}
          action={
            notifications.some((n) => !n.read) ? (
              <button onClick={markAll} className="btn-primary-soft">
                <CheckCheck className="h-4 w-4" /> Mark all read
              </button>
            ) : null
          }
        />

        {error && <ErrorState message={error} onRetry={load} />}

        {!error && loading && (
          <div className="space-y-2.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card flex items-start gap-3 p-4">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-1/3" />
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-2.5 w-24" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!error && !loading && notifications.length === 0 && (
          <EmptyState
            title="Nothing in your inbox"
            description="Requests, acceptances, returns and reviews will land here in real time."
            icon={Bell}
          />
        )}

        {!error && !loading && notifications.length > 0 && (
          <div>
            <div className="mb-4 flex items-center justify-between rounded-2xl border border-slate-200/70 bg-white/60 px-4 py-3">
              <span className="inline-flex items-center gap-2 text-sm text-slate-600">
                {unread > 0 ? (
                  <>
                    <span className="flex h-2.5 w-2.5 rounded-full bg-primary-500" />
                    {unread} unread {unread === 1 ? 'item' : 'items'} await your attention
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-accent-600" />
                    You are all caught up
                  </>
                )}
              </span>
              <span className="input-chip">{notifications.length} shown</span>
            </div>

            {groups.map(([label, items]) => (
              <div key={label} className="mt-7 first:mt-0">
                <p className="mb-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                  {label}
                  <span className="h-px flex-1 bg-slate-100" />
                </p>
                <div className="space-y-2.5">
                  {items.map((n) => {
                    const Icon = typeIcons[n.type] || typeIcons.system;
                    const isUnread = !n.read;
                    return (
                      <Reveal key={n._id} y={14}>
                        <div
                          onClick={() => isUnread && markRead(n._id)}
                          className={`card relative flex cursor-pointer items-start gap-3 overflow-hidden p-4 text-left transition duration-200 ${
                            isUnread
                              ? 'border-primary-200/70 bg-gradient-to-r from-primary-50/70 to-white shadow-soft'
                              : 'opacity-70'
                          }`}
                        >
                          {isUnread && (
                            <span className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-primary-500 to-accent-500" />
                          )}
                          <span
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm ${tones[n.type] || tones.system}`}
                          >
                            <Icon className="h-5 w-5" strokeWidth={2} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                              {isUnread && <span className="h-2 w-2 shrink-0 rounded-full bg-primary-500" />}
                            </div>
                            <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{n.message}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                                <Clock className="h-3 w-3" /> {timeAgo(n.createdAt)}
                              </span>
                              <span className="input-chip">{typeLabels[n.type] || 'Update'}</span>
                            </div>
                          </div>
                          {isUnread && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markRead(n._id);
                              }}
                              className="btn-ghost !px-3 !py-1.5 text-xs"
                            >
                              <CheckCheck className="h-3.5 w-3.5" /> Mark read
                            </button>
                          )}
                        </div>
                      </Reveal>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}