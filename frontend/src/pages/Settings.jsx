import { useState, useRef } from 'react';
import { Camera, KeyRound, Save, User2, Mail, CheckCircle2, Lock } from 'lucide-react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { PageHeader, Avatar, ButtonLoader, Reveal, PageTransition } from '../components/index.js';
import { getError } from '../utils/format.js';

export default function Settings() {
  const { user, setUser, refreshUser } = useAuth();
  const toast = useToast();
  const fileRef = useRef(null);

  const [profile, setProfile] = useState({
    name: user?.name || '',
    department: user?.department || '',
    year: user?.year || '',
  });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const data = new FormData();
      data.append('name', profile.name);
      data.append('department', profile.department);
      data.append('year', profile.year || '');
      const res = await api.put('/auth/profile', data);
      setUser(res.data.user);
      toast.success('Profile updated.');
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setSavingProfile(false);
    }
  };

  const uploadPhoto = async (file) => {
    if (!file) return;
    const data = new FormData();
    data.append('profileImage', file);
    const res = await api.put('/auth/profile', data);
    setUser(res.data.user);
    toast.success('Profile photo updated.');
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setSavingPassword(true);
    try {
      if (passwords.newPassword !== passwords.confirmPassword) {
        toast.error('New passwords do not match.');
        return;
      }
      const res = await api.put('/auth/password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      toast.success(res.data.message);
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      await refreshUser();
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl">
        <PageHeader title="Settings" subtitle="Manage your public profile and account security." />

        <div className="space-y-6">
          <Reveal>
            <form onSubmit={saveProfile} className="card overflow-hidden">
              <div className="h-1.5 w-full bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500" />
              <div className="p-6 sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                      <User2 className="h-4 w-4" />
                    </span>
                    Profile
                  </h2>
                  <span className="badge bg-slate-100 text-slate-600 ring-1 ring-slate-200">Public profile</span>
                </div>

                <div className="mt-7 flex flex-col items-center gap-6 sm:flex-row">
                  <div className="relative">
                    <span className="absolute -inset-1.5 rounded-full bg-gradient-to-br from-primary-500/20 via-accent-500/20 to-transparent blur-sm" />
                    <Avatar user={user} size="xl" className="relative ring-4 ring-white" />
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white shadow-lift transition hover:bg-primary-700"
                      aria-label="Change profile photo"
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <p className="text-lg font-bold text-slate-900">{user?.name}</p>
                    <p className="text-sm text-slate-500">
                      {user?.department || 'Student'}
                      {user?.year ? ` · Year ${user.year}` : ''}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">PNG or JPG, up to 5MB.</p>
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => uploadPhoto(e.target.files?.[0])}
                  />
                </div>

                <div className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-primary-600 shadow-sm">
                    <Mail className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Connected email</p>
                    <p className="truncate text-sm font-medium text-slate-800">{user?.email}</p>
                  </div>
                  <span className="badge bg-accent-50 text-accent-700 ring-1 ring-accent-200">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                  </span>
                </div>

                <div className="mt-7 grid grid-cols-1 gap-5">
                  <div>
                    <label className="label" htmlFor="s-name">Full name</label>
                    <input id="s-name" required className="input" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="label" htmlFor="s-dept">Department</label>
                      <input id="s-dept" className="input" value={profile.department} onChange={(e) => setProfile({ ...profile, department: e.target.value })} placeholder="e.g. CSE" />
                    </div>
                    <div>
                      <label className="label" htmlFor="s-year">Year</label>
                      <select id="s-year" className="input" value={profile.year} onChange={(e) => setProfile({ ...profile, year: e.target.value })}>
                        <option value="">Select</option>
                        {[1, 2, 3, 4, 5].map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end border-t border-slate-100 pt-5">
                  <button type="submit" disabled={savingProfile} className="btn-primary">
                    {savingProfile ? <ButtonLoader>Saving…</ButtonLoader> : <><Save className="h-4 w-4" /> Save changes</>}
                  </button>
                </div>
              </div>
            </form>
          </Reveal>

          <Reveal delay={0.06}>
            <form onSubmit={savePassword} className="card overflow-hidden">
              <div className="h-1.5 w-full bg-gradient-to-r from-slate-700 via-slate-600 to-slate-500" />
              <div className="p-6 sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                      <KeyRound className="h-4 w-4" />
                    </span>
                    Password
                  </h2>
                  <span className="badge bg-slate-100 text-slate-600 ring-1 ring-slate-200">
                    <Lock className="h-3.5 w-3.5" /> Account security
                  </span>
                </div>

                <div className="mt-7 space-y-5">
                  <div>
                    <label className="label" htmlFor="cp-current">Current password</label>
                    <input id="cp-current" type="password" required className="input" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="label" htmlFor="cp-new">New password</label>
                      <input id="cp-new" type="password" required className="input" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} />
                    </div>
                    <div>
                      <label className="label" htmlFor="cp-confirm">Confirm new password</label>
                      <input id="cp-confirm" type="password" required className="input" value={passwords.confirmPassword} onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })} />
                    </div>
                  </div>
                  <p className="rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-700 ring-1 ring-inset ring-amber-100">
                    Use at least 6 characters and keep it unique to BorrowBox.
                  </p>
                </div>

                <div className="mt-8 flex justify-end border-t border-slate-100 pt-5">
                  <button type="submit" disabled={savingPassword} className="btn-primary">
                    {savingPassword ? <ButtonLoader>Updating…</ButtonLoader> : <><KeyRound className="h-4 w-4" /> Update password</>}
                  </button>
                </div>
              </div>
            </form>
          </Reveal>
        </div>
      </div>
    </PageTransition>
  );
}