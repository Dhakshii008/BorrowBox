import { motion } from 'framer-motion';

export default function StatCard({ icon: Icon, label, value, sub, tone = 'primary' }) {
  const tones = {
    primary: 'bg-primary-50 text-primary-600',
    accent: 'bg-accent-50 text-accent-600',
    amber: 'bg-amber-50 text-amber-600',
    violet: 'bg-violet-50 text-violet-600',
    slate: 'bg-slate-100 text-slate-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card flex items-center gap-4 p-4"
    >
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-bold leading-tight text-slate-900">{value}</p>
        <p className="truncate text-sm font-medium text-slate-500">{label}</p>
        {sub && <p className="truncate text-xs text-slate-400">{sub}</p>}
      </div>
    </motion.div>
  );
}