// Job Hunter Service
// Pulls live job listings from free public APIs (Remotive, Arbeitnow,
// Adzuna, Jooble) in parallel, dedupes them, and ranks against the user's
// CV. Fully on-demand — no cron, no scraping. Each source has a 5s timeout
// and failures are isolated (one dead API doesn't kill the whole request).
//
// Adding a new source: write an async fetchX(query) that returns an array
// of normalized job objects (see NORMALIZED_JOB_SHAPE below) and add it to
// the sources[] array in findJobsForCV.

const NORMALIZED_JOB_SHAPE = {
  title: '',           // job title
  company: '',         // employer name
  location: null,      // human-readable location string, or null for "remote"
  url: '',             // direct apply / details URL on the source platform
  source: '',          // 'remotive' | 'arbeitnow' | 'adzuna' | 'jooble'
  snippet: null,       // short description, may be HTML or plain text
  posted_at: null,     // ISO date string, or null if unknown
};

// Adzuna only supports these 19 ISO codes — calling any other code
// returns 404 and burns quota. Validate before requesting.
const ADZUNA_COUNTRIES = new Set([
  'gb','us','at','au','be','br','ca','ch','de','es','fr','in','it','mx','nl','nz','pl','sg','za'
]);

// Lightweight location → ISO code mapping. Only common cases — anything
// unmatched falls through to a "global" search (Adzuna defaults to gb,
// Jooble auto-detects from keywords).
const COUNTRY_MAP = {
  'united states': 'us', 'usa': 'us', 'u.s.': 'us', 'u.s.a': 'us', 'america': 'us',
  'united kingdom': 'gb', 'uk': 'gb', 'great britain': 'gb', 'england': 'gb', 'scotland': 'gb', 'wales': 'gb', 'london': 'gb',
  'germany': 'de', 'deutschland': 'de', 'berlin': 'de', 'munich': 'de',
  'france': 'fr', 'paris': 'fr',
  'italy': 'it', 'milano': 'it', 'milan': 'it', 'rome': 'it',
  'netherlands': 'nl', 'holland': 'nl', 'amsterdam': 'nl',
  'spain': 'es', 'madrid': 'es', 'barcelona': 'es',
  'canada': 'ca', 'toronto': 'ca', 'vancouver': 'ca',
  'australia': 'au', 'sydney': 'au', 'melbourne': 'au',
  'india': 'in', 'mumbai': 'in', 'bangalore': 'in', 'delhi': 'in',
  'singapore': 'sg',
  'switzerland': 'ch', 'zurich': 'ch',
  'austria': 'at', 'vienna': 'at',
  'belgium': 'be', 'brussels': 'be',
  'mexico': 'mx', 'brasil': 'br', 'brazil': 'br',
  'new zealand': 'nz', 'south africa': 'za',
  'poland': 'pl', 'warsaw': 'pl',
};

// Common English stopwords — dropped from tokenization so a job titled
// "Senior Engineer at the Bank" doesn't match every job containing "the".
const STOPWORDS = new Set([
  'the','a','an','and','or','of','for','to','in','at','on','with','by','from','is','are',
  'be','as','it','this','that','your','our','we','you','i','they','them','their','its',
  'has','have','had','was','were','will','would','can','could','should','do','does','did',
  'job','jobs','role','roles','position','positions','work','working',
]);

// Per-source timeout — keep it tight so the parallel fan-out doesn't
// stall on a slow API. Anything that takes >5s is "bad" anyway.
const SOURCE_TIMEOUT_MS = 5000;

// ─── Helpers ────────────────────────────────────────────────────────────

