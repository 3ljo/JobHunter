'use client';

import { useEffect, useState } from 'react';
import { getAdminReferrals } from '@/lib/api';
import toast from 'react-hot-toast';
import { Users, Trophy, Gift, Link2, Search } from 'lucide-react';

interface Referral {
  id: string;
  referrer_id: string;
  referred_user_id: string;
  referrer_email: string;
  referred_email: string;
  referral_code: string;
  referrer_reward_applied: boolean;
  referred_reward_applied: boolean;
  created_at: string;
}

interface ReferralCode {
  id: string;
  user_id: string;
  user_email: string;
  code: string;
  times_used: number;
  created_at: string;
}

interface TopReferrer {
  user_id: string;
  email: string;
  referral_count: number;
}

interface Stats {
  total_referrals: number;
  total_codes: number;
  rewards_given: number;
}

export default function BosiReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [codes, setCodes] = useState<ReferralCode[]>([]);
  const [topReferrers, setTopReferrers] = useState<TopReferrer[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'referrals' | 'codes'>('referrals');
  const [search, setSearch] = useState('');

  useEffect(() => {
    getAdminReferrals()
      .then((res) => {
        setReferrals(res.data.referrals || []);
        setCodes(res.data.codes || []);
        setTopReferrers(res.data.topReferrers || []);
        setStats(res.data.stats || null);
      })
      .catch(() => toast.error('Failed to load referral data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="lds-roller"><div /><div /><div /><div /><div /><div /><div /><div /></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Gift className="h-5 w-5" style={{ color: '#764DF0' }} />
        <h2 className="text-white text-xl font-black">Referral Tracker</h2>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl p-5" style={{ background: '#1a1e42', border: '1px solid rgba(255,255,255,0.10)' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-white/70 text-xs uppercase tracking-widest font-semibold">Total Referrals</p>
              <Users className="h-4 w-4" style={{ color: '#764DF0', opacity: 0.8 }} />
            </div>
            <p className="text-white text-3xl font-black tabular-nums">{stats.total_referrals}</p>
          </div>
          <div className="rounded-xl p-5" style={{ background: '#1a1e42', border: '1px solid rgba(255,255,255,0.10)' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-white/70 text-xs uppercase tracking-widest font-semibold">Active Codes</p>
              <Link2 className="h-4 w-4" style={{ color: '#60a5fa', opacity: 0.8 }} />
            </div>
            <p className="text-white text-3xl font-black tabular-nums">{stats.total_codes}</p>
          </div>
          <div className="rounded-xl p-5" style={{ background: '#1a1e42', border: '1px solid rgba(255,255,255,0.10)' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-white/70 text-xs uppercase tracking-widest font-semibold">Rewards Given</p>
              <Trophy className="h-4 w-4" style={{ color: '#fbbf24', opacity: 0.8 }} />
            </div>
            <p className="text-white text-3xl font-black tabular-nums">{stats.rewards_given}</p>
          </div>
        </div>
      )}

      {/* Top Referrers leaderboard */}
      {topReferrers.length > 0 && (
        <div className="rounded-xl p-5" style={{ background: '#1a1e42', border: '1px solid rgba(255,255,255,0.10)' }}>
          <h3 className="text-white/70 text-xs uppercase tracking-widest font-semibold mb-4 flex items-center gap-2">
            <Trophy className="h-3.5 w-3.5" style={{ color: '#fbbf24' }} /> Top Referrers
          </h3>
          <div className="space-y-2">
            {topReferrers.map((r, i) => (
              <div key={r.user_id} className="flex items-center justify-between py-2" style={{ borderBottom: i < topReferrers.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                <div className="flex items-center gap-3">
                  <span
                    className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-black"
                    style={{
                      background: i === 0 ? 'rgba(251,191,36,0.2)' : i === 1 ? 'rgba(192,192,192,0.15)' : i === 2 ? 'rgba(205,127,50,0.15)' : 'rgba(255,255,255,0.05)',
                      color: i === 0 ? '#fbbf24' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : 'rgba(255,255,255,0.4)',
                    }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-white text-sm font-medium truncate" style={{ maxWidth: '200px' }}>
                    {r.email}
                  </span>
                </div>
                <span className="text-white font-bold tabular-nums">{r.referral_count} referrals</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search + Tabs */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email, code..."
            className="w-full h-10 rounded-lg pl-9 pr-3 text-sm text-white placeholder:text-white/25"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', outline: 'none' }}
          />
        </div>
      </div>
      <div className="flex gap-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        {([{ key: 'referrals', label: 'Referrals' }, { key: 'codes', label: 'All Codes' }] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-3 text-sm font-semibold transition-all"
            style={{
              color: tab === t.key ? '#fff' : 'rgba(255,255,255,0.4)',
              borderBottom: tab === t.key ? '2px solid #764DF0' : '2px solid transparent',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Referrals table */}
      {tab === 'referrals' && (
        <div className="rounded-xl overflow-hidden" style={{ background: '#1a1e42', border: '1px solid rgba(255,255,255,0.10)' }}>
          {referrals.length === 0 ? (
            <div className="p-8 text-center text-white/40 text-sm">No referrals yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <th className="text-left p-4 text-white/50 text-xs uppercase tracking-widest font-semibold">Referrer</th>
                    <th className="text-left p-4 text-white/50 text-xs uppercase tracking-widest font-semibold">Referred User</th>
                    <th className="text-left p-4 text-white/50 text-xs uppercase tracking-widest font-semibold">Code</th>
                    <th className="text-left p-4 text-white/50 text-xs uppercase tracking-widest font-semibold">Referrer Reward</th>
                    <th className="text-left p-4 text-white/50 text-xs uppercase tracking-widest font-semibold">New User Reward</th>
                    <th className="text-left p-4 text-white/50 text-xs uppercase tracking-widest font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.filter((r) => {
                    if (!search.trim()) return true;
                    const q = search.toLowerCase();
                    return r.referrer_email.toLowerCase().includes(q) || r.referred_email.toLowerCase().includes(q) || r.referral_code.toLowerCase().includes(q);
                  }).map((r) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td className="p-4 text-white/80 truncate" style={{ maxWidth: '180px' }}>{r.referrer_email}</td>
                      <td className="p-4 text-white/80 truncate" style={{ maxWidth: '180px' }}>{r.referred_email}</td>
                      <td className="p-4"><span className="text-white font-mono text-xs">{r.referral_code}</span></td>
                      <td className="p-4">
                        <span
                          className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                          style={{
                            background: r.referrer_reward_applied ? 'rgba(16,185,129,0.12)' : 'rgba(251,191,36,0.12)',
                            color: r.referrer_reward_applied ? '#34d399' : '#fbbf24',
                          }}
                        >
                          {r.referrer_reward_applied ? 'Applied' : 'Pending'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                          style={{
                            background: r.referred_reward_applied ? 'rgba(16,185,129,0.12)' : 'rgba(251,191,36,0.12)',
                            color: r.referred_reward_applied ? '#34d399' : '#fbbf24',
                          }}
                        >
                          {r.referred_reward_applied ? 'Applied' : 'Pending'}
                        </span>
                      </td>
                      <td className="p-4 text-white/60 text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Codes table */}
      {tab === 'codes' && (
        <div className="rounded-xl overflow-hidden" style={{ background: '#1a1e42', border: '1px solid rgba(255,255,255,0.10)' }}>
          {codes.length === 0 ? (
            <div className="p-8 text-center text-white/40 text-sm">No referral codes generated yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <th className="text-left p-4 text-white/50 text-xs uppercase tracking-widest font-semibold">User</th>
                    <th className="text-left p-4 text-white/50 text-xs uppercase tracking-widest font-semibold">Code</th>
                    <th className="text-left p-4 text-white/50 text-xs uppercase tracking-widest font-semibold">Times Used</th>
                    <th className="text-left p-4 text-white/50 text-xs uppercase tracking-widest font-semibold">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {codes.filter((c) => {
                    if (!search.trim()) return true;
                    const q = search.toLowerCase();
                    return c.user_email.toLowerCase().includes(q) || c.code.toLowerCase().includes(q);
                  }).map((c) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td className="p-4 text-white/80 truncate" style={{ maxWidth: '200px' }}>{c.user_email}</td>
                      <td className="p-4"><span className="text-white font-mono font-bold">{c.code}</span></td>
                      <td className="p-4 text-white/80 tabular-nums">{c.times_used}</td>
                      <td className="p-4 text-white/60 text-xs">{new Date(c.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
