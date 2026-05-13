'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getAdminRevenue } from '@/lib/api';
import { Crown, Gift, Tag, TrendingUp } from 'lucide-react';

interface Subscription {
  user_id: string;
  email: string;
  plan: string;
  status: string;
  billing_interval: string;
  current_period_end: string | null;
  provider: string | null;
  updated_at: string;
}

interface GiftRow {
  id: string;
  buyer_email: string;
  recipient_email: string;
  redeemed: boolean;
  redeemed_at: string | null;
  pass_code: string;
  created_at: string;
}

interface PromoRow {
  id: string;
  code: string;
  discount_type: string;
  discount_amount: number;
  times_used: number;
}

interface PromoUseRow {
  used_at: string;
  email: string;
  promo_code: { code: string; discount_amount: number; discount_type: string } | null;
}

interface Revenue {
  mrr: number;
  planBreakdown: { starter: number; pro: number; pro_voice: number; canceled: number };
  subscriptions: Subscription[];
  gifts: GiftRow[];
  promos: PromoRow[];
  recentPromoUses: PromoUseRow[];
  promoUsesTotal: number;
}

const planLabel = (p: string) =>
  p === 'pro_voice' || p === 'pro_plus' ? 'Pro+'
    : p === 'pro' ? 'Pro'
    : p === 'starter' ? '7-Day Pass'
    : p;

const planColor = (p: string) =>
  p === 'pro_voice' || p === 'pro_plus' ? '#c084fc'
    : p === 'pro' ? '#a78bfa'
    : p === 'starter' ? '#34d399'
    : 'rgba(255,255,255,0.5)';

export default function BosiRevenue() {
  const [data, setData] = useState<Revenue | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'subs' | 'gifts' | 'promos'>('subs');

  useEffect(() => {
    getAdminRevenue()
      .then((res) => setData(res.data))
      .catch((err: any) => toast.error(err?.response?.data?.error || 'Failed to load revenue'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="lds-roller"><div /><div /><div /><div /><div /><div /><div /><div /></div>
      </div>
    );
  }

  if (!data) return <p className="text-white/55">No data</p>;

  const giftsRedeemed = data.gifts.filter((g) => g.redeemed).length;
  const giftsPending = data.gifts.length - giftsRedeemed;
  const activeSubs = data.subscriptions.filter((s) => s.status === 'active').length;

  return (
    <div className="space-y-6">

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="MRR" value={`$${data.mrr.toLocaleString()}`} icon={TrendingUp} color="#34d399" />
        <Kpi label="Active Subs" value={activeSubs.toString()} icon={Crown} color="#a78bfa" />
        <Kpi label="Gifts Sold" value={data.gifts.length.toString()} icon={Gift} color="#fbbf24" sub={`${giftsRedeemed} redeemed · ${giftsPending} pending`} />
        <Kpi label="Promo Uses" value={data.promoUsesTotal.toString()} icon={Tag} color="#60a5fa" />
      </div>

      {/* Plan breakdown bar */}
      <div className="rounded-xl p-5" style={{ background: '#1a1e42', border: '1px solid rgba(255,255,255,0.10)' }}>
        <p className="text-white/70 text-[10px] uppercase tracking-widest font-semibold mb-3">Paying Plans</p>
        <div className="flex items-center gap-4 flex-wrap">
          <Chip label="Pro+" value={data.planBreakdown.pro_voice} color="#c084fc" />
          <Chip label="Pro" value={data.planBreakdown.pro} color="#a78bfa" />
          <Chip label="7-Day Pass" value={data.planBreakdown.starter} color="#34d399" />
          <Chip label="Canceled" value={data.planBreakdown.canceled} color="#f87171" />
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex items-center gap-2">
        <TabBtn active={tab === 'subs'} onClick={() => setTab('subs')} label="Subscriptions" count={data.subscriptions.length} />
        <TabBtn active={tab === 'gifts'} onClick={() => setTab('gifts')} label="Gifted Passes" count={data.gifts.length} />
        <TabBtn active={tab === 'promos'} onClick={() => setTab('promos')} label="Promo Activity" count={data.recentPromoUses.length} />
      </div>

      {tab === 'subs' && <SubsTable rows={data.subscriptions} />}
      {tab === 'gifts' && <GiftsTable rows={data.gifts} />}
      {tab === 'promos' && <PromoTabContent promos={data.promos} recent={data.recentPromoUses} />}
    </div>
  );
}

function Kpi({ label, value, icon: Icon, color, sub }: { label: string; value: string; icon: any; color: string; sub?: string }) {
  return (
    <div className="rounded-xl p-4" style={{ background: '#1a1e42', border: '1px solid rgba(255,255,255,0.10)' }}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-white/70 text-[10px] uppercase tracking-widest font-semibold">{label}</p>
        <Icon className="h-4 w-4" style={{ color, opacity: 0.85 }} />
      </div>
      <p className="text-white text-2xl font-black tabular-nums">{value}</p>
      {sub && <p className="text-white/40 text-[10px] mt-1">{sub}</p>}
    </div>
  );
}

function Chip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      <span className="text-white/65 text-xs">{label}</span>
      <span className="text-white text-sm font-black tabular-nums">{value}</span>
    </div>
  );
}

