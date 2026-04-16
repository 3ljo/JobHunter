'use client';

import { useEffect, useState } from 'react';
import { getAdminDashboard } from '@/lib/api';
import { Users, FileText, Briefcase, Zap, DollarSign, Activity, Cpu } from 'lucide-react';

interface DashboardData {
  users: number;
  cvs: number;
  jobs: number;
  today: { apiCalls: number; cost: number };
  week: { cost: number };
  month: { cost: number };
  total: { apiCalls: number; cost: number };
  activeProvider: string;
  activeModel: string;
}

const PROVIDER_COLORS: Record<string, string> = {
  gemini: '#34d399',
  openai: '#60a5fa',
  anthropic: '#c084fc',
};

export default function BosiDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminDashboard()
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="lds-roller"><div /><div /><div /><div /><div /><div /><div /><div /></div>
      </div>
    );
  }

  if (!data) return <p className="text-white/60">Failed to load dashboard</p>;

  const stats = [
    { label: 'Total Users', value: data.users, icon: Users, color: '#764DF0' },
    { label: 'CVs Analyzed', value: data.cvs, icon: FileText, color: '#c084fc' },
    { label: 'Jobs Tracked', value: data.jobs, icon: Briefcase, color: '#fbbf24' },
    { label: 'API Calls Today', value: data.today.apiCalls, icon: Zap, color: '#60a5fa' },
  ];

  const costs = [
    { label: 'Today', value: data.today.cost },
    { label: 'This Week', value: data.week.cost },
    { label: 'This Month', value: data.month.cost },
    { label: 'All Time', value: data.total.cost },
  ];

  return (
    <div className="space-y-8">

      {/* Active Provider Banner */}
      <div
        className="rounded-xl p-5 flex items-center justify-between"
        style={{
          background: '#1a1e42',
          border: `1px solid ${PROVIDER_COLORS[data.activeProvider] || '#764DF0'}55`,
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="h-12 w-12 rounded-xl flex items-center justify-center"
            style={{ background: `${PROVIDER_COLORS[data.activeProvider] || '#764DF0'}25` }}
          >
            <Cpu className="h-6 w-6" style={{ color: PROVIDER_COLORS[data.activeProvider] || '#764DF0' }} />
          </div>
          <div>
            <p className="text-white/70 text-xs uppercase tracking-widest font-semibold">Active AI Provider</p>
            <p className="text-white text-xl font-bold capitalize">{data.activeProvider}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-white/60 text-xs uppercase tracking-wider font-semibold">Model</p>
          <p className="text-white/90 text-sm font-mono">{data.activeModel}</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-5"
            style={{ background: '#1a1e42', border: '1px solid rgba(255,255,255,0.10)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-white/70 text-xs uppercase tracking-widest font-semibold">{s.label}</p>
              <s.icon className="h-4 w-4" style={{ color: s.color, opacity: 0.8 }} />
            </div>
            <p className="text-white text-3xl font-black tabular-nums">{s.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Cost Overview */}
      <div>
        <h3 className="text-white/70 text-xs uppercase tracking-widest font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="h-3.5 w-3.5" /> API Cost Overview
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {costs.map((c) => (
            <div
              key={c.label}
              className="rounded-xl p-5"
              style={{ background: '#1a1e42', border: '1px solid rgba(255,255,255,0.10)' }}
            >
              <p className="text-white/70 text-xs uppercase tracking-widest font-semibold mb-2">{c.label}</p>
              <p className="text-white text-2xl font-black tabular-nums">
                ${c.value.toFixed(4)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Total API Calls */}
      <div
        className="rounded-xl p-5 flex items-center gap-4"
        style={{ background: '#1a1e42', border: '1px solid rgba(255,255,255,0.10)' }}
      >
        <Activity className="h-5 w-5 text-white/50" />
        <div>
          <p className="text-white/70 text-xs uppercase tracking-widest font-semibold">Total API Calls (All Time)</p>
          <p className="text-white text-2xl font-black tabular-nums">{data.total.apiCalls.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
