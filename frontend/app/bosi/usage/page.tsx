'use client';

import { useEffect, useState } from 'react';
import { getAdminUsage } from '@/lib/api';
import { Calendar, Filter } from 'lucide-react';

interface UsageRow {
  id: string;
  user_email: string;
  feature: string;
  provider: string;
  model: string;
  stage: string | null;
  input_tokens: number;
  output_tokens: number;
  estimated_cost: number;
  duration_ms: number;
  success: boolean;
  created_at: string;
}

interface Summary {
  totalCalls: number;
  totalCost: number;
  byProvider: Record<string, { calls: number; cost: number; tokens: number }>;
  byFeature: Record<string, { calls: number; cost: number }>;
  daily: { date: string; calls: number; cost: number }[];
}

const FEATURE_LABELS: Record<string, string> = {
  cv_analysis: 'CV Analysis',
  cover_letter: 'Cover Letter',
  cv_refine: 'CV Refine',
  cl_refine: 'CL Refine',
};

const PROVIDER_COLORS: Record<string, string> = {
  gemini: '#34d399',
  openai: '#60a5fa',
  anthropic: '#c084fc',
};

export default function BosiUsage() {
  const [usage, setUsage] = useState<UsageRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    setLoading(true);
    getAdminUsage(days)
      .then((res) => {
        setUsage(res.data.usage);
        setSummary(res.data.summary);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="lds-roller"><div /><div /><div /><div /><div /><div /><div /><div /></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* Period selector */}
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-white/60" />
        <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mr-3">Period:</p>
        {[7, 14, 30, 90].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
            style={{
              background: days === d ? 'rgba(118,77,240,0.2)' : 'rgba(255,255,255,0.04)',
              color: days === d ? '#a78bfa' : 'rgba(255,255,255,0.35)',
              border: days === d ? '1px solid rgba(118,77,240,0.3)' : '1px solid rgba(255,255,255,0.10)',
            }}
          >
            {d}d
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      {summary && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl p-4" style={{ background: '#1a1e42', border: '1px solid rgba(255,255,255,0.10)' }}>
              <p className="text-white/70 text-[10px] uppercase tracking-widest font-semibold mb-1">Total Calls</p>
              <p className="text-white text-2xl font-black">{summary.totalCalls.toLocaleString()}</p>
            </div>
            <div className="rounded-xl p-4" style={{ background: '#1a1e42', border: '1px solid rgba(255,255,255,0.10)' }}>
              <p className="text-white/70 text-[10px] uppercase tracking-widest font-semibold mb-1">Total Cost</p>
              <p className="text-white text-2xl font-black">${summary.totalCost.toFixed(4)}</p>
            </div>
            <div className="rounded-xl p-4" style={{ background: '#1a1e42', border: '1px solid rgba(255,255,255,0.10)' }}>
              <p className="text-white/70 text-[10px] uppercase tracking-widest font-semibold mb-1">Avg Cost / Call</p>
              <p className="text-white text-2xl font-black">
                ${summary.totalCalls > 0 ? (summary.totalCost / summary.totalCalls).toFixed(5) : '0'}
              </p>
            </div>
            <div className="rounded-xl p-4" style={{ background: '#1a1e42', border: '1px solid rgba(255,255,255,0.10)' }}>
              <p className="text-white/70 text-[10px] uppercase tracking-widest font-semibold mb-1">Providers Used</p>
              <p className="text-white text-2xl font-black">{Object.keys(summary.byProvider).length}</p>
            </div>
          </div>

          {/* By Provider */}
          <div>
            <h3 className="text-white/70 text-xs uppercase tracking-widest font-semibold mb-3">Cost by Provider</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {Object.entries(summary.byProvider).map(([provider, data]) => (
                <div
                  key={provider}
                  className="rounded-xl p-4"
                  style={{
                    background: '#1a1e42',
                    border: `1px solid ${PROVIDER_COLORS[provider] || '#764DF0'}33`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-2 w-2 rounded-full" style={{ background: PROVIDER_COLORS[provider] || '#764DF0' }} />
                    <p className="text-white/70 text-sm font-bold capitalize">{provider}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-white text-lg font-black">{data.calls}</p>
                      <p className="text-white/60 text-[10px] uppercase">Calls</p>
                    </div>
                    <div>
                      <p className="text-white text-lg font-black">{(data.tokens / 1000).toFixed(1)}k</p>
                      <p className="text-white/60 text-[10px] uppercase">Tokens</p>
                    </div>
                    <div>
                      <p className="text-lg font-black" style={{ color: PROVIDER_COLORS[provider] }}>${data.cost.toFixed(4)}</p>
                      <p className="text-white/60 text-[10px] uppercase">Cost</p>
                    </div>
                  </div>
                </div>
              ))}
              {Object.keys(summary.byProvider).length === 0 && (
                <p className="text-white/55 text-sm col-span-3 text-center py-8">No usage data yet. Usage tracking starts once you create the api_usage table in Supabase.</p>
              )}
            </div>
          </div>

          {/* By Feature */}
          <div>
            <h3 className="text-white/70 text-xs uppercase tracking-widest font-semibold mb-3">Cost by Feature</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(summary.byFeature).map(([feature, data]) => (
                <div
                  key={feature}
                  className="rounded-xl p-4"
                  style={{ background: '#1a1e42', border: '1px solid rgba(255,255,255,0.10)' }}
                >
                  <p className="text-white/60 text-xs font-bold mb-2">{FEATURE_LABELS[feature] || feature}</p>
                  <p className="text-white text-lg font-black">{data.calls} calls</p>
                  <p className="text-white/70 text-xs font-mono">${data.cost.toFixed(4)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Chart (simple bar) */}
          {summary.daily.length > 0 && (
            <div>
              <h3 className="text-white/70 text-xs uppercase tracking-widest font-semibold mb-3">Daily API Calls</h3>
              <div
                className="rounded-xl p-5"
                style={{ background: '#1a1e42', border: '1px solid rgba(255,255,255,0.10)' }}
              >
                <div className="flex items-end gap-1 h-32">
                  {summary.daily.map((day) => {
                    const maxCalls = Math.max(...summary.daily.map((d) => d.calls), 1);
                    const height = Math.max((day.calls / maxCalls) * 100, 2);
                    return (
                      <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                        <div
                          className="w-full rounded-t-sm transition-all duration-200 group-hover:opacity-100 opacity-75"
                          style={{
                            height: `${height}%`,
                            background: 'linear-gradient(180deg, #764DF0, #4f46e5)',
                            minHeight: '2px',
                          }}
                        />
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                          <div className="rounded-lg px-2 py-1 text-[10px] text-white whitespace-nowrap" style={{ background: 'rgba(0,0,0,0.9)' }}>
                            {day.date}: {day.calls} calls / ${day.cost.toFixed(4)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2 text-[9px] text-white/45">
                  <span>{summary.daily[0]?.date}</span>
                  <span>{summary.daily[summary.daily.length - 1]?.date}</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Recent Logs */}
      <div>
        <h3 className="text-white/70 text-xs uppercase tracking-widest font-semibold mb-3 flex items-center gap-2">
          <Filter className="h-3.5 w-3.5" /> Recent API Calls
        </h3>
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: '#1a1e42', border: '1px solid rgba(255,255,255,0.10)' }}
        >
          {usage.length === 0 ? (
            <div className="px-5 py-12 text-center text-white/55 text-sm">
              No usage logs yet. API calls will appear here once the api_usage table is created in Supabase.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.10)' }}>
                    <th className="px-4 py-3 text-left text-white/60 uppercase tracking-widest font-bold text-[10px]">Time</th>
                    <th className="px-4 py-3 text-left text-white/60 uppercase tracking-widest font-bold text-[10px]">User</th>
                    <th className="px-4 py-3 text-left text-white/60 uppercase tracking-widest font-bold text-[10px]">Feature</th>
                    <th className="px-4 py-3 text-left text-white/60 uppercase tracking-widest font-bold text-[10px]">Provider</th>
                    <th className="px-4 py-3 text-right text-white/60 uppercase tracking-widest font-bold text-[10px]">Tokens</th>
                    <th className="px-4 py-3 text-right text-white/60 uppercase tracking-widest font-bold text-[10px]">Cost</th>
                    <th className="px-4 py-3 text-right text-white/60 uppercase tracking-widest font-bold text-[10px]">Time (ms)</th>
                    <th className="px-4 py-3 text-center text-white/60 uppercase tracking-widest font-bold text-[10px]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {usage.slice(0, 50).map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-white/[0.02] transition-colors"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                    >
                      <td className="px-4 py-2.5 text-white/70 whitespace-nowrap">
                        {new Date(row.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-white/75 truncate max-w-[140px]">{row.user_email || 'Unknown'}</td>
                      <td className="px-4 py-2.5 text-white/60 font-semibold">{FEATURE_LABELS[row.feature] || row.feature}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded capitalize"
                          style={{ color: PROVIDER_COLORS[row.provider] || '#fff', background: `${PROVIDER_COLORS[row.provider] || '#764DF0'}18` }}
                        >
                          {row.provider}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-white/75 font-mono">
                        {((row.input_tokens || 0) + (row.output_tokens || 0)).toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono" style={{ color: '#34d399' }}>
                        ${parseFloat(String(row.estimated_cost || 0)).toFixed(5)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-white/70 font-mono">
                        {row.duration_ms?.toLocaleString() || '-'}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ background: row.success ? '#34d399' : '#f87171' }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
