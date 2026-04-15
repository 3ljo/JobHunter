'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { getTrackerStats, getAllTrackerJobs, getCVHistory } from '@/lib/api';
import { TrackerStats, TrackerJob } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Plus, ArrowRight, TrendingUp, Star } from 'lucide-react';
import { useThemeStore } from '@/store/themeStore';

/* ─── Static config ─────────────────────────────────────────────── */
const STATS = [
  { label: 'Applications', color: '#764DF0', glow: 'rgba(118,77,240,0.4)' },
  { label: 'Interviews',   color: '#fbbf24', glow: 'rgba(251,191,36,0.3)' },
  { label: 'Offers',       color: '#34d399', glow: 'rgba(52,211,153,0.3)' },
  { label: 'CVs Analyzed', color: '#c084fc', glow: 'rgba(192,132,252,0.3)' },
] as const;

const TOOLS = [
  {
    href: '/cv',
    label: 'CV Analyzer',
    desc: 'ATS scoring & keyword optimization',
    img: '/aivent/misc/s3.webp',
  },
  {
    href: '/cover-letter',
    label: 'Cover Letter',
    desc: 'AI-tailored letters in seconds',
    img: '/aivent/misc/s4.webp',
  },
  {
    href: '/tracker',
    label: 'Job Tracker',
    desc: 'Kanban & table application board',
    img: '/aivent/misc/s5.webp',
  },
  {
    href: '/cv-history',
    label: 'CV History',
    desc: 'All your past analyses & scores',
    img: '/aivent/misc/s6.webp',
  },
] as const;

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  applied:   { label: 'Applied',   color: '#60a5fa', bg: 'rgba(96,165,250,0.12)'  },
  interview: { label: 'Interview', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)'  },
  offer:     { label: 'Offer',     color: '#34d399', bg: 'rgba(52,211,153,0.12)'  },
  rejected:  { label: 'Rejected',  color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
  saved:     { label: 'Saved',     color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
};

/* ─── Component ─────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { user } = useAuthStore();
  const { theme } = useThemeStore();
  const dark = theme === 'dark';

  const [stats, setStats]     = useState<TrackerStats | null>(null);
  const [recentJobs, setJobs] = useState<TrackerJob[]>([]);
  const [cvCount, setCvCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getTrackerStats(), getAllTrackerJobs(), getCVHistory()])
      .then(([s, j, c]) => {
        setStats(s.data.stats);
        setJobs(j.data.jobs.slice(0, 5));
        setCvCount(c.data.cvs.length);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner className="mt-32" />;

  const statValues  = [stats?.total ?? 0, stats?.interview ?? 0, stats?.offer ?? 0, cvCount];
  const firstName   = user?.email?.split('@')[0] ?? 'there';
  const hasApps     = recentJobs.length > 0;
  const successRate = stats?.total
    ? Math.round(((stats.offer ?? 0) / stats.total) * 100)
    : 0;

  return (
    <div className="space-y-8">

      {/* ══════════════════════════════════════════
          HERO PANEL
      ══════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden rounded-3xl"
        style={{
          background: dark
            ? 'linear-gradient(135deg,#0a0d28 0%,#131740 55%,#0d1030 100%)'
            : 'linear-gradient(135deg,#ede9fe 0%,#f5f3ff 60%,#faf5ff 100%)',
          border: dark
            ? '1px solid rgba(255,255,255,0.06)'
            : '1px solid rgba(118,77,240,0.18)',
          boxShadow: dark
            ? '0 0 80px rgba(118,77,240,0.1)'
            : '0 8px 40px rgba(118,77,240,0.08)',
        }}
      >
        {/* dot-grid bg */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: dark
              ? 'radial-gradient(circle,rgba(255,255,255,0.6) 1px,transparent 1px)'
              : 'radial-gradient(circle,rgba(0,0,0,0.11) 1px,transparent 1px)',
            backgroundSize: '32px 32px',
            opacity: dark ? 0.045 : 0.07,
          }}
        />

        {/* orb — violet top-left */}
        <div
          className="pointer-events-none absolute -top-40 -left-40 rounded-full"
          style={{
            width: 560, height: 560,
            background: 'radial-gradient(circle,rgba(118,77,240,0.55) 0%,transparent 65%)',
            filter: 'blur(60px)',
          }}
        />
        {/* orb — fuchsia bottom-right */}
        <div
          className="pointer-events-none absolute -bottom-24 -right-24 rounded-full"
          style={{
            width: 440, height: 440,
            background: 'radial-gradient(circle,rgba(192,38,211,0.32) 0%,transparent 65%)',
            filter: 'blur(70px)',
          }}
        />
        {/* orb — indigo center */}
        <div
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: 600, height: 300,
            background: 'radial-gradient(ellipse,rgba(79,70,229,0.18) 0%,transparent 70%)',
            filter: 'blur(50px)',
          }}
        />

        {/* top shimmer line */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{ background: 'linear-gradient(90deg,transparent,rgba(118,77,240,0.9),transparent)' }}
        />

        <div className="relative px-7 py-10 md:px-12 md:py-12">

          {/* AIvent subtitle — [ bracket style ] */}
          <p
            className="mb-5 text-[11px] font-black uppercase tracking-[0.18em]"
            style={{ color: dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.38)' }}
          >
            <span style={{ color: '#764DF0' }}>[&nbsp;&nbsp;</span>
            YOUR COMMAND CENTER
            <span style={{ color: '#764DF0' }}>&nbsp;&nbsp;]</span>
          </p>

          {/* Headline */}
          <h1
            className="mb-3 font-black tracking-tight leading-[1.08]"
            style={{
              fontSize: 'clamp(34px,5.5vw,60px)',
              color: dark ? '#fff' : '#0f0f1a',
            }}
          >
            Welcome back,&nbsp;
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: 'linear-gradient(135deg,#a78bfa 0%,#f0abfc 50%,#818cf8 100%)',
                WebkitBackgroundClip: 'text',
              }}
            >
              {firstName}
            </span>
          </h1>

          <p
            className="mb-10 text-base font-medium"
            style={{ color: dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.42)' }}
          >
            Your AI-powered job search headquarters — track, optimize, and land.
          </p>

          {/* Stat counters — AIvent countdown box style */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {STATS.map((s, i) => (
              <div
                key={s.label}
                className="group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 cursor-default"
                style={{
                  background: dark ? 'rgba(0,0,0,0.28)' : 'rgba(255,255,255,0.78)',
                  border: dark
                    ? '1px solid rgba(255,255,255,0.07)'
                    : '1px solid rgba(118,77,240,0.12)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                {/* colored top accent line */}
                <div
                  className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl"
                  style={{ background: s.color, opacity: 0.75 }}
                />
                {/* bottom radial glow on hover */}
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `radial-gradient(ellipse at 50% 110%,${s.glow} 0%,transparent 65%)`,
                  }}
                />
                <p
                  className="text-[3.25rem] font-black tabular-nums leading-none mt-1 mb-1.5"
                  style={{ color: dark ? '#fff' : '#0f0f1a' }}
                >
                  {statValues[i]}
                </p>
                <p
                  className="text-[10px] font-black uppercase tracking-[0.15em]"
                  style={{ color: dark ? 'rgba(255,255,255,0.32)' : 'rgba(0,0,0,0.38)' }}
                >
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          {/* success-rate pills */}
          {stats?.total ? (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold"
                style={{
                  background: dark ? 'rgba(52,211,153,0.1)' : 'rgba(52,211,153,0.08)',
                  border: '1px solid rgba(52,211,153,0.25)',
                  color: '#34d399',
                }}
              >
                <TrendingUp className="h-3.5 w-3.5" />
                {successRate}% offer rate
              </div>
              {(stats.interview ?? 0) > 0 && (
                <div
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold"
                  style={{
                    background: dark ? 'rgba(251,191,36,0.1)' : 'rgba(251,191,36,0.08)',
                    border: '1px solid rgba(251,191,36,0.25)',
                    color: '#fbbf24',
                  }}
                >
                  <Star className="h-3.5 w-3.5" />
                  {stats.interview} interview{stats.interview !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          ) : null}

        </div>
      </section>

      {/* ══════════════════════════════════════════
          QUICK TOOLS — AIvent "Why Attend" cards
      ══════════════════════════════════════════ */}
      <section>
        <p
          className="mb-4 text-[11px] font-black uppercase tracking-[0.18em]"
          style={{ color: dark ? 'rgba(255,255,255,0.32)' : 'rgba(0,0,0,0.38)' }}
        >
          <span style={{ color: '#764DF0' }}>[&nbsp;</span>
          Quick Tools
          <span style={{ color: '#764DF0' }}>&nbsp;]</span>
        </p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {TOOLS.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group relative block overflow-hidden rounded-2xl"
              style={{ minHeight: '210px' }}
            >
              {/* background image — scale up on hover */}
              <div
                className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-110"
                style={{
                  backgroundImage: `url('${tool.img}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />

              {/* dark gradient overlay */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(0deg,rgba(7,9,26,0.92) 0%,rgba(7,9,26,0.45) 55%,rgba(7,9,26,0.15) 100%)',
                }}
              />

              {/* AIvent radial violet glow on hover */}
              <div
                className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background:
                    'radial-gradient(circle at 50% 0%,rgba(118,77,240,0.75) 0%,transparent 65%)',
                }}
              />

              {/* AIvent hover-bg-color solid violet tint */}
              <div
                className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-[0.18] transition-opacity duration-500"
                style={{ background: '#764DF0' }}
              />

              {/* top-right arrow */}
              <div className="absolute top-4 right-4 translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                <ArrowRight className="h-4 w-4 text-white/80" />
              </div>

              {/* text */}
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h3 className="text-white font-black text-base leading-tight tracking-tight">
                  {tool.label}
                </h3>
                <p className="text-white/45 text-xs mt-1 font-medium leading-snug">
                  {tool.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          RECENT APPLICATIONS
      ══════════════════════════════════════════ */}
      <section>
        <p
          className="mb-4 text-[11px] font-black uppercase tracking-[0.18em]"
          style={{ color: dark ? 'rgba(255,255,255,0.32)' : 'rgba(0,0,0,0.38)' }}
        >
          <span style={{ color: '#764DF0' }}>[&nbsp;</span>
          Recent Applications
          <span style={{ color: '#764DF0' }}>&nbsp;]</span>
        </p>

        <div
          className="relative overflow-hidden rounded-2xl"
          style={{
            background: dark
              ? 'linear-gradient(145deg,#0f1330 0%,#1A1E42 100%)'
              : '#ffffff',
            border: dark
              ? '1px solid rgba(255,255,255,0.07)'
              : '1px solid rgba(118,77,240,0.13)',
            boxShadow: dark ? 'none' : '0 4px 28px rgba(118,77,240,0.06)',
          }}
        >
          {/* top shimmer */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{
              background:
                'linear-gradient(90deg,transparent,rgba(118,77,240,0.65),transparent)',
            }}
          />

          {/* header */}
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{
              borderBottom: dark
                ? '1px solid rgba(255,255,255,0.05)'
                : '1px solid rgba(0,0,0,0.06)',
            }}
          >
            <h3
              className="text-sm font-bold tracking-wide"
              style={{ color: dark ? 'rgba(255,255,255,0.88)' : '#0f0f1a' }}
            >
              Latest Tracked Jobs
            </h3>
            {hasApps && (
              <Link href="/tracker">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-xs transition-colors hover:text-violet-400"
                  style={{ color: dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)' }}
                >
                  View all <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            )}
          </div>

          <div className="p-2">
            {!hasApps ? (

              /* empty state */
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-2xl mb-5 text-2xl font-black"
                  style={{
                    background: 'rgba(118,77,240,0.1)',
                    border: '1px solid rgba(118,77,240,0.22)',
                    color: '#764DF0',
                  }}
                >
                  0
                </div>
                <p
                  className="text-sm font-bold mb-1.5"
                  style={{ color: dark ? 'rgba(255,255,255,0.52)' : 'rgba(0,0,0,0.5)' }}
                >
                  No applications yet
                </p>
                <p
                  className="text-xs max-w-[240px] mb-6 leading-relaxed"
                  style={{ color: dark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.35)' }}
                >
                  Start tracking your job search to see your pipeline here.
                </p>
                <Link href="/tracker">
                  <button
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-xs font-bold transition-all duration-200 hover:opacity-90"
                    style={{
                      background: 'linear-gradient(135deg,#764DF0,#442490)',
                      boxShadow: '0 2px 18px rgba(118,77,240,0.4)',
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Track first application
                  </button>
                </Link>
              </div>

            ) : (

              /* jobs list */
              <ul className="space-y-0.5">
                {recentJobs.map((job) => {
                  const sc = STATUS_MAP[job.status] ?? {
                    label: job.status,
                    color: '#a78bfa',
                    bg: 'rgba(167,139,250,0.12)',
                  };
                  return (
                    <li
                      key={job.id}
                      className="group flex items-center justify-between rounded-xl px-4 py-3 transition-all duration-200"
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = dark
                          ? 'rgba(118,77,240,0.07)'
                          : 'rgba(118,77,240,0.04)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                      }}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black text-violet-400 ring-1 ring-violet-500/20 transition-all group-hover:ring-violet-500/40"
                          style={{ background: 'rgba(118,77,240,0.1)' }}
                        >
                          {job.company_name?.charAt(0)?.toUpperCase() ?? 'C'}
                        </div>
                        <div className="min-w-0">
                          <p
                            className="text-sm font-semibold truncate"
                            style={{ color: dark ? 'rgba(255,255,255,0.88)' : '#0f0f1a' }}
                          >
                            {job.company_name}
                          </p>
                          <p
                            className="text-xs truncate"
                            style={{
                              color: dark
                                ? 'rgba(255,255,255,0.35)'
                                : 'rgba(0,0,0,0.45)',
                            }}
                          >
                            {job.job_title}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className="text-[11px] font-bold px-2.5 py-1 rounded-lg"
                          style={{ color: sc.color, background: sc.bg }}
                        >
                          {sc.label}
                        </span>
                        <span
                          className="hidden sm:block text-[11px] tabular-nums"
                          style={{
                            color: dark
                              ? 'rgba(255,255,255,0.28)'
                              : 'rgba(0,0,0,0.35)',
                          }}
                        >
                          {new Date(job.applied_at).toLocaleDateString()}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>

            )}
          </div>
        </div>
      </section>

    </div>
  );
}
