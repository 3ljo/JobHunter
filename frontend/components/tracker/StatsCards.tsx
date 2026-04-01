'use client';

import { Card, CardContent } from '@/components/ui/card';
import { TrackerStats } from '@/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const statusConfig: { key: keyof Omit<TrackerStats, 'total'>; label: string; color: string }[] = [
  { key: 'applied', label: 'Applied', color: '#3b82f6' },
  { key: 'interview', label: 'Interview', color: '#eab308' },
  { key: 'offer', label: 'Offer', color: '#22c55e' },
  { key: 'rejected', label: 'Rejected', color: '#ef4444' },
  { key: 'saved', label: 'Saved', color: '#6b7280' },
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
        {statusConfig.map((s) => (
          <Card key={s.key}>
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{s.label}</p>
              <p className="text-2xl font-bold mt-1" style={{ color: s.color }}>
                {stats[s.key]}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      {stats.total > 0 && (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  color: 'var(--foreground)',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
