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
  { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/10', radial: 'rgba(59,130,246,0.1)', bar: 'from-blue-500 to-blue-400/50' },
  { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/10', radial: 'rgba(245,158,11,0.1)', bar: 'from-amber-500 to-amber-400/50' },
  { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/10', radial: 'rgba(16,185,129,0.1)', bar: 'from-emerald-500 to-emerald-400/50' },
  { text: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/10', radial: 'rgba(118,77,240,0.12)', bar: 'from-violet-500 to-violet-400/50' },
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
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/[0.08] px-3 py-1 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-violet-400">Job Search Dashboard</span>
        </div>
        <h2 className="text-3xl font-black tracking-tight text-foreground">
          Welcome back, <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-300 bg-clip-text text-transparent">{firstName}</span>
        </h2>
        <p className="text-muted-foreground mt-1.5 text-sm">Here&apos;s your job search at a glance.</p>
      </div>

      {/* Hero CTA */}
      <Link href="/cv" className="group block">
        <div className="relative overflow-hidden rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-600/20 via-violet-500/8 to-transparent p-6 transition-all duration-300 hover:border-violet-500/45 hover:shadow-[0_8px_40px_-8px_rgba(118,77,240,0.35)]">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{ background: 'radial-gradient(circle at 20% 50%, rgba(118,77,240,0.15) 0%, transparent 65%)' }} />
          <div className="absolute -right-10 -top-10 h-52 w-52 rounded-full bg-violet-500/15 blur-[80px] transition-all group-hover:bg-violet-500/25" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/30 to-violet-700/20 ring-1 ring-violet-500/35 shadow-[0_0_20px_rgba(118,77,240,0.2)]">
                <Sparkles className="h-5 w-5 text-violet-300" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Analyze Your CV</h3>
                <p className="text-muted-foreground text-sm mt-0.5">Get AI-powered ATS scoring and optimization suggestions</p>
              </div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 ring-1 ring-violet-500/20 transition-all duration-200 group-hover:bg-violet-500/20 group-hover:ring-violet-500/40 group-hover:shadow-[0_0_12px_rgba(118,77,240,0.25)]">
              <ArrowRight className="h-4 w-4 text-violet-400 transition-transform duration-200 group-hover:translate-x-0.5" />
            </div>
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
              className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-card p-5 transition-all duration-300 hover:border-violet-500/20 hover:shadow-[0_4px_30px_-4px_rgba(118,77,240,0.2)]"
            >
              {/* Radial glow on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: `radial-gradient(circle at 50% 110%, ${accent.radial} 0%, transparent 70%)` }}
              />
              {/* Bottom accent bar */}
              <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r ${accent.bar} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

              <div className="relative flex items-start justify-between mb-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent.bg} ring-1 ring-white/[0.07] shadow-inner`}>
                  <Icon className={`h-5 w-5 ${accent.text}`} />
                </div>
                <TrendingUp className="h-3.5 w-3.5 text-muted-foreground/30 transition-colors group-hover:text-muted-foreground/60 mt-0.5" />
              </div>
              <p className="relative text-4xl font-black tracking-tight text-foreground">{card.value}</p>
              <p className="relative text-[11px] font-bold uppercase tracking-widest text-muted-foreground/50 mt-1.5">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/cv">
          <Button className="gap-2 rounded-xl bg-gradient-to-b from-violet-500 to-violet-700 text-white hover:from-violet-400 hover:to-violet-600 shadow-[0_2px_20px_rgba(118,77,240,0.35)] hover:shadow-[0_4px_28px_rgba(118,77,240,0.50)] transition-all active:scale-[0.97]">
            <FileSearch className="h-4 w-4" />
            Analyze CV
          </Button>
        </Link>
        <Link href="/tracker">
          <Button variant="outline" className="gap-2 rounded-xl border-white/[0.1] text-muted-foreground hover:bg-accent hover:text-foreground hover:border-violet-500/30 transition-all">
            <Plus className="h-4 w-4" />
            Add Application
          </Button>
        </Link>
      </div>

      {/* Recent Applications */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-card">
        {/* Subtle top glow */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.05]">
          <h3 className="text-sm font-bold text-foreground tracking-wide">Recent Applications</h3>
          {recentJobs.length > 0 && (
            <Link href="/tracker">
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-violet-400 gap-1 transition-colors">
                View all
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          )}
        </div>
        <div className="p-2">
          {recentJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/[0.08] ring-1 ring-violet-500/15 mb-4">
                <Briefcase className="h-6 w-6 text-violet-400/60" />
              </div>
              <p className="text-sm font-semibold text-foreground/70">No applications yet</p>
              <p className="text-xs text-muted-foreground/50 mt-1 max-w-[240px]">Start tracking your job search to see your progress here.</p>
              <Link href="/tracker" className="mt-5">
                <Button size="sm" className="rounded-xl gap-2 bg-gradient-to-b from-violet-500 to-violet-700 text-white text-xs shadow-[0_2px_16px_rgba(118,77,240,0.3)]">
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
                  className="group flex items-center justify-between rounded-xl px-4 py-3 transition-all duration-200 hover:bg-accent/40"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/[0.08] text-sm font-black text-violet-400 ring-1 ring-violet-500/15 transition-all group-hover:ring-violet-500/30">
                      {job.company_name?.charAt(0)?.toUpperCase() || 'C'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground/90 truncate">{job.company_name}</p>
                      <p className="text-xs text-muted-foreground/55 truncate">{job.job_title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant="secondary" className={`text-[11px] ${statusStyles[job.status]}`}>
                      {job.status}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground/50 hidden sm:block tabular-nums">
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
