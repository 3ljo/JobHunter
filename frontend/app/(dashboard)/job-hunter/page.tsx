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
  SlidersHorizontal,
  X,
  Star,
  Globe,
  Home,
  ArrowUpDown,
  ChevronDown,
  Check,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

// Location-type heuristics. Remotive / Arbeitnow flag remote in the
// location string ("Worldwide", "Anywhere", "Remote — EU"); hybrid is
// rarer but does appear. Anything else we treat as on-site.
const isRemoteLoc = (loc?: string | null) => !!loc && /remote|anywhere|worldwide/i.test(loc);
const isHybridLoc = (loc?: string | null) => !!loc && /hybrid/i.test(loc);
const isOnsiteLoc = (loc?: string | null) => !!loc && !isRemoteLoc(loc) && !isHybridLoc(loc);

type Recency = 'any' | '24h' | '7d' | '30d';
type LocType = 'any' | 'remote' | 'hybrid' | 'onsite';
type ScoreTier = 'any' | 'good' | 'great' | 'excellent';
type SortKey = 'best' | 'newest' | 'company';

const RECENCY_MS: Record<Exclude<Recency, 'any'>, number> = {
  '24h': 24 * 3600 * 1000,
  '7d':  7 * 24 * 3600 * 1000,
  '30d': 30 * 24 * 3600 * 1000,
};

const SCORE_MIN: Record<Exclude<ScoreTier, 'any'>, number> = {
  good: 0.5,
  great: 0.7,
  excellent: 0.85,
};

export default function JobHunterPage() {
  const [match, setMatch] = useState<JobHunterMatch | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [recency, setRecency] = useState<Recency>('any');
  const [locType, setLocType] = useState<LocType>('any');
  const [scoreTier, setScoreTier] = useState<ScoreTier>('any');
  const [sortBy, setSortBy] = useState<SortKey>('best');

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

    if (recency !== 'any') {
      const cutoff = Date.now() - RECENCY_MS[recency];
      out = out.filter((j) => {
        if (!j.posted_at) return false;
        const t = new Date(j.posted_at).getTime();
        return !Number.isNaN(t) && t >= cutoff;
      });
    }

    if (locType !== 'any') {
      out = out.filter((j) => {
        if (locType === 'remote') return isRemoteLoc(j.location);
        if (locType === 'hybrid') return isHybridLoc(j.location);
        return isOnsiteLoc(j.location);
      });
    }

    if (scoreTier !== 'any') {
      const min = SCORE_MIN[scoreTier];
      out = out.filter((j) => (j.score ?? 0) >= min);
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

    const sorted = [...out];
    if (sortBy === 'newest') {
      sorted.sort((a, b) => {
        const ta = a.posted_at ? new Date(a.posted_at).getTime() : 0;
        const tb = b.posted_at ? new Date(b.posted_at).getTime() : 0;
        return tb - ta;
      });
    } else if (sortBy === 'company') {
      sorted.sort((a, b) => a.company.localeCompare(b.company));
    } else {
      sorted.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    }
    return sorted;
  }, [match, search, sourceFilter, recency, locType, scoreTier, sortBy]);

  const sourceCounts = useMemo(() => {
    const list = match?.results || [];
    const counts: Record<string, number> = { all: list.length };
    for (const src of ['remotive', 'arbeitnow', 'adzuna', 'jooble']) {
      counts[src] = list.filter((j) => j.source === src).length;
    }
    return counts;
  }, [match]);

  const locCounts = useMemo(() => {
    const list = match?.results || [];
    return {
      any: list.length,
      remote: list.filter((j) => isRemoteLoc(j.location)).length,
      hybrid: list.filter((j) => isHybridLoc(j.location)).length,
      onsite: list.filter((j) => isOnsiteLoc(j.location)).length,
    };
  }, [match]);

  const activeFilterCount =
    (sourceFilter !== 'all' ? 1 : 0) +
    (recency !== 'any' ? 1 : 0) +
    (locType !== 'any' ? 1 : 0) +
    (scoreTier !== 'any' ? 1 : 0) +
    (search.trim() ? 1 : 0);

  const clearAllFilters = () => {
    setSearch('');
    setSourceFilter('all');
    setRecency('any');
    setLocType('any');
    setScoreTier('any');
  };

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
    <div className="space-y-5">
      <Header />

      {/* Query summary + refresh */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground/60 font-semibold mb-1">
            Searched for
          </p>
          <p className="text-sm text-foreground">
            <span className="font-semibold">{match.query.title || 'Developer'}</span>
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

      <FilterBar
        search={search}
        onSearch={setSearch}
        sortBy={sortBy}
        onSort={setSortBy}
        sourceFilter={sourceFilter}
        onSource={setSourceFilter}
        sourceCounts={sourceCounts}
        recency={recency}
        onRecency={setRecency}
        locType={locType}
        onLocType={setLocType}
        locCounts={locCounts}
        scoreTier={scoreTier}
        onScoreTier={setScoreTier}
        activeFilterCount={activeFilterCount}
        onClearAll={clearAllFilters}
      />

      <div className="flex items-center justify-between text-xs text-muted-foreground/60 px-1">
        <span>
          {filtered.length === match.results.length
            ? `${match.results.length} results`
            : `${filtered.length} of ${match.results.length} results`}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div
          className="rounded-2xl p-10 text-center"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <p className="text-sm text-muted-foreground/70 mb-3">
            No jobs match the current filters.
          </p>
          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-violet-300"
              style={{
                background: 'rgba(118,77,240,0.12)',
                border: '1px solid rgba(118,77,240,0.25)',
              }}
            >
              <X className="h-3 w-3" /> Clear filters
            </button>
          )}
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

