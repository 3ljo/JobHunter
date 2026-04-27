'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Briefcase,
  Search,
  ExternalLink,
  RefreshCw,
  Sparkles,
  MapPin,
  Building2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  findJobsForCV,
  getLatestJobMatches,
  JobHunterJob,
  JobHunterMatch,
} from '@/lib/api';

// Per-source pill colors. Mirrors the violet-tinted "glass" style used
// elsewhere in the dashboard so this page doesn't feel like a foreign
// island. New sources should pick a distinct hue from this palette.
const SOURCE_STYLE: Record<string, { bg: string; color: string; border: string; label: string }> = {
  remotive:  { bg: 'rgba(52,211,153,0.15)',  color: '#34d399', border: 'rgba(52,211,153,0.3)',  label: 'Remotive'  },
  arbeitnow: { bg: 'rgba(96,165,250,0.15)',  color: '#60a5fa', border: 'rgba(96,165,250,0.3)',  label: 'Arbeitnow' },
  adzuna:    { bg: 'rgba(251,146,60,0.15)',  color: '#fb923c', border: 'rgba(251,146,60,0.3)',  label: 'Adzuna'    },
  jooble:    { bg: 'rgba(192,132,252,0.15)', color: '#c084fc', border: 'rgba(192,132,252,0.3)', label: 'Jooble'    },
};

const sourceMeta = (s: string) =>
  SOURCE_STYLE[s] || { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.65)', border: 'rgba(255,255,255,0.1)', label: s };

// Render relative-time as "3d ago" / "2h ago" — date-fns isn't worth a
// dependency for one helper, and the display only needs day-ish accuracy.
const relativeTime = (iso?: string | null) => {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  const diff = Date.now() - t;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  const yr = Math.floor(mo / 12);
  return `${yr}y ago`;
};

