import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, KeyRound, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { ButtonLoader, AuthShell } from '../components/index.js';
import { getError } from '../utils/format.js';

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`${user.name}, welcome back!`, 'Logged in');
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(getError(err, 'Login failed.'));
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email, password) => {
    setForm({ email, password });
    setError('');
  };

  return (
    <AuthShell
      footer={
        <p className="mt-6 text-center text-sm text-slate-500">
          New to BorrowBox?{' '}
          <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-700">
            Create an account
          </Link>
        </p>
      }
    >
      <div className="rounded-3xl border border-slate-200/80 bg-white/85 p-8 shadow-lift backdrop-blur-md sm:p-10">
        <motion.span
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-primary-600"
        >
          <LogIn className="h-3.5 w-3.5" /> Welcome back
        </motion.span>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">Good to see you again</h1>
        <p className="mt-1.5 text-sm text-slate-500">Log in to borrow and share items with your campus.</p>

        <div className="divider-gradient my-6" />

        {error && (
          <div className="mb-5 rounded-lg border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="label">Email</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input pl-10"
                placeholder="you@college.edu"
                autoComplete="email"
              />
            </div>
          </div>
          <div>
            <label htmlFor="password" className="label">Password</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input pl-10 pr-10"
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <motion.div whileTap={{ scale: 0.99 }}>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? <ButtonLoader>Logging in…</ButtonLoader> : <>Continue <ArrowRight className="h-4 w-4" /></>}
            </button>
          </motion.div>
        </form>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white/60 p-4 shadow-card backdrop-blur">
        <div className="flex items-center justify-between">
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <KeyRound className="h-3.5 w-3.5" /> Demo accounts
          </p>
          <span className="badge badge-dot bg-primary-50 text-primary-600 ring-primary-200">tap to fill</span>
        </div>
        <div className="mt-3 space-y-2">
          <button
            onClick={() => fillDemo('lani@borrowbox.com', 'Lani@123')}
            className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm transition hover:-translate-y-0.5 hover:border-primary-300 hover:bg-primary-50 hover:shadow-soft"
          >
            <span>
              <span className="font-semibold text-slate-800">Lani</span>
              <span className="block text-xs text-slate-500">lani@borrowbox.com</span>
            </span>
            <span className="text-xs font-medium text-primary-600">Fill</span>
          </button>
          <button
            onClick={() => fillDemo('arun@borrowbox.com', 'Arun@123')}
            className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm transition hover:-translate-y-0.5 hover:border-primary-300 hover:bg-primary-50 hover:shadow-soft"
          >
            <span>
              <span className="font-semibold text-slate-800">Arun Kumar</span>
              <span className="block text-xs text-slate-500">arun@borrowbox.com</span>
            </span>
            <span className="text-xs font-medium text-primary-600">Fill</span>
          </button>
        </div>
      </div>
    </AuthShell>
  );
}