const tokenize = (text) => {
  if (!text || typeof text !== 'string') return [];
  return [...new Set(
    text.toLowerCase()
      .split(/[^a-z0-9+#.]+/i)
      .filter((t) => t.length > 1 && !STOPWORDS.has(t))
  )];
};

const stripHtml = (html) => {
  if (!html || typeof html !== 'string') return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
};

const normalizeUrl = (url) => {
  if (!url) return '';
  try {
    const u = new URL(url);
    return (u.host + u.pathname).toLowerCase().replace(/\/+$/, '');
  } catch {
    return String(url).toLowerCase();
  }
};

const detectCountry = (location) => {
  if (!location || typeof location !== 'string') return null;
  const lower = location.toLowerCase();
  for (const [name, code] of Object.entries(COUNTRY_MAP)) {
    if (lower.includes(name)) return code;
  }
  return null;
};

// AbortController-based timeout wrapper. Returns null instead of throwing
// so the parallel Promise.allSettled below treats timeouts as empty
// results rather than poisoning the whole batch.
const fetchWithTimeout = async (url, options = {}, timeoutMs = SOURCE_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } catch (err) {
    return null;
  } finally {
    clearTimeout(timer);
  }
};

// ─── CV → search query extraction ───────────────────────────────────────

// Pulls a usable {title, skills, location, country} object out of the
// final_cv JSON the CV analyzer pipeline produces. Falls back to safe
// defaults so we always run *something* even on a sparse CV.
const extractSearchTerms = (finalCv) => {
  const cv = finalCv || {};
  const exp = Array.isArray(cv.experience) ? cv.experience : [];

  // Most-recent role title is the strongest signal for what the user
  // wants to do next. If experience is empty, fall back to the first
  // sentence of the summary — sometimes summaries lead with the role.
  let title = '';
  if (exp.length && exp[0]?.title) {
    title = String(exp[0].title).trim();
  } else if (typeof cv.summary === 'string') {
    title = cv.summary.split(/[.,\n]/)[0].trim().slice(0, 80);
  }
  if (!title) title = 'developer'; // last-ditch fallback

  // Take up to 8 skills — more than that and the queries become noisy
  // (every API does AND-style matching on long skill lists).
  const skills = Array.isArray(cv.skills)
    ? cv.skills.map((s) => String(s || '').trim()).filter(Boolean).slice(0, 8)
    : [];

  const location = typeof cv.location === 'string' && cv.location.trim()
    ? cv.location.trim()
    : null;
  const country = detectCountry(location);

  return { title, skills, location, country };
};

// ─── Sources ────────────────────────────────────────────────────────────

// Remotive — global remote jobs, no API key required.
// API: https://remotive.com/api/remote-jobs?search={q}&limit=50
const fetchRemotive = async (query) => {
  const params = new URLSearchParams({ limit: '30' });
  if (query.title) params.set('search', query.title);
  const res = await fetchWithTimeout(`https://remotive.com/api/remote-jobs?${params}`);
  if (!res || !res.ok) return [];
  const data = await res.json().catch(() => null);
  if (!data || !Array.isArray(data.jobs)) return [];
  return data.jobs.map((j) => ({
    title: j.title || '',
    company: j.company_name || 'Unknown',
    location: j.candidate_required_location || 'Remote',
    url: j.url || '',
    source: 'remotive',
    snippet: stripHtml(j.description || '').slice(0, 400) || null,
    posted_at: j.publication_date || null,
  })).filter((j) => j.url && j.title);
};

// Arbeitnow — EU + global remote, no key. Free-text search via ?search=
// API: https://www.arbeitnow.com/api/job-board-api?search={q}
const fetchArbeitnow = async (query) => {
  const params = new URLSearchParams();
  if (query.title) params.set('search', query.title);
  const res = await fetchWithTimeout(`https://www.arbeitnow.com/api/job-board-api?${params}`);
  if (!res || !res.ok) return [];
  const data = await res.json().catch(() => null);
  if (!data || !Array.isArray(data.data)) return [];
  return data.data.slice(0, 30).map((j) => ({
    title: j.title || '',
    company: j.company_name || 'Unknown',
    location: j.location || (j.remote ? 'Remote' : null),
    url: j.url || '',
    source: 'arbeitnow',
    snippet: stripHtml(j.description || '').slice(0, 400) || null,
    posted_at: j.created_at ? new Date(j.created_at * 1000).toISOString() : null,
  })).filter((j) => j.url && j.title);
};

// Adzuna — global, 19 countries, free key (1k calls/mo). The API requires
// a country code in the path; we map the user's CV location → ISO code,
// or fall back to GB for the broadest English-speaking coverage.
// API: https://api.adzuna.com/v1/api/jobs/{cc}/search/1?app_id=&app_key=&what=&where=
const fetchAdzuna = async (query) => {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) return [];

  // If the CV-derived country isn't supported, default to GB. We don't
  // multi-country fan-out — that burns the 1k/mo quota 3x faster.
  const country = (query.country && ADZUNA_COUNTRIES.has(query.country))
    ? query.country
    : 'gb';

  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    what: query.title || 'developer',
    results_per_page: '30',
    'content-type': 'application/json',
    sort_by: 'date', // freshness first
  });
  if (query.location) params.set('where', query.location);

  const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?${params}`;
  const res = await fetchWithTimeout(url);
  if (!res || !res.ok) return [];
  const data = await res.json().catch(() => null);
  if (!data || !Array.isArray(data.results)) return [];
  return data.results.map((j) => ({
    title: j.title || '',
    company: j.company?.display_name || 'Unknown',
    location: j.location?.display_name || null,
    url: j.redirect_url || '',
    source: 'adzuna',
    snippet: j.description ? String(j.description).slice(0, 400) : null,
    posted_at: j.created || null,
  })).filter((j) => j.url && j.title);
};

// Jooble — 70+ countries, free key. Optional: silently skipped if
// JOOBLE_API_KEY is unset, so the rest of the pipeline still works.
// API: POST https://jooble.org/api/{key} with JSON {keywords, location}
const fetchJooble = async (query) => {
  const key = process.env.JOOBLE_API_KEY;
  if (!key) return [];

  const body = {
    keywords: query.title || 'developer',
    location: query.location || '',
  };
  const res = await fetchWithTimeout(`https://jooble.org/api/${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res || !res.ok) return [];
  const data = await res.json().catch(() => null);
  if (!data || !Array.isArray(data.jobs)) return [];
  return data.jobs.slice(0, 30).map((j) => ({
    title: j.title || '',
    company: j.company || 'Unknown',
    location: j.location || null,
    url: j.link || '',
    source: 'jooble',
    snippet: stripHtml(j.snippet || '').slice(0, 400) || null,
    posted_at: j.updated || null,
  })).filter((j) => j.url && j.title);
};

