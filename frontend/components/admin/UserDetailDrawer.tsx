'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  X, Mail, Calendar, Crown, Shield, KeyRound, Trash2, Ban, Gift,
  FileText, Briefcase, Receipt, Activity,
} from 'lucide-react';
import {
  getAdminUserDetail, grantAdminPlan, changeAdminPlan,
  resetAdminUserPassword, banAdminUser, unbanAdminUser, deleteAdminUser,
} from '@/lib/api';

interface Props {
  userId: string;
  onClose: () => void;
  onMutated: () => void;
}

interface Detail {
  user: {
    id: string;
    email: string;
    full_name: string | null;
    created_at: string;
    email_confirmed_at: string | null;
    last_sign_in_at: string | null;
    is_banned: boolean;
    banned_until: string | null;
    provider: string;
  };
  subscription: {
    plan: string;
    status: string;
    billing_interval: string;
    current_period_end: string | null;
    provider: string | null;
  } | null;
  cvs: { id: string; file_name: string; created_at: string }[];
  jobs: { id: string; company: string; position: string; status: string; created_at: string }[];
  usage_recent: { id: string; feature: string; provider: string; estimated_cost: number; created_at: string; success: boolean }[];
  usage_total: { calls: number; cost: number };
  quotas_recent: { feature: string; usage_date: string; count: number }[];
  gifts_sent: { id: string; recipient_email: string; redeemed: boolean; pass_code: string; created_at: string }[];
  gifts_received: { id: string; recipient_email: string; pass_code: string }[];
  promos_redeemed: { used_at: string; promo_code: { code: string; discount_amount: number; discount_type: string } | null }[];
}

const PLANS = [
  { key: 'free', label: 'Free' },
  { key: 'starter', label: '7-Day Pass' },
  { key: 'pro', label: 'Pro' },
  { key: 'pro_voice', label: 'Pro Voice' },
];

