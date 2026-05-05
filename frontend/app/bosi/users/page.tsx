'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { getAdminUsers } from '@/lib/api';
import { Search, FileText, Briefcase, DollarSign, Crown, MailCheck, MailX, Filter, ChevronRight } from 'lucide-react';
import UserDetailDrawer from '@/components/admin/UserDetailDrawer';

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

type PlanFilter = 'all' | 'paid' | 'free' | 'pro_voice' | 'pro' | 'starter';
type VerifiedFilter = 'all' | 'verified' | 'unverified';
type SortKey = 'newest' | 'oldest' | 'cost' | 'cvs' | 'jobs';

const PLAN_FILTERS: { key: PlanFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'paid', label: 'Paid' },
  { key: 'pro_voice', label: 'Pro Voice' },
  { key: 'pro', label: 'Pro' },
  { key: 'starter', label: 'Pass' },
  { key: 'free', label: 'Free' },
];

const VERIFIED_FILTERS: { key: VerifiedFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'verified', label: 'Verified' },
  { key: 'unverified', label: 'Unverified' },
];

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'newest', label: 'Newest' },
  { key: 'oldest', label: 'Oldest' },
  { key: 'cost', label: 'Top cost' },
  { key: 'cvs', label: 'Most CVs' },
  { key: 'jobs', label: 'Most jobs' },
];

