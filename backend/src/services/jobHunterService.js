// Job Hunter Service
// Pulls live job listings from free public APIs (Remotive, Arbeitnow,
// Adzuna, Jooble) in parallel, dedupes them, and ranks against the user's
// CV. Fully on-demand — no cron, no scraping. Each source has a 5s timeout
// and failures are isolated (one dead API doesn't kill the whole request).
//
// Adding a new source: write an async fetchX(query) that returns an array
// of normalized job objects (see NORMALIZED_JOB_SHAPE below) and add it to
// the sources[] array in findJobs.

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

// ISO code → human-readable name. Used to (a) feed Jooble's freeform
// `location` field (Jooble has no country code), and (b) display the
// chosen country back to the user in the UI. Covers Adzuna's 19 + a few
// extras that Jooble understands. Unmapped codes fall through.
const COUNTRY_NAMES = {
  gb: 'United Kingdom', us: 'United States', at: 'Austria', au: 'Australia',
  be: 'Belgium', br: 'Brazil', ca: 'Canada', ch: 'Switzerland',
  de: 'Germany', es: 'Spain', fr: 'France', in: 'India',
  it: 'Italy', mx: 'Mexico', nl: 'Netherlands', nz: 'New Zealand',
  pl: 'Poland', sg: 'Singapore', za: 'South Africa',
  // Non-Adzuna but Jooble-friendly:
  al: 'Albania', gr: 'Greece', tr: 'Turkey', ie: 'Ireland', se: 'Sweden',
  no: 'Norway', dk: 'Denmark', fi: 'Finland', pt: 'Portugal', cz: 'Czechia',
  ro: 'Romania', hu: 'Hungary', ua: 'Ukraine', ae: 'United Arab Emirates',
  jp: 'Japan', kr: 'South Korea', ph: 'Philippines',
};

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

// HN comment_text comes pre-escaped (`&#x27;` for apostrophes etc).
// Decode the handful of entities we actually see; full decode would need
// a dependency.
const decodeEntities = (s) => {
  if (!s || typeof s !== 'string') return '';
  return s
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
};

// RemoteOK injects a "spam honeypot" sentence at the top of every
// description ("Please mention the word **WARMTH** and tag ... when
// applying ... they're human."). Strip it so snippets are readable.
const stripRemoteOKHoneypot = (s) =>
  String(s || '').replace(/Please mention the word[\s\S]*?human\.?/i, '').trim();

// "Front End" / "Front-End" / "Frontend" / "front end developer" are all
// the same role. Generate the obvious spelling variants so a literal
// substring match against API responses doesn't miss the obvious cases.
// Returns the lowercase set; callers `includes` each variant against
// their haystack.
const expandQuery = (q) => {
  if (!q || typeof q !== 'string') return [];
  const lower = q.toLowerCase().trim();
  if (!lower) return [];
  const variants = new Set([lower]);
  variants.add(lower.replace(/[\s-]+/g, ''));   // "front end" -> "frontend"
  variants.add(lower.replace(/\s+/g, '-'));     // "front end" -> "front-end"
  variants.add(lower.replace(/-+/g, ' '));      // "front-end" -> "front end"
  variants.add(lower.replace(/-+/g, ''));       // "front-end" -> "frontend"
  return [...variants].filter((v) => v.length > 0);
};

