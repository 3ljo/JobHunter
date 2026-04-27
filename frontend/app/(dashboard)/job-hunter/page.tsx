'use client';

import { useEffect, useMemo, useState } from 'react';
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
  SlidersHorizontal,
  X,
  Star,
  Globe,
  Home,
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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
  findJobs,
  getLatestJobMatches,
  JobHunterJob,
  JobHunterMatch,
} from '@/lib/api';

// Per-source pill colors. Mirrors the violet-tinted "glass" style used
// elsewhere in the dashboard so this page doesn't feel like a foreign
// island. New sources should pick a distinct hue from this palette.
const SOURCE_STYLE: Record<string, { bg: string; color: string; border: string; label: string }> = {
  remotive:      { bg: 'rgba(52,211,153,0.15)',  color: '#34d399', border: 'rgba(52,211,153,0.3)',  label: 'Remotive'       },
  remoteok:      { bg: 'rgba(244,114,182,0.15)', color: '#f472b6', border: 'rgba(244,114,182,0.3)', label: 'RemoteOK'       },
  workingnomads: { bg: 'rgba(20,184,166,0.15)',  color: '#14b8a6', border: 'rgba(20,184,166,0.3)',  label: 'Working Nomads' },
  themuse:       { bg: 'rgba(236,72,153,0.15)',  color: '#ec4899', border: 'rgba(236,72,153,0.3)',  label: 'The Muse'       },
  hackernews:    { bg: 'rgba(255,102,0,0.15)',   color: '#ff6600', border: 'rgba(255,102,0,0.3)',   label: 'HN Hiring'      },
  arbeitnow:     { bg: 'rgba(96,165,250,0.15)',  color: '#60a5fa', border: 'rgba(96,165,250,0.3)',  label: 'Arbeitnow'      },
  adzuna:        { bg: 'rgba(251,146,60,0.15)',  color: '#fb923c', border: 'rgba(251,146,60,0.3)',  label: 'Adzuna'         },
  jooble:        { bg: 'rgba(192,132,252,0.15)', color: '#c084fc', border: 'rgba(192,132,252,0.3)', label: 'Jooble'         },
  jsearch:       { bg: 'rgba(129,140,248,0.15)', color: '#818cf8', border: 'rgba(129,140,248,0.3)', label: 'JSearch'        },
  linkedin:      { bg: 'rgba(10,102,194,0.18)',  color: '#60a5fa', border: 'rgba(10,102,194,0.4)',  label: 'LinkedIn'       },
  indeed:        { bg: 'rgba(45,100,200,0.15)',  color: '#7aa2f7', border: 'rgba(45,100,200,0.3)',  label: 'Indeed'         },
  glassdoor:     { bg: 'rgba(13,170,127,0.15)',  color: '#0daa7f', border: 'rgba(13,170,127,0.3)',  label: 'Glassdoor'      },
  upwork:        { bg: 'rgba(20,164,77,0.15)',   color: '#14a44d', border: 'rgba(20,164,77,0.3)',   label: 'Upwork'         },
};

// Sources that ONLY publish remote jobs. The location string on individual
// listings can say "USA Only" / "EU" / etc — it's a hiring restriction,
// not an on-site flag. Trust the source over the string for these.
const REMOTE_ONLY_SOURCES = new Set(['remotive', 'remoteok', 'workingnomads']);

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

// Location-type heuristics. Most boards flag remote in the location
// string ("Worldwide", "Anywhere", "Remote — EU"); hybrid is rarer but
// does appear. Anything else we treat as on-site.
const isRemoteLoc = (loc?: string | null) => !!loc && /remote|anywhere|worldwide/i.test(loc);
const isHybridLoc = (loc?: string | null) => !!loc && /hybrid/i.test(loc);
const isOnsiteLoc = (loc?: string | null) => !!loc && !isRemoteLoc(loc) && !isHybridLoc(loc);

// Source-aware variants — for remote-only boards, the location string is
// a hiring restriction (e.g. "USA Only"), not an on-site flag. Trust the
// source and call those Remote regardless of the string.
const isRemoteJob = (j: JobHunterJob) =>
  REMOTE_ONLY_SOURCES.has(j.source) || isRemoteLoc(j.location);
const isOnsiteJob = (j: JobHunterJob) =>
  !REMOTE_ONLY_SOURCES.has(j.source) && isOnsiteLoc(j.location);

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