export default function BosiUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [planFilter, setPlanFilter] = useState<PlanFilter>('all');
  const [verifiedFilter, setVerifiedFilter] = useState<VerifiedFilter>('all');
  const [sortBy, setSortBy] = useState<SortKey>('newest');
  const [openUserId, setOpenUserId] = useState<string | null>(null);

  const fetchUsers = useCallback(() => {
    setLoading(true);
    setError(null);
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

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

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

  const filtered = useMemo(() => {
    const matchesPlan = (u: AdminUser) => {
      if (planFilter === 'all') return true;
      if (planFilter === 'paid') return u.plan && u.plan !== 'free';
      if (planFilter === 'pro_voice') return u.plan === 'pro_voice' || u.plan === 'pro_plus';
      return u.plan === planFilter;
    };
    const matchesVerified = (u: AdminUser) => {
      if (verifiedFilter === 'all') return true;
      const v = !!u.email_confirmed_at;
      return verifiedFilter === 'verified' ? v : !v;
    };
    const matchesSearch = (u: AdminUser) => !q ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.id || '').toLowerCase().includes(q);

    const result = users.filter((u) => matchesPlan(u) && matchesVerified(u) && matchesSearch(u));

    const ts = (s: string | null) => (s ? new Date(s).getTime() : 0);
    result.sort((a, b) => {
      switch (sortBy) {
        case 'oldest': return ts(a.created_at) - ts(b.created_at);
        case 'cost':   return b.api_cost - a.api_cost;
        case 'cvs':    return b.cv_count - a.cv_count;
        case 'jobs':   return b.job_count - a.job_count;
        case 'newest':
        default:       return ts(b.created_at) - ts(a.created_at);
      }
    });
    return result;
  }, [users, q, planFilter, verifiedFilter, sortBy]);

  const totalCost = users.reduce((sum, u) => sum + u.api_cost, 0);
  const paidCount = users.filter((u) => u.plan && u.plan !== 'free').length;
  const activeFilters = (planFilter !== 'all' ? 1 : 0) + (verifiedFilter !== 'all' ? 1 : 0);

  return (
    <div className="space-y-6">

      {/* Summary bar — 2 cols on the tiniest screens, 3 on sm, 5 on lg.
          Avoids the stranded-5th-card-on-its-own-row look on mid widths. */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        <SummaryCard label="Total Users" value={users.length.toString()} />
        <SummaryCard
          label="Paid"
          value={paidCount.toString()}
          tint={{ bg: 'rgba(192,132,252,0.08)', border: 'rgba(192,132,252,0.22)', fg: '#c084fc' }}
        />
        <SummaryCard label="Total CVs" value={users.reduce((s, u) => s + u.cv_count, 0).toString()} />
        <SummaryCard label="Total Jobs" value={users.reduce((s, u) => s + u.job_count, 0).toString()} />
        <SummaryCard label="API Cost" value={`$${totalCost.toFixed(4)}`} />
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

      {/* Filters */}
      <div
        className="rounded-xl p-3 md:p-4 space-y-3"
        style={{ background: '#1a1e42', border: '1px solid rgba(255,255,255,0.10)' }}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-3.5 w-3.5 text-white/50" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white/60 mr-1">Plan</span>
          {PLAN_FILTERS.map((f) => (
            <FilterPill
              key={f.key}
              active={planFilter === f.key}
              onClick={() => setPlanFilter(f.key)}
              label={f.label}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/60 mr-1 pl-[22px] md:pl-[22px]">Email</span>
          {VERIFIED_FILTERS.map((f) => (
            <FilterPill
              key={f.key}
              active={verifiedFilter === f.key}
              onClick={() => setVerifiedFilter(f.key)}
              label={f.label}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/60 mr-1 pl-[22px] md:pl-[22px]">Sort</span>
          {SORT_OPTIONS.map((f) => (
            <FilterPill
              key={f.key}
              active={sortBy === f.key}
              onClick={() => setSortBy(f.key)}
              label={f.label}
            />
          ))}
        </div>
        <div className="flex items-center justify-between gap-3 pt-1 text-[11px] text-white/45">
          <span>
            Showing <span className="text-white/80 font-bold tabular-nums">{filtered.length}</span>
            <span className="text-white/35"> / {users.length}</span>
          </span>
          {(activeFilters > 0 || !!q) && (
            <button
              onClick={() => {
                setPlanFilter('all');
                setVerifiedFilter('all');
                setSortBy('newest');
                setSearch('');
              }}
              className="text-white/55 hover:text-white transition-colors underline-offset-2 hover:underline"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Users Table — desktop grid / mobile card stack */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: '#1a1e42', border: '1px solid rgba(255,255,255,0.10)' }}
      >
        {/* Header row — desktop only; mobile cards have inline labels */}
        <div
          className="hidden md:grid grid-cols-12 gap-3 px-5 py-3 text-[10px] text-white/60 uppercase tracking-widest font-bold"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.10)' }}
        >
          <div className="col-span-4">User</div>
          <div className="col-span-2 text-center">Plan</div>
          <div className="col-span-2 text-center">Joined</div>
          <div className="col-span-1 text-center">CVs</div>
          <div className="col-span-1 text-center">Jobs</div>
          <div className="col-span-2 text-center">Cost</div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center text-white/50 text-sm">
            {users.length === 0
              ? 'No users yet'
              : q || activeFilters > 0
                ? 'No users match the current filters'
                : 'No users yet'}
          </div>
        ) : (
          filtered.map((user, i) => {
            const pc = planColor(user.plan);
            const verified = !!user.email_confirmed_at;
            const isLast = i >= filtered.length - 1;
            return (
              <div
                key={user.id}
                role="button"
                tabIndex={0}
                onClick={() => setOpenUserId(user.id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpenUserId(user.id); } }}
                className="px-4 md:px-5 py-3.5 md:py-3 hover:bg-white/[0.04] transition-colors cursor-pointer"
                style={{
                  borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.07)',
                }}
              >
                {/* ── Desktop: 12-col grid (original layout, slightly wider User col) */}
                <div className="hidden md:grid grid-cols-12 gap-3 items-center">
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
                      className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full whitespace-nowrap"
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
                  <div className="col-span-2 text-center flex items-center justify-center gap-1">
                    <span
                      className="inline-flex items-center gap-1 text-xs font-mono"
                      style={{ color: user.api_cost > 0 ? '#34d399' : 'rgba(255,255,255,0.5)' }}
                    >
                      <DollarSign className="h-3 w-3" /> {user.api_cost.toFixed(4)}
                    </span>
                    <ChevronRight className="h-3 w-3 text-white/25" />
                  </div>
                </div>

                {/* ── Mobile: card layout with full email + labeled chips */}
                <div className="md:hidden">
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="h-9 w-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ background: 'rgba(118,77,240,0.2)', color: '#a78bfa' }}
                    >
                      {(user.full_name || user.email)?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      {/* Name or email (wraps full on mobile — no truncate) */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-white text-sm font-semibold break-all">
                          {user.full_name || user.email}
                        </p>
                        {verified
                          ? <MailCheck className="h-3 w-3 shrink-0" style={{ color: '#34d399' }} />
                          : <MailX className="h-3 w-3 shrink-0" style={{ color: '#fbbf24' }} />}
                      </div>
                      {user.full_name && (
                        <p className="text-white/50 text-xs mt-0.5 break-all">{user.email}</p>
                      )}
                      <p className="text-white/35 text-[10px] mt-1">
                        Joined {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full whitespace-nowrap shrink-0"
                      style={{ background: pc.bg, color: pc.fg }}
                    >
                      {user.plan !== 'free' && <Crown className="h-2.5 w-2.5" />}
                      {planLabel(user.plan)}
                    </span>
                  </div>
                  {/* Stats strip — 3 equal chips */}
                  <div
                    className="grid grid-cols-3 gap-2 rounded-lg p-2"
                    style={{ background: 'rgba(0,0,0,0.25)' }}
                  >
                    <StatChip icon={FileText} value={user.cv_count.toString()} label="CVs" />
                    <StatChip icon={Briefcase} value={user.job_count.toString()} label="Jobs" />
                    <StatChip
                      icon={DollarSign}
                      value={`$${user.api_cost.toFixed(4)}`}
                      label="Cost"
                      highlight={user.api_cost > 0}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {openUserId && (
        <UserDetailDrawer
          userId={openUserId}
          onClose={() => setOpenUserId(null)}
          onMutated={fetchUsers}
        />
      )}
    </div>
  );
}

function SummaryCard({
  label, value, tint,
}: {
  label: string;
  value: string;
  tint?: { bg: string; border: string; fg: string };
}) {
  return (
    <div
      className="rounded-xl p-3 md:p-4"
      style={{
        background: tint?.bg || '#1a1e42',
        border: `1px solid ${tint?.border || 'rgba(255,255,255,0.10)'}`,
      }}
    >
      <p
        className="text-[10px] uppercase tracking-widest font-semibold mb-1 truncate"
        style={{ color: tint?.fg || 'rgba(255,255,255,0.7)' }}
      >
        {label}
      </p>
      <p className="text-white text-xl md:text-2xl font-black tabular-nums">{value}</p>
    </div>
  );
}

function FilterPill({
  active, onClick, label,
}: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap"
      style={{
        background: active ? 'rgba(118,77,240,0.2)' : 'rgba(255,255,255,0.04)',
        color: active ? '#a78bfa' : 'rgba(255,255,255,0.5)',
        border: active ? '1px solid rgba(118,77,240,0.3)' : '1px solid rgba(255,255,255,0.10)',
      }}
    >
      {label}
    </button>
  );
}

function StatChip({
  icon: Icon, value, label, highlight,
}: { icon: any; value: string; label: string; highlight?: boolean }) {
  return (
    <div className="text-center">
      <div
        className="flex items-center justify-center gap-1 text-xs font-mono tabular-nums"
        style={{ color: highlight ? '#34d399' : 'rgba(255,255,255,0.85)' }}
      >
        <Icon className="h-3 w-3" style={{ color: highlight ? '#34d399' : 'rgba(255,255,255,0.45)' }} />
        {value}
      </div>
      <p className="text-[9px] uppercase tracking-widest text-white/40 font-bold mt-0.5">{label}</p>
    </div>
  );
}
