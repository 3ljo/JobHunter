'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { getTrackerStats, getAllTrackerJobs, getCVHistory } from '@/lib/api';
import { TrackerStats, TrackerJob } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Briefcase, Calendar, Trophy, FileText, FileSearch, Plus, Sparkles, ArrowRight, TrendingUp } from 'lucide-react';

const statusStyles: Record<string, string> = {
  applied: 'bg-blue-500/15 text-blue-400',
  interview: 'bg-amber-500/15 text-amber-400',
  offer: 'bg-emerald-500/15 text-emerald-400',
  rejected: 'bg-red-500/15 text-red-400',
  saved: 'bg-muted text-muted-foreground',
};

const statIcons = [Briefcase, Calendar, Trophy, FileText];

const statAccents = [
  { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/10' },
  { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/10' },
  { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/10' },
  { text: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/10' },
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
        // Stats will remain null
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LoadingSpinner className="mt-32" />;

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
          Welcome back, <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">{firstName}</span>
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">Here&apos;s your job search at a glance.</p>
      </div>

      {/* Hero CTA */}
      <Link href="/cv" className="group block">
        <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-600/15 via-violet-500/5 to-transparent p-6 transition-all hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/5">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-violet-500/10 blur-[60px] transition-all group-hover:bg-violet-500/15" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/15 ring-1 ring-violet-500/20">
                <Sparkles className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Analyze Your CV</h3>
                <p className="text-muted-foreground text-sm">Get AI-powered ATS scoring and optimization suggestions</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground/60 transition-all group-hover:text-violet-400 group-hover:translate-x-1" />
          </div>
        </div>
      </Link>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map((card, i) => {
          const Icon = statIcons[i];
          const accent = statAccents[i];
          return (
            <div
              key={card.label}
              className={`group rounded-2xl border border-border bg-card/70 p-5 transition-all hover:border-border hover:bg-card/80`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${accent.bg}`}>
                  <Icon className={`h-4 w-4 ${accent.text}`} />
                </div>
                <TrendingUp className="h-3.5 w-3.5 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground" />
              </div>
              <p className="text-3xl font-bold tracking-tight text-foreground">{card.value}</p>
              <p className="text-xs font-medium text-muted-foreground mt-1">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/cv">
          <Button className="gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white hover:shadow-lg hover:shadow-violet-500/20 transition-all">
            <FileSearch className="h-4 w-4" />
            Analyze CV
          </Button>
        </Link>
        <Link href="/tracker">
          <Button variant="outline" className="gap-2 rounded-xl border-border text-muted-foreground hover:bg-accent hover:text-foreground hover:border-border transition-all">
            <Plus className="h-4 w-4" />
            Add Application
          </Button>
        </Link>
      </div>

      {/* Recent Applications */}
      <div className="rounded-2xl border border-border bg-card/70 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <h3 className="text-sm font-semibold text-foreground">Recent Applications</h3>
          {recentJobs.length > 0 && (
            <Link href="/tracker">
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground gap-1">
                View all
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          )}
        </div>
        <div className="p-2">
          {recentJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50 mb-4">
                <Briefcase className="h-6 w-6 text-muted-foreground/60" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No applications yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1 max-w-[240px]">Start tracking your job search to see your progress here.</p>
              <Link href="/tracker" className="mt-5">
                <Button size="sm" className="rounded-xl gap-2 bg-violet-600 hover:bg-violet-500 text-white text-xs">
                  <Plus className="h-3.5 w-3.5" />
                  Track your first application
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-0.5">
              {recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between rounded-xl px-4 py-3 transition-colors hover:bg-accent/50"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-bold text-muted-foreground ring-1 ring-border">
                      {job.company_name?.charAt(0)?.toUpperCase() || 'C'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground/90 truncate">{job.company_name}</p>
                      <p className="text-xs text-muted-foreground/60 truncate">{job.job_title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant="secondary" className={`text-[11px] ${statusStyles[job.status]}`}>
                      {job.status}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground/60 hidden sm:block tabular-nums">
                      {new Date(job.applied_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