export default function JobHunterPage() {
  const [match, setMatch] = useState<JobHunterMatch | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  // Hydrate from cache on mount so revisiting the tab is instant.
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await getLatestJobMatches();
        if (mounted) setMatch(res.data.match);
      } catch (err: any) {
        // 401 redirects globally; anything else is just "no cache yet"
      } finally {
        if (mounted) setInitialLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleFindJobs = async () => {
    setSearching(true);
    setError(null);
    setErrorCode(null);
    try {
      const res = await findJobsForCV();
      setMatch(res.data.match);
      if (res.data.warning) {
        toast(res.data.warning, { icon: 'ℹ️' });
      } else {
        toast.success(`Found ${res.data.match.results.length} jobs for you`);
      }
    } catch (err: any) {
      const code = err.response?.data?.code;
      const message = err.response?.data?.error || 'Failed to find jobs. Try again.';
      setError(message);
      setErrorCode(code || null);
      // Don't toast.error for the "no CV" path — the inline empty state
      // is more informative and offers a link to /cv.
      if (code !== 'no_cv' && code !== 'cv_not_analyzed') {
        toast.error(message);
      }
    } finally {
      setSearching(false);
    }
  };

  const filtered = useMemo(() => {
    const list = match?.results || [];
    let out = list;
    if (sourceFilter !== 'all') {
      out = out.filter((j) => j.source === sourceFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.company.toLowerCase().includes(q) ||
          (j.location || '').toLowerCase().includes(q)
      );
    }
    return out;
  }, [match, search, sourceFilter]);

  const sourceTabs = useMemo(() => {
    if (!match) return [];
    const counts = match.source_counts || {};
    const tabs = [{ key: 'all', label: 'All', count: match.results.length }];
    for (const src of ['remotive', 'arbeitnow', 'adzuna', 'jooble']) {
      const c = match.results.filter((j) => j.source === src).length;
      if (c > 0) tabs.push({ key: src, label: sourceMeta(src).label, count: c });
    }
    void counts;
    return tabs;
  }, [match]);

  if (initialLoading) {
    return <LoadingSpinner className="mt-32" />;
  }

  // ── Empty state — user hasn't analyzed a CV yet ─────────────────────
  if (errorCode === 'no_cv' || errorCode === 'cv_not_analyzed') {
    return (
      <div className="space-y-6">
        <Header />
        <div
          className="rounded-2xl p-12 text-center"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: 'rgba(118,77,240,0.12)', border: '1px solid rgba(118,77,240,0.25)' }}
          >
            <AlertCircle className="h-6 w-6 text-violet-400" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1">
            {errorCode === 'no_cv' ? 'No CV yet' : 'CV not analyzed'}
          </h3>
          <p className="text-sm text-muted-foreground/70 mb-5">
            {errorCode === 'no_cv'
              ? 'Analyze a CV first so we can match you with the right jobs.'
              : 'This CV needs a full analysis run before we can match jobs.'}
          </p>
          <Link
            href="/cv"
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all"
            style={{
              background: 'linear-gradient(135deg, rgba(118,77,240,0.95), rgba(139,92,246,0.85))',
              boxShadow: '0 4px 14px rgba(118,77,240,0.35)',
            }}
          >
            <Sparkles className="h-4 w-4" /> Go to CV Analyzer
          </Link>
        </div>
      </div>
    );
  }

  // ── First-time state — never run a search ───────────────────────────
  if (!match) {
    return (
      <div className="space-y-6">
        <Header />
        <div
          className="rounded-2xl p-12 text-center"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: 'rgba(118,77,240,0.12)', border: '1px solid rgba(118,77,240,0.25)' }}
          >
            <Briefcase className="h-6 w-6 text-violet-400" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1">Find jobs matching your CV</h3>
          <p className="text-sm text-muted-foreground/70 mb-5 max-w-md mx-auto">
            We'll search across Remotive, Arbeitnow, Adzuna and Jooble in parallel and rank the
            best matches for your skills, role and location.
          </p>
          <button
            onClick={handleFindJobs}
            disabled={searching}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-60"
            style={{
              background: 'linear-gradient(135deg, rgba(118,77,240,0.95), rgba(139,92,246,0.85))',
              boxShadow: '0 4px 14px rgba(118,77,240,0.35)',
            }}
          >
            {searching ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" /> Searching across job boards…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Find Jobs Matching My CV
              </>
            )}
          </button>
          {error && (
            <p className="text-xs text-red-400 mt-4">{error}</p>
          )}
        </div>
      </div>
    );
  }

  // ── Results ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <Header />

      {/* Query summary + actions */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground/60 font-semibold mb-1">
            Searched for
          </p>
          <p className="text-sm text-foreground">
            <span className="font-semibold">{match.query.title || 'Developer'}</span>
            {match.query.location && (
              <span className="text-muted-foreground/70"> in {match.query.location}</span>
            )}
            {match.query.skills && match.query.skills.length > 0 && (
              <span className="text-muted-foreground/60">
                {' '}
                · {match.query.skills.slice(0, 5).join(', ')}
              </span>
            )}
          </p>
          <p className="text-[11px] text-muted-foreground/50 mt-1">
            {match.results.length} matches · refreshed {relativeTime(match.created_at)}
          </p>
        </div>

        <button
          onClick={handleFindJobs}
          disabled={searching}
          className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold text-white/85 transition-all disabled:opacity-60"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${searching ? 'animate-spin' : ''}`} />
          {searching ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* Source tabs */}
      {sourceTabs.length > 1 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {sourceTabs.map((tab) => {
            const isActive = sourceFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setSourceFilter(tab.key)}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all"
                style={{
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(118,77,240,0.9), rgba(139,92,246,0.75))'
                    : 'rgba(255,255,255,0.04)',
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.65)',
                  border: '1px solid',
                  borderColor: isActive ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.07)',
                }}
              >
                {tab.label}
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{
                    background: isActive ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.06)',
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
        <Input
          placeholder="Filter by title, company or location…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 rounded-lg border-white/[0.08] bg-card pl-9 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20"
        />
      </div>

      {/* Job list */}
      {filtered.length === 0 ? (
        <div
          className="rounded-2xl p-10 text-center"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <p className="text-sm text-muted-foreground/70">
            No jobs match the current filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map((job, i) => (
            <JobCard key={`${job.source}-${i}-${job.url}`} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────

function Header() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-700/10 ring-1 ring-violet-500/25 shadow-[0_0_16px_rgba(118,77,240,0.15)]">
        <Briefcase className="h-4.5 w-4.5 text-violet-400" />
      </div>
      <div>
        <h1 className="text-xl font-black text-foreground tracking-tight">Job Hunter</h1>
        <p className="text-muted-foreground/60 text-xs">
          Live jobs matched to your CV — click to apply
        </p>
      </div>
    </div>
  );
}

// ─── Job card ─────────────────────────────────────────────────────────

function JobCard({ job }: { job: JobHunterJob }) {
  const src = sourceMeta(job.source);
  const posted = relativeTime(job.posted_at);
  return (
    <a
      href={job.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-2xl p-4 sm:p-5 transition-all"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = 'rgba(255,255,255,0.04)';
        el.style.borderColor = 'rgba(139,92,246,0.25)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = 'rgba(255,255,255,0.02)';
        el.style.borderColor = 'rgba(255,255,255,0.06)';
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{ background: src.bg, color: src.color, border: `1px solid ${src.border}` }}
            >
              {src.label}
            </span>
            {posted && (
              <span className="text-[10px] text-muted-foreground/55 flex items-center gap-1">
                <Clock className="h-2.5 w-2.5" /> {posted}
              </span>
            )}
          </div>
          <h3 className="text-sm sm:text-base font-bold text-foreground leading-snug mb-1 line-clamp-2 group-hover:text-violet-300 transition-colors">
            {job.title}
          </h3>
          <div className="flex items-center gap-3 text-xs text-muted-foreground/70 flex-wrap">
            <span className="flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              <span className="truncate max-w-[180px]">{job.company}</span>
            </span>
            {job.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span className="truncate max-w-[200px]">{job.location}</span>
              </span>
            )}
          </div>
          {job.snippet && (
            <p className="text-xs text-muted-foreground/55 mt-2 line-clamp-2 leading-relaxed">
              {job.snippet}
            </p>
          )}
        </div>
        <div
          className="shrink-0 flex items-center justify-center h-9 w-9 rounded-xl transition-all group-hover:scale-110"
          style={{
            background: 'rgba(118,77,240,0.12)',
            border: '1px solid rgba(118,77,240,0.25)',
          }}
        >
          <ExternalLink className="h-4 w-4 text-violet-400" />
        </div>
      </div>
    </a>
  );
}