// Country picker. Mirrors backend's COUNTRY_NAMES — keep these in sync.
// "Anywhere" sends `null` to the API; non-Adzuna codes still hit Jooble
// (which understands country names) plus the always-global Remotive +
// Arbeitnow.
const COUNTRY_OPTIONS: Array<{ code: string | null; name: string }> = [
  { code: null, name: 'Anywhere' },
  { code: 'al', name: 'Albania' },
  { code: 'ar', name: 'Argentina' },
  { code: 'au', name: 'Australia' },
  { code: 'at', name: 'Austria' },
  { code: 'be', name: 'Belgium' },
  { code: 'br', name: 'Brazil' },
  { code: 'ca', name: 'Canada' },
  { code: 'cz', name: 'Czechia' },
  { code: 'dk', name: 'Denmark' },
  { code: 'fi', name: 'Finland' },
  { code: 'fr', name: 'France' },
  { code: 'de', name: 'Germany' },
  { code: 'gr', name: 'Greece' },
  { code: 'hu', name: 'Hungary' },
  { code: 'in', name: 'India' },
  { code: 'ie', name: 'Ireland' },
  { code: 'it', name: 'Italy' },
  { code: 'jp', name: 'Japan' },
  { code: 'mx', name: 'Mexico' },
  { code: 'nl', name: 'Netherlands' },
  { code: 'nz', name: 'New Zealand' },
  { code: 'no', name: 'Norway' },
  { code: 'ph', name: 'Philippines' },
  { code: 'pl', name: 'Poland' },
  { code: 'pt', name: 'Portugal' },
  { code: 'ro', name: 'Romania' },
  { code: 'sg', name: 'Singapore' },
  { code: 'za', name: 'South Africa' },
  { code: 'kr', name: 'South Korea' },
  { code: 'es', name: 'Spain' },
  { code: 'se', name: 'Sweden' },
  { code: 'ch', name: 'Switzerland' },
  { code: 'tr', name: 'Turkey' },
  { code: 'ua', name: 'Ukraine' },
  { code: 'ae', name: 'UAE' },
  { code: 'gb', name: 'United Kingdom' },
  { code: 'us', name: 'United States' },
];

const countryName = (code?: string | null) => {
  if (!code) return 'Anywhere';
  return COUNTRY_OPTIONS.find((c) => c.code === code)?.name || code.toUpperCase();
};