const matchesAnyVariant = (haystack, variants) => {
  if (!variants.length) return true;
  const lower = String(haystack || '').toLowerCase();
  for (const v of variants) {
    if (lower.includes(v)) return true;
  }
  return false;
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

// Per-source result cap. 50 is the sweet spot — most APIs allow it
// without paging, and it gives us enough volume to dedupe + rank from.
const PER_SOURCE_LIMIT = 50;

// Remotive — global remote jobs, no API key required.
// API: https://remotive.com/api/remote-jobs?search={q}&limit=50
const fetchRemotive = async (query) => {
  const params = new URLSearchParams({ limit: String(PER_SOURCE_LIMIT) });
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
  return data.data.slice(0, PER_SOURCE_LIMIT).map((j) => ({
    title: j.title || '',
    company: j.company_name || 'Unknown',
    location: j.location || (j.remote ? 'Remote' : null),
    url: j.url || '',
    source: 'arbeitnow',
    snippet: stripHtml(j.description || '').slice(0, 400) || null,
    posted_at: j.created_at ? new Date(j.created_at * 1000).toISOString() : null,
  })).filter((j) => j.url && j.title);
};

// Adzuna — 19 countries, free key (1k calls/mo). The API requires a
// supported country code in the path; if the user picked a country we
// don't have, skip Adzuna entirely (returning UK results for someone who
// asked for Germany would be misleading and burns quota).
// API: https://api.adzuna.com/v1/api/jobs/{cc}/search/1?app_id=&app_key=&what=&where=
const fetchAdzuna = async (query) => {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) return [];
  if (!query.country || !ADZUNA_COUNTRIES.has(query.country)) return [];

  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    what: query.title || 'developer',
    results_per_page: String(PER_SOURCE_LIMIT),
    'content-type': 'application/json',
    sort_by: 'date', // freshness first
  });
  if (query.location) params.set('where', query.location);

  const url = `https://api.adzuna.com/v1/api/jobs/${query.country}/search/1?${params}`;
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
// Country gating: pass the country *name* (not code) in `location` so
// Jooble filters by it. If the user picked "Anywhere", send no location.
// API: POST https://jooble.org/api/{key} with JSON {keywords, location}
const fetchJooble = async (query) => {
  const key = process.env.JOOBLE_API_KEY;
  if (!key) return [];

  const location = query.location
    || (query.country ? COUNTRY_NAMES[query.country] : '')
    || '';
  const body = {
    keywords: query.title || 'developer',
    location,
  };
  const res = await fetchWithTimeout(`https://jooble.org/api/${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res || !res.ok) return [];
  const data = await res.json().catch(() => null);
  if (!data || !Array.isArray(data.jobs)) return [];
  return data.jobs.slice(0, PER_SOURCE_LIMIT).map((j) => ({
    title: j.title || '',
    company: j.company || 'Unknown',
    location: j.location || null,
    url: j.link || '',
    source: 'jooble',
    snippet: stripHtml(j.snippet || '').slice(0, 400) || null,
    posted_at: j.updated || null,
  })).filter((j) => j.url && j.title);
};

// RemoteOK — public JSON feed, no key. Returns ALL jobs (no server-side
// search), so we filter by title client-side. First element of the array
// is metadata; skip it. They politely ask for a User-Agent.
// API: GET https://remoteok.com/api
const fetchRemoteOK = async (query) => {
  const res = await fetchWithTimeout('https://remoteok.com/api', {
    headers: { 'User-Agent': 'CvClimber/1.0 (+https://cvclimber.lol)' },
  });
  if (!res || !res.ok) return [];
  const data = await res.json().catch(() => null);
  if (!Array.isArray(data) || data.length < 2) return [];
  const jobs = data.slice(1); // first element is the metadata blurb

  // RemoteOK has no server-side search; match against position, tags,
  // company *and* description so a query like "developer" still hits jobs
  // titled "Operations Associate" if the description mentions developer.
  // Expand the query so "front end" also matches "frontend"/"front-end".
  const variants = expandQuery(query.title);
  const filtered = variants.length
    ? jobs.filter((j) =>
        matchesAnyVariant(j.position, variants) ||
        (Array.isArray(j.tags) && j.tags.some((t) => matchesAnyVariant(t, variants))) ||
        matchesAnyVariant(j.company, variants) ||
        matchesAnyVariant(j.description, variants)
      )
    : jobs;

  return filtered.slice(0, PER_SOURCE_LIMIT).map((j) => ({
    title: j.position || '',
    company: j.company || 'Unknown',
    location: j.location || 'Remote',
    url: j.apply_url || j.url || '',
    source: 'remoteok',
    snippet: stripHtml(stripRemoteOKHoneypot(j.description || '')).slice(0, 400) || null,
    posted_at: j.date || (j.epoch ? new Date(j.epoch * 1000).toISOString() : null),
  })).filter((j) => j.url && j.title);
};

// Working Nomads — curated remote-jobs aggregator, no key. No server-side
// search either, so filter client-side over title/category/tags.
// API: GET https://www.workingnomads.com/api/exposed_jobs/
const fetchWorkingNomads = async (query) => {
  const res = await fetchWithTimeout('https://www.workingnomads.com/api/exposed_jobs/');
  if (!res || !res.ok) return [];
  const data = await res.json().catch(() => null);
  if (!Array.isArray(data)) return [];

  // Match across title, category, tags AND description — small daily feed
  // so any field-restricted match would yield near-zero for niche keywords.
  // Spelling variants too (front end / frontend / front-end).
  const variants = expandQuery(query.title);
  const filtered = variants.length
    ? data.filter((j) =>
        matchesAnyVariant(j.title, variants) ||
        matchesAnyVariant(j.category_name, variants) ||
        matchesAnyVariant(j.tags, variants) ||
        matchesAnyVariant(j.description, variants)
      )
    : data;

  return filtered.slice(0, PER_SOURCE_LIMIT).map((j) => ({
    title: j.title || '',
    company: j.company_name || 'Unknown',
    location: j.location || 'Remote',
    url: j.url || '',
    source: 'workingnomads',
    snippet: stripHtml(j.description || '').slice(0, 400) || null,
    posted_at: j.pub_date || null,
  })).filter((j) => j.url && j.title);
};

// The Muse — public jobs feed for US-focused / global startup roles. No
// server-side keyword search; supports `category` and `location` params
// but those expect predefined values, so we filter client-side. Pull 3
// pages in parallel (20/page → 60 candidates) so niche keywords still
// have a real shot at matching.
// API: GET https://www.themuse.com/api/public/jobs?page=N
const fetchTheMuse = async (query) => {
  const pages = await Promise.all(
    [0, 1, 2].map((p) =>
      fetchWithTimeout(`https://www.themuse.com/api/public/jobs?page=${p}`)
        .then((r) => (r && r.ok ? r.json().catch(() => null) : null))
        .catch(() => null)
    )
  );
  const all = [];
  for (const data of pages) {
    if (data && Array.isArray(data.results)) all.push(...data.results);
  }
  if (!all.length) return [];

  const variants = expandQuery(query.title);
  const countryName = (query.country_name || '').toLowerCase();

  const filtered = all.filter((j) => {
    if (variants.length) {
      const haystack = `${j.name || ''} ${j.contents || ''}`;
      if (!matchesAnyVariant(haystack, variants)) return false;
    }
    if (countryName) {
      const locs = (j.locations || [])
        .map((l) => (l && l.name ? l.name : '').toLowerCase())
        .join(' ');
      // Allow remote/flexible matches even if the country isn't named
      if (!locs.includes(countryName) && !locs.includes('remote') && !locs.includes('flexible')) {
        return false;
      }
    }
    return true;
  });

  return filtered.slice(0, PER_SOURCE_LIMIT).map((j) => ({
    title: j.name || '',
    company: (j.company && j.company.name) || 'Unknown',
    location: (j.locations || [])
      .map((l) => l && l.name)
      .filter(Boolean)
      .join(', ') || null,
    url: (j.refs && j.refs.landing_page) || '',
    source: 'themuse',
    snippet: stripHtml(j.contents || '').slice(0, 400) || null,
    posted_at: j.publication_date || null,
  })).filter((j) => j.url && j.title);
};

