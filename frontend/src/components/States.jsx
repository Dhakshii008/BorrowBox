import { motion } from 'framer-motion';
import { PackageOpen, WifiOff } from 'lucide-react';

export function EmptyState({ title, description, icon: Icon = PackageOpen, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white/50 px-8 py-16 text-center"
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-50 to-accent-50 text-primary-600 ring-1 ring-inset ring-primary-100">
        <Icon className="h-8 w-8" strokeWidth={1.8} />
      </div>
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  );
}

export function ErrorState({ message = 'Something went wrong. Please try again.', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-red-200 bg-red-50/50 px-8 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">
        <WifiOff className="h-7 w-7" strokeWidth={1.8} />
      </div>
      <h3 className="text-base font-bold text-red-900">Couldn't load this data</h3>
      <p className="mt-1 max-w-sm text-sm text-red-700/80">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary mt-5">
          Try again
        </button>
      )}
    </div>
  );
}