// ─── Filter bar ───────────────────────────────────────────────────────

interface FilterBarProps {
  search: string;
  onSearch: (v: string) => void;
  sortBy: SortKey;
  onSort: (v: SortKey) => void;
  sourceFilter: string;
  onSource: (v: string) => void;
  sourceCounts: Record<string, number>;
  recency: Recency;
  onRecency: (v: Recency) => void;
  locType: LocType;
  onLocType: (v: LocType) => void;
  locCounts: { any: number; remote: number; hybrid: number; onsite: number };
  scoreTier: ScoreTier;
  onScoreTier: (v: ScoreTier) => void;
  activeFilterCount: number;
  onClearAll: () => void;
}

function FilterBar(p: FilterBarProps) {
  const sourceOpts = [
    { key: 'all',       label: 'All sources', count: p.sourceCounts.all       },
    { key: 'remotive',  label: 'Remotive',    count: p.sourceCounts.remotive  },
    { key: 'arbeitnow', label: 'Arbeitnow',   count: p.sourceCounts.arbeitnow },
    { key: 'adzuna',    label: 'Adzuna',      count: p.sourceCounts.adzuna    },
    { key: 'jooble',    label: 'Jooble',      count: p.sourceCounts.jooble    },
  ].filter((o) => o.key === 'all' || (o.count ?? 0) > 0);

  const recencyOpts: Array<{ key: Recency; label: string }> = [
    { key: 'any', label: 'Any time'   },
    { key: '24h', label: 'Last 24h'   },
    { key: '7d',  label: 'Last week'  },
    { key: '30d', label: 'Last month' },
  ];

  const typeOpts: Array<{ key: LocType; label: string; count: number }> = [
    { key: 'any',    label: 'Any',     count: p.locCounts.any    },
    { key: 'remote', label: 'Remote',  count: p.locCounts.remote },
    { key: 'hybrid', label: 'Hybrid',  count: p.locCounts.hybrid },
    { key: 'onsite', label: 'On-site', count: p.locCounts.onsite },
  ];

  const matchOpts: Array<{ key: ScoreTier; label: string }> = [
    { key: 'any',       label: 'Any match'      },
    { key: 'good',      label: 'Good 50%+'      },
    { key: 'great',     label: 'Great 70%+'     },
    { key: 'excellent', label: 'Excellent 85%+' },
  ];

  const sortOpts: Array<{ key: SortKey; label: string }> = [
    { key: 'best',    label: 'Best match' },
    { key: 'newest',  label: 'Newest'     },
    { key: 'company', label: 'Company A–Z' },
  ];

  return (
    <div
      className="rounded-2xl p-3 sm:p-4 flex items-center gap-2 flex-wrap"
      style={{
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="relative flex-1 min-w-[220px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
        <Input
          placeholder="Filter by title, company or location…"
          value={p.search}
          onChange={(e) => p.onSearch(e.target.value)}
          className="h-9 rounded-lg border-white/[0.08] bg-card pl-9 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20"
        />
      </div>

      <FilterDropdown
        icon={<SlidersHorizontal className="h-3 w-3" />}
        label="Source"
        value={p.sourceFilter}
        defaultKey="all"
        options={sourceOpts}
        onChange={p.onSource}
      />
      <FilterDropdown
        icon={<Clock className="h-3 w-3" />}
        label="Posted"
        value={p.recency}
        defaultKey="any"
        options={recencyOpts}
        onChange={(v) => p.onRecency(v as Recency)}
      />
      <FilterDropdown
        icon={<MapPin className="h-3 w-3" />}
        label="Type"
        value={p.locType}
        defaultKey="any"
        options={typeOpts}
        onChange={(v) => p.onLocType(v as LocType)}
      />
      <FilterDropdown
        icon={<Star className="h-3 w-3" />}
        label="Match"
        value={p.scoreTier}
        defaultKey="any"
        options={matchOpts}
        onChange={(v) => p.onScoreTier(v as ScoreTier)}
      />
      <FilterDropdown
        icon={<ArrowUpDown className="h-3 w-3" />}
        label="Sort"
        value={p.sortBy}
        defaultKey="best"
        options={sortOpts}
        onChange={(v) => p.onSort(v as SortKey)}
      />

      {p.activeFilterCount > 0 && (
        <button
          onClick={p.onClearAll}
          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-violet-300 hover:bg-violet-500/10 transition-colors"
        >
          <X className="h-3 w-3" /> Clear
        </button>
      )}
    </div>
  );
}

interface FilterDropdownProps<T extends string> {
  icon: React.ReactNode;
  label: string;
  value: T;
  defaultKey: T;
  options: Array<{ key: T; label: string; count?: number }>;
  onChange: (v: T) => void;
}

function FilterDropdown<T extends string>({
  icon,
  label,
  value,
  defaultKey,
  options,
  onChange,
}: FilterDropdownProps<T>) {
  const selected = options.find((o) => o.key === value);
  const isDefault = value === defaultKey;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-all outline-none"
        style={{
          background: isDefault ? 'rgba(255,255,255,0.04)' : 'rgba(118,77,240,0.18)',
          border: '1px solid',
          borderColor: isDefault ? 'rgba(255,255,255,0.07)' : 'rgba(139,92,246,0.4)',
          color: isDefault ? 'rgba(255,255,255,0.7)' : '#c4b5fd',
        }}
      >
        {icon}
        <span className="text-muted-foreground/55">{label}:</span>
        <span>{selected?.label ?? '—'}</span>
        <ChevronDown className="h-3 w-3 opacity-55" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={6}
        className="w-48 rounded-xl p-1"
        style={{
          background: 'rgba(16,20,53,0.95)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.55)',
        }}
      >
        {options.map((o) => {
          const active = o.key === value;
          return (
            <DropdownMenuItem
              key={o.key}
              onClick={() => onChange(o.key)}
              className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs cursor-pointer"
              style={{ color: active ? '#c4b5fd' : 'rgba(255,255,255,0.78)' }}
            >
              <span className="flex-1">{o.label}</span>
              {typeof o.count === 'number' && (
                <span className="text-[10px] text-white/40">{o.count}</span>
              )}
              {active && <Check className="h-3.5 w-3.5 text-violet-400" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Job card ─────────────────────────────────────────────────────────

function JobCard({ job }: { job: JobHunterJob }) {
  const src = sourceMeta(job.source);
  const posted = relativeTime(job.posted_at);
  const remote = isRemoteLoc(job.location);
  const hybrid = isHybridLoc(job.location);
  const scorePct = Math.round((job.score ?? 0) * 100);
  const scoreTone =
    scorePct >= 85 ? { color: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.3)' } :
    scorePct >= 70 ? { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.3)' } :
    scorePct >= 50 ? { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.3)' } :
                     { color: 'rgba(255,255,255,0.6)', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)' };

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
            {scorePct > 0 && (
              <span
                className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded"
                style={{ background: scoreTone.bg, color: scoreTone.color, border: `1px solid ${scoreTone.border}` }}
              >
                <Star className="h-2.5 w-2.5 fill-current" /> {scorePct}% match
              </span>
            )}
            {remote && (
              <span
                className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(52,211,153,0.10)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)' }}
              >
                <Globe className="h-2.5 w-2.5" /> Remote
              </span>
            )}
            {hybrid && !remote && (
              <span
                className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(251,146,60,0.10)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.25)' }}
              >
                <Home className="h-2.5 w-2.5" /> Hybrid
              </span>
            )}
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
