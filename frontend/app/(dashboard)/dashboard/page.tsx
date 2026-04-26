'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useAccountStore } from '@/store/accountStore';
import { useDashboardStore } from '@/store/dashboardStore';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import UsageSummaryCard from '@/components/usage/UsageSummaryCard';
import { ArrowRight } from 'lucide-react';

/* ─── config ──────────────────────────────────────────────────────── */
const TOOLS = [
  { href: '/cv',           label: 'CV Analyzer',     desc: 'ATS scoring & keyword gap analysis for any job.',        img: '/aivent/misc/s3.webp' },
  { href: '/create-cv',    label: 'Create CV',       desc: 'Build a CV from scratch — fill the form, preview live, tune with AI, download.', img: '/aivent/misc/s2.webp' },
  { href: '/cover-letter', label: 'Cover Letter',    desc: 'AI-tailored cover letters generated in seconds.',         img: '/aivent/misc/s4.webp' },
  { href: '/interview',    label: 'Mock Interview',  desc: 'Voice-based AI interview practice with scored feedback.', img: '/aivent/misc/s7.webp', badge: 'PRO VOICE' },
  { href: '/tracker',      label: 'Job Tracker',     desc: 'Kanban & table view for every application you send.',    img: '/aivent/misc/s5.webp' },
  { href: '/cv-history',   label: 'CV History',      desc: 'Full history of every analysis with score progression.', img: '/aivent/misc/s6.webp' },
] as const;

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  applied:   { label: 'Applied',   color: '#60a5fa', bg: 'rgba(96,165,250,0.12)'  },
  interview: { label: 'Interview', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)'  },
  offer:     { label: 'Offer',     color: '#34d399', bg: 'rgba(52,211,153,0.12)'  },
  rejected:  { label: 'Rejected',  color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
  saved:     { label: 'Saved',     color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
};

/* ─── page ────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { user } = useAuthStore();
  const { stats, jobs: allJobs, cvs, loaded, load } = useDashboardStore();
  const { profile, loaded: accountLoaded, load: loadAccount } = useAccountStore();

  useEffect(() => { load(); loadAccount(); }, [load, loadAccount]);

  const jobs = useMemo(() => allJobs.slice(0, 5), [allJobs]);
  const cvCount = cvs.length;

  // Wait on both stores so the greeting doesn't flicker email → name on reload.
  if (!loaded || !accountLoaded) return <LoadingSpinner className="mt-32" />;

  const firstName =
    profile?.full_name?.trim().split(/\s+/)[0]
    || user?.email?.split('@')[0]
    || 'there';
  const hasJobs   = jobs.length > 0;

  const statBoxes = [
    { label: 'Applications', value: stats?.total      ?? 0, color: '#764DF0' },
    { label: 'Interviews',   value: stats?.interview  ?? 0, color: '#fbbf24' },
    { label: 'Offers',       value: stats?.offer      ?? 0, color: '#34d399' },
    { label: 'CVs Analyzed', value: cvCount,                color: '#c084fc' },
  ];

  return (
    <div
      style={{
        width: '100vw',
        maxWidth: '100vw',
        marginLeft: 'calc(-50vw + 50%)',
        marginTop: '-32px',
        background: '#101435',
        position: 'relative',
        zIndex: 2,
        overflowX: 'hidden',
      }}
    >

      {/* ══════════════════════════════════════════════════════════
          HERO — centered text, no image
      ══════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden pt-14 sm:pt-[100px]"
        style={{
          backgroundImage: 'url(/aivent/background/8.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          paddingBottom: 0,
        }}
      >
        {/* dark overlay */}
        <div className="absolute inset-0" style={{ background: 'rgba(16,20,53,0.72)' }} />
        {/* bottom fade into #101435 */}
        <div className="absolute bottom-0 left-0 right-0" style={{ height: '40%', background: 'linear-gradient(0deg,#101435 0%,transparent 100%)' }} />

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 pb-0 text-center" style={{ zIndex: 2 }}>
          <span className="aivent-subtitle s2">Welcome back</span>
          <h1
            className="text-white leading-[1.1] mb-5 break-words"
            style={{ fontSize: 'clamp(30px,8vw,64px)', fontWeight: 800, letterSpacing: '-0.02em', overflowWrap: 'anywhere' }}
          >
            Hello,{' '}
            <span style={{ color: '#764DF0' }}>{firstName}</span>
          </h1>
          <p className="text-white/55 text-base sm:text-lg leading-relaxed mb-10 mx-auto" style={{ fontWeight: 400, maxWidth: '36rem' }}>
            Your AI-powered command center. Analyze CVs, generate cover letters, and track every application from one place.
          </p>
        </div>

        {/* ── glassmorphism stats bar ── */}
        <div className="relative px-4 sm:px-6" style={{ zIndex: 3 }}>
          <div className="mx-auto max-w-5xl">
            <div
              className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-white/[0.06] rounded-t-xl px-4 sm:px-8 py-5"
              style={{
                background: 'rgba(0,0,0,0.28)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderBottom: 'none',
              }}
            >
              {statBoxes.map((s) => (
                <div key={s.label} className="text-center px-2 sm:px-4 py-1">
                  <div
                    className="text-2xl sm:text-3xl font-black tabular-nums mb-1 leading-none"
                    style={{ color: s.color }}
                  >
                    {s.value}
                  </div>
                  <p className="text-white/50 text-[10px] sm:text-xs uppercase tracking-widest" style={{ fontWeight: 600 }}>
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          TODAY'S USAGE — per-plan daily quota across AI features
      ══════════════════════════════════════════════════════════ */}
      <section className="pt-10 sm:pt-14 px-4 sm:px-6" style={{ background: '#101435', position: 'relative', zIndex: 1 }}>
        <div className="mx-auto max-w-5xl space-y-4">
          <UsageSummaryCard />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          TOOLS — feature card pattern
      ══════════════════════════════════════════════════════════ */}
      <section className="py-14 sm:py-24 px-4 sm:px-6" style={{ background: '#101435', position: 'relative', zIndex: 1 }}>
        <div className="mx-auto max-w-6xl">

          <div className="text-center mb-14">
            <span className="aivent-subtitle">Your AI Tools</span>
            <h2
              className="text-white tracking-tight"
              style={{ fontSize: 'clamp(30px,4vw,46px)', fontWeight: 800 }}
            >
              Everything You Need to Land the Job
            </h2>
            <p className="text-white/50 text-base mt-4 max-w-xl mx-auto" style={{ fontWeight: 400 }}>
              From ATS-beating CVs to automated cover letters — your full toolkit in one place.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {TOOLS.map((tool) => (
              <Link key={tool.href} href={tool.href} className="feature-card relative rounded-xl overflow-hidden block" style={{ minHeight: '200px' }}>
                {/* image background */}
                <div
                  className="card-bg absolute inset-0 transition-colors duration-500"
                  style={{ background: '#1A1E42' }}
                >
                  <img
                    src={tool.img}
                    alt={tool.label}
                    className="w-full h-full object-cover opacity-80"
                  />
                </div>
                {/* gradient */}
                <div
                  className="absolute bottom-0 left-0 right-0"
                  style={{ height: '70%', background: 'linear-gradient(0deg,#101435 0%,rgba(16,20,53,0) 100%)', zIndex: 1 }}
                />
                {/* radial glow on hover */}
                <div className="radial-overlay absolute inset-0" style={{ zIndex: 2 }} />
                {/* arrow */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ zIndex: 3 }}>
                  <ArrowRight className="h-4 w-4 text-white/70" />
                </div>
                {/* Plan ribbon (e.g. "PRO VOICE") */}
                {'badge' in tool && tool.badge && (
                  <div className="absolute top-3 left-3" style={{ zIndex: 3 }}>
                    <span
                      className="text-[9px] font-black px-2 py-0.5 rounded"
                      style={{
                        background: 'rgba(192,132,252,0.2)',
                        color: '#e9d5ff',
                        border: '1px solid rgba(192,132,252,0.4)',
                        backdropFilter: 'blur(6px)',
                      }}
                    >
                      {tool.badge}
                    </span>
                  </div>
                )}
                {/* text */}
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-5" style={{ zIndex: 3 }}>
                  <h4 className="text-white font-bold text-sm sm:text-lg mb-0.5 sm:mb-1 tracking-tight">{tool.label}</h4>
                  <p className="text-white/55 text-xs sm:text-sm leading-snug hidden sm:block" style={{ fontWeight: 400 }}>{tool.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          RECENT APPLICATIONS
      ══════════════════════════════════════════════════════════ */}
      <section
        className="py-14 sm:py-24 px-4 sm:px-6"
        style={{
          backgroundImage: 'url(/aivent/background/7.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div className="absolute inset-0" style={{ background: 'rgba(10,13,40,0.88)' }} />
        <div className="absolute top-0 left-0 right-0" style={{ height: '80px', background: 'linear-gradient(180deg,#101435 0%,transparent 100%)' }} />
        <div className="absolute bottom-0 left-0 right-0" style={{ height: '80px', background: 'linear-gradient(0deg,#101435 0%,transparent 100%)' }} />

        <div className="relative mx-auto max-w-4xl" style={{ zIndex: 2 }}>

          <div className="text-center mb-12">
            <span className="aivent-subtitle s2">Pipeline</span>
            <h2
              className="text-white tracking-tight"
              style={{ fontSize: 'clamp(28px,3.5vw,42px)', fontWeight: 800 }}
            >
              Recent Applications
            </h2>
          </div>

          {/* card */}
          <div
            className="rounded-xl overflow-hidden"
            style={{
              background: 'rgba(0,0,0,0.32)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {/* top violet shimmer */}
            <div
              className="absolute inset-x-0 top-0 h-px pointer-events-none"
              style={{ background: 'linear-gradient(90deg,transparent,rgba(118,77,240,0.7),transparent)' }}
            />

            {/* header row */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <h3 className="text-white/80 text-sm font-bold tracking-wide uppercase" style={{ letterSpacing: '0.08em' }}>
                Latest Jobs
              </h3>
              {hasJobs && (
                <Link
                  href="/tracker"
                  className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white/80 transition-colors"
                >
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>

            {!hasJobs ? (
              /* empty state */
              <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                <div
                  className="text-4xl font-black mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
                  style={{ background: 'rgba(118,77,240,0.12)', border: '1px solid rgba(118,77,240,0.25)', color: '#764DF0' }}
                >
                  0
                </div>
                <p className="text-white/50 text-sm font-semibold mb-1">No applications tracked yet</p>
                <p className="text-white/30 text-xs mb-8 max-w-xs leading-relaxed">
                  Start tracking your job search to see your full pipeline here.
                </p>
                <Link href="/tracker" className="btn-aivent fx-slide" data-hover="OPEN TRACKER">
                  <span>Track First Application</span>
                </Link>
              </div>
            ) : (
              <ul>
                {jobs.map((job, i) => {
                  const sc = STATUS_MAP[job.status] ?? { label: job.status, color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' };
                  return (
                    <li
                      key={job.id}
                      className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 transition-colors duration-200 hover:bg-white/[0.03] cursor-default"
                      style={{ borderBottom: i < jobs.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
                    >
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <div
                          className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black text-violet-300"
                          style={{ background: 'rgba(118,77,240,0.15)', border: '1px solid rgba(118,77,240,0.2)' }}
                        >
                          {job.company_name?.charAt(0)?.toUpperCase() ?? 'C'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white/90 text-sm font-semibold truncate">{job.company_name}</p>
                          <p className="text-white/35 text-xs truncate">{job.job_title}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <span
                          className="text-[11px] font-bold px-2 sm:px-3 py-1 rounded-lg"
                          style={{ color: sc.color, background: sc.bg }}
                        >
                          {sc.label}
                        </span>
                        <span className="hidden sm:block text-[11px] text-white/25 tabular-nums">
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
