'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getAdminUsers } from '@/lib/api';
import { Search, FileText, Briefcase, Zap, DollarSign, Crown, MailCheck, MailX } from 'lucide-react';

interface AdminUser {
  id: string;
  full_name: string | null;
  email: string;
  created_at: string;
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
  plan: string;
  subscription_status: string | null;
  cv_count: number;
  job_count: number;
  api_calls: number;
  api_cost: number;
}

const planLabel = (plan: string) =>
  plan === 'pro_voice' || plan === 'pro_plus' ? 'Pro Voice'
    : plan === 'pro' ? 'Pro'
    : plan === 'starter' ? 'Pass'
    : 'Free';

const planColor = (plan: string) =>
  plan === 'pro_voice' || plan === 'pro_plus' ? { bg: 'rgba(192,132,252,0.15)', fg: '#c084fc' }
    : plan === 'pro' ? { bg: 'rgba(118,77,240,0.18)', fg: '#a78bfa' }
    : plan === 'starter' ? { bg: 'rgba(52,211,153,0.15)', fg: '#34d399' }
    : { bg: 'rgba(255,255,255,0.06)', fg: 'rgba(255,255,255,0.55)' };

export default function BosiUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAdminUsers()
      .then((res) => setUsers(res.data.users || []))
      .catch((err: any) => {
        // Previously the .catch was empty, which is why the page
        // rendered "No users yet" for every failure. Actually surface
        // the error so we can see Supabase/API problems.
        const msg = err?.response?.data?.error || err?.message || 'Failed to load users';
        setError(msg);
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="lds-roller"><div /><div /><div /><div /><div /><div /><div /><div /></div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="rounded-xl p-6"
        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}
      >
        <p className="text-red-300 font-bold text-sm mb-1">Couldn't load users</p>
        <p className="text-white/60 text-xs">{error}</p>
      </div>
    );
  }

  const q = search.trim().toLowerCase();
  const filtered = !q ? users : users.filter((u) =>
    (u.email || '').toLowerCase().includes(q) ||
    (u.full_name || '').toLowerCase().includes(q) ||
    (u.id || '').toLowerCase().includes(q)
  );

  const totalCost = users.reduce((sum, u) => sum + u.api_cost, 0);
  const paidCount = users.filter((u) => u.plan && u.plan !== 'free').length;

  return (
    <div className="space-y-6">

      {/* Summary bar */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-xl p-4" style={{ background: '#1a1e42', border: '1px solid rgba(255,255,255,0.10)' }}>
          <p className="text-white/70 text-[10px] uppercase tracking-widest font-semibold mb-1">Total Users</p>
          <p className="text-white text-2xl font-black">{users.length}</p>
        </div>
        <div className="rounded-xl p-4" style={{ background: 'rgba(192,132,252,0.08)', border: '1px solid rgba(192,132,252,0.22)' }}>
          <p className="text-[10px] uppercase tracking-widest font-semibold mb-1" style={{ color: '#c084fc' }}>Paid</p>
          <p className="text-white text-2xl font-black">{paidCount}</p>
        </div>
        <div className="rounded-xl p-4" style={{ background: '#1a1e42', border: '1px solid rgba(255,255,255,0.10)' }}>
          <p className="text-white/70 text-[10px] uppercase tracking-widest font-semibold mb-1">Total CVs</p>
          <p className="text-white text-2xl font-black">{users.reduce((s, u) => s + u.cv_count, 0)}</p>
        </div>
        <div className="rounded-xl p-4" style={{ background: '#1a1e42', border: '1px solid rgba(255,255,255,0.10)' }}>
          <p className="text-white/70 text-[10px] uppercase tracking-widest font-semibold mb-1">Total Jobs</p>
          <p className="text-white text-2xl font-black">{users.reduce((s, u) => s + u.job_count, 0)}</p>
        </div>
        <div className="rounded-xl p-4" style={{ background: '#1a1e42', border: '1px solid rgba(255,255,255,0.10)' }}>
          <p className="text-white/70 text-[10px] uppercase tracking-widest font-semibold mb-1">API Cost</p>
          <p className="text-white text-2xl font-black">${totalCost.toFixed(4)}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
        <input
          type="text"
          placeholder="Search users by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm text-white placeholder-white/40 outline-none"
          style={{
            background: '#1a1e42',
            border: '1px solid rgba(255,255,255,0.12)',
          }}
        />
      </div>

      {/* Users Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: '#1a1e42', border: '1px solid rgba(255,255,255,0.10)' }}
      >
        {/* Header */}
        <div
          className="grid grid-cols-12 gap-3 px-5 py-3 text-[10px] text-white/60 uppercase tracking-widest font-bold"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.10)' }}
        >
          <div className="col-span-4">User</div>
          <div className="col-span-2 text-center">Plan</div>
          <div className="col-span-2 text-center">Joined</div>
          <div className="col-span-1 text-center">CVs</div>
          <div className="col-span-1 text-center">Jobs</div>
          <div className="col-span-2 text-center">Cost</div>
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center text-white/50 text-sm">
            {search ? 'No users match your search' : 'No users yet'}
          </div>
        ) : (
          filtered.map((user, i) => {
            const pc = planColor(user.plan);
            const verified = !!user.email_confirmed_at;
            return (
            <div
              key={user.id}
              className="grid grid-cols-12 gap-3 px-5 py-3.5 items-center hover:bg-white/[0.04] transition-colors"
              style={{
                borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
              }}
            >
              <div className="col-span-4 flex items-center gap-3 min-w-0">
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: 'rgba(118,77,240,0.2)', color: '#a78bfa' }}
                >
                  {(user.full_name || user.email)?.charAt(0)?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-semibold truncate flex items-center gap-1.5">
                    {user.full_name || user.email}
                    {verified
                      ? <MailCheck className="h-3 w-3 shrink-0" style={{ color: '#34d399' }} />
                      : <MailX className="h-3 w-3 shrink-0" style={{ color: '#fbbf24' }} />}
                  </p>
                  {user.full_name && (
                    <p className="text-white/50 text-xs truncate">{user.email}</p>
                  )}
                </div>
              </div>
              <div className="col-span-2 text-center">
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{ background: pc.bg, color: pc.fg }}
                >
                  {user.plan !== 'free' && <Crown className="h-2.5 w-2.5" />}
                  {planLabel(user.plan)}
                </span>
              </div>
              <div className="col-span-2 text-center text-white/60 text-xs">
                {new Date(user.created_at).toLocaleDateString()}
              </div>
              <div className="col-span-1 text-center">
                <span className="inline-flex items-center gap-1 text-white/80 text-xs">
                  <FileText className="h-3 w-3 text-white/40" /> {user.cv_count}
                </span>
              </div>
              <div className="col-span-1 text-center">
                <span className="inline-flex items-center gap-1 text-white/80 text-xs">
                  <Briefcase className="h-3 w-3 text-white/40" /> {user.job_count}
                </span>
              </div>
              <div className="col-span-2 text-center">
                <span className="inline-flex items-center gap-1 text-xs font-mono" style={{ color: user.api_cost > 0 ? '#34d399' : 'rgba(255,255,255,0.5)' }}>
                  <DollarSign className="h-3 w-3" /> {user.api_cost.toFixed(4)}
                </span>
              </div>
            </div>
          )})
        )}
      </div>
    </div>
  );
}