// ─── Dedupe + score ─────────────────────────────────────────────────────

// Some aggregators (Adzuna, Jooble) re-list the same job from the same
// source ATS (Greenhouse, Lever, etc) — dedupe by normalized URL so the
// user doesn't see the exact same posting 3 times in a row.
const dedupe = (jobs) => {
  const seen = new Set();
  const out = [];
  for (const j of jobs) {
    const k = normalizeUrl(j.url);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(j);
  }
  return out;
};

// Simple keyword-overlap scorer. Title-token matches weigh 5x, exact-skill
// title hits 3x, exact-skill snippet hits 1.5x, plus a recency boost for
// fresh postings. Good enough for a first cut without embeddings — a
// future pass can swap in pgvector + a free embedding model if rankings
// feel off.
const scoreJob = (job, query) => {
  const title = (job.title || '').toLowerCase();
  const desc = (job.snippet || '').toLowerCase();

  let score = 0;

  if (query.title) {
    const qTokens = tokenize(query.title);
    for (const t of qTokens) {
      if (title.includes(t)) score += 5;
    }
  }

  if (Array.isArray(query.skills)) {
    for (const skill of query.skills) {
      const s = String(skill || '').toLowerCase().trim();
      if (!s) continue;
      if (title.includes(s)) score += 3;
      else if (desc.includes(s)) score += 1.5;
    }
  }

  if (job.posted_at) {
    const t = new Date(job.posted_at).getTime();
    if (!Number.isNaN(t)) {
      const days = (Date.now() - t) / (1000 * 60 * 60 * 24);
      if (days < 7) score += 3;
      else if (days < 30) score += 1;
      else if (days > 90) score -= 1;
    }
  }

  return score;
};

// ─── Public entry ───────────────────────────────────────────────────────

// findJobsForCV
//   finalCv: the structured CV object (cvs.ats_feedback.final.final_cv)
// Returns: { query, results, sourceCounts }
//   - query: the derived search terms (saved alongside results so the UI
//     can show "Searched for: Senior Developer in Berlin")
//   - results: ranked + deduped list, top 100
//   - sourceCounts: per-source raw count BEFORE dedupe, for diagnostics
const findJobsForCV = async (finalCv) => {
  const query = extractSearchTerms(finalCv);

  const sources = [
    { name: 'remotive', fn: fetchRemotive },
    { name: 'arbeitnow', fn: fetchArbeitnow },
    { name: 'adzuna', fn: fetchAdzuna },
    { name: 'jooble', fn: fetchJooble },
  ];

  // Promise.allSettled — one source crashing should never take down the
  // whole batch. We log the rejection but return empty results for it.
  const settled = await Promise.allSettled(sources.map((s) => s.fn(query)));

  const sourceCounts = {};
  let merged = [];
  settled.forEach((res, i) => {
    const name = sources[i].name;
    if (res.status === 'fulfilled' && Array.isArray(res.value)) {
      sourceCounts[name] = res.value.length;
      merged = merged.concat(res.value);
    } else {
      sourceCounts[name] = 0;
      if (res.status === 'rejected') {
        console.warn(`[jobHunter] source "${name}" failed:`, res.reason?.message || res.reason);
      }
    }
  });

  const deduped = dedupe(merged);
  const scored = deduped
    .map((j) => ({ ...j, score: scoreJob(j, query) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 100); // cap so the JSONB blob stays small

  return { query, results: scored, sourceCounts };
};

module.exports = {
  findJobsForCV,
  extractSearchTerms, // exported for tests / debugging
};