function TabBtn({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-lg text-xs font-bold transition-all"
      style={{
        background: active ? 'rgba(118,77,240,0.2)' : 'rgba(255,255,255,0.04)',
        color: active ? '#a78bfa' : 'rgba(255,255,255,0.55)',
        border: active ? '1px solid rgba(118,77,240,0.3)' : '1px solid rgba(255,255,255,0.10)',
      }}
    >
      {label} <span className="opacity-60 ml-1">{count}</span>
    </button>
  );
}

function SubsTable({ rows }: { rows: Subscription[] }) {
  if (rows.length === 0) {
    return <EmptyBox>No paying subscriptions yet.</EmptyBox>;
  }
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#1a1e42', border: '1px solid rgba(255,255,255,0.10)' }}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <Th>Email</Th><Th>Plan</Th><Th>Status</Th><Th>Provider</Th><Th>Period End</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.user_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td className="px-4 py-2.5 text-white/85 text-xs truncate max-w-[280px]">{s.email}</td>
                <td className="px-4 py-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: `${planColor(s.plan)}18`, color: planColor(s.plan) }}>
                    {planLabel(s.plan)}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
                    style={{
                      background: s.status === 'active' ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)',
                      color: s.status === 'active' ? '#34d399' : '#f87171',
                    }}
                  >
                    {s.status}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-white/55 text-xs">{s.provider || '—'}</td>
                <td className="px-4 py-2.5 text-white/55 text-xs">
                  {s.current_period_end ? new Date(s.current_period_end).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GiftsTable({ rows }: { rows: GiftRow[] }) {
  if (rows.length === 0) return <EmptyBox>No gifted passes yet.</EmptyBox>;
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#1a1e42', border: '1px solid rgba(255,255,255,0.10)' }}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <Th>Buyer</Th><Th>Recipient</Th><Th>Code</Th><Th>Status</Th><Th>Sent</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((g) => (
              <tr key={g.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td className="px-4 py-2.5 text-white/75 text-xs truncate max-w-[220px]">{g.buyer_email}</td>
                <td className="px-4 py-2.5 text-white/75 text-xs truncate max-w-[220px]">{g.recipient_email}</td>
                <td className="px-4 py-2.5 text-white/65 text-xs font-mono">{g.pass_code}</td>
                <td className="px-4 py-2.5">
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
                    style={{
                      background: g.redeemed ? 'rgba(52,211,153,0.15)' : 'rgba(251,191,36,0.15)',
                      color: g.redeemed ? '#34d399' : '#fbbf24',
                    }}
                  >
                    {g.redeemed ? 'Redeemed' : 'Pending'}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-white/55 text-xs">{new Date(g.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PromoTabContent({ promos, recent }: { promos: PromoRow[]; recent: PromoUseRow[] }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-white/70 text-[10px] uppercase tracking-widest font-bold mb-3">Promo Code Performance</h3>
        {promos.length === 0 ? (
          <EmptyBox>No promo codes created. Head to Promo Codes tab.</EmptyBox>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[...promos].sort((a, b) => b.times_used - a.times_used).map((p) => (
              <div key={p.id} className="rounded-xl p-4" style={{ background: '#1a1e42', border: '1px solid rgba(255,255,255,0.10)' }}>
                <p className="text-white font-mono font-bold">{p.code}</p>
                <p className="text-white/55 text-[10px] mt-1">
                  {p.discount_type === 'percent' ? `${p.discount_amount}% off` : `$${p.discount_amount} off`}
                </p>
                <p className="text-white text-xl font-black tabular-nums mt-2">{p.times_used}</p>
                <p className="text-white/40 text-[9px] uppercase tracking-widest">uses</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-white/70 text-[10px] uppercase tracking-widest font-bold mb-3">Recent Redemptions</h3>
        {recent.length === 0 ? (
          <EmptyBox>No redemptions yet.</EmptyBox>
        ) : (
          <div className="rounded-xl overflow-hidden" style={{ background: '#1a1e42', border: '1px solid rgba(255,255,255,0.10)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <Th>Code</Th><Th>User</Th><Th>Discount</Th><Th>When</Th>
                </tr>
              </thead>
              <tbody>
                {recent.map((p, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td className="px-4 py-2.5 text-white font-mono text-xs">{p.promo_code?.code || '—'}</td>
                    <td className="px-4 py-2.5 text-white/75 text-xs truncate max-w-[280px]">{p.email}</td>
                    <td className="px-4 py-2.5 text-white/55 text-xs">
                      {p.promo_code
                        ? p.promo_code.discount_type === 'percent'
                          ? `${p.promo_code.discount_amount}%`
                          : `$${p.promo_code.discount_amount}`
                        : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-white/55 text-xs">{new Date(p.used_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left px-4 py-3 text-white/55 text-[10px] uppercase tracking-widest font-bold">{children}</th>
  );
}

function EmptyBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl p-8 text-center text-white/45 text-sm"
      style={{ background: '#1a1e42', border: '1px solid rgba(255,255,255,0.10)' }}
    >
      {children}
    </div>
  );
}
