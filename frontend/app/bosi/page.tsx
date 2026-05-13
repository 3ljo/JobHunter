'use client';

import { useEffect, useState } from 'react';
import { getAdminOverview } from '@/lib/api';
import {
  Users, FileText, Briefcase, Cpu, DollarSign, Activity, CheckCircle, XCircle,
} from 'lucide-react';

interface Overview {
  counts: { users: number; cvs: number; jobs: number };
  cost: { today: number; week: number; month: number };
  mrr: number;
  planBreakdown: { free: number; starter: number; pro: number; pro_voice: number; canceled: number };
  activeProvider: string;
  activeModel: string;
  health: {
    supabase: boolean;
    anthropic_key: boolean;
    openai_key: boolean;
    gemini_key: boolean;
    paypal: boolean;
    paypal_mode: string;
  };
}

const PROVIDER_COLORS: Record<string, string> = {
  gemini: '#34d399',
  openai: '#60a5fa',
  anthropic: '#c084fc',
};

export default function BosiOverview() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAdminOverview()
      .then((res) => setData(res.data))
      .catch((err: any) => setError(err?.response?.data?.error || err?.message || 'Failed'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="lds-roller"><div /><div /><div /><div /><div /><div /><div /><div /></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        className="rounded-xl p-6"
        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}
      >
        <p className="text-red-300 font-bold text-sm mb-1">Couldn't load overview</p>
        <p className="text-white/60 text-xs">{error || 'Empty response'}</p>
      </div>
    );
  }

  const stats = [
    { label: 'Users', value: data.counts.users.toLocaleString(), icon: Users, color: '#764DF0' },
    { label: 'CVs', value: data.counts.cvs.toLocaleString(), icon: FileText, color: '#c084fc' },
    { label: 'Jobs', value: data.counts.jobs.toLocaleString(), icon: Briefcase, color: '#fbbf24' },
    { label: 'MRR', value: `$${data.mrr.toLocaleString()}`, icon: DollarSign, color: '#34d399' },
  ];

  const paidTotal =
    data.planBreakdown.starter + data.planBreakdown.pro + data.planBreakdown.pro_voice;

  const providerColor = PROVIDER_COLORS[data.activeProvider] || '#764DF0';

  return (
    <div className="space-y-6">

      {/* Top KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-5"
            style={{ background: '#1a1e42', border: '1px solid rgba(255,255,255,0.10)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-white/70 text-[10px] uppercase tracking-widest font-semibold">{s.label}</p>
              <s.icon className="h-4 w-4" style={{ color: s.color, opacity: 0.85 }} />
            </div>
            <p className="text-white text-3xl font-black tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Two-column: provider + plan distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div
          className="rounded-xl p-5"
          style={{ background: '#1a1e42', border: `1px solid ${providerColor}55` }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: `${providerColor}25` }}>
              <Cpu className="h-4 w-4" style={{ color: providerColor }} />
            </div>
            <div>
              <p className="text-white/70 text-[10px] uppercase tracking-widest font-semibold">Active AI Provider</p>
              <p className="text-white text-base font-bold capitalize">{data.activeProvider}</p>
            </div>
          </div>
          <div className="rounded-lg px-3 py-2 font-mono text-xs text-white/80" style={{ background: '#141736' }}>
            {data.activeModel}
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            <CostStat label="Today" value={data.cost.today} />
            <CostStat label="7 days" value={data.cost.week} />
            <CostStat label="30 days" value={data.cost.month} />
          </div>
        </div>

        <div
          className="rounded-xl p-5"
          style={{ background: '#1a1e42', border: '1px solid rgba(255,255,255,0.10)' }}
        >
          <p className="text-white/70 text-[10px] uppercase tracking-widest font-semibold mb-4">Plan Distribution</p>
          <PlanBars breakdown={data.planBreakdown} totalUsers={data.counts.users} paidTotal={paidTotal} />
        </div>
      </div>

      {/* Health checks */}
      <div>
        <h3 className="text-white/70 text-[10px] uppercase tracking-widest font-semibold mb-3 flex items-center gap-2">
          <Activity className="h-3.5 w-3.5" /> System Health
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <HealthDot label="Supabase" ok={data.health.supabase} />
          <HealthDot label="Anthropic" ok={data.health.anthropic_key} />
          <HealthDot label="OpenAI" ok={data.health.openai_key} />
          <HealthDot label="Gemini" ok={data.health.gemini_key} />
          <HealthDot label="PayPal" ok={data.health.paypal} hint={data.health.paypal_mode} />
          <HealthDot label="Backend" ok hint="online" />
        </div>
      </div>
    </div>
  );
}

function CostStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg px-3 py-2.5" style={{ background: 'rgba(0,0,0,0.25)' }}>
      <p className="text-white/55 text-[9px] uppercase tracking-widest font-semibold">{label}</p>
      <p className="text-white text-sm font-black tabular-nums">${value.toFixed(value >= 1 ? 2 : 4)}</p>
    </div>
  );
}

function PlanBars({
  breakdown,
  totalUsers,
  paidTotal,
}: {
  breakdown: Overview['planBreakdown'];
  totalUsers: number;
  paidTotal: number;
}) {
  const free = Math.max(totalUsers - paidTotal - breakdown.canceled, 0);
  const rows = [
    { label: 'Pro+', value: breakdown.pro_voice, color: '#c084fc' },
    { label: 'Pro', value: breakdown.pro, color: '#a78bfa' },
    { label: '7-Day Pass', value: breakdown.starter, color: '#34d399' },
    { label: 'Free', value: free, color: 'rgba(255,255,255,0.3)' },
    { label: 'Canceled', value: breakdown.canceled, color: '#f87171' },
  ];
  const max = Math.max(...rows.map((r) => r.value), 1);

  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-3">
          <div className="w-20 text-[11px] font-semibold text-white/70 shrink-0">{r.label}</div>
          <div className="flex-1 h-5 rounded-md overflow-hidden" style={{ background: 'rgba(0,0,0,0.25)' }}>
            <div
              className="h-full rounded-md transition-all"
              style={{ width: `${(r.value / max) * 100}%`, background: r.color, minWidth: r.value > 0 ? '4px' : '0' }}
            />
          </div>
          <div className="w-10 text-right text-xs font-bold tabular-nums text-white/85">{r.value}</div>
        </div>
      ))}
    </div>
  );
}

function HealthDot({ label, ok, hint }: { label: string; ok: boolean; hint?: string }) {
  return (
    <div
      className="rounded-lg px-3 py-3 flex items-center gap-2"
      style={{
        background: '#1a1e42',
        border: `1px solid ${ok ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.25)'}`,
      }}
    >
      {ok
        ? <CheckCircle className="h-4 w-4 shrink-0" style={{ color: '#34d399' }} />
        : <XCircle className="h-4 w-4 shrink-0" style={{ color: '#f87171' }} />}
      <div className="min-w-0">
        <p className="text-white text-xs font-bold truncate">{label}</p>
        {hint && <p className="text-white/45 text-[9px] uppercase tracking-widest truncate">{hint}</p>}
      </div>
    </div>
  );
}
