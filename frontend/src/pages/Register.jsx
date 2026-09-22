import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Mail, Lock, UserRound, GraduationCap, Hash, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { ButtonLoader, AuthShell } from '../components/index.js';
import { getError } from '../utils/format.js';

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    department: '',
    year: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const user = await register({
        name: form.name,
        email: form.email,
        password: form.password,
        department: form.department,
        year: form.year ? Number(form.year) : null,
      });
      toast.success(`Welcome to BorrowBox, ${user.name}!`, 'Account created');
      navigate('/dashboard');
    } catch (err) {
      setError(getError(err, 'Registration failed.'));
    } finally {
      setLoading(false);
    }
  };

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <AuthShell
      footer={
        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">
            Log in
          </Link>
        </p>
      }
    >
      <div className="rounded-3xl border border-slate-200/80 bg-white/85 p-8 shadow-lift backdrop-blur-md sm:p-10">
        <motion.span
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="inline-flex items-center gap-2 rounded-full bg-accent-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-accent-600"
        >
          <UserPlus className="h-3.5 w-3.5" /> Join BorrowBox
        </motion.span>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">Create your account</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Join the campus sharing community for free — forever.
        </p>

        <div className="divider-gradient my-6" />

        {error && (
          <div className="mb-5 rounded-lg border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label" htmlFor="r-name">Full name</label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input id="r-name" required className="input pl-10" placeholder="e.g. Lani" value={form.name} onChange={set('name')} autoComplete="name" />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="r-email">Email</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input id="r-email" type="email" required className="input pl-10" placeholder="you@college.edu" value={form.email} onChange={set('email')} autoComplete="email" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="r-dept">Department</label>
              <div className="relative">
                <GraduationCap className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input id="r-dept" className="input pl-10" placeholder="CSE" value={form.department} onChange={set('department')} />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="r-year">Year</label>
              <div className="relative">
                <Hash className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select id="r-year" className="input pl-10" value={form.year} onChange={set('year')}>
                  <option value="">Select</option>
                  {[1, 2, 3, 4, 5].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div>
            <label className="label" htmlFor="r-pass">Password</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input id="r-pass" type="password" required className="input pl-10" placeholder="At least 6 characters" value={form.password} onChange={set('password')} autoComplete="new-password" />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="r-pass2">Confirm password</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input id="r-pass2" type="password" required className="input pl-10" placeholder="Repeat password" value={form.confirmPassword} onChange={set('confirmPassword')} autoComplete="new-password" />
            </div>
          </div>
          <motion.div whileTap={{ scale: 0.99 }}>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? <ButtonLoader>Creating account…</ButtonLoader> : <>Create account <ArrowRight className="h-4 w-4" /></>}
            </button>
          </motion.div>
        </form>
      </div>
    </AuthShell>
  );
}