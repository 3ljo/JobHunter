'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { getTrackerStats, getAllTrackerJobs, getCVHistory } from '@/lib/api';
import { TrackerStats, TrackerJob } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const statusStyles: Record<string, string> = {
  applied: 'bg-blue-500/10 text-blue-500 dark:bg-blue-500/20 dark:text-blue-400',
  interview: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
  offer: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
  rejected: 'bg-red-500/10 text-red-500 dark:bg-red-500/20 dark:text-red-400',
  saved: 'bg-muted text-muted-foreground',
};

const statIcons = [
  // Briefcase
  <svg key="brief" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  // Calendar
  <svg key="cal" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  // Trophy
  <svg key="trophy" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>,
  // File
  <svg key="file" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
];

const statColors = [
  'text-blue-500 bg-blue-500/10 dark:bg-blue-500/20',
  'text-amber-500 bg-amber-500/10 dark:bg-amber-500/20',
  'text-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/20',
  'text-violet-500 bg-violet-500/10 dark:bg-violet-500/20',
];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<TrackerStats | null>(null);
  const [recentJobs, setRecentJobs] = useState<TrackerJob[]>([]);
  const [cvCount, setCvCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, jobsRes, cvRes] = await Promise.all([
          getTrackerStats(),
          getAllTrackerJobs(),
          getCVHistory(),
        ]);
        setStats(statsRes.data.stats);
        setRecentJobs(jobsRes.data.jobs.slice(0, 5));
        setCvCount(cvRes.data.cvs.length);
      } catch {
        // Stats will remain null — handled in UI
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LoadingSpinner className="mt-20" />;

  const statCards = [
    { label: 'Applications', value: stats?.total || 0 },
    { label: 'Interviews', value: stats?.interview || 0 },
    { label: 'Offers', value: stats?.offer || 0 },
    { label: 'CVs Analyzed', value: cvCount },
  ];

  const firstName = user?.email?.split('@')[0] || 'there';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome back, {firstName}
        </h2>
        <p className="text-muted-foreground mt-1">Here&apos;s your job search at a glance.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, i) => (
          <Card key={card.label} className="relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                  <p className="text-3xl font-bold tracking-tight text-foreground mt-2">{card.value}</p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${statColors[i]}`}>
                  {statIcons[i]}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/cv">
          <Button className="gap-2">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Analyze CV
          </Button>
        </Link>
        <Link href="/tracker">
          <Button variant="outline" className="gap-2">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Application
          </Button>
        </Link>
      </div>

      {/* Recent Applications */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Recent Applications</CardTitle>
            {recentJobs.length > 0 && (
              <Link href="/tracker">
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                  View all
                </Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {recentJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                <svg className="h-6 w-6 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
              </div>
              <p className="text-sm font-medium text-foreground">No applications yet</p>
              <p className="text-sm text-muted-foreground mt-1">Start tracking your job search to see your progress here.</p>
              <Link href="/tracker" className="mt-4">
                <Button size="sm" variant="outline">Track your first application</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-accent/30"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-bold text-muted-foreground">
                      {job.company_name?.charAt(0)?.toUpperCase() || 'C'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{job.company_name}</p>
                      <p className="text-sm text-muted-foreground truncate">{job.job_title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <Badge variant="secondary" className={statusStyles[job.status]}>
                      {job.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground hidden sm:block">
                      {new Date(job.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
