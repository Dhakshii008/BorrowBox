import { motion } from 'framer-motion';
import { RefreshCcw, ShieldCheck, Sparkles, Laptop, Drill, Wind } from 'lucide-react';
import { Logo } from './index.js';

const featureItems = [
  { icon: RefreshCcw, title: 'Free to borrow & lend', desc: 'No rentals and no fees. Borrow what you need, share what you own.' },
  { icon: ShieldCheck, title: 'Campus-trusted only', desc: 'Every member belongs to your college, so lending stays safe and simple.' },
  { icon: Sparkles, title: 'Tracked in real time', desc: 'Availability, due dates, and handoffs are managed in one clean dashboard.' },
];

const floatingChips = [
  { icon: Laptop, label: 'Laptop · available', delay: '0s' },
  { icon: Drill, label: 'Drill kit · borrowed', delay: '1.4s' },
  { icon: Wind, label: 'Stand mixer · available', delay: '2.3s' },
];

const ease = [0.21, 0.55, 0.24, 1];

export default function AuthShell({ children, footer }) {
  return (
    <div className="relative grid min-h-screen overflow-hidden bg-surface lg:grid-cols-[46%_54%] xl:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-slate-950 via-primary-950 to-slate-900 lg:block">
        <div aria-hidden="true" className="animate-blob-a absolute -top-24 -left-16 h-80 w-80 rounded-full bg-primary-600/40 blur-3xl" />
        <div aria-hidden="true" className="animate-blob-b absolute right-0 bottom-1/4 h-96 w-96 rounded-full bg-accent-500/25 blur-3xl" />
        <div aria-hidden="true" className="animate-blob-c absolute top-1/3 left-1/3 h-72 w-72 rounded-full bg-primary-400/20 blur-3xl" />
        <div aria-hidden="true" className="animate-float absolute top-16 right-10 h-24 w-24 rounded-full bg-accent-400/20 blur-2xl" />
        <div aria-hidden="true" className="absolute inset-x-12 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="relative z-10 flex h-full flex-col justify-between p-12 xl:p-16"
        >
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 shadow-glow">
              <svg viewBox="0 0 64 64" className="h-6 w-6" fill="none">
                <path d="M21 44V28a11 11 0 1 1 22 0v16" stroke="white" strokeWidth="5" strokeLinecap="round" />
                <path d="M20 34h8v10h-8zM36 34h8v10h-8z" fill="white" />
                <circle cx="32" cy="20" r="4.5" fill="#6EE7B7" />
              </svg>
            </span>
            <span className="text-xl font-semibold tracking-tight text-white">
              Borrow<span className="text-accent-400">Box</span>
            </span>
          </div>

          <div className="max-w-md">
            <div className="flex flex-wrap gap-2">
              <span className="pill border-primary-400/30 bg-primary-400/10 text-xs text-primary-200">100% free</span>
              <span className="pill border-accent-400/30 bg-accent-400/10 text-xs text-accent-200">Campus verified</span>
              <span className="pill border-white/10 bg-white/5 text-xs text-slate-300">Zero rental stress</span>
            </div>
            <h1 className="mt-8 text-4xl font-bold leading-tight tracking-tight text-white xl:text-5xl">
              Everything on campus,<br />
              <span className="text-gradient">shared freely.</span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-slate-300/90">
              Borrow the drill for a shelf. Lend your camera for a shoot. BorrowBox connects your campus for quick, friendly, no-cost sharing.
            </p>

            <ul className="mt-10 space-y-5">
              {featureItems.map((f) => (
                <li key={f.title} className="flex items-start gap-3.5">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-accent-400">
                    <f.icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{f.title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-slate-400">{f.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap gap-3">
            {floatingChips.map((c) => (
              <span
                key={c.label}
                className="animate-float inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-slate-300 backdrop-blur-md"
                style={{ animationDelay: c.delay }}
              >
                <c.icon className="h-3.5 w-3.5 text-accent-400" />
                {c.label}
              </span>
            ))}
          </div>
        </motion.div>
      </aside>

      <main className="relative flex w-full flex-col items-center justify-center overflow-hidden px-4 py-10">
        <div aria-hidden="true" className="animate-blob-a pointer-events-none absolute -top-32 -right-24 h-80 w-80 rounded-full bg-primary-200/40 blur-3xl" />
        <div aria-hidden="true" className="animate-blob-b pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-accent-200/40 blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="mb-8 lg:hidden"
        >
          <Logo />
        </motion.div>

        <div className="relative z-10 w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.05, ease }}
          >
            {children}
          </motion.div>
          {footer && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.18, ease }}
            >
              {footer}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}