// HN comment lines on the "Who is hiring?" thread tend to follow either:
//   "Company | Role | Location | Remote/Onsite | https://link"
//   "Company | Location | Remote/Onsite | Role | https://link"
// Field order varies, so instead of trusting position we use keyword
// hints: a part containing "engineer/developer/designer/..." is the
// role; a part containing "remote/onsite/USA/Berlin/..." is the location.
// Returns null if the comment can't be reasonably parsed.
const HN_PIPE_RE = /\s*[|·•]\s*/;
const HN_DASH_RE = /\s+[-—]\s+/;
const HN_ROLE_HINT_RE = /\b(engineer|developer|designer|manager|architect|lead|director|head of|specialist|analyst|scientist|admin|consultant|coordinator|recruiter|writer|researcher|product|sde|swe|cto|cpo|founding|principal|staff|senior|junior|intern|devops|sre|qa|qa\s|frontend|backend|fullstack|full-stack|mobile|ios|android|data|machine learning|ml\s|ai\s)\b/i;
const HN_LOC_HINT_RE = /\b(remote|onsite|hybrid|usa|us\b|uk\b|europe|emea|americas|amer|apac|worldwide|anywhere|berlin|london|new york|nyc|sf\b|san francisco|tokyo|paris|amsterdam|boston|toronto|sydney|dublin|munich|vienna|zurich|prague|warsaw|madrid|barcelona|lisbon|rome|milan|stockholm|oslo|copenhagen|helsinki|tel aviv|singapore|hong kong)\b/i;

