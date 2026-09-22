import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PackageOpen, Home, Search, RotateCcw, PackageX } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-surface px-4 text-center">
      <div aria-hidden="true" className="animate-blob-a pointer-events-none absolute -top-32 -left-24 h-96 w-96 rounded-full bg-primary-200/40 blur-3xl" />
      <div aria-hidden="true" className="animate-blob-b pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-accent-200/40 blur-3xl" />
      <div aria-hidden="true" className="animate-float pointer-events-none absolute top-1/3 right-1/4 h-24 w-24 rounded-full bg-primary-300/30 blur-2xl" />

      <motion.span
        initial={{ opacity: 0, rotate: -8 }}
        animate={{ opacity: 1, rotate: 0 }}
        transition={{ duration: 0.5 }}
        className="animate-spin-slow relative z-10 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary-600 to-accent-600 text-white shadow-glow"
      >
        <PackageOpen className="h-9 w-9" />
      </motion.span>

      <div className="relative z-10 mt-8 flex items-center justify-center gap-4" aria-hidden="true">
        <span className="animate-float inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-500 shadow-soft" style={{ animationDelay: '0.4s' }}>
          <Search className="h-3.5 w-3.5 text-primary-500" /> still searching…
        </span>
        <span className="animate-float inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-500 shadow-soft" style={{ animationDelay: '1.1s' }}>
          <PackageX className="h-3.5 w-3.5 text-accent-600" /> no match found
        </span>
        <span className="animate-float inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-500 shadow-soft" style={{ animationDelay: '1.9s' }}>
          <RotateCcw className="h-3.5 w-3.5 text-primary-500" /> return home
        </span>
      </div>

      <motion.h1
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.1 }}
        className="relative z-10 mt-6 text-7xl font-black tracking-tight sm:text-8xl"
      >
        <span className="text-gradient">404</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="relative z-10 mt-3 text-lg font-semibold text-slate-900"
      >
        Page not found
      </motion.p>
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.28 }}
        className="relative z-10 mt-2 max-w-sm text-sm leading-relaxed text-slate-500"
      >
        The page you're looking for was moved, borrowed, or never existed.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.36 }}
        whileTap={{ scale: 0.98 }}
        className="relative z-10 mt-8"
      >
        <Link to="/" className="btn-primary px-6 py-3">
          <Home className="h-4 w-4" /> Back to home
        </Link>
      </motion.div>
    </div>
  );
}