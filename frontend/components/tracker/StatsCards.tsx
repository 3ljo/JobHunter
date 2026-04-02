'use client';

import { TrackerStats } from '@/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Send, MessageSquare, Trophy, XCircle, Bookmark } from 'lucide-react';

const statusConfig: { key: keyof Omit<TrackerStats, 'total'>; label: string; color: string; icon: typeof Send }[] = [
  { key: 'applied', label: 'Applied', color: '#3b82f6', icon: Send },
  { key: 'interview', label: 'Interview', color: '#eab308', icon: MessageSquare },
  { key: 'offer', label: 'Offer', color: '#22c55e', icon: Trophy },
  { key: 'rejected', label: 'Rejected', color: '#ef4444', icon: XCircle },
  { key: 'saved', label: 'Saved', color: '#6b7280', icon: Bookmark },
];

export default function StatsCards({ stats }: { stats: TrackerStats }) {
  const chartData = statusConfig.map((s) => ({
    name: s.label,
    count: stats[s.key],
    fill: s.color,
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {statusConfig.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.key}
              className="group rounded-2xl border border-border bg-card/70 p-4 transition-all hover:border-border hover:bg-card/90"
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${s.color}15` }}
                >
                  <Icon className="h-3.5 w-3.5" style={{ color: s.color }} />
                </div>
              </div>
              <p className="text-2xl font-bold tabular-nums text-foreground">{stats[s.key]}</p>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60 mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>
      {stats.total > 0 && (
        <div className="rounded-2xl border border-border bg-card/70 p-5">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">Applications Overview</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#52525b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#52525b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    border: '1px solid rgba(255,255,255,0.06)',
                    color: '#fff',
                    borderRadius: '12px',
                    fontSize: '13px',
                    boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)',
                  }}
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