const parseHNComment = (rawHtml) => {
  const text = decodeEntities(stripHtml(rawHtml || ''));
  if (!text) return null;
  const headLine = text.split(/\n|\.  /)[0].trim().slice(0, 280);

  const urlMatch = text.match(/https?:\/\/[^\s)]+/);
  const url = urlMatch ? urlMatch[0] : null;

  let company = '';
  let title = '';
  let location = null;

  const pipeParts = headLine.split(HN_PIPE_RE).map((p) => p.trim()).filter(Boolean);
  if (pipeParts.length >= 2) {
    company = pipeParts[0];
    const tail = pipeParts.slice(1);

    // Identify the role part by keyword hint, location part by hint.
    const rolePart = tail.find((p) => HN_ROLE_HINT_RE.test(p));
    const locPart = tail.find((p) => p !== rolePart && HN_LOC_HINT_RE.test(p));

    title = rolePart || tail.find((p) => !/^https?:/i.test(p)) || '';
    location = locPart || null;
  } else {
    const dashParts = headLine.split(HN_DASH_RE).map((p) => p.trim()).filter(Boolean);
    if (dashParts.length >= 2) {
      company = dashParts[0];
      title = dashParts.slice(1).join(' - ');
    } else {
      return null;
    }
  }

  if (!company || !title) return null;
  // Reject URL-as-title — happens when no pipe-part has a role keyword
  if (/^https?:/i.test(title) || /^https?:/i.test(company)) return null;
  if (company.length > 80 || title.length > 140) return null;
  if (location && location.length > 100) location = location.slice(0, 100);
  // Filter out obvious non-job replies ("Thanks!", "I applied", links-only)
  if (/^(thanks|thank you|i applied|applied|hi|hello)\b/i.test(company)) return null;

  return { title, company, location, url };
};

// JSearch (RapidAPI) — aggregates LinkedIn + Indeed + ZipRecruiter +
// Glassdoor for ~50 countries (including Albania, Greece, Turkey — the
// gaps in our other sources). Paid: free tier ~150 req/mo, then $10/mo
// for 1k. Skipped silently if RAPIDAPI_KEY is unset so other sources
// still work in dev. `num_pages=1` returns ~10 jobs per call and burns
// 1 quota unit; bumping to 2 doubles results AND quota burn.
// API: GET https://jsearch.p.rapidapi.com/search?query=&country=&page=1&num_pages=1
const fetchJSearch = async (query) => {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) return [];

  const params = new URLSearchParams({
    query: query.title || 'developer',
    page: '1',
    num_pages: process.env.JSEARCH_NUM_PAGES || '1',
    date_posted: 'month',
  });
  if (query.country) params.set('country', query.country);

  const res = await fetchWithTimeout(
    `https://jsearch.p.rapidapi.com/search?${params}`,
    {
      headers: {
        'x-rapidapi-key': key,
        'x-rapidapi-host': 'jsearch.p.rapidapi.com',
      },
    }
  );
  if (!res || !res.ok) return [];
  const data = await res.json().catch(() => null);
  if (!data || !Array.isArray(data.data)) return [];

  return data.data.slice(0, PER_SOURCE_LIMIT).map((j) => ({
    title: j.job_title || '',
    company: j.employer_name || 'Unknown',
    location:
      [j.job_city, j.job_state, j.job_country].filter(Boolean).join(', ') ||
      (j.job_is_remote ? 'Remote' : null),
    url: j.job_apply_link || '',
    source: 'jsearch',
    snippet: j.job_description ? String(j.job_description).slice(0, 400) : null,
    posted_at: j.job_posted_at_datetime_utc || null,
  })).filter((j) => j.url && j.title);
};

