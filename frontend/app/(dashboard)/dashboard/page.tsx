'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { getTrackerStats, getAllTrackerJobs, getCVHistory } from '@/lib/api';
import { TrackerStats, TrackerJob } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Plus, ArrowRight } from 'lucide-react';
import { useThemeStore } from '@/store/themeStore';

const statusStyles: Record<string, string> = {
  applied: 'bg-blue-500/15 text-blue-400',
  interview: 'bg-amber-500/15 text-amber-400',
  offer: 'bg-emerald-500/15 text-emerald-400',
  rejected: 'bg-red-500/15 text-red-400',
  saved: 'bg-muted text-muted-foreground',
};

const statAccents = [
  { label: 'Applications', color: '#60a5fa' },
  { label: 'Interviews',   color: '#fbbf24' },
  { label: 'Offers',       color: '#34d399' },
  { label: 'CVs Analyzed', color: '#a78bfa' },
];

const featureCards = [
  {
    href: '/cv',
    label: 'CV Analyzer',
    desc: 'ATS scoring & optimization',
    bg: 'aivent-s3.webp',
    color: 'from-violet-600/60 via-violet-900/80',
  },
  {
    href: '/cover-letter',
    label: 'Cover Letter',
    desc: 'AI-tailored in seconds',
    bg: 'aivent-s4.webp',
    color: 'from-fuchsia-600/60 via-fuchsia-900/80',
  },
  {
    href: '/tracker',
    label: 'Job Tracker',
    desc: 'Kanban & table view',
    bg: 'aivent-s5.webp',
    color: 'from-indigo-600/60 via-indigo-900/80',
  },
  {
    href: '/cv-history',
    label: 'CV History',
    desc: 'All your past analyses',
    bg: 'aivent-s6.webp',
    color: 'from-violet-700/60 via-slate-900/80',
  },
];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { theme } = useThemeStore();
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

  const statValues = [
    stats?.total || 0,
    stats?.interview || 0,
    stats?.offer || 0,
    cvCount,
  ];

  const firstName = user?.email?.split('@')[0] || 'there';
  const dark = theme === 'dark';

  return (
    <div className="space-y-6">

      {/* ── HERO PANEL ── */}
      <div className="relative overflow-hidden rounded-3xl"
        style={{
          background: dark
            ? 'linear-gradient(135deg, #1A1E42 0%, #101435 60%, #0d1030 100%)'
            : 'linear-gradient(135deg, #ede9fe 0%, #f5f3ff 60%, #faf5ff 100%)',
          border: dark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(118,77,240,0.2)',
        }}>

        {/* Mesh dot grid */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

        {/* Orb glows */}
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-violet-600/30 blur-[100px] pointer-events-none" />
        <div className="absolute right-0 bottom-0 h-56 w-56 rounded-full bg-fuchsia-600/20 blur-[80px] pointer-events-none" />

        <div className="relative p-7 md:p-10">
          {/* AIvent-style [ subtitle ] */}
          <p className="mb-4 text-sm font-bold tracking-widest" style={{ color: dark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)' }}>
            <span className="text-violet-400 font-black">[&nbsp;&nbsp;</span>
            YOUR COMMAND CENTER
            <span className="text-violet-400 font-black">&nbsp;&nbsp;]</span>
          </p>

          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight mb-2" style={{ color: dark ? '#ffffff' : '#111827' }}>
            Welcome back,{' '}
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-300 to-violet-300 bg-clip-text text-transparent">
              {firstName}
            </span>
          </h1>
          <p className="text-base mb-8" style={{ color: dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.45)' }}>Your AI-powered job search is ready to go.</p>

          {/* Stats row — AIvent glass counter style */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {statAccents.map((acc, i) => (
              <div key={acc.label}
                className="group relative overflow-hidden rounded-2xl p-5 transition-all duration-300"
                style={{
                  background: dark ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.7)',
                  border: dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(118,77,240,0.15)',
                  backdropFilter: 'blur(8px)',
                }}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: `radial-gradient(circle at 50% 120%, ${acc.color}22 0%, transparent 70%)` }} />
                {/* colored top accent line */}
                <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl opacity-60"
                  style={{ background: acc.color }} />
                <p className="text-5xl font-black tabular-nums leading-none mt-1" style={{ color: dark ? '#ffffff' : '#111827' }}>
                  {statValues[i]}
                </p>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] mt-2" style={{ color: dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)' }}>
                  {acc.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FEATURE CARDS ── AIvent "Why Attend" style */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.15em] mb-3" style={{ color: dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)' }}>
          <span className="text-violet-400 font-black">[&nbsp;</span>
          Quick Actions
          <span className="text-violet-400 font-black">&nbsp;]</span>
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {featureCards.map((card) => (
            <Link key={card.href} href={card.href} className="group relative h-[180px] overflow-hidden rounded-2xl block">
              {/* Background image */}
              <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{ backgroundImage: `url('/${card.bg}')` }} />
              {/* Color overlay */}
              <div className={`absolute inset-0 bg-gradient-to-t ${card.color} to-[#0d1030]`} />
              {/* AIvent radial glow on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: 'radial-gradient(circle at 50% 0%, rgba(118,77,240,0.6) 0%, transparent 65%)' }} />
              {/* Bottom gradient */}
              <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/75 to-transparent" />
              {/* Arrow on hover */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-1 group-hover:translate-x-0">
                <ArrowRight className="h-4 w-4 text-white/70" />
              </div>
              {/* Text content */}
              <div className="absolute bottom-0 left-0 p-5">
                <h3 className="text-base font-black text-white leading-tight">{card.label}</h3>
                <p className="text-white/50 text-xs mt-0.5">{card.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── RECENT APPLICATIONS ── */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.15em] mb-3" style={{ color: dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)' }}>
          <span className="text-violet-400 font-black">[&nbsp;</span>
          Recent Applications
          <span className="text-violet-400 font-black">&nbsp;]</span>
        </p>
        <div className="relative overflow-hidden rounded-2xl"
          style={{
            background: dark ? 'linear-gradient(135deg, #1A1E42 0%, #101435 100%)' : '#ffffff',
            border: dark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(118,77,240,0.15)',
            boxShadow: dark ? 'none' : '0 4px 24px rgba(118,77,240,0.08)',
          }}>
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />

          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.05]">
            <h3 className="text-sm font-bold tracking-wide" style={{ color: dark ? 'rgba(255,255,255,0.8)' : '#111827' }}>Latest Tracked Jobs</h3>
            {recentJobs.length > 0 && (
              <Link href="/tracker">
                <Button variant="ghost" size="sm" className="text-xs hover:text-violet-400 gap-1 transition-colors" style={{ color: dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                  View all <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            )}
          </div>

          <div className="p-2">
            {recentJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl mb-4 text-2xl font-black"
                  style={{ background: 'rgba(118,77,240,0.1)', border: '1px solid rgba(118,77,240,0.2)', color: 'rgba(118,77,240,0.5)' }}>
                  0
                </div>
                <p className="text-sm font-bold" style={{ color: dark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>No applications yet</p>
                <p className="text-xs mt-1 max-w-[240px]" style={{ color: dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)' }}>Start tracking your job search to see progress here.</p>
                <Link href="/tracker" className="mt-5">
                  <Button size="sm"
                    className="rounded-xl gap-2 bg-gradient-to-b from-violet-500 to-violet-700 text-white text-xs shadow-[0_2px_16px_rgba(118,77,240,0.35)]">
                    <Plus className="h-3.5 w-3.5" /> Track first application
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-0.5">
                {recentJobs.map((job) => (
                  <div key={job.id}
                    className="group flex items-center justify-between rounded-xl px-4 py-3 transition-all duration-200"
                    style={{ ':hover': { background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' } } as any}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = dark ? 'rgba(255,255,255,0.04)' : 'rgba(118,77,240,0.04)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/[0.12] text-sm font-black text-violet-400 ring-1 ring-violet-500/20 transition-all group-hover:ring-violet-500/40">
                        {job.company_name?.charAt(0)?.toUpperCase() || 'C'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: dark ? 'rgba(255,255,255,0.8)' : '#111827' }}>{job.company_name}</p>
                        <p className="text-xs truncate" style={{ color: dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.45)' }}>{job.job_title}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge variant="secondary" className={`text-[11px] ${statusStyles[job.status]}`}>
                        {job.status}
                      </Badge>
                      <span className="text-[11px] hidden sm:block tabular-nums" style={{ color: dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)' }}>
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

    </div>
  );
}