export default function UserDetailDrawer({ userId, onClose, onMutated }: Props) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Grant form
  const [grantPlan, setGrantPlan] = useState('pro');
  const [grantDays, setGrantDays] = useState('30');

  const load = async () => {
    setLoading(true);
    try {
      const res = await getAdminUserDetail(userId);
      setDetail(res.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to load user');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [userId]);

  const guarded = async (fn: () => Promise<unknown>, successMsg?: string) => {
    setBusy(true);
    try {
      await fn();
      if (successMsg) toast.success(successMsg);
      await load();
      onMutated();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  const handleGrant = () =>
    guarded(
      () => grantAdminPlan(userId, grantPlan, parseInt(grantDays) || 30),
      `Granted ${grantPlan} for ${grantDays} days`,
    );

  const handleChangePlan = (plan: string) =>
    guarded(() => changeAdminPlan(userId, plan), `Plan set to ${plan}`);

  const handleReset = () =>
    guarded(() => resetAdminUserPassword(userId), 'Reset email sent');

  const handleBan = () => {
    if (!confirm('Ban this user? They won\'t be able to sign in.')) return;
    guarded(() => banAdminUser(userId, 24 * 365), 'User banned');
  };

  const handleUnban = () => guarded(() => unbanAdminUser(userId), 'User unbanned');

  const handleDelete = () => {
    if (!confirm('Permanently delete this user and all their data? Cannot be undone.')) return;
    if (!confirm('Are you really sure?')) return;
    guarded(async () => {
      await deleteAdminUser(userId);
      onMutated();
      onClose();
      toast.success('User deleted');
    });
  };

  return (
    <div className="fixed inset-0 z-[80] flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.6)' }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="ml-auto h-full w-full max-w-2xl overflow-y-auto relative"
        style={{ background: '#161937', borderLeft: '1px solid rgba(255,255,255,0.10)' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white/80 z-10"
        >
          <X className="h-5 w-5" />
        </button>

        {loading || !detail ? (
          <div className="flex items-center justify-center h-full">
            <div className="lds-roller"><div /><div /><div /><div /><div /><div /><div /><div /></div>
          </div>
        ) : (
          <div className="p-6 space-y-6">

            {/* Header */}
            <div className="flex items-start gap-4 pr-6">
              <div
                className="h-12 w-12 rounded-xl flex items-center justify-center text-base font-black shrink-0"
                style={{ background: 'rgba(118,77,240,0.2)', color: '#a78bfa' }}
              >
                {(detail.user.full_name || detail.user.email).charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white text-lg font-bold truncate">
                  {detail.user.full_name || detail.user.email}
                </p>
                <p className="text-white/55 text-xs truncate">{detail.user.email}</p>
                <div className="flex items-center gap-3 mt-2 text-[10px] text-white/45">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Joined {new Date(detail.user.created_at).toLocaleDateString()}</span>
                  {detail.user.last_sign_in_at && (
                    <span>Last seen {new Date(detail.user.last_sign_in_at).toLocaleDateString()}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Pill ok={!!detail.user.email_confirmed_at} okLabel="Verified" badLabel="Unverified" />
                  <Pill ok={!detail.user.is_banned} okLabel="Active" badLabel="Banned" />
                  <span className="text-[10px] uppercase font-bold tracking-widest text-white/45 px-2 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    via {detail.user.provider}
                  </span>
                </div>
              </div>
            </div>

            {/* Subscription block */}
            <Section title="Subscription">
              {detail.subscription ? (
                <div className="rounded-lg p-4" style={{ background: 'rgba(0,0,0,0.25)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="h-3.5 w-3.5 text-white/40" />
                    <span className="text-white font-bold capitalize">{detail.subscription.plan.replace('_', ' ')}</span>
                    <span
                      className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
                      style={{
                        background: detail.subscription.status === 'active' ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)',
                        color: detail.subscription.status === 'active' ? '#34d399' : '#f87171',
                      }}
                    >
                      {detail.subscription.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-white/55 grid grid-cols-2 gap-1">
                    <span>Billing: {detail.subscription.billing_interval}</span>
                    <span>Provider: {detail.subscription.provider || '—'}</span>
                    {detail.subscription.current_period_end && (
                      <span className="col-span-2">
                        Expires {new Date(detail.subscription.current_period_end).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-white/45 text-sm italic">No subscription row — user is on Free plan.</p>
              )}

              {/* Quick plan switcher */}
              <div className="flex flex-wrap gap-2 mt-3">
                {PLANS.map((p) => {
                  const active = detail.subscription?.plan === p.key
                    || (p.key === 'pro_voice' && detail.subscription?.plan === 'pro_plus')
                    || (!detail.subscription && p.key === 'free');
                  return (
                    <button
                      key={p.key}
                      onClick={() => !active && handleChangePlan(p.key)}
                      disabled={busy || active}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40"
                      style={{
                        background: active ? 'rgba(118,77,240,0.2)' : 'rgba(255,255,255,0.04)',
                        color: active ? '#a78bfa' : 'rgba(255,255,255,0.6)',
                        border: active ? '1px solid rgba(118,77,240,0.4)' : '1px solid rgba(255,255,255,0.10)',
                      }}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </Section>

            {/* Grant comp */}
            <Section title="Grant Comp Plan">
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={grantPlan}
                  onChange={(e) => setGrantPlan(e.target.value)}
                  className="h-9 px-3 rounded-lg text-xs text-white outline-none cursor-pointer"
                  style={{ background: '#141736', border: '1px solid rgba(255,255,255,0.1)', colorScheme: 'dark' }}
                >
                  <option value="starter">7-Day Pass</option>
                  <option value="pro">Pro</option>
                  <option value="pro_voice">Pro Voice</option>
                </select>
                <input
                  type="number"
                  value={grantDays}
                  onChange={(e) => setGrantDays(e.target.value)}
                  className="h-9 w-20 px-2 rounded-lg text-xs text-white text-right outline-none"
                  style={{ background: '#141736', border: '1px solid rgba(255,255,255,0.1)' }}
                  min="1"
                />
                <span className="text-white/55 text-xs">days</span>
                <button
                  onClick={handleGrant}
                  disabled={busy}
                  className="h-9 px-4 rounded-lg text-xs font-bold text-white disabled:opacity-50"
                  style={{ background: 'linear-gradient(180deg, oklch(0.62 0.24 291), oklch(0.48 0.22 291))' }}
                >
                  Grant
                </button>
              </div>
              <p className="text-[10px] text-white/35 mt-2">
                Sets <span className="font-mono">billing_interval=once</span> and <span className="font-mono">provider=admin</span>. Won't auto-renew.
              </p>
            </Section>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <StatBox icon={FileText} label="CVs" value={detail.cvs.length.toString()} />
              <StatBox icon={Briefcase} label="Jobs" value={detail.jobs.length.toString()} />
              <StatBox icon={Receipt} label="API Cost" value={`$${detail.usage_total.cost.toFixed(4)}`} highlight />
            </div>

            {/* Recent activity */}
            {detail.usage_recent.length > 0 && (
              <Section title="Recent AI Calls">
                <div className="rounded-lg overflow-hidden" style={{ background: 'rgba(0,0,0,0.25)' }}>
                  {detail.usage_recent.slice(0, 10).map((u, i) => (
                    <div
                      key={u.id}
                      className="flex items-center gap-2 px-3 py-2 text-xs"
                      style={{ borderBottom: i < 9 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: u.success ? '#34d399' : '#f87171' }} />
                      <span className="text-white/65 w-36 shrink-0 truncate">{u.feature}</span>
                      <span className="text-white/45 text-[10px] shrink-0 uppercase">{u.provider}</span>
                      <span className="ml-auto text-white/55 font-mono shrink-0">${parseFloat(String(u.estimated_cost || 0)).toFixed(5)}</span>
                      <span className="text-white/35 text-[10px] w-24 text-right shrink-0">{new Date(u.created_at).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Quotas */}
            {detail.quotas_recent.length > 0 && (
              <Section title="Recent Quota Usage">
                <div className="rounded-lg p-3 space-y-1.5" style={{ background: 'rgba(0,0,0,0.25)' }}>
                  {detail.quotas_recent.slice(0, 8).map((q) => (
                    <div key={`${q.feature}-${q.usage_date}`} className="flex items-center text-xs gap-3">
                      <span className="text-white/55 w-32">{q.feature}</span>
                      <span className="text-white/40 text-[10px] w-24">{q.usage_date}</span>
                      <span className="ml-auto text-white/85 font-bold tabular-nums">{q.count}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Gifts */}
            {(detail.gifts_sent.length > 0 || detail.gifts_received.length > 0) && (
              <Section title="Gifts">
                {detail.gifts_sent.length > 0 && (
                  <div className="space-y-1 mb-2">
                    <p className="text-white/45 text-[10px] uppercase tracking-widest font-bold flex items-center gap-1">
                      <Gift className="h-3 w-3" /> Sent
                    </p>
                    {detail.gifts_sent.map((g) => (
                      <div key={g.id} className="flex items-center text-xs gap-2 px-2 py-1.5 rounded" style={{ background: 'rgba(0,0,0,0.25)' }}>
                        <span className="text-white/75 truncate flex-1">{g.recipient_email}</span>
                        <span className="text-white/45 font-mono text-[10px]">{g.pass_code}</span>
                        <span
                          className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
                          style={{
                            background: g.redeemed ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.06)',
                            color: g.redeemed ? '#34d399' : 'rgba(255,255,255,0.5)',
                          }}
                        >
                          {g.redeemed ? 'Redeemed' : 'Pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {detail.gifts_received.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-white/45 text-[10px] uppercase tracking-widest font-bold">Received</p>
                    {detail.gifts_received.map((g) => (
                      <div key={g.id} className="flex items-center text-xs gap-2 px-2 py-1.5 rounded" style={{ background: 'rgba(0,0,0,0.25)' }}>
                        <span className="text-white/75 truncate flex-1">From: {g.recipient_email}</span>
                        <span className="text-white/45 font-mono text-[10px]">{g.pass_code}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Section>
            )}

            {/* Promos */}
            {detail.promos_redeemed.length > 0 && (
              <Section title="Promo Codes Used">
                <div className="rounded-lg p-3 space-y-1" style={{ background: 'rgba(0,0,0,0.25)' }}>
                  {detail.promos_redeemed.map((p, i) => (
                    <div key={i} className="flex items-center text-xs gap-3">
                      <span className="text-white font-mono font-bold">{p.promo_code?.code || '—'}</span>
                      <span className="text-white/55">
                        {p.promo_code
                          ? p.promo_code.discount_type === 'percent'
                            ? `${p.promo_code.discount_amount}% off`
                            : `$${p.promo_code.discount_amount} off`
                          : ''}
                      </span>
                      <span className="ml-auto text-white/35 text-[10px]">{new Date(p.used_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Danger zone */}
            <Section title="Account Actions" danger>
              <div className="flex flex-wrap gap-2">
                <ActionBtn icon={Mail} label="Send reset email" onClick={handleReset} disabled={busy} />
                {detail.user.is_banned ? (
                  <ActionBtn icon={Shield} label="Unban" onClick={handleUnban} disabled={busy} variant="warn" />
                ) : (
                  <ActionBtn icon={Ban} label="Ban user" onClick={handleBan} disabled={busy} variant="warn" />
                )}
                <ActionBtn icon={Trash2} label="Delete account" onClick={handleDelete} disabled={busy} variant="danger" />
              </div>
              <p className="text-[10px] text-white/35 mt-2">
                Delete is permanent. Subscription, CVs, jobs and usage rows cascade-delete with the user.
              </p>
            </Section>

            {/* User ID footer for debug */}
            <p className="text-[10px] text-white/25 font-mono pt-2 break-all">{detail.user.id}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children, danger }: { title: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <div>
      <h4
        className="text-[10px] uppercase tracking-widest font-bold mb-2"
        style={{ color: danger ? '#f87171' : 'rgba(255,255,255,0.55)' }}
      >
        {title}
      </h4>
      {children}
    </div>
  );
}

function Pill({ ok, okLabel, badLabel }: { ok: boolean; okLabel: string; badLabel: string }) {
  return (
    <span
      className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
      style={{
        background: ok ? 'rgba(52,211,153,0.15)' : 'rgba(251,191,36,0.15)',
        color: ok ? '#34d399' : '#fbbf24',
      }}
    >
      {ok ? okLabel : badLabel}
    </span>
  );
}

function StatBox({ icon: Icon, label, value, highlight }: { icon: any; label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg p-3" style={{ background: '#1a1e42', border: '1px solid rgba(255,255,255,0.10)' }}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="h-3 w-3 text-white/40" />
        <p className="text-[9px] uppercase tracking-widest font-bold text-white/55">{label}</p>
      </div>
      <p className="text-white text-base font-black tabular-nums" style={{ color: highlight ? '#34d399' : '#fff' }}>{value}</p>
    </div>
  );
}

function ActionBtn({
  icon: Icon, label, onClick, disabled, variant = 'neutral',
}: {
  icon: any; label: string; onClick: () => void; disabled?: boolean;
  variant?: 'neutral' | 'warn' | 'danger';
}) {
  const colors = {
    neutral: { bg: 'rgba(255,255,255,0.05)', fg: 'rgba(255,255,255,0.75)', border: 'rgba(255,255,255,0.10)' },
    warn:    { bg: 'rgba(251,191,36,0.10)', fg: '#fbbf24', border: 'rgba(251,191,36,0.30)' },
    danger:  { bg: 'rgba(239,68,68,0.10)',  fg: '#f87171', border: 'rgba(239,68,68,0.30)' },
  }[variant];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold disabled:opacity-50"
      style={{ background: colors.bg, color: colors.fg, border: `1px solid ${colors.border}` }}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