// Real-Time LinkedIn Job Search (RapidAPI) — pulls fresh active LinkedIn
// listings. Highest-quality dataset of the bunch for normal markets.
// WARNING: free tier is only 25 requests/month — every user search burns
// one. Skipped silently if RAPIDAPI_KEY is unset. For production use,
// upgrade to a paid plan (~$10-30/mo for ~10k requests) or this source
// will go dark after the first ~25 searches each month.
// API: GET https://linkedin-job-search-api.p.rapidapi.com/active-jb-7d
const fetchLinkedIn = async (query) => {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) return [];

  const params = new URLSearchParams({
    limit: String(PER_SOURCE_LIMIT),
    offset: '0',
    description_type: 'text',
  });
  // Their filters expect quoted phrase strings (LinkedIn's own syntax).
  if (query.title) params.set('title_filter', `"${query.title}"`);
  if (query.country_name) params.set('location_filter', `"${query.country_name}"`);

  const res = await fetchWithTimeout(
    `https://linkedin-job-search-api.p.rapidapi.com/active-jb-7d?${params}`,
    {
      headers: {
        'x-rapidapi-key': key,
        'x-rapidapi-host': 'linkedin-job-search-api.p.rapidapi.com',
      },
    }
  );
  if (!res || !res.ok) return [];
  const data = await res.json().catch(() => null);
  if (!Array.isArray(data)) return [];

  return data.slice(0, PER_SOURCE_LIMIT).map((j) => {
    const city = (j.cities_derived && j.cities_derived[0]) || null;
    const country = (j.countries_derived && j.countries_derived[0]) || null;
    const location = [city, country].filter(Boolean).join(', ')
      || (j.locations_raw && j.locations_raw[0] && j.locations_raw[0].address && j.locations_raw[0].address.addressLocality)
      || (j.remote_derived ? 'Remote' : null);
    return {
      title: j.title || '',
      company: j.organization || 'Unknown',
      location,
      url: j.url || j.external_apply_url || '',
      source: 'linkedin',
      snippet: j.description_text ? String(j.description_text).slice(0, 400) : null,
      posted_at: j.date_posted || j.date_created || null,
    };
  }).filter((j) => j.url && j.title);
};

// Indeed (RapidAPI: indeed12) — US-heavy paid aggregator. Returns relative
// `link` paths (`/job/<id>?locality=<cc>`); we resolve them against the
// localized Indeed host (`https://<cc>.indeed.com` or `www.indeed.com`).
// API: GET https://indeed12.p.rapidapi.com/jobs/search?query=&locality=&page_id=1
const fetchIndeed = async (query) => {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) return [];

  const params = new URLSearchParams({
    query: query.title || 'developer',
    page_id: '1',
  });
  if (query.country) params.set('locality', query.country);
  if (query.country_name) params.set('location', query.country_name);

  const res = await fetchWithTimeout(
    `https://indeed12.p.rapidapi.com/jobs/search?${params}`,
    {
      headers: {
        'x-rapidapi-key': key,
        'x-rapidapi-host': 'indeed12.p.rapidapi.com',
      },
    }
  );
  if (!res || !res.ok) return [];
  const data = await res.json().catch(() => null);
  const hits = (data && data.hits) || [];
  if (!Array.isArray(hits)) return [];

  const resolveLink = (link, locality) => {
    if (!link) return '';
    if (/^https?:/i.test(link)) return link;
    const host = locality && locality !== 'us' ? `${locality}.indeed.com` : 'www.indeed.com';
    return `https://${host}${link.startsWith('/') ? '' : '/'}${link}`;
  };

  return hits.slice(0, PER_SOURCE_LIMIT).map((j) => ({
    title: j.title || '',
    company: j.company_name || 'Unknown',
    location: j.location || null,
    url: resolveLink(j.link || j.url, j.locality || query.country),
    source: 'indeed',
    snippet: stripHtml(j.description || j.snippet || j.summary || '').slice(0, 400) || null,
    posted_at: j.pub_date_ts_milli ? new Date(Number(j.pub_date_ts_milli)).toISOString() : null,
  })).filter((j) => j.url && j.title);
};