export default function JobHunterPage() {
  const [match, setMatch] = useState<JobHunterMatch | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search inputs (what the user is typing, not the active match query)
  const [queryInput, setQueryInput] = useState('');
  const [countryInput, setCountryInput] = useState<string | null>(null);

  // Result-list filters
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [recency, setRecency] = useState<Recency>('any');
  const [locType, setLocType] = useState<LocType>('any');
  const [scoreTier, setScoreTier] = useState<ScoreTier>('any');
  const [sortBy, setSortBy] = useState<SortKey>('best');

  // Pagination — 20 per page is the sweet spot for this card height.
  // Resets to 1 whenever the underlying filtered set changes (see useEffect
  // below) so users don't end up on an empty page after narrowing filters.
  const PAGE_SIZE = 20;
  const [page, setPage] = useState(1);

  // Hydrate from cache on mount so revisiting the tab is instant.
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await getLatestJobMatches();
        if (mounted && res.data.match) {
          setMatch(res.data.match);
          setQueryInput(res.data.match.query?.title || '');
          setCountryInput(res.data.match.query?.country || null);
        }
      } catch {
        // 401 redirects globally; anything else is just "no cache yet"
      } finally {
        if (mounted) setInitialLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleSearch = async () => {
    const q = queryInput.trim();
    if (!q) {
      setError('Enter a job title or keyword to search.');
      return;
    }
    setSearching(true);
    setError(null);
    try {
      const res = await findJobs({ query: q, country: countryInput });
      setMatch(res.data.match);
      if (res.data.warning) {
        toast(res.data.warning, { icon: 'ℹ️' });
      } else {
        toast.success(`Found ${res.data.match.results.length} jobs`);
      }
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to find jobs. Try again.';
      setError(message);
      toast.error(message);
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
        if (locType === 'remote') return isRemoteJob(j);
        if (locType === 'hybrid') return isHybridLoc(j.location);
        return isOnsiteJob(j);
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

  // Reset to page 1 whenever the filtered set changes — otherwise narrowing
  // a filter could leave the user staring at an empty page 7.
  useEffect(() => { setPage(1); }, [search, sourceFilter, recency, locType, scoreTier, sortBy, match]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const paged = useMemo(
    () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage]
  );
  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * PAGE_SIZE, filtered.length);

  const sourceCounts = useMemo(() => {
    const list = match?.results || [];
    const counts: Record<string, number> = { all: list.length };
    for (const src of ['remotive', 'remoteok', 'workingnomads', 'themuse', 'hackernews', 'arbeitnow', 'adzuna', 'jooble', 'jsearch', 'linkedin', 'indeed', 'glassdoor', 'upwork']) {
      counts[src] = list.filter((j) => j.source === src).length;
    }
    return counts;
  }, [match]);

  const locCounts = useMemo(() => {
    const list = match?.results || [];
    return {
      any: list.length,
      remote: list.filter(isRemoteJob).length,
      hybrid: list.filter((j) => isHybridLoc(j.location)).length,
      onsite: list.filter(isOnsiteJob).length,
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

  // ── First-time state — never run a search ───────────────────────────
  if (!match) {
    return (
      <div className="space-y-6">
        <Header />
        <div
          className="rounded-2xl p-8 sm:p-12 text-center"
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
          <h3 className="text-lg font-bold text-foreground mb-1">Find your next job</h3>
          <p className="text-sm text-muted-foreground/70 mb-6 max-w-md mx-auto">
            Search across Remotive, Arbeitnow, Adzuna and Jooble in one go.
            Try <span className="text-foreground/85">&quot;Front End Developer&quot;</span> in{' '}
            <span className="text-foreground/85">Germany</span>.
          </p>
          <SearchForm
            queryInput={queryInput}
            onQueryInput={setQueryInput}
            countryInput={countryInput}
            onCountryInput={setCountryInput}
            onSubmit={handleSearch}
            searching={searching}
            big
          />
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

      {/* Search form — refine and re-run */}
      <SearchForm
        queryInput={queryInput}
        onQueryInput={setQueryInput}
        countryInput={countryInput}
        onCountryInput={setCountryInput}
        onSubmit={handleSearch}
        searching={searching}
      />

      {/* Active query summary */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground/60 font-semibold mb-1">
            Searched for
          </p>
          <p className="text-sm text-foreground">
            <span className="font-semibold">{match.query.title || '—'}</span>
            <span className="text-muted-foreground/70">
              {' '}in {countryName(match.query.country)}
            </span>
          </p>
          <p className="text-[11px] text-muted-foreground/50 mt-1">
            {match.results.length} matches · refreshed {relativeTime(match.created_at)}
          </p>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

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
          {filtered.length === 0
            ? '0 results'
            : filtered.length === match.results.length
              ? `Showing ${rangeStart}–${rangeEnd} of ${match.results.length}`
              : `Showing ${rangeStart}–${rangeEnd} of ${filtered.length} (${match.results.length} total)`}
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
        <>
          <div className="grid grid-cols-1 gap-3">
            {paged.map((job, i) => (
              <JobCard key={`${job.source}-${(safePage - 1) * PAGE_SIZE + i}-${job.url}`} job={job} />
            ))}
          </div>
          {pageCount > 1 && (
            <Pagination
              page={safePage}
              pageCount={pageCount}
              onChange={(p) => {
                setPage(p);
                if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}
        </>
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
          Live jobs across Remotive, Arbeitnow, Adzuna and Jooble — pick a country and search
        </p>
      </div>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────

// Compact page nav. For ≤7 pages, shows all numbers. For more, shows
// first/last + a window around the current page with "…" gaps so the
// strip stays a fixed-ish width even with 30+ pages.
function buildPageList(current: number, total: number): Array<number | 'gap'> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: Array<number | 'gap'> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) out.push('gap');
  for (let i = start; i <= end; i++) out.push(i);
  if (end < total - 1) out.push('gap');
  out.push(total);
  return out;
}

function Pagination({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (p: number) => void;
}) {
  const pages = buildPageList(page, pageCount);
  const btnBase =
    'inline-flex items-center justify-center h-8 min-w-8 px-2 rounded-lg text-xs font-semibold transition-all outline-none';
  const inactiveStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
    color: 'rgba(255,255,255,0.7)',
  } as const;
  const activeStyle = {
    background: 'linear-gradient(135deg, rgba(118,77,240,0.95), rgba(139,92,246,0.85))',
    border: '1px solid rgba(139,92,246,0.4)',
    color: '#fff',
  } as const;
  const disabledStyle = {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.04)',
    color: 'rgba(255,255,255,0.25)',
  } as const;
  return (
    <nav className="flex items-center justify-center gap-1.5 pt-2" aria-label="Pagination">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className={btnBase}
        style={page <= 1 ? disabledStyle : inactiveStyle}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>
      {pages.map((p, i) =>
        p === 'gap' ? (
          <span key={`gap-${i}`} className="text-[11px] text-muted-foreground/50 px-1">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={btnBase}
            style={p === page ? activeStyle : inactiveStyle}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onChange(Math.min(pageCount, page + 1))}
        disabled={page >= pageCount}
        className={btnBase}
        style={page >= pageCount ? disabledStyle : inactiveStyle}
        aria-label="Next page"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </nav>
  );
}

// ─── Search form ──────────────────────────────────────────────────────

interface SearchFormProps {
  queryInput: string;
  onQueryInput: (v: string) => void;
  countryInput: string | null;
  onCountryInput: (v: string | null) => void;
  onSubmit: () => void;
  searching: boolean;
  big?: boolean;
}

function SearchForm({
  queryInput,
  onQueryInput,
  countryInput,
  onCountryInput,
  onSubmit,
  searching,
  big,
}: SearchFormProps) {
  const wrapperClass = big
    ? 'mx-auto max-w-xl'
    : 'rounded-2xl p-3 sm:p-4';
  const wrapperStyle = big
    ? undefined
    : { background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' };

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
      className={`flex items-center gap-2 flex-wrap ${wrapperClass}`}
      style={wrapperStyle}
    >
      <div className="relative flex-1 min-w-[220px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
        <Input
          placeholder='e.g. "Front End Developer"'
          value={queryInput}
          onChange={(e) => onQueryInput(e.target.value)}
          className="h-10 rounded-lg border-white/[0.08] bg-card pl-9 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20"
        />
      </div>

      <CountryDropdown value={countryInput} onChange={onCountryInput} />

      <button
        type="submit"
        disabled={searching}
        className="inline-flex items-center gap-2 rounded-lg px-4 h-10 text-sm font-semibold text-white transition-all disabled:opacity-60"
        style={{
          background: 'linear-gradient(135deg, rgba(118,77,240,0.95), rgba(139,92,246,0.85))',
          boxShadow: '0 4px 14px rgba(118,77,240,0.35)',
        }}
      >
        {searching ? (
          <>
            <RefreshCw className="h-4 w-4 animate-spin" /> Searching…
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" /> Search
          </>
        )}
      </button>
    </form>
  );
}

function CountryDropdown({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const isDefault = !value;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex items-center gap-1.5 rounded-lg px-3 h-10 text-sm font-semibold transition-all outline-none min-w-[160px] justify-between"
        style={{
          background: isDefault ? 'rgba(255,255,255,0.04)' : 'rgba(118,77,240,0.18)',
          border: '1px solid',
          borderColor: isDefault ? 'rgba(255,255,255,0.07)' : 'rgba(139,92,246,0.4)',
          color: isDefault ? 'rgba(255,255,255,0.75)' : '#c4b5fd',
        }}
      >
        <span className="inline-flex items-center gap-1.5">
          <Globe className="h-3.5 w-3.5 opacity-70" />
          {countryName(value)}
        </span>
        <ChevronDown className="h-3.5 w-3.5 opacity-55" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={6}
        className="w-56 max-h-80 overflow-y-auto rounded-xl p-1"
        style={{
          background: 'rgba(16,20,53,0.95)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.55)',
        }}
      >
        {COUNTRY_OPTIONS.map((opt) => {
          const active = opt.code === value;
          return (
            <DropdownMenuItem
              key={opt.code ?? 'any'}
              onClick={() => onChange(opt.code)}
              className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs cursor-pointer"
              style={{ color: active ? '#c4b5fd' : 'rgba(255,255,255,0.78)' }}
            >
              <span className="flex-1">{opt.name}</span>
              {active && <Check className="h-3.5 w-3.5 text-violet-400" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
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
    { key: 'all',           label: 'All sources',   count: p.sourceCounts.all           },
    { key: 'linkedin',      label: 'LinkedIn',      count: p.sourceCounts.linkedin      },
    { key: 'indeed',        label: 'Indeed',        count: p.sourceCounts.indeed        },
    { key: 'glassdoor',     label: 'Glassdoor',     count: p.sourceCounts.glassdoor     },
    { key: 'jsearch',       label: 'JSearch',       count: p.sourceCounts.jsearch       },
    { key: 'upwork',        label: 'Upwork',        count: p.sourceCounts.upwork        },
    { key: 'remotive',      label: 'Remotive',      count: p.sourceCounts.remotive      },
    { key: 'remoteok',      label: 'RemoteOK',      count: p.sourceCounts.remoteok      },
    { key: 'workingnomads', label: 'Working Nomads',count: p.sourceCounts.workingnomads },
    { key: 'themuse',       label: 'The Muse',      count: p.sourceCounts.themuse       },
    { key: 'hackernews',    label: 'HN Hiring',     count: p.sourceCounts.hackernews    },
    { key: 'arbeitnow',     label: 'Arbeitnow',     count: p.sourceCounts.arbeitnow     },
    { key: 'adzuna',        label: 'Adzuna',        count: p.sourceCounts.adzuna        },
    { key: 'jooble',        label: 'Jooble',        count: p.sourceCounts.jooble        },
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
  const remote = isRemoteJob(job);
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
