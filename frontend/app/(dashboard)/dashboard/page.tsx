'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { getTrackerStats, getAllTrackerJobs, getCVHistory } from '@/lib/api';
import { TrackerStats, TrackerJob } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Briefcase, Calendar, Trophy, FileText, FileSearch, Plus, Sparkles } from 'lucide-react';

const statusStyles: Record<string, string> = {
  applied: 'bg-blue-500/15 text-blue-400',
  interview: 'bg-amber-500/15 text-amber-400',
  offer: 'bg-emerald-500/15 text-emerald-400',
  rejected: 'bg-red-500/15 text-red-400',
  saved: 'bg-zinc-700/50 text-zinc-400',
};

const statIcons = [Briefcase, Calendar, Trophy, FileText];

const statColors = [
  'text-blue-400 bg-blue-500/10',
  'text-amber-400 bg-amber-500/10',
  'text-emerald-400 bg-emerald-500/10',
  'text-violet-400 bg-violet-500/10',
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
        <h2 className="text-2xl font-bold tracking-tight text-white">
          Welcome back, {firstName}
        </h2>
        <p className="text-zinc-400 mt-1">Here&apos;s your job search at a glance.</p>
      </div>

      {/* Hero CTA */}
      <Link href="/cv" className="block">
        <div className="rounded-2xl bg-gradient-to-r from-violet-600/20 via-violet-500/10 to-transparent border border-violet-500/20 p-6 hover:border-violet-500/30 transition-colors">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600/20">
              <Sparkles className="h-6 w-6 text-violet-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Analyze Your CV</h3>
              <p className="text-zinc-400 text-sm">Get AI-powered ATS scoring and optimization suggestions</p>
            </div>
          </div>
        </div>
      </Link>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, i) => {
          const Icon = statIcons[i];
          return (
            <div key={card.label} className="rounded-xl bg-zinc-900/50 border border-white/[0.06] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-400">{card.label}</p>
                  <p className="text-3xl font-bold tracking-tight text-white mt-2">{card.value}</p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${statColors[i]}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/cv">
          <Button className="gap-2 bg-violet-600 hover:bg-violet-500 text-white">
            <FileSearch className="h-4 w-4" />
            Analyze CV
          </Button>
        </Link>
        <Link href="/tracker">
          <Button variant="outline" className="gap-2 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white">
            <Plus className="h-4 w-4" />
            Add Application
          </Button>
        </Link>
      </div>

      {/* Recent Applications */}
      <div className="rounded-xl bg-zinc-900/50 border border-white/[0.06]">
        <div className="flex items-center justify-between p-5 pb-3">
          <h3 className="text-base font-semibold text-white">Recent Applications</h3>
          {recentJobs.length > 0 && (
            <Link href="/tracker">
              <Button variant="ghost" size="sm" className="text-xs text-zinc-400 hover:text-white">
                View all
              </Button>
            </Link>
          )}
        </div>
        <div className="px-5 pb-5">
          {recentJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800 mb-4">
                <Briefcase className="h-6 w-6 text-zinc-500" />
              </div>
              <p className="text-sm font-medium text-zinc-300">No applications yet</p>
              <p className="text-sm text-zinc-500 mt-1">Start tracking your job search to see progress here.</p>
              <Link href="/tracker" className="mt-4">
                <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-300">Track your first application</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between rounded-lg border border-white/[0.04] p-4 transition-colors hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-sm font-bold text-zinc-400">
                      {job.company_name?.charAt(0)?.toUpperCase() || 'C'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-200 truncate">{job.company_name}</p>
                      <p className="text-sm text-zinc-500 truncate">{job.job_title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <Badge variant="secondary" className={statusStyles[job.status]}>
                      {job.status}
                    </Badge>
                    <span className="text-xs text-zinc-500 hidden sm:block">
                      {new Date(job.created_at).toLocaleDateString()}
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