// Glassdoor Real-Time (RapidAPI) — paid US-heavy. Jobs nested deep at
// data.jobListings[].jobview. Fields under jobview.header & jobview.job.
// API: GET https://glassdoor-real-time.p.rapidapi.com/jobs/search?query=&page=1
const fetchGlassdoor = async (query) => {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) return [];

  const params = new URLSearchParams({
    query: query.title || 'developer',
    page: '1',
  });
  if (query.country_name) params.set('location', query.country_name);

  const res = await fetchWithTimeout(
    `https://glassdoor-real-time.p.rapidapi.com/jobs/search?${params}`,
    {
      headers: {
        'x-rapidapi-key': key,
        'x-rapidapi-host': 'glassdoor-real-time.p.rapidapi.com',
      },
    }
  );
  if (!res || !res.ok) return [];
  const data = await res.json().catch(() => null);
  const listings = (data && data.data && data.data.jobListings) || [];
  if (!Array.isArray(listings)) return [];

  return listings.slice(0, PER_SOURCE_LIMIT).map((entry) => {
    const v = entry && entry.jobview;
    if (!v) return null;
    const h = v.header || {};
    const job = v.job || {};
    const url =
      h.seoJobLink || h.jobViewUrl || h.viewJobUrl ||
      (h.adOrderId && job.listingId ? `https://www.glassdoor.com/job-listing/j?jl=${job.listingId}` : '');
    return {
      title: h.jobTitleText || job.jobTitleText || '',
      company: (h.employer && h.employer.name) || h.employerNameFromSearch || 'Unknown',
      location: h.locationName || h.locationCity || null,
      url,
      source: 'glassdoor',
      snippet: stripHtml(job.description || h.jobDescriptionText || '').slice(0, 400) || null,
      posted_at: h.posted || h.postingDate ||
        (typeof h.ageInDays === 'number'
          ? new Date(Date.now() - h.ageInDays * 86400000).toISOString()
          : null),
    };
  }).filter((j) => j && j.url && j.title);
};

// Upwork Jobs (RapidAPI) — freelance/contract listings. Endpoint and host
// are best-guess (`upwork-jobs.p.rapidapi.com/jobs`); fails silently if
// the host doesn't resolve (DNS lookup error) or returns non-2xx.
// API: GET https://upwork-jobs.p.rapidapi.com/jobs
const fetchUpwork = async (query) => {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) return [];

  const params = new URLSearchParams();
  if (query.title) params.set('q', query.title);
  if (query.country_name) params.set('location', query.country_name);

  const res = await fetchWithTimeout(
    `https://upwork-jobs.p.rapidapi.com/jobs?${params}`,
    {
      headers: {
        'x-rapidapi-key': key,
        'x-rapidapi-host': 'upwork-jobs.p.rapidapi.com',
      },
    }
  );
  if (!res || !res.ok) return [];
  const data = await res.json().catch(() => null);
  // Try common shapes
  const list =
    (Array.isArray(data) && data) ||
    (data && (data.jobs || data.data || data.results || data.hits)) ||
    [];
  if (!Array.isArray(list)) return [];

  return list.slice(0, PER_SOURCE_LIMIT).map((j) => ({
    title: j.title || j.name || '',
    company: j.client_name || j.company || j.employer || 'Upwork client',
    location: j.location || j.client_country || null,
    url: j.url || j.link || j.job_url || '',
    source: 'upwork',
    snippet: stripHtml(j.description || j.snippet || j.summary || '').slice(0, 400) || null,
    posted_at: j.posted_at || j.created_at || j.date_created || null,
  })).filter((j) => j.url && j.title);
};

