import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard,
  Search,
  ArrowDownToLine,
  ArrowUpFromLine,
  Inbox,
  Bell,
  Shield,
  Settings,
  LogOut,
  Menu,
  X,
  Store,
  Plus,
  Shuffle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { Logo, Avatar, PageTransition, CursorGlow } from '../components/index.js';

const navSections = [
  {
    heading: 'Overview',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/discover', label: 'Discover', icon: Search, badge: null },
    ],
  },
  {
    heading: 'Exchanges',
    items: [
      { to: '/borrowings', label: 'My Borrowings', icon: ArrowDownToLine },
      { to: '/lending', label: 'My Lending', icon: ArrowUpFromLine },
      { to: '/requests', label: 'Requests', icon: Inbox },
    ],
  },
  {
    heading: 'Account',
    items: [
      { to: '/notifications', label: 'Notifications', icon: Bell },
      { to: '/reputation', label: 'My Reputation', icon: Shield },
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

const mobileNav = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/discover', label: 'Discover', icon: Search },
  { to: '/borrowings', label: 'Borrowings', icon: ArrowDownToLine },
  { to: '/notifications', label: 'Alerts', icon: Bell },
  { to: '/settings', label: 'Profile', icon: Settings },
];

function NavLinkItem({ to, label, icon: Icon, unread, onClick, activeClass = 'bg-primary-50 text-primary-700' }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-slate-100/80 hover:text-slate-900 ${
          isActive ? `${activeClass} shadow-sm` : ''
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && <span aria-hidden="true" className="absolute -left-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary-600" />}
          <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={isActive ? 2.2 : 1.9} />
          <span className="hidden flex-1 truncate text-left lg:block">{label}</span>
          {unread > 0 && (
            <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-600 px-1.5 text-[11px] font-bold text-white ring-2 ring-white">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { unreadCount } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-surface pb-24 md:pb-0">
      <CursorGlow />

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200/80 bg-white lg:flex">
        <div className="flex items-center justify-between px-6 py-6">
          <Logo />
        </div>
        <nav className="flex-1 space-y-5 overflow-y-auto px-4 py-2">
          {navSections.map((section) => (
            <div key={section.heading}>
              <p className="mb-1.5 px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">{section.heading}</p>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLinkItem key={item.to} {...item} unread={item.label === 'Notifications' ? unreadCount : 0} />
                ))}
              </div>
            </div>
          ))}
          {user?.role === 'admin' && (
            <div>
              <p className="mb-1.5 px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Staff</p>
              <NavLinkItem to="/admin" label="Admin" icon={Store} activeClass="bg-violet-50 text-violet-700" />
            </div>
          )}
        </nav>
        <div className="border-t border-slate-200 p-4">
          <div className="mb-2 flex items-center gap-3 rounded-2xl bg-slate-50 p-3 ring-1 ring-inset ring-slate-100">
            <Avatar user={user} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-800">{user?.name}</p>
              <p className="truncate text-xs font-medium text-accent-600">Trust {user?.trustScore ?? 50}/100</p>
            </div>
            <SettingsIconLink onClick={() => navigate('/settings')} />
          </div>
          <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600">
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>
      </aside>

      {/* Tablet collapse: hamburger toggling mobile drawer + icon rail */}
      <div className="fixed inset-y-0 left-0 z-30 hidden w-20 flex-col items-center border-r border-slate-200/80 bg-white py-6 md:flex lg:hidden">
        <Logo className="h-8 w-8" textClass="hidden" />
        <nav className="mt-8 flex flex-1 flex-col items-center gap-1">
          {[...navSections.flatMap((s) => s.items), ...(user?.role === 'admin' ? [{ to: '/admin', icon: Store }] : [])].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 transition ${isActive ? 'bg-primary-50 text-primary-700' : 'hover:bg-slate-100 hover:text-slate-900'}`
              }
            >
              <item.icon className="h-5 w-5" strokeWidth={1.9} />
            </NavLink>
          ))}
        </nav>
        <button onClick={handleLogout} className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600">
          <LogOut className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white shadow-modal"
            >
              <div className="flex items-center justify-between px-5 py-5">
                <Logo />
                <button onClick={() => setMobileOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Close menu">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex-1 space-y-5 overflow-y-auto px-4 py-2">
                {navSections.map((section) => (
                  <div key={section.heading}>
                    <p className="mb-1.5 px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">{section.heading}</p>
                    <div className="space-y-0.5">
                      {section.items.map((item) => (
                        <NavLinkItem key={item.to} {...item} unread={item.label === 'Notifications' ? unreadCount : 0} onClick={() => setMobileOpen(false)} />
                      ))}
                    </div>
                  </div>
                ))}
                {user?.role === 'admin' && <NavLinkItem to="/admin" label="Admin" icon={Store} activeClass="bg-violet-50 text-violet-700" onClick={() => setMobileOpen(false)} />}
              </nav>
              <div className="flex items-center justify-between border-t border-slate-200 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar user={user} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-800">{user?.name}</p>
                    <p className="text-xs text-slate-400">{user?.email}</p>
                  </div>
                </div>
                <button onClick={handleLogout} className="rounded-lg bg-slate-100 p-2.5 text-slate-500 hover:bg-red-50 hover:text-red-600">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <div className="md:pl-20 lg:pl-64">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-200/70 bg-white/80 px-4 backdrop-blur-xl md:hidden">
          <button onClick={() => setMobileOpen(true)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <Logo className="h-6 w-6" textClass="text-base" />
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => navigate('/notifications')} className="relative rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-600 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <button onClick={() => navigate('/settings')} aria-label="Profile">
              <Avatar user={user} size="sm" />
            </button>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-center justify-around border-t border-slate-200/80 bg-white/90 px-2 backdrop-blur-xl md:hidden" aria-label="Primary">
        {mobileNav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            className={({ isActive }) =>
              `relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-[11px] font-semibold transition ${
                isActive ? 'text-primary-700' : 'text-slate-400 hover:text-slate-700'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.3 : 1.9} />
                {label === 'Alerts' && unreadCount > 0 && (
                  <span className="absolute right-1/2 top-0.5 mr-[-14px] flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-600 px-1 text-[9px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* FAB: share an item */}
      <button
        onClick={() => navigate('/items/new')}
        className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary-600 to-primary-500 text-white shadow-glow transition hover:scale-105 active:scale-95 md:hidden"
        aria-label="Share an item"
      >
        <Plus className="h-6 w-6" strokeWidth={2.4} />
      </button>

      {/* Floating composer (desktop hint) */}
      <button
        onClick={() => navigate('/items/new')}
        className="fixed bottom-6 right-6 z-30 hidden items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lift transition hover:-translate-y-0.5 hover:bg-slate-800 md:flex"
        aria-label="Share an item"
      >
        <Plus className="h-4 w-4" /> Share
      </button>
    </div>
  );
}

function SettingsIconLink({ onClick }) {
  return (
    <button onClick={onClick} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-200/70 hover:text-slate-700" aria-label="Settings">
      <Settings className="h-4 w-4" />
    </button>
  );
}