// Hacker News "Ask HN: Who is hiring?" — find the latest monthly thread,
// pull top-level comments, parse each as a job posting. Free public
// Algolia search index, no key. Use search_by_date so we always get the
// CURRENT month's thread; the relevance-ranked endpoint stickily returns
// old viral threads from years ago.
// 1) GET https://hn.algolia.com/api/v1/search_by_date?query=...&tags=story
// 2) GET https://hn.algolia.com/api/v1/search?tags=comment,story_<id>
const HN_HIRING_TITLE_RE = /^Ask HN:\s*Who is hiring\??\s*\(?(?:[A-Z][a-z]+ \d{4})?\)?$/i;
const fetchHackerNews = async (query) => {
  const searchRes = await fetchWithTimeout(
    'https://hn.algolia.com/api/v1/search_by_date?query=Ask+HN+Who+is+hiring&tags=story&hitsPerPage=20'
  );
  if (!searchRes || !searchRes.ok) return [];
  const searchData = await searchRes.json().catch(() => null);
  const story = (searchData && searchData.hits || []).find(
    (h) => HN_HIRING_TITLE_RE.test(h.title || '')
  );
  if (!story) return [];

  const commentsRes = await fetchWithTimeout(
    `https://hn.algolia.com/api/v1/search?tags=comment,story_${story.objectID}&hitsPerPage=200`
  );
  if (!commentsRes || !commentsRes.ok) return [];
  const commentsData = await commentsRes.json().catch(() => null);
  const hits = (commentsData && commentsData.hits) || [];

  // Top-level comments only (parent_id === story_id). Replies are usually
  // candidates saying "I applied", which we don't want as job entries.
  const topLevel = hits.filter((c) => c.parent_id === c.story_id);

  const variants = expandQuery(query.title);
  const country = (query.country_name || '').toLowerCase();

  const out = [];
  for (const c of topLevel) {
    const parsed = parseHNComment(c.comment_text);
    if (!parsed) continue;

    if (variants.length) {
      const haystack = `${parsed.title} ${parsed.company} ${c.comment_text || ''}`;
      if (!matchesAnyVariant(haystack, variants)) continue;
    }
    if (country) {
      const haystack = `${parsed.location || ''} ${c.comment_text || ''}`.toLowerCase();
      if (!haystack.includes(country) && !haystack.includes('remote') && !haystack.includes('worldwide')) {
        continue;
      }
    }

    const itemUrl = `https://news.ycombinator.com/item?id=${c.objectID}`;
    out.push({
      title: parsed.title,
      company: parsed.company,
      location: parsed.location,
      url: parsed.url || itemUrl,
      source: 'hackernews',
      snippet: stripHtml(decodeEntities(c.comment_text || '')).slice(0, 400) || null,
      posted_at: c.created_at || null,
    });
    if (out.length >= PER_SOURCE_LIMIT) break;
  }
  return out;
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

// findJobs
//   input: { title: string, country?: string|null, location?: string|null }
//     - title is the keyword/role (required, e.g. "Front End Developer")
//     - country is an ISO-2 code (e.g. "de") used for Adzuna routing and
//       to derive a country name for Jooble. null/empty = global.
//     - location is an optional freeform city/region passed to Adzuna's
//       `where` and Jooble's `location`. If omitted but country is given,
//       Jooble still receives the country name so its results stay scoped.
// Returns: { query, results, sourceCounts }
//   - query: the normalized search terms (saved alongside results so the
//     UI can render "Searched for: Front End in Germany"). Includes a
//     `country_name` field for display.
//   - results: ranked + deduped list, top 200.
//   - sourceCounts: per-source raw count BEFORE dedupe, for diagnostics.
const findJobs = async (input) => {
  const title = String(input?.title || '').trim();
  const country = input?.country
    ? String(input.country).toLowerCase().trim()
    : null;
  const location = input?.location ? String(input.location).trim() : null;
  const country_name = country ? (COUNTRY_NAMES[country] || null) : null;

  const query = { title, country, country_name, location };

  const sources = [
    { name: 'remotive',      fn: fetchRemotive      },
    { name: 'remoteok',      fn: fetchRemoteOK      },
    { name: 'workingnomads', fn: fetchWorkingNomads },
    { name: 'themuse',       fn: fetchTheMuse       },
    { name: 'hackernews',    fn: fetchHackerNews    },
    { name: 'arbeitnow',     fn: fetchArbeitnow     },
    { name: 'adzuna',        fn: fetchAdzuna        },
    { name: 'jooble',        fn: fetchJooble        },
    { name: 'jsearch',       fn: fetchJSearch       },
    { name: 'linkedin',      fn: fetchLinkedIn      },
    { name: 'indeed',        fn: fetchIndeed        },
    { name: 'glassdoor',     fn: fetchGlassdoor     },
    { name: 'upwork',        fn: fetchUpwork        },
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
    .slice(0, 200); // cap so the JSONB blob stays small

  return { query, results: scored, sourceCounts };
};

module.exports = {
  findJobs,
  ADZUNA_COUNTRIES,
  COUNTRY_NAMES,
  extractSearchTerms, // exported for tests / debugging
};
