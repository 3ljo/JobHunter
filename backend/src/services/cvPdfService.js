// CV PDF Service
// Generates PDF from structured CV data using Puppeteer.
// Supports 16 ATS-optimized templates.

const puppeteer = require('puppeteer');

const DEFAULT_TEMPLATE = 'harvard';
const TEMPLATES = [
  'harvard', 'modern', 'minimalist', 'european',
  'tech', 'compact', 'executive', 'academic', 'consulting', 'swiss',
  'sidebar', 'creative', 'darktech', 'sales', 'functional', 'serif',
];

const PHOTO_TEMPLATES = [
  // Original 16: ones with a photo prop in the React component
  'european', 'executive', 'swiss', 'sidebar', 'creative', 'darktech', 'serif',
  // Unique-layout templates whose React version accepts a photo prop.
  'healthcare', 'designer', 'twotone', 'rightcol',
];

// Bulk theme-variant templates (50 IDs) that the frontend renders via a single
// GenericRenderer + ThemeTokens. Backend mirrors that with genericTemplate()
// below — adding a new tile is one line in BULK_THEMES, no template fn needed.
//
// Keep theme tokens in sync with frontend/components/cv/templates/BulkTemplates.tsx
// (if a token diverges, preview ≠ PDF). The 35 "unique-layout" templates
// (banking, threecol, infographic, etc.) are NOT in this map — they still need
// dedicated backend HTML, and fall through to harvardTemplate() until ported.
const SERIF = "'Garamond','Georgia','Times New Roman',serif";
const SERIF2 = "'Cormorant Garamond','Georgia',serif";
const SANS = "'Inter','Segoe UI',Arial,sans-serif";
const MONO = "'JetBrains Mono','SF Mono',Consolas,monospace";

const BULK_THEMES = {
  // Industry-specific (12)
  nursing:    { primary: '#9f1239', accent: '#fb7185', fontFamily: SANS,   headerStyle: 'centered', sectionStyle: 'rule',  skillStyle: 'pills',  tagline: 'Registered Nurse' },
  faculty:    { primary: '#14532d', accent: '#92400e', fontFamily: SERIF,  headerStyle: 'centered', sectionStyle: 'plain', skillStyle: 'inline', tagline: 'University Faculty', baseSize: 14 },
  dental:     { primary: '#0d9488', accent: '#86efac', fontFamily: SANS,   headerStyle: 'left',     sectionStyle: 'rule',  skillStyle: 'pills',  tagline: 'Dental Practitioner' },
  solicitor:  { primary: '#7f1d1d', accent: '#a16207', fontFamily: SERIF,  headerStyle: 'centered', sectionStyle: 'rule',  skillStyle: 'inline', tagline: 'Solicitor' },
  police:     { primary: '#1e3a8a', accent: '#fbbf24', fontFamily: SANS,   headerStyle: 'band',     sectionStyle: 'rule',  skillStyle: 'plain',  tagline: 'Public Safety' },
  military:   { primary: '#365314', accent: '#a3a380', fontFamily: SANS,   headerStyle: 'centered', sectionStyle: 'rule',  skillStyle: 'plain',  tagline: 'Veteran' },
  aviation:   { primary: '#1e293b', accent: '#cbd5e1', fontFamily: SANS,   headerStyle: 'band',     sectionStyle: 'rule',  skillStyle: 'plain',  tagline: 'Aviation' },
  culinary:   { primary: '#451a03', accent: '#dc2626', fontFamily: SERIF2, headerStyle: 'centered', sectionStyle: 'plain', skillStyle: 'inline', tagline: 'Culinary Professional', baseSize: 14 },
  fitness:    { primary: '#0a0a0a', accent: '#f97316', fontFamily: SANS,   headerStyle: 'band',     sectionStyle: 'tab',   skillStyle: 'pills',  tagline: 'Strength · Conditioning' },
  ngofield:   { primary: '#92400e', accent: '#fbbf24', fontFamily: SANS,   headerStyle: 'left',     sectionStyle: 'plain', skillStyle: 'pills',  tagline: 'NGO · Field Programs' },
  translator: { primary: '#3730a3', accent: '#fcd34d', fontFamily: SANS,   headerStyle: 'left',     sectionStyle: 'rule',  skillStyle: 'pills',  tagline: 'Translator · Linguist' },
  accountant: { primary: '#14532d', accent: '#bef264', fontFamily: SANS,   headerStyle: 'centered', sectionStyle: 'rule',  skillStyle: 'plain',  tagline: 'Certified Public Accountant' },

  // Color / aesthetic (15)
  arctic:      { primary: '#0c4a6e', accent: '#7dd3fc', fontFamily: SANS,   headerStyle: 'left',     sectionStyle: 'plain', skillStyle: 'inline', bg: '#f0f9ff' },
  terracotta:  { primary: '#92400e', accent: '#fdba74', fontFamily: SERIF2, headerStyle: 'centered', sectionStyle: 'plain', skillStyle: 'pills',  bg: '#fef9f3' },
  lavender:    { primary: '#5b21b6', accent: '#c4b5fd', fontFamily: SANS,   headerStyle: 'left',     sectionStyle: 'rule',  skillStyle: 'pills' },
  emerald:     { primary: '#065f46', accent: '#fbbf24', fontFamily: SERIF,  headerStyle: 'band',     sectionStyle: 'rule',  skillStyle: 'plain' },
  sapphire:    { primary: '#1e3a8a', accent: '#94a3b8', fontFamily: SERIF,  headerStyle: 'band',     sectionStyle: 'block', skillStyle: 'plain' },
  plum:        { primary: '#86198f', accent: '#fda4af', fontFamily: SANS,   headerStyle: 'left',     sectionStyle: 'rule',  skillStyle: 'pills' },
  mustard:     { primary: '#854d0e', accent: '#1e3a8a', fontFamily: SANS,   headerStyle: 'band',     sectionStyle: 'tab',   skillStyle: 'pills' },
  seafoam:     { primary: '#0f766e', accent: '#fde68a', fontFamily: SANS,   headerStyle: 'centered', sectionStyle: 'plain', skillStyle: 'pills',  bg: '#f0fdfa' },
  rose:        { primary: '#9f1239', accent: '#f5d0c0', fontFamily: SERIF,  headerStyle: 'centered', sectionStyle: 'plain', skillStyle: 'inline' },
  coal:        { primary: '#1f2937', accent: '#94a3b8', fontFamily: MONO,   headerStyle: 'left',     sectionStyle: 'tab',   skillStyle: 'pills' },
  forest:      { primary: '#14532d', accent: '#a3e635', fontFamily: SANS,   headerStyle: 'left',     sectionStyle: 'rule',  skillStyle: 'pills' },
  crimson:     { primary: '#7f1d1d', accent: '#fecaca', fontFamily: SANS,   headerStyle: 'band',     sectionStyle: 'rule',  skillStyle: 'plain' },
  mocha:       { primary: '#451a03', accent: '#92400e', fontFamily: SERIF,  headerStyle: 'centered', sectionStyle: 'plain', skillStyle: 'inline', bg: '#fdf6e3' },
  cobalt:      { primary: '#1e40af', accent: '#fbbf24', fontFamily: MONO,   headerStyle: 'band',     sectionStyle: 'tab',   skillStyle: 'pills' },
  ash:         { primary: '#404040', accent: '#a3a3a3', fontFamily: SANS,   headerStyle: 'left',     sectionStyle: 'plain', skillStyle: 'inline' },

  // Style / mood (15)
  retro:       { primary: '#86198f', accent: '#06b6d4', fontFamily: MONO,   headerStyle: 'band',     sectionStyle: 'block', skillStyle: 'pills' },
  modernist:   { primary: '#0a0a0a', accent: '#dc2626', fontFamily: SANS,   headerStyle: 'band',     sectionStyle: 'tab',   skillStyle: 'pills' },
  ultramin:    { primary: '#0a0a0a', accent: '#9ca3af', fontFamily: SANS,   headerStyle: 'left',     sectionStyle: 'plain', skillStyle: 'inline' },
  coolgrad:    { primary: '#1e40af', accent: '#a78bfa', fontFamily: SANS,   headerStyle: 'band',     sectionStyle: 'rule',  skillStyle: 'pills' },
  chrome:      { primary: '#1a1a1a', accent: '#9ca3af', fontFamily: MONO,   headerStyle: 'band',     sectionStyle: 'tab',   skillStyle: 'pills' },
  pastoral:    { primary: '#78350f', accent: '#d6c8a3', fontFamily: SERIF2, headerStyle: 'centered', sectionStyle: 'plain', skillStyle: 'inline', bg: '#fef9e7', baseSize: 14 },
  zen:         { primary: '#3f2a14', accent: '#a8a29e', fontFamily: SERIF2, headerStyle: 'centered', sectionStyle: 'plain', skillStyle: 'inline', bg: '#fafaf9', baseSize: 14 },
  industrial:  { primary: '#27272a', accent: '#f97316', fontFamily: SANS,   headerStyle: 'band',     sectionStyle: 'tab',   skillStyle: 'pills' },
  paperback:   { primary: '#451a03', accent: '#92400e', fontFamily: SERIF,  headerStyle: 'left',     sectionStyle: 'rule',  skillStyle: 'inline', bg: '#f5e6c4', baseSize: 14 },
  midnight:    { primary: '#0c1d3d', accent: '#22d3ee', fontFamily: SANS,   headerStyle: 'band',     sectionStyle: 'block', skillStyle: 'pills' },
  coralcalm:   { primary: '#9a3412', accent: '#fed7aa', fontFamily: SANS,   headerStyle: 'centered', sectionStyle: 'plain', skillStyle: 'pills' },
  ashfog:      { primary: '#475569', accent: '#cbd5e1', fontFamily: SANS,   headerStyle: 'left',     sectionStyle: 'plain', skillStyle: 'pills' },
  goldroyal:   { primary: '#0a0a0a', accent: '#d4af37', fontFamily: SERIF,  headerStyle: 'centered', sectionStyle: 'rule',  skillStyle: 'inline' },
  scarlet:     { primary: '#dc2626', accent: '#fef3c7', fontFamily: SANS,   headerStyle: 'band',     sectionStyle: 'rule',  skillStyle: 'plain' },
  tealclean:   { primary: '#0f766e', accent: '#a7f3d0', fontFamily: SANS,   headerStyle: 'left',     sectionStyle: 'rule',  skillStyle: 'pills' },

  // Final mix (8)
  navycoral:     { primary: '#1e3a8a', accent: '#f87171', fontFamily: SANS,  headerStyle: 'left',     sectionStyle: 'rule',  skillStyle: 'pills' },
  bronze:        { primary: '#78350f', accent: '#fcd34d', fontFamily: SERIF, headerStyle: 'centered', sectionStyle: 'plain', skillStyle: 'inline' },
  violet:        { primary: '#6b21a8', accent: '#cbd5e1', fontFamily: SANS,  headerStyle: 'left',     sectionStyle: 'rule',  skillStyle: 'pills' },
  orangebold:    { primary: '#27272a', accent: '#f97316', fontFamily: SANS,  headerStyle: 'band',     sectionStyle: 'block', skillStyle: 'pills' },
  charcoalserif: { primary: '#1f2937', accent: '#9ca3af', fontFamily: SERIF, headerStyle: 'centered', sectionStyle: 'plain', skillStyle: 'inline' },
  maroon:        { primary: '#7f1d1d', accent: '#a16207', fontFamily: SERIF, headerStyle: 'centered', sectionStyle: 'plain', skillStyle: 'inline', bg: '#fffbeb' },
  jade:          { primary: '#047857', accent: '#a7f3d0', fontFamily: SANS,  headerStyle: 'left',     sectionStyle: 'rule',  skillStyle: 'pills' },
  silverelite:   { primary: '#1f2937', accent: '#cbd5e1', fontFamily: SANS,  headerStyle: 'band',     sectionStyle: 'rule',  skillStyle: 'pills' },

  // GenericRenderer-wrapped templates from individual files (18). Same data
  // source as BulkTemplates above — just split across separate files on the
  // frontend. Mirrors the `theme={...}` literal in each .tsx file.
  education:   { primary: '#15803d', accent: '#f59e0b', fontFamily: SANS,  headerStyle: 'left',     sectionStyle: 'rule',  skillStyle: 'pills', tagline: 'Educator' },
  nonprofit:   { primary: '#365314', accent: '#84cc16', fontFamily: SANS,  headerStyle: 'centered', sectionStyle: 'plain', skillStyle: 'pills', tagline: 'Mission-Driven Professional' },
  construction:{ primary: '#1f2937', accent: '#ea580c', fontFamily: SANS,  headerStyle: 'band',     sectionStyle: 'tab',   skillStyle: 'plain', tagline: 'Skilled Trades Professional' },
  journalism:  { primary: '#0a0a0a', accent: '#0a0a0a', fontFamily: "'Georgia','Times New Roman',serif", headerStyle: 'centered', sectionStyle: 'rule', skillStyle: 'inline', tagline: 'Reporter · Writer · Editor' },
  finance:     { primary: '#064e3b', accent: '#10b981', fontFamily: SANS,  headerStyle: 'band',     sectionStyle: 'rule',  skillStyle: 'pills', tagline: 'Finance · Analytics' },
  research:    { primary: '#1e40af', accent: '#0ea5e9', fontFamily: "'IBM Plex Sans','Inter',sans-serif", headerStyle: 'left', sectionStyle: 'rule', skillStyle: 'pills', tagline: 'Research Scientist' },
  media:       { primary: '#27272a', accent: '#f43f5e', fontFamily: SANS,  headerStyle: 'band',     sectionStyle: 'tab',   skillStyle: 'pills', tagline: 'Production · Media' },
  retail:      { primary: '#7c2d12', accent: '#f59e0b', fontFamily: SANS,  headerStyle: 'centered', sectionStyle: 'rule',  skillStyle: 'plain', tagline: 'Retail · Operations' },
  logistics:   { primary: '#1e3a8a', accent: '#64748b', fontFamily: SANS,  headerStyle: 'left',     sectionStyle: 'rule',  skillStyle: 'inline', tagline: 'Supply Chain · Operations' },
  pastel:      { primary: '#86198f', accent: '#f0abfc', fontFamily: SANS,  headerStyle: 'left',     sectionStyle: 'plain', skillStyle: 'pills', bg: '#fdf4ff' },
  noir:        { primary: '#18181b', accent: '#ef4444', fontFamily: SANS,  headerStyle: 'band',     sectionStyle: 'tab',   skillStyle: 'pills' },
  botanical:   { primary: '#3f6212', accent: '#a3a380', fontFamily: SERIF2, headerStyle: 'centered', sectionStyle: 'plain', skillStyle: 'pills', bg: '#f7f8f3', baseSize: 14 },
  sunset:      { primary: '#9a3412', accent: '#fbbf24', fontFamily: SANS,  headerStyle: 'band',     sectionStyle: 'rule',  skillStyle: 'pills', bg: '#fff7ed' },
  neon:        { primary: '#581c87', accent: '#06b6d4', fontFamily: MONO,  headerStyle: 'band',     sectionStyle: 'block', skillStyle: 'pills', baseSize: 13 },
  kraft:       { primary: '#3f2a14', accent: '#92400e', fontFamily: "'Courier New','Courier',monospace", headerStyle: 'centered', sectionStyle: 'plain', skillStyle: 'inline', bg: '#e8d8b0', text: '#3f2a14' },
  typewriter:  { primary: '#1a1a1a', accent: '#1a1a1a', fontFamily: "'Courier New','Courier',monospace", headerStyle: 'left', sectionStyle: 'rule', skillStyle: 'inline', baseSize: 13 },
  booklet:     { primary: '#0f172a', accent: '#475569', fontFamily: "'Crimson Pro','Georgia',serif", headerStyle: 'centered', sectionStyle: 'plain', skillStyle: 'inline', baseSize: 14 },
  blocks:      { primary: '#4338ca', accent: '#a78bfa', fontFamily: SANS,  headerStyle: 'left',     sectionStyle: 'block', skillStyle: 'pills' },
};

// ─── Singleton browser ──────────────────────────────────────────────
// Launching Chromium is expensive (1-3s). Keep one instance alive for the
// process lifetime and just open a fresh Page per PDF. This alone takes
// preview generation from ~3-5s down to ~400-800ms.
let browserPromise = null;
let browserDeadSince = 0;

const getBrowser = async () => {
  if (browserPromise) {
    try {
      const b = await browserPromise;
      if (b && b.connected !== false && b.process() && !b.process().killed) {
        return b;
      }
    } catch {
      // fall through to relaunch
    }
  }

  browserDeadSince = 0;
  browserPromise = puppeteer
    .launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
    })
    .then((b) => {
      b.on('disconnected', () => {
        browserDeadSince = Date.now();
        browserPromise = null;
      });
      return b;
    })
    .catch((err) => {
      browserPromise = null;
      throw err;
    });

  return browserPromise;
};

// Close on shutdown so no orphan Chromium processes linger.
['SIGINT', 'SIGTERM', 'beforeExit'].forEach((sig) => {
  process.once(sig, async () => {
    try {
      if (browserPromise) {
        const b = await browserPromise;
        if (b) await b.close();
      }
    } catch { /* noop */ }
  });
});

const generateCVPdfBuffer = async (finalCV, options = {}) => {
  const requested = typeof options.template === 'string' ? options.template : '';
  const isKnown = TEMPLATES.includes(requested) || Object.prototype.hasOwnProperty.call(BULK_THEMES, requested);
  const templateId = isKnown ? requested : DEFAULT_TEMPLATE;
  // All bulk theme templates support photo (via genericTemplate's Header).
  const supportsPhoto = PHOTO_TEMPLATES.includes(templateId) || Object.prototype.hasOwnProperty.call(BULK_THEMES, templateId);
  const photo = supportsPhoto
    && typeof options.photo === 'string'
    && options.photo.startsWith('data:image/')
    ? options.photo
    : null;

  const html = buildCVHtml(finalCV, templateId, photo);

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // HTML is self-contained (inline CSS, optional base64 photo). No remote
    // network calls, so domcontentloaded fires immediately — no need to
    // wait for networkidle0, which used to add ~500ms of dead time.
    await page.setContent(html, { waitUntil: 'domcontentloaded' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '0.6in', bottom: '0.6in', left: '0.7in', right: '0.7in' },
      printBackground: true,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    // Close the page, not the browser — keeps the chromium warm for the next call.
    try { await page.close(); } catch { /* noop */ }
  }
};

function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildCVHtml(cv, templateId, photo) {
  // Route theme-variant templates (zen, arctic, etc.) through the shared
  // genericTemplate so adding a new tile on the frontend doesn't require a
  // new backend fn — just a BULK_THEMES entry.
  if (Object.prototype.hasOwnProperty.call(BULK_THEMES, templateId)) {
    return genericTemplate(cv, photo, BULK_THEMES[templateId]);
  }
  switch (templateId) {
    case 'modern':      return modernTemplate(cv);
    case 'minimalist':  return minimalistTemplate(cv);
    case 'european':    return europeanTemplate(cv, photo);
    case 'tech':        return techTemplate(cv);
    case 'compact':     return compactTemplate(cv);
    case 'executive':   return executiveTemplate(cv, photo);
    case 'academic':    return academicTemplate(cv);
    case 'consulting':  return consultingTemplate(cv);
    case 'swiss':       return swissTemplate(cv, photo);
    case 'sidebar':     return sidebarTemplate(cv, photo);
    case 'creative':    return creativeTemplate(cv, photo);
    case 'darktech':    return darkTechTemplate(cv, photo);
    case 'sales':       return salesTemplate(cv);
    case 'functional':  return functionalTemplate(cv);
    case 'serif':       return serifTemplate(cv, photo);
    // 17 dedicated ports of frontend hand-written React layouts. Keep these
    // in sync with frontend/components/cv/templates/<Name>.tsx — colors,
    // spacing, section headers, special elements (drop caps, skill bars,
    // sidebars, 3-column grid) all match the React source.
    case 'mono':        return monoTemplate(cv);
    case 'timeline':    return timelineTemplate(cv);
    case 'banking':     return bankingTemplate(cv);
    case 'healthcare':  return healthcareTemplate(cv, photo);
    case 'government':  return governmentTemplate(cv);
    case 'designer':    return designerTemplate(cv, photo);
    case 'marketing':   return marketingTemplate(cv);
    case 'legal':       return legalTemplate(cv);
    case 'twotone':     return twotoneTemplate(cv, photo);
    case 'startup':     return startupTemplate(cv);
    case 'realestate':  return realestateTemplate(cv);
    case 'magazine':    return magazineTemplate(cv);
    case 'rightcol':    return rightcolTemplate(cv, photo);
    case 'threecol':    return threecolTemplate(cv);
    case 'horizontal':  return horizontalTemplate(cv);
    case 'infographic': return infographicTemplate(cv);
    case 'cards':       return cardsTemplate(cv);
    case 'harvard':
    default:            return harvardTemplate(cv);
  }
}

/* ═══════════════════════ Shared section helpers ═══════════════════════ */

function renderExperience(cv, heading = 'WORK EXPERIENCE') {
  if (!cv.experience || cv.experience.length === 0) return '';
  return `
    <div class="section">
      <h2>${heading}</h2>
      ${cv.experience.map((role) => `
        <div class="role">
          <div class="role-title">${escapeHtml(role.title)}</div>
          <div class="role-meta">${[role.company, role.duration].filter(Boolean).map(escapeHtml).join(' | ')}</div>
          ${role.bullets && role.bullets.length > 0 ? `
            <ul>${role.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>
          ` : ''}
        </div>
      `).join('')}
    </div>
  `;
}

function renderSkills(cv, separator = ', ', heading = 'SKILLS') {
  const skills = (cv.skills || []).filter((s) => s && String(s).trim());
  if (skills.length === 0) return '';
  return `
    <div class="section">
      <h2>${heading}</h2>
      <p>${escapeHtml(skills.join(separator))}</p>
    </div>
  `;
}

function eduLocationText(edu) {
  if (!edu) return '';
  return [edu.city, edu.country]
    .map((s) => (s ? String(s).trim() : ''))
    .filter(Boolean)
    .join(', ');
}

function eduExtrasHtml(edu) {
  if (!edu) return '';
  const loc = eduLocationText(edu);
  const url = edu.url ? String(edu.url).trim() : '';
  let out = '';
  if (loc) out += `<p class="entry-meta">${escapeHtml(loc)}</p>`;
  if (url) {
    out += `<p class="entry-link"><a href="${escapeHtml(url)}">${escapeHtml(url)}</a></p>`;
  }
  return out;
}

function renderEducation(cv) {
  const entries = (cv.education || []).filter((edu) =>
    [edu && edu.degree, edu && edu.institution, edu && edu.year, edu && edu.url].filter(Boolean).join(' ').trim().length > 0
  );
  if (entries.length === 0) return '';
  return `
    <div class="section">
      <h2>EDUCATION</h2>
      ${entries.map((edu) => {
        const parts = [edu.degree, edu.institution, edu.year].filter(Boolean);
        return `<div class="entry"><p>${escapeHtml(parts.join(' — '))}</p>${eduExtrasHtml(edu)}</div>`;
      }).join('')}
    </div>
  `;
}

function certText(cert) {
  if (!cert) return '';
  if (typeof cert === 'string') return cert.trim();
  return String(cert.name || '').trim();
}

function certExtrasHtml(cert) {
  if (!cert || typeof cert === 'string') return '';
  const meta = [cert.issuer, cert.year]
    .map((s) => (s ? String(s).trim() : ''))
    .filter(Boolean)
    .join(' · ');
  const url = cert.url ? String(cert.url).trim() : '';
  let out = '';
  if (meta) out += `<p class="entry-meta">${escapeHtml(meta)}</p>`;
  if (url) {
    out += `<p class="entry-link"><a href="${escapeHtml(url)}">${escapeHtml(url)}</a></p>`;
  }
  return out;
}

function renderCertifications(cv) {
  const entries = (cv.certifications || []).filter((c) => certText(c).length > 0);
  if (entries.length === 0) return '';
  return `
    <div class="section">
      <h2>CERTIFICATIONS</h2>
      ${entries.map((cert) => `<div class="entry"><p>${escapeHtml(certText(cert))}</p>${certExtrasHtml(cert)}</div>`).join('')}
    </div>
  `;
}

function langText(lang) {
  if (!lang) return '';
  if (typeof lang === 'string') return lang.trim();
  const name = String(lang.name || '').trim();
  const level = String(lang.level || '').trim();
  if (name && level) return `${name} — ${level}`;
  return name || level;
}

function renderLanguages(cv, heading = 'LANGUAGES') {
  const entries = (cv.languages || []).filter((l) => langText(l).length > 0);
  if (entries.length === 0) return '';
  return `
    <div class="section">
      <h2>${heading}</h2>
      <p>${escapeHtml(entries.map(langText).join('  ·  '))}</p>
    </div>
  `;
}

function baseStyles() {
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { color: #1a1a1a; }
    ul { padding-left: 20px; margin-top: 4px; }
    li { margin-bottom: 3px; }
    .entry { margin-bottom: 4pt; }
    .entry-meta { font-size: 9.5pt; color: #555; margin-top: 1pt; margin-bottom: 1pt; }
    .entry-link { font-size: 9pt; margin-top: 1pt; margin-bottom: 1pt; word-break: break-all; }
    .entry-link a { color: #1d4ed8; text-decoration: underline; }
  `;
}

/* ═══════════════════════ Harvard Classic ═══════════════════════ */

function harvardTemplate(cv) {
  const contactParts = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean);

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
${baseStyles()}
body { font-family: Calibri, 'Segoe UI', Arial, sans-serif; font-size: 11pt; line-height: 1.4; }
.name { text-align: center; font-size: 22pt; font-weight: bold; letter-spacing: 0.5px; }
.contact { text-align: center; font-size: 10.5pt; color: #444; margin-top: 2px; }
.divider { border-bottom: 1px solid #000; margin: 10px 0 12px; }
.section { margin-bottom: 12px; }
h2 { font-size: 10.5pt; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #999; padding-bottom: 2px; margin-bottom: 6px; letter-spacing: 0.6px; }
.role { margin-bottom: 9px; }
.role-title { font-weight: bold; font-size: 11pt; }
.role-meta { font-style: italic; font-size: 10.5pt; color: #444; margin-bottom: 3px; }
p { font-size: 11pt; margin-bottom: 3px; }
li { font-size: 11pt; }
</style></head><body>
  <div class="name">${escapeHtml(cv.full_name)}</div>
  ${contactParts.length > 0 ? `<div class="contact">${escapeHtml(contactParts.join(' | '))}</div>` : ''}
  <div class="divider"></div>
  ${cv.summary ? `<div class="section"><h2>PROFESSIONAL SUMMARY</h2><p>${escapeHtml(cv.summary)}</p></div>` : ''}
  ${renderExperience(cv)}
  ${renderSkills(cv)}
  ${renderEducation(cv)}
  ${renderLanguages(cv)}
  ${renderCertifications(cv)}
</body></html>`;
}

/* ═══════════════════════ Modern Professional (Jake's Resume style) ═══════════════════════ */

function modernTemplate(cv) {
  const contactParts = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean);

  const experienceHtml = !cv.experience || cv.experience.length === 0 ? '' : `
    <div class="section">
      <h2>EXPERIENCE</h2>
      ${cv.experience.map((role) => `
        <div class="role">
          <div class="role-row">
            <span class="role-title">${escapeHtml(role.title)}${role.company ? ' — ' + escapeHtml(role.company) : ''}</span>
            ${role.duration ? `<span class="role-date">${escapeHtml(role.duration)}</span>` : ''}
          </div>
          ${role.bullets && role.bullets.length > 0 ? `
            <ul>${role.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>
          ` : ''}
        </div>
      `).join('')}
    </div>
  `;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
${baseStyles()}
body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 10.5pt; line-height: 1.45; }
.header { text-align: center; padding-bottom: 6px; }
.name { font-size: 22pt; font-weight: bold; color: #0f172a; letter-spacing: -0.3px; }
.contact { font-size: 10pt; color: #555; margin-top: 3px; }
.section { margin-top: 12px; }
h2 { font-size: 10pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; color: #0f172a; border-bottom: 1.5px solid #0f172a; padding-bottom: 2px; margin-bottom: 6px; }
.role { margin-bottom: 8px; }
.role-row { display: flex; justify-content: space-between; align-items: baseline; gap: 12pt; }
.role-title { font-weight: 600; font-size: 10.5pt; color: #0f172a; }
.role-date { font-size: 10pt; color: #555; white-space: nowrap; }
p { font-size: 10.5pt; margin-bottom: 3px; }
li { font-size: 10.5pt; }
</style></head><body>
  <div class="header">
    <div class="name">${escapeHtml(cv.full_name)}</div>
    ${contactParts.length > 0 ? `<div class="contact">${escapeHtml(contactParts.join('   •   '))}</div>` : ''}
  </div>
  ${cv.summary ? `<div class="section"><h2>SUMMARY</h2><p>${escapeHtml(cv.summary)}</p></div>` : ''}
  ${experienceHtml}
  ${renderSkills(cv, ' · ')}
  ${renderEducation(cv)}
  ${renderLanguages(cv)}
  ${renderCertifications(cv)}
</body></html>`;
}

/* ═══════════════════════ Minimalist Executive ═══════════════════════ */

function minimalistTemplate(cv) {
  const contactParts = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean);

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
${baseStyles()}
body { font-family: Garamond, 'Times New Roman', Georgia, serif; font-size: 11pt; line-height: 1.55; color: #111; }
.name { text-align: center; font-size: 22pt; font-weight: 400; letter-spacing: 4px; text-transform: uppercase; }
.contact { text-align: center; font-size: 10pt; color: #555; margin-top: 4px; letter-spacing: 0.5px; }
.divider { height: 1px; background: #d4d4d4; margin: 16px 0 14px; }
.section { margin-bottom: 14px; }
h2 { font-size: 9.5pt; font-weight: bold; text-transform: uppercase; letter-spacing: 3px; color: #111; margin-bottom: 6px; }
.role { margin-bottom: 10px; }
.role-title { font-weight: 600; font-size: 11pt; }
.role-meta { font-size: 10pt; font-style: italic; color: #555; margin-bottom: 3px; }
p { font-size: 11pt; margin-bottom: 3px; }
li { font-size: 11pt; }
</style></head><body>
  <div class="name">${escapeHtml(cv.full_name)}</div>
  ${contactParts.length > 0 ? `<div class="contact">${escapeHtml(contactParts.join('   ·   '))}</div>` : ''}
  <div class="divider"></div>
  ${cv.summary ? `<div class="section"><h2>PROFILE</h2><p>${escapeHtml(cv.summary)}</p></div>` : ''}
  ${renderExperience(cv, 'EXPERIENCE')}
  ${renderSkills(cv, ' · ', 'EXPERTISE')}
  ${renderEducation(cv)}
  ${renderLanguages(cv)}
  ${renderCertifications(cv)}
</body></html>`;
}

/* ═══════════════════════ European CV (Europass-inspired, with photo) ═══════════════════════ */

function europeanTemplate(cv, photo) {
  const contactParts = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean);
  const photoHtml = photo ? `<img src="${photo}" class="photo" alt="Profile" />` : '';

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
${baseStyles()}
body { font-family: Calibri, 'Segoe UI', Arial, sans-serif; font-size: 11pt; line-height: 1.45; }
.header { display: flex; align-items: flex-start; gap: 18pt; padding-bottom: 10px; border-bottom: 2px solid #1e3a8a; }
.photo { width: 90pt; height: 90pt; object-fit: cover; border: 1px solid #d4d4d4; border-radius: 4px; flex-shrink: 0; }
.header-text { flex: 1; }
.name { font-size: 22pt; font-weight: bold; color: #1e3a8a; letter-spacing: -0.2px; line-height: 1.15; }
.contact { font-size: 10.5pt; color: #333; margin-top: 4px; }
.section { margin-top: 14px; }
h2 { font-size: 10.5pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.8px; color: #1e3a8a; border-bottom: 1px solid #dbeafe; padding-bottom: 2px; margin-bottom: 6px; }
.role { margin-bottom: 9px; }
.role-title { font-weight: bold; font-size: 11pt; }
.role-meta { font-size: 10.5pt; color: #555; margin-bottom: 3px; }
p { font-size: 11pt; margin-bottom: 3px; }
li { font-size: 11pt; }
</style></head><body>
  <div class="header">
    ${photoHtml}
    <div class="header-text">
      <div class="name">${escapeHtml(cv.full_name)}</div>
      ${contactParts.length > 0 ? `<div class="contact">${escapeHtml(contactParts.join('  |  '))}</div>` : ''}
    </div>
  </div>
  ${cv.summary ? `<div class="section"><h2>PERSONAL STATEMENT</h2><p>${escapeHtml(cv.summary)}</p></div>` : ''}
  ${renderExperience(cv)}
  ${renderEducation(cv)}
  ${renderSkills(cv)}
  ${renderLanguages(cv)}
  ${renderCertifications(cv)}
</body></html>`;
}

/* ═══════════════════════ Technical Engineer ═══════════════════════ */

function techTemplate(cv) {
  const contactParts = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean);
  const skills = (cv.skills || []).filter((s) => s && String(s).trim());

  const skillsHtml = skills.length === 0 ? '' : `
    <div class="section">
      <h2>Technical Skills</h2>
      <p class="mono">${escapeHtml(skills.join(' · '))}</p>
    </div>
  `;

  const experienceHtml = !cv.experience || cv.experience.length === 0 ? '' : `
    <div class="section">
      <h2>Experience</h2>
      ${cv.experience.map((role) => `
        <div class="role">
          <div class="role-row">
            <span class="role-title">${escapeHtml(role.title)}${role.company ? ' — ' + escapeHtml(role.company) : ''}</span>
            ${role.duration ? `<span class="role-date">${escapeHtml(role.duration)}</span>` : ''}
          </div>
          ${role.bullets && role.bullets.length > 0 ? `
            <ul>${role.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>
          ` : ''}
        </div>
      `).join('')}
    </div>
  `;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
${baseStyles()}
body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 10.5pt; line-height: 1.4; color: #0f172a; }
.name { font-size: 22pt; font-weight: bold; letter-spacing: -0.3px; color: #0f172a; }
.contact { font-size: 10pt; color: #555; margin-top: 2pt; }
.rule { height: 2pt; background: #0ea5e9; margin: 10pt 0 12pt; }
.section { margin-bottom: 12pt; }
h2 { font-size: 10pt; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; color: #0ea5e9; margin-bottom: 6pt; }
.role { margin-bottom: 9pt; }
.role-row { display: flex; justify-content: space-between; align-items: baseline; gap: 12pt; }
.role-title { font-weight: 600; font-size: 10.5pt; color: #0f172a; }
.role-date { font-size: 10pt; color: #64748b; white-space: nowrap; }
p { font-size: 10.5pt; margin-bottom: 3pt; }
.mono { font-family: 'JetBrains Mono', Consolas, Menlo, monospace; font-size: 9.5pt; }
li { font-size: 10.5pt; }
</style></head><body>
  <div class="name">${escapeHtml(cv.full_name)}</div>
  ${contactParts.length > 0 ? `<div class="contact">${escapeHtml(contactParts.join('  ·  '))}</div>` : ''}
  <div class="rule"></div>
  ${skillsHtml}
  ${cv.summary ? `<div class="section"><h2>Summary</h2><p>${escapeHtml(cv.summary)}</p></div>` : ''}
  ${experienceHtml}
  ${renderEducation(cv)}
  ${renderLanguages(cv)}
  ${renderCertifications(cv)}
</body></html>`;
}

/* ═══════════════════════ Compact One-Page ═══════════════════════ */

function compactTemplate(cv) {
  const contactParts = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean);

  const experienceHtml = !cv.experience || cv.experience.length === 0 ? '' : `
    <div class="section">
      <h2>Experience</h2>
      ${cv.experience.map((role) => `
        <div class="role">
          <div class="role-row">
            <span class="role-title">${escapeHtml(role.title)}${role.company ? ' · ' + escapeHtml(role.company) : ''}</span>
            ${role.duration ? `<span class="role-date">${escapeHtml(role.duration)}</span>` : ''}
          </div>
          ${role.bullets && role.bullets.length > 0 ? `
            <ul>${role.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>
          ` : ''}
        </div>
      `).join('')}
    </div>
  `;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
${baseStyles()}
body { font-family: Arial, Helvetica, sans-serif; font-size: 9.5pt; line-height: 1.28; color: #111; }
.name { font-size: 18pt; font-weight: bold; }
.contact { font-size: 9pt; color: #333; margin-top: 1pt; }
.rule { border-top: 1pt solid #333; margin: 6pt 0 8pt; }
.section { margin-bottom: 7pt; }
h2 { font-size: 9pt; font-weight: bold; text-transform: uppercase; border-bottom: 0.6pt solid #999; padding-bottom: 1pt; margin-bottom: 4pt; letter-spacing: 0.4px; }
.role { margin-bottom: 5pt; }
.role-row { display: flex; justify-content: space-between; align-items: baseline; gap: 8pt; }
.role-title { font-weight: bold; font-size: 9.5pt; }
.role-date { font-size: 9pt; color: #555; white-space: nowrap; }
p { font-size: 9.5pt; margin-bottom: 1pt; }
ul { padding-left: 16pt; margin-top: 1pt; }
li { font-size: 9.5pt; margin-bottom: 1pt; }
</style></head><body>
  <div class="name">${escapeHtml(cv.full_name)}</div>
  ${contactParts.length > 0 ? `<div class="contact">${escapeHtml(contactParts.join(' | '))}</div>` : ''}
  <div class="rule"></div>
  ${cv.summary ? `<div class="section"><h2>Summary</h2><p>${escapeHtml(cv.summary)}</p></div>` : ''}
  ${experienceHtml}
  ${renderSkills(cv, ' · ')}
  ${renderEducation(cv)}
  ${renderLanguages(cv)}
  ${renderCertifications(cv)}
</body></html>`;
}

/* ═══════════════════════ Executive Narrative ═══════════════════════ */

function executiveTemplate(cv, photo) {
  const contactParts = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean);

  const summaryBlock = !cv.summary ? '' : `
    <div class="summary-box">
      <p class="summary-text">${escapeHtml(cv.summary)}</p>
    </div>
  `;

  const headerHtml = photo ? `
    <div class="header-with-photo">
      <img src="${photo}" class="photo" alt="Profile" />
      <div class="header-text">
        <div class="name-left">${escapeHtml(cv.full_name)}</div>
        ${contactParts.length > 0 ? `<div class="contact-left">${escapeHtml(contactParts.join('  ·  '))}</div>` : ''}
      </div>
    </div>
  ` : `
    <div class="name">${escapeHtml(cv.full_name)}</div>
    ${contactParts.length > 0 ? `<div class="contact">${escapeHtml(contactParts.join('  ·  '))}</div>` : ''}
  `;

  const experienceHtml = !cv.experience || cv.experience.length === 0 ? '' : `
    <div class="section">
      <h2>Professional Experience</h2>
      ${cv.experience.map((role) => `
        <div class="role">
          <div class="role-title">${escapeHtml(role.title)}</div>
          <div class="role-meta">${[role.company, role.duration].filter(Boolean).map(escapeHtml).join(' — ')}</div>
          ${role.bullets && role.bullets.length > 0 ? `
            <ul>${role.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>
          ` : ''}
        </div>
      `).join('')}
    </div>
  `;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
${baseStyles()}
body { font-family: Georgia, 'Times New Roman', serif; font-size: 11pt; line-height: 1.5; color: #1f2937; }
.name { text-align: center; font-size: 24pt; font-weight: 400; letter-spacing: 1px; color: #1f2937; }
.contact { text-align: center; font-size: 10pt; color: #555; margin-top: 3pt; }
.header-with-photo { display: flex; align-items: center; gap: 16pt; }
.photo { width: 78pt; height: 78pt; object-fit: cover; border-radius: 50%; border: 2pt solid #7c2d12; flex-shrink: 0; }
.header-text { flex: 1; }
.name-left { font-size: 24pt; font-weight: 400; letter-spacing: 1px; color: #1f2937; }
.contact-left { font-size: 10pt; color: #555; margin-top: 3pt; }
.rule { height: 1pt; background: #7c2d12; margin: 12pt auto 16pt; width: 48%; }
.summary-box { background: #fafaf9; border-left: 3pt solid #7c2d12; padding: 10pt 14pt; margin-bottom: 16pt; }
.summary-text { font-size: 11pt; font-style: italic; color: #374151; }
.section { margin-bottom: 14pt; }
h2 { text-align: center; font-size: 10pt; font-weight: bold; text-transform: uppercase; letter-spacing: 3px; color: #7c2d12; margin-bottom: 10pt; }
.role { margin-bottom: 11pt; }
.role-title { font-weight: bold; font-size: 11.5pt; }
.role-meta { font-size: 10.5pt; font-style: italic; color: #6b7280; margin-bottom: 3pt; }
p { font-size: 11pt; margin-bottom: 3pt; }
li { font-size: 11pt; }
</style></head><body>
  ${headerHtml}
  <div class="rule"></div>
  ${summaryBlock}
  ${experienceHtml}
  ${renderSkills(cv, '  ·  ', 'Core Competencies')}
  ${renderEducation(cv)}
  ${renderLanguages(cv)}
  ${renderCertifications(cv)}
</body></html>`;
}

/* ═══════════════════════ Academic / Research ═══════════════════════ */

function academicTemplate(cv) {
  const contactParts = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean);

  // Academic convention: Education comes first.
  const educationHtml = !cv.education || cv.education.length === 0 ? '' : `
    <div class="section">
      <h2>Education</h2>
      ${cv.education
        .filter((e) => [e.degree, e.institution, e.year, e.url].filter(Boolean).length > 0)
        .map((e) => `
          <div class="entry">
            <div class="edu-row">
              <span class="edu-main"><strong>${escapeHtml(e.degree || 'Degree')}</strong>${e.institution ? `, <em>${escapeHtml(e.institution)}</em>` : ''}</span>
              ${e.year ? `<span class="edu-year">${escapeHtml(e.year)}</span>` : ''}
            </div>
            ${eduExtrasHtml(e)}
          </div>
        `).join('')}
    </div>
  `;

  const experienceHtml = !cv.experience || cv.experience.length === 0 ? '' : `
    <div class="section">
      <h2>Academic &amp; Research Experience</h2>
      ${cv.experience.map((role) => `
        <div class="role">
          <div class="role-row">
            <span class="role-title"><strong>${escapeHtml(role.title)}</strong></span>
            ${role.duration ? `<span class="role-date"><em>${escapeHtml(role.duration)}</em></span>` : ''}
          </div>
          ${role.company ? `<div class="role-meta"><em>${escapeHtml(role.company)}</em></div>` : ''}
          ${role.bullets && role.bullets.length > 0 ? `
            <ul>${role.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>
          ` : ''}
        </div>
      `).join('')}
    </div>
  `;

  const pubs = (cv.certifications || []).filter((c) => certText(c).length > 0);
  const publicationsHtml = pubs.length === 0 ? '' : `
    <div class="section">
      <h2>Publications &amp; Honors</h2>
      ${pubs.map((p) => `<div class="entry"><p class="pub">${escapeHtml(certText(p))}</p>${certExtrasHtml(p)}</div>`).join('')}
    </div>
  `;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
${baseStyles()}
body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.45; color: #111; }
.name { text-align: center; font-size: 20pt; font-weight: bold; }
.contact { text-align: center; font-size: 10pt; color: #333; margin-top: 2pt; }
.rule { border-top: 1pt solid #000; margin: 8pt 0 10pt; }
.section { margin-bottom: 10pt; }
h2 { font-size: 11pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; border-bottom: 0.5pt solid #444; padding-bottom: 2pt; margin-bottom: 6pt; }
.edu-row, .role-row { display: flex; justify-content: space-between; gap: 8pt; }
.edu-main { font-size: 11pt; }
.edu-year { font-size: 10.5pt; white-space: nowrap; }
.role { margin-bottom: 8pt; }
.role-meta { font-size: 10.5pt; color: #444; margin-bottom: 2pt; }
p { font-size: 11pt; margin-bottom: 2pt; }
.pub { margin-bottom: 4pt; }
li { font-size: 11pt; }
</style></head><body>
  <div class="name">${escapeHtml(cv.full_name)}</div>
  ${contactParts.length > 0 ? `<div class="contact">${escapeHtml(contactParts.join(', '))}</div>` : ''}
  <div class="rule"></div>
  ${educationHtml}
  ${cv.summary ? `<div class="section"><h2>Research Interests</h2><p>${escapeHtml(cv.summary)}</p></div>` : ''}
  ${experienceHtml}
  ${publicationsHtml}
  ${renderSkills(cv, '; ', 'Technical &amp; Methodological Skills')}
  ${renderLanguages(cv)}
</body></html>`;
}

/* ═══════════════════════ Consulting Metrics ═══════════════════════ */

function highlightMetricsHtml(text) {
  if (!text) return '';
  const regex = /(\$?\d[\d,]*(?:\.\d+)?%?\+?|\d+x)/g;
  return escapeHtml(text).replace(regex, '<strong>$1</strong>');
}

function consultingTemplate(cv) {
  const contactParts = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean);

  const experienceHtml = !cv.experience || cv.experience.length === 0 ? '' : `
    <div class="section">
      <h2>Professional Experience</h2>
      ${cv.experience.map((role) => `
        <div class="role">
          <div class="role-row">
            <span class="role-title"><strong>${escapeHtml(role.title)}</strong>${role.company ? ', ' + escapeHtml(role.company) : ''}</span>
            ${role.duration ? `<span class="role-date">${escapeHtml(role.duration)}</span>` : ''}
          </div>
          ${role.bullets && role.bullets.length > 0 ? `
            <ul>${role.bullets.map((b) => `<li>${highlightMetricsHtml(b)}</li>`).join('')}</ul>
          ` : ''}
        </div>
      `).join('')}
    </div>
  `;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
${baseStyles()}
body { font-family: Arial, Helvetica, sans-serif; font-size: 10.5pt; line-height: 1.42; color: #0f172a; }
.name { font-size: 22pt; font-weight: bold; color: #0c2340; }
.contact { font-size: 10pt; color: #475569; margin-top: 2pt; }
.rule { height: 3pt; background: #0c2340; margin: 10pt 0 14pt; }
.section { margin-bottom: 12pt; }
h2 { font-size: 10pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; color: #0c2340; border-bottom: 0.5pt solid #cbd5e1; padding-bottom: 2pt; margin-bottom: 6pt; }
.role { margin-bottom: 9pt; }
.role-row { display: flex; justify-content: space-between; align-items: baseline; gap: 12pt; }
.role-title { font-size: 10.5pt; color: #0f172a; }
.role-date { font-size: 10pt; color: #475569; font-weight: 600; white-space: nowrap; }
p { font-size: 10.5pt; margin-bottom: 3pt; }
li { font-size: 10.5pt; }
strong { color: #0c2340; }
</style></head><body>
  <div class="name">${escapeHtml(cv.full_name)}</div>
  ${contactParts.length > 0 ? `<div class="contact">${escapeHtml(contactParts.join(' · '))}</div>` : ''}
  <div class="rule"></div>
  ${cv.summary ? `<div class="section"><h2>Value Proposition</h2><p>${escapeHtml(cv.summary)}</p></div>` : ''}
  ${experienceHtml}
  ${renderSkills(cv, ' · ', 'Expertise')}
  ${renderEducation(cv)}
  ${renderLanguages(cv)}
  ${renderCertifications(cv)}
</body></html>`;
}

/* ═══════════════════════ Swiss Grid ═══════════════════════ */

function swissTemplate(cv, photo) {
  const contactParts = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean);

  const headerHtml = photo ? `
    <div class="swiss-header">
      <div class="swiss-header-text">
        <div class="name">${escapeHtml(cv.full_name)}</div>
        ${contactParts.length > 0 ? `<div class="contact">${escapeHtml(contactParts.join('   /   '))}</div>` : ''}
      </div>
      <img src="${photo}" class="swiss-photo" alt="Profile" />
    </div>
  ` : `
    <div class="name">${escapeHtml(cv.full_name)}</div>
    ${contactParts.length > 0 ? `<div class="contact">${escapeHtml(contactParts.join('   /   '))}</div>` : ''}
  `;

  const experienceHtml = !cv.experience || cv.experience.length === 0 ? '' : `
    <div class="section">
      <h2>02 / Experience</h2>
      ${cv.experience.map((role) => `
        <div class="grid-row">
          ${role.duration ? `<div class="grid-left">${escapeHtml(role.duration)}</div>` : '<div class="grid-left"></div>'}
          <div class="grid-right">
            <div class="role-title"><strong>${escapeHtml(role.title)}</strong></div>
            ${role.company ? `<div class="role-meta">${escapeHtml(role.company)}</div>` : ''}
            ${role.bullets && role.bullets.length > 0 ? `
              <ul>${role.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>
            ` : ''}
          </div>
        </div>
      `).join('')}
    </div>
  `;

  const educationHtml = !cv.education || cv.education.length === 0 ? '' : `
    <div class="section">
      <h2>03 / Education</h2>
      ${cv.education
        .filter((e) => [e.degree, e.institution, e.year, e.url].filter(Boolean).length > 0)
        .map((e) => `
          <div class="grid-row">
            ${e.year ? `<div class="grid-left">${escapeHtml(e.year)}</div>` : '<div class="grid-left"></div>'}
            <div class="grid-right">
              <p>${escapeHtml([e.degree, e.institution].filter(Boolean).join(' — '))}</p>
              ${eduExtrasHtml(e)}
            </div>
          </div>
        `).join('')}
    </div>
  `;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
${baseStyles()}
body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 10.5pt; line-height: 1.5; color: #111; }
.name { font-size: 28pt; font-weight: bold; letter-spacing: -0.5px; line-height: 1.05; }
.contact { font-size: 10pt; color: #64748b; margin-top: 5pt; letter-spacing: 0.5px; }
.swiss-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16pt; }
.swiss-header-text { flex: 1; }
.swiss-photo { width: 72pt; height: 72pt; object-fit: cover; flex-shrink: 0; border-radius: 0; }
.rule { height: 3pt; background: #111; margin: 16pt 0 20pt; width: 40pt; }
.section { margin-bottom: 18pt; }
h2 { font-size: 10pt; font-weight: bold; text-transform: uppercase; letter-spacing: 3px; color: #111; margin-bottom: 10pt; }
.grid-row { display: flex; gap: 14pt; margin-bottom: 10pt; }
.grid-left { width: 90pt; flex-shrink: 0; font-size: 9.5pt; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 1.2px; padding-top: 2pt; }
.grid-right { flex: 1; }
.role-title { font-size: 11pt; }
.role-meta { font-size: 10.5pt; color: #64748b; margin-bottom: 2pt; }
p { font-size: 10.5pt; margin-bottom: 2pt; }
li { font-size: 10.5pt; }
</style></head><body>
  ${headerHtml}
  <div class="rule"></div>
  ${cv.summary ? `<div class="section"><h2>01 / Profile</h2><p>${escapeHtml(cv.summary)}</p></div>` : ''}
  ${experienceHtml}
  ${educationHtml}
  ${renderSkills(cv, ' / ', '04 / Skills')}
  ${renderLanguages(cv)}
  ${renderCertifications(cv)}
</body></html>`;
}

/* ═══════════════════════ Two-Column Sidebar (navy + amber) ═══════════════════════ */

function sidebarTemplate(cv, photo) {
  const skills = (cv.skills || []).filter((s) => s && String(s).trim());
  const langs = (cv.languages || []).filter((l) => langText(l).length > 0);
  const certs = (cv.certifications || []).filter((c) => certText(c).length > 0);
  const photoHtml = photo ? `<img src="${photo}" class="photo" alt="Profile" />` : '';

  const experienceHtml = !cv.experience || cv.experience.length === 0 ? '' : `
    <div class="section">
      <h2>Experience</h2>
      ${cv.experience.map((role) => `
        <div class="role">
          <div class="role-row">
            <span class="role-title"><strong>${escapeHtml(role.title)}</strong></span>
            ${role.duration ? `<span class="role-date">${escapeHtml(role.duration)}</span>` : ''}
          </div>
          ${role.company ? `<div class="role-meta"><em>${escapeHtml(role.company)}</em></div>` : ''}
          ${role.bullets && role.bullets.length > 0 ? `
            <ul>${role.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>
          ` : ''}
        </div>
      `).join('')}
    </div>
  `;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
${baseStyles()}
body { font-family: 'Inter', 'Segoe UI', Arial, sans-serif; font-size: 10.5pt; line-height: 1.5; color: #1f2937; }
.layout { display: flex; gap: 16pt; align-items: stretch; }
.side { width: 32%; background: #0f1f3d; color: #f8fafc; padding: 14pt 12pt; }
.side .photo { width: 100%; max-width: 90pt; aspect-ratio: 1/1; object-fit: cover; border-radius: 50%; border: 2pt solid #d97706; display: block; margin: 0 auto 10pt; }
.side .name { font-size: 18pt; font-weight: 700; color: #fff; line-height: 1.15; }
.side .accent { width: 28pt; height: 2.5pt; background: #d97706; margin: 6pt 0 12pt; }
.side h3 { font-size: 9pt; font-weight: 700; color: #d97706; text-transform: uppercase; letter-spacing: 2.5px; margin-bottom: 5pt; margin-top: 12pt; }
.side ul { list-style: none; padding-left: 0; margin-top: 4pt; }
.side li { font-size: 9.5pt; color: #e5e7eb; margin-bottom: 3pt; line-height: 1.45; word-break: break-all; }
.side li.skill::before { content: '▸ '; color: #d97706; }
.side .cert-name { font-weight: 600; color: #fff; }
.side .cert-meta { font-size: 9pt; color: rgba(255,255,255,0.7); }
.main { flex: 1; padding-top: 4pt; }
.main h2 { font-size: 10.5pt; font-weight: 700; color: #0f1f3d; text-transform: uppercase; letter-spacing: 2.5px; border-bottom: 2pt solid #0f1f3d; padding-bottom: 2pt; margin-bottom: 8pt; }
.main .section { margin-bottom: 14pt; }
.main .role { margin-bottom: 10pt; }
.main .role-row { display: flex; justify-content: space-between; align-items: baseline; gap: 10pt; }
.main .role-title { font-size: 11pt; color: #0f1f3d; }
.main .role-date { font-size: 9.5pt; color: #d97706; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; white-space: nowrap; }
.main .role-meta { font-size: 10pt; color: #6b7280; font-style: italic; margin-bottom: 3pt; }
.main p { font-size: 10.5pt; }
.main li { font-size: 10.5pt; }
</style></head><body>
  <div class="layout">
    <aside class="side">
      ${photoHtml}
      <div class="name">${escapeHtml(cv.full_name)}</div>
      <div class="accent"></div>
      <h3>Contact</h3>
      <ul>
        ${[cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean).map((c) => `<li>${escapeHtml(c)}</li>`).join('')}
      </ul>
      ${skills.length > 0 ? `<h3>Skills</h3><ul>${skills.map((s) => `<li class="skill">${escapeHtml(s)}</li>`).join('')}</ul>` : ''}
      ${langs.length > 0 ? `<h3>Languages</h3><ul>${langs.map((l) => `<li>${escapeHtml(langText(l))}</li>`).join('')}</ul>` : ''}
      ${certs.length > 0 ? `<h3>Certifications</h3><ul>${certs.map((c) => `<li><span class="cert-name">${escapeHtml(certText(c))}</span></li>`).join('')}</ul>` : ''}
    </aside>
    <div class="main">
      ${cv.summary ? `<div class="section"><h2>Profile</h2><p>${escapeHtml(cv.summary)}</p></div>` : ''}
      ${experienceHtml}
      ${renderEducation(cv)}
    </div>
  </div>
</body></html>`;
}

/* ═══════════════════════ Creative Bold (violet→pink gradient hero) ═══════════════════════ */

function creativeTemplate(cv, photo) {
  const contactLine = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean).join('  ·  ');
  const skills = (cv.skills || []).filter((s) => s && String(s).trim());
  const photoHtml = photo ? `<img src="${photo}" class="photo" alt="Profile" />` : '';

  const experienceHtml = !cv.experience || cv.experience.length === 0 ? '' : `
    <div class="section">
      ${sectionHeader('Experience')}
      ${cv.experience.map((role) => `
        <div class="role">
          <div class="role-row">
            <span class="role-title"><strong>${escapeHtml(role.title)}</strong></span>
            ${role.duration ? `<span class="role-pill">${escapeHtml(role.duration)}</span>` : ''}
          </div>
          ${role.company ? `<div class="role-meta"><em>${escapeHtml(role.company)}</em></div>` : ''}
          ${role.bullets && role.bullets.length > 0 ? `
            <ul>${role.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>
          ` : ''}
        </div>
      `).join('')}
    </div>
  `;

  const skillsHtml = skills.length === 0 ? '' : `
    <div class="section">
      ${sectionHeader('Skills')}
      <div class="chips">
        ${skills.map((s) => `<span class="chip">${escapeHtml(s)}</span>`).join('')}
      </div>
    </div>
  `;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
${baseStyles()}
body { font-family: 'Inter', 'Segoe UI', Arial, sans-serif; font-size: 10.5pt; line-height: 1.5; color: #1f2937; margin: 0; }
.hero { background: linear-gradient(135deg,#7c3aed 0%,#ec4899 100%); color: #fff; padding: 22pt 26pt; display: flex; align-items: center; gap: 16pt; margin: -0.6in -0.7in 18pt; }
.photo { width: 70pt; height: 70pt; object-fit: cover; border-radius: 50%; border: 2pt solid rgba(255,255,255,0.85); flex-shrink: 0; }
.hero .name { font-size: 26pt; font-weight: 800; letter-spacing: -0.5px; line-height: 1.05; color: #fff; }
.hero .contact { font-size: 10pt; color: rgba(255,255,255,0.92); margin-top: 6pt; }
.section { margin-bottom: 14pt; }
.h2-row { display: flex; align-items: center; gap: 8pt; margin-bottom: 8pt; }
.h2-bar { display: inline-block; width: 18pt; height: 2.5pt; border-radius: 1pt; background: linear-gradient(90deg,#7c3aed,#ec4899); }
.h2 { font-size: 10pt; font-weight: 800; text-transform: uppercase; letter-spacing: 2.5px; color: #1f2937; }
.role { margin-bottom: 10pt; padding-left: 10pt; border-left: 2.5pt solid #7c3aed; }
.role-row { display: flex; justify-content: space-between; align-items: baseline; gap: 10pt; }
.role-title { font-size: 11pt; color: #0a0a0a; }
.role-pill { font-size: 9pt; font-weight: 700; color: #7c3aed; background: rgba(124,58,237,0.10); padding: 2pt 8pt; border-radius: 10pt; white-space: nowrap; }
.role-meta { font-size: 10pt; color: #6b7280; font-style: italic; margin-bottom: 3pt; }
.chips { display: flex; flex-wrap: wrap; gap: 4pt; }
.chip { display: inline-block; font-size: 9.5pt; font-weight: 600; color: #581c87; padding: 3pt 9pt; border-radius: 10pt; background: rgba(124,58,237,0.08); border: 0.5pt solid rgba(124,58,237,0.20); }
p { font-size: 10.5pt; }
li { font-size: 10.5pt; }
</style></head><body>
  <div class="hero">
    ${photoHtml}
    <div>
      <div class="name">${escapeHtml(cv.full_name)}</div>
      ${contactLine ? `<div class="contact">${escapeHtml(contactLine)}</div>` : ''}
    </div>
  </div>
  ${cv.summary ? `<div class="section">${sectionHeader('About')}<p>${escapeHtml(cv.summary)}</p></div>` : ''}
  ${experienceHtml}
  ${skillsHtml}
  ${renderEducation(cv)}
  ${renderLanguages(cv)}
  ${renderCertifications(cv)}
</body></html>`;
}

function sectionHeader(title) {
  return `<div class="h2-row"><span class="h2-bar"></span><span class="h2">${escapeHtml(title)}</span></div>`;
}

/* ═══════════════════════ Dark Tech (charcoal sidebar + cyan) ═══════════════════════ */

function darkTechTemplate(cv, photo) {
  const skills = (cv.skills || []).filter((s) => s && String(s).trim());
  const langs = (cv.languages || []).filter((l) => langText(l).length > 0);
  const certs = (cv.certifications || []).filter((c) => certText(c).length > 0);
  const photoHtml = photo ? `<img src="${photo}" class="photo" alt="Profile" />` : '';

  const experienceHtml = !cv.experience || cv.experience.length === 0 ? '' : `
    <div class="section">
      <h2><span class="hash">#</span> experience.log</h2>
      ${cv.experience.map((role) => `
        <div class="role">
          <div class="role-row">
            <span class="role-title"><strong>${escapeHtml(role.title)}</strong></span>
            ${role.duration ? `<span class="role-tag">${escapeHtml(role.duration)}</span>` : ''}
          </div>
          ${role.company ? `<div class="role-meta">${escapeHtml(role.company)}</div>` : ''}
          ${role.bullets && role.bullets.length > 0 ? `
            <ul>${role.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>
          ` : ''}
        </div>
      `).join('')}
    </div>
  `;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
${baseStyles()}
body { font-family: 'Inter', 'Segoe UI', Arial, sans-serif; font-size: 10.5pt; line-height: 1.5; color: #1f2937; }
.layout { display: flex; gap: 16pt; }
.side { width: 32%; background: #0b1220; color: #e5e7eb; padding: 14pt 12pt; }
.side .photo { width: 100%; max-width: 88pt; aspect-ratio: 1/1; object-fit: cover; border-radius: 6pt; border: 0.5pt solid rgba(34,211,238,0.35); display: block; margin: 0 auto 10pt; }
.side .who { font-family: 'Courier New', monospace; font-size: 9pt; color: #22d3ee; margin-bottom: 4pt; }
.side .name { font-size: 17pt; font-weight: 700; color: #fff; line-height: 1.15; }
.side .accent { height: 2pt; width: 22pt; background: #22d3ee; margin: 6pt 0 14pt; }
.side h3 { font-size: 9pt; color: #22d3ee; font-family: 'Courier New', monospace; letter-spacing: 0.5px; margin-top: 12pt; margin-bottom: 5pt; }
.side ul { list-style: none; padding-left: 0; margin-top: 0; }
.side li { font-size: 9.5pt; color: #e5e7eb; margin-bottom: 3pt; word-break: break-all; }
.side .stack { display: flex; flex-wrap: wrap; gap: 3pt; }
.side .stack .tag { font-family: 'Courier New', monospace; font-size: 8.5pt; color: #a5f3fc; padding: 2pt 6pt; border-radius: 3pt; background: rgba(34,211,238,0.10); border: 0.4pt solid rgba(34,211,238,0.30); }
.main { flex: 1; padding-top: 4pt; }
.main h2 { font-family: 'Courier New', monospace; font-size: 10.5pt; font-weight: 700; color: #0b1220; letter-spacing: 0.5px; margin-bottom: 8pt; }
.main .hash { color: #22d3ee; }
.section { margin-bottom: 14pt; }
.role { margin-bottom: 10pt; padding: 8pt 10pt; background: #fafafa; border: 0.5pt solid #e5e7eb; border-radius: 4pt; }
.role-row { display: flex; justify-content: space-between; align-items: baseline; gap: 10pt; }
.role-title { font-size: 11pt; color: #0b1220; }
.role-tag { font-family: 'Courier New', monospace; font-size: 9pt; color: #0e7490; background: rgba(34,211,238,0.10); padding: 2pt 6pt; border-radius: 3pt; white-space: nowrap; }
.role-meta { font-size: 10pt; color: #6b7280; margin-bottom: 3pt; }
p { font-size: 10.5pt; }
li { font-size: 10.5pt; }
</style></head><body>
  <div class="layout">
    <aside class="side">
      ${photoHtml}
      <div class="who">$ whoami</div>
      <div class="name">${escapeHtml(cv.full_name)}</div>
      <div class="accent"></div>
      <h3>// contact</h3>
      <ul>${[cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean).map((c) => `<li>${escapeHtml(c)}</li>`).join('')}</ul>
      ${skills.length > 0 ? `<h3>// stack</h3><div class="stack">${skills.map((s) => `<span class="tag">${escapeHtml(s)}</span>`).join('')}</div>` : ''}
      ${langs.length > 0 ? `<h3>// langs</h3><ul>${langs.map((l) => `<li>${escapeHtml(langText(l))}</li>`).join('')}</ul>` : ''}
      ${certs.length > 0 ? `<h3>// certs</h3><ul>${certs.map((c) => `<li>${escapeHtml(certText(c))}</li>`).join('')}</ul>` : ''}
    </aside>
    <div class="main">
      ${cv.summary ? `<div class="section"><h2><span class="hash">#</span> README.md</h2><p>${escapeHtml(cv.summary)}</p></div>` : ''}
      ${experienceHtml}
      ${renderEducation(cv)}
    </div>
  </div>
</body></html>`;
}

/* ═══════════════════════ Sales Performance (KPI pills auto-detect) ═══════════════════════ */

function salesTemplate(cv) {
  const contactLine = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean).join('  •  ');
  const skills = (cv.skills || []).filter((s) => s && String(s).trim());

  // Pull the first KPI-style number (%, $, K/M/B, or 2+ digits) out of a bullet
  // and render it as a green pill on the left so achievements jump off the page.
  const kpiBulletHtml = (bullet) => {
    const trimmed = String(bullet || '').trim();
    if (!trimmed) return '';
    const m = trimmed.match(/([+\-]?\$?\d[\d,.]*[KMBkmb]?%?)/);
    if (!m) return `<li>${escapeHtml(trimmed)}</li>`;
    const raw = m[0];
    const looksLikeMetric = /[\$%]/.test(raw) || /\d{2,}/.test(raw) || /[KMBkmb]/.test(raw);
    if (!looksLikeMetric) return `<li>${escapeHtml(trimmed)}</li>`;
    const before = trimmed.slice(0, m.index);
    const after = trimmed.slice(m.index + raw.length).replace(/^[\s\-—:.,]*/, '');
    const rest = (before + after).replace(/\s+/g, ' ').trim();
    return `<li class="kpi-li"><span class="kpi">${escapeHtml(raw)}</span><span>${escapeHtml(rest)}</span></li>`;
  };

  const experienceHtml = !cv.experience || cv.experience.length === 0 ? '' : `
    <div class="section">
      <h2>Track Record</h2>
      ${cv.experience.map((role) => `
        <div class="role">
          <div class="role-row">
            <div>
              <div class="role-title"><strong>${escapeHtml(role.title)}</strong></div>
              ${role.company ? `<div class="role-meta">${escapeHtml(role.company)}</div>` : ''}
            </div>
            ${role.duration ? `<span class="role-date">${escapeHtml(role.duration)}</span>` : ''}
          </div>
          ${role.bullets && role.bullets.length > 0 ? `
            <ul class="kpi-list">${role.bullets.map(kpiBulletHtml).join('')}</ul>
          ` : ''}
        </div>
      `).join('')}
    </div>
  `;

  const skillsHtml = skills.length === 0 ? '' : `
    <div class="section">
      <h2>Core Competencies</h2>
      <div class="comp-list">
        ${skills.map((s) => `<span class="comp-pill">${escapeHtml(s)}</span>`).join('')}
      </div>
    </div>
  `;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
${baseStyles()}
body { font-family: 'Inter', 'Segoe UI', Arial, sans-serif; font-size: 10.5pt; line-height: 1.55; color: #1f2937; border-top: 4pt solid #065f46; padding-top: 8pt; }
.head-row { display: flex; justify-content: space-between; align-items: baseline; gap: 12pt; flex-wrap: wrap; }
.name { font-size: 24pt; font-weight: 800; color: #0a0a0a; letter-spacing: -0.3px; line-height: 1.1; }
.qpill { font-size: 8.5pt; font-weight: 800; color: #065f46; background: rgba(16,185,129,0.10); border: 0.5pt solid rgba(16,185,129,0.30); padding: 3pt 9pt; border-radius: 12pt; letter-spacing: 0.5px; }
.contact { font-size: 10pt; color: #4b5563; margin-top: 4pt; }
.section { margin-top: 14pt; }
h2 { font-size: 10pt; font-weight: 800; text-transform: uppercase; letter-spacing: 2.5px; color: #065f46; border-bottom: 1.5pt solid #10b981; padding-bottom: 2pt; padding-right: 12pt; display: inline-block; margin-bottom: 8pt; }
.role { margin-bottom: 10pt; }
.role-row { display: flex; justify-content: space-between; align-items: baseline; gap: 10pt; }
.role-title { font-size: 11pt; color: #0a0a0a; }
.role-meta { font-size: 10pt; color: #6b7280; margin-bottom: 3pt; }
.role-date { font-size: 9.5pt; font-weight: 700; color: #065f46; text-transform: uppercase; letter-spacing: 1px; white-space: nowrap; }
ul.kpi-list { list-style: none; padding-left: 0; margin-top: 4pt; }
li.kpi-li { display: flex; gap: 7pt; align-items: flex-start; font-size: 10.5pt; margin-bottom: 4pt; }
li.kpi-li .kpi { background: #10b981; color: #fff; font-weight: 800; padding: 2pt 7pt; border-radius: 3pt; font-size: 9.5pt; min-width: 36pt; text-align: center; flex-shrink: 0; }
ul.kpi-list li:not(.kpi-li) { padding-left: 12pt; position: relative; font-size: 10.5pt; margin-bottom: 4pt; }
ul.kpi-list li:not(.kpi-li)::before { content: ''; position: absolute; left: 2pt; top: 6pt; width: 4pt; height: 4pt; background: #065f46; border-radius: 50%; }
.comp-list { display: flex; flex-wrap: wrap; gap: 4pt; }
.comp-pill { font-size: 9.5pt; font-weight: 600; color: #065f46; background: #f0fdf4; border: 0.5pt solid rgba(16,185,129,0.25); padding: 3pt 9pt; border-radius: 3pt; }
p { font-size: 10.5pt; }
</style></head><body>
  <div class="head-row">
    <div class="name">${escapeHtml(cv.full_name)}</div>
    <span class="qpill">QUOTA · ACHIEVEMENT · GROWTH</span>
  </div>
  ${contactLine ? `<div class="contact">${escapeHtml(contactLine)}</div>` : ''}
  ${cv.summary ? `<div class="section"><h2>Performance Summary</h2><p>${escapeHtml(cv.summary)}</p></div>` : ''}
  ${experienceHtml}
  ${skillsHtml}
  ${renderEducation(cv)}
  ${renderLanguages(cv)}
  ${renderCertifications(cv)}
</body></html>`;
}

/* ═══════════════════════ Career Changer (skills hero) ═══════════════════════ */

function functionalTemplate(cv) {
  const contactLine = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean).join('  ·  ');
  const skills = (cv.skills || []).filter((s) => s && String(s).trim());
  const certs = (cv.certifications || []).filter((c) => certText(c).length > 0);

  const skillsHtml = skills.length === 0 ? '' : `
    <div class="section">
      <h2>Core Strengths <span class="sub">— Transferable skills built across roles</span></h2>
      <div class="grid">
        ${skills.map((s, i) => `
          <div class="strength ${i % 2 === 0 ? 'plum' : 'teal'}">
            <span class="dot"></span>${escapeHtml(s)}
          </div>
        `).join('')}
      </div>
    </div>
  `;

  const experienceHtml = !cv.experience || cv.experience.length === 0 ? '' : `
    <div class="section">
      <h2>Experience <span class="sub">— Most relevant roles</span></h2>
      ${cv.experience.map((role) => `
        <div class="role">
          <div class="role-row">
            <span class="role-title"><strong>${escapeHtml(role.title)}</strong></span>
            ${role.duration ? `<span class="role-date">${escapeHtml(role.duration)}</span>` : ''}
          </div>
          ${role.company ? `<div class="role-meta"><em>${escapeHtml(role.company)}</em></div>` : ''}
          ${role.bullets && role.bullets.length > 0 ? `
            <ul>${role.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>
          ` : ''}
        </div>
      `).join('')}
    </div>
  `;

  const certsHtml = certs.length === 0 ? '' : `
    <div class="section">
      <h2>Certifications &amp; Training</h2>
      <div class="grid">
        ${certs.map((c) => `
          <div class="cert-card">
            <div class="cert-name">${escapeHtml(certText(c))}</div>
            ${certExtrasHtml(c)}
          </div>
        `).join('')}
      </div>
    </div>
  `;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
${baseStyles()}
body { font-family: 'Inter', 'Segoe UI', Arial, sans-serif; font-size: 10.5pt; line-height: 1.55; color: #1f2937; }
.hero { background: #faf5ff; padding: 18pt 20pt; text-align: center; margin: -0.6in -0.7in 16pt; }
.hero .name { font-size: 24pt; font-weight: 800; color: #5b21b6; letter-spacing: -0.3px; }
.hero .contact { font-size: 10pt; color: #6b7280; margin-top: 4pt; }
.hero .summary { font-size: 10.5pt; color: #374151; max-width: 480pt; margin: 8pt auto 0; line-height: 1.65; }
.section { margin-bottom: 14pt; }
h2 { font-size: 11pt; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #5b21b6; margin-bottom: 8pt; }
h2 .sub { font-size: 9.5pt; font-weight: 400; text-transform: none; letter-spacing: normal; color: #9ca3af; margin-left: 6pt; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5pt; }
.strength { display: flex; align-items: center; gap: 6pt; padding: 5pt 9pt; border-radius: 5pt; font-size: 10pt; font-weight: 600; }
.strength .dot { width: 5pt; height: 5pt; border-radius: 50%; flex-shrink: 0; }
.strength.plum { background: rgba(91,33,182,0.06); border: 0.5pt solid rgba(91,33,182,0.18); }
.strength.plum .dot { background: #5b21b6; }
.strength.teal { background: rgba(13,148,136,0.06); border: 0.5pt solid rgba(13,148,136,0.20); }
.strength.teal .dot { background: #0d9488; }
.role { margin-bottom: 9pt; }
.role-row { display: flex; justify-content: space-between; align-items: baseline; gap: 10pt; }
.role-title { font-size: 11pt; color: #5b21b6; }
.role-date { font-size: 9.5pt; font-weight: 700; color: #0d9488; text-transform: uppercase; letter-spacing: 1px; white-space: nowrap; }
.role-meta { font-size: 10pt; color: #6b7280; font-style: italic; margin-bottom: 3pt; }
.cert-card { background: #fafafa; border: 0.5pt solid #e5e7eb; border-radius: 5pt; padding: 6pt 9pt; }
.cert-name { font-size: 10pt; font-weight: 600; color: #111; }
ul li::marker { content: '✓  '; color: #0d9488; }
p { font-size: 10.5pt; }
li { font-size: 10.5pt; }
</style></head><body>
  <div class="hero">
    <div class="name">${escapeHtml(cv.full_name)}</div>
    ${contactLine ? `<div class="contact">${escapeHtml(contactLine)}</div>` : ''}
    ${cv.summary ? `<div class="summary">${escapeHtml(cv.summary)}</div>` : ''}
  </div>
  ${skillsHtml}
  ${experienceHtml}
  ${renderEducation(cv)}
  ${renderLanguages(cv)}
  ${certsHtml}
</body></html>`;
}

/* ═══════════════════════ Elegant Serif (premium serif + gold) ═══════════════════════ */

function serifTemplate(cv, photo) {
  const contactLine = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean).join('   ·   ');
  const skills = (cv.skills || []).filter((s) => s && String(s).trim());
  const langs = (cv.languages || []).filter((l) => langText(l).length > 0);
  const certs = (cv.certifications || []).filter((c) => certText(c).length > 0);
  const photoHtml = photo ? `<img src="${photo}" class="photo" alt="Profile" />` : '';

  const experienceHtml = !cv.experience || cv.experience.length === 0 ? '' : `
    <div class="section">
      <h2>Experience</h2>
      ${cv.experience.map((role) => `
        <div class="role">
          <div class="role-row">
            <span class="role-title"><strong>${escapeHtml(role.title)}</strong></span>
            ${role.duration ? `<span class="role-date"><em>${escapeHtml(role.duration)}</em></span>` : ''}
          </div>
          ${role.company ? `<div class="role-meta"><em>${escapeHtml(role.company)}</em></div>` : ''}
          ${role.bullets && role.bullets.length > 0 ? `
            <ul>${role.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>
          ` : ''}
        </div>
      `).join('')}
    </div>
  `;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
${baseStyles()}
body { font-family: 'Source Serif Pro', Georgia, 'Times New Roman', serif; font-size: 11pt; line-height: 1.65; color: #111827; }
.head { text-align: center; }
.photo { width: 70pt; height: 70pt; object-fit: cover; border-radius: 50%; border: 1.5pt solid #b45309; padding: 2pt; display: block; margin: 0 auto 8pt; }
.name { font-family: 'Playfair Display', Georgia, serif; font-size: 26pt; font-weight: 700; letter-spacing: -0.3px; color: #111827; line-height: 1.05; }
.gold-rule { display: flex; align-items: center; justify-content: center; gap: 6pt; margin: 10pt 0 6pt; }
.gold-rule .line { height: 0.6pt; width: 50pt; background: #b45309; }
.gold-rule .diamond { width: 4pt; height: 4pt; background: #b45309; transform: rotate(45deg); }
.contact { font-size: 10pt; color: #374151; font-style: italic; }
.body { margin-top: 18pt; }
.section { margin-bottom: 16pt; }
h2 { font-family: 'Playfair Display', Georgia, serif; text-align: center; font-size: 11.5pt; font-weight: 600; text-transform: uppercase; letter-spacing: 5px; color: #111827; padding-bottom: 3pt; border-bottom: 0.5pt solid #b45309; margin-bottom: 10pt; }
.role { margin-bottom: 10pt; }
.role-row { display: flex; justify-content: space-between; align-items: baseline; gap: 10pt; }
.role-title { font-family: 'Playfair Display', Georgia, serif; font-size: 11.5pt; }
.role-date { font-size: 9.5pt; color: #b45309; font-style: italic; white-space: nowrap; }
.role-meta { font-size: 10.5pt; color: #4b5563; margin-bottom: 3pt; }
ul { padding-left: 18pt; margin-top: 3pt; }
li { font-size: 11pt; }
li::marker { content: '— '; color: #4b5563; }
.skills-list { text-align: center; font-size: 10.5pt; font-style: italic; line-height: 1.85; }
.langs-list { text-align: center; font-size: 10.5pt; font-style: italic; }
p { font-size: 11pt; }
.justify p { text-align: justify; }
</style></head><body>
  <div class="head">
    ${photoHtml}
    <div class="name">${escapeHtml(cv.full_name)}</div>
    <div class="gold-rule"><span class="line"></span><span class="diamond"></span><span class="line"></span></div>
    ${contactLine ? `<div class="contact">${escapeHtml(contactLine)}</div>` : ''}
  </div>
  <div class="body">
    ${cv.summary ? `<div class="section justify"><h2>Profile</h2><p>${escapeHtml(cv.summary)}</p></div>` : ''}
    ${experienceHtml}
    ${skills.length > 0 ? `<div class="section"><h2>Areas of Expertise</h2><div class="skills-list">${escapeHtml(skills.join('   ·   '))}</div></div>` : ''}
    ${renderEducation(cv)}
    ${langs.length > 0 ? `<div class="section"><h2>Languages</h2><div class="langs-list">${escapeHtml(langs.map(langText).join('   ·   '))}</div></div>` : ''}
    ${certs.length > 0 ? `<div class="section"><h2>Certifications</h2>${certs.map((c) => `<div class="entry"><p style="font-family:'Playfair Display',serif;font-weight:600;">${escapeHtml(certText(c))}</p>${certExtrasHtml(c)}</div>`).join('')}</div>` : ''}
  </div>
</body></html>`;
}

/* ═══════════════════════ Generic theme-driven template ═══════════════════════
 * Shared renderer for all BULK_THEMES tiles (zen, arctic, mocha, etc.).
 * Mirrors frontend/components/cv/templates/GenericRenderer.tsx — three header
 * styles (band / centered / left), four section styles (rule / block / tab /
 * plain), three skill styles (pills / inline / plain).
 *
 * If you tweak this, also update GenericRenderer.tsx so preview === PDF.
 * ════════════════════════════════════════════════════════════════════════════ */

function genericTemplate(cv, photo, themeIn) {
  const t = {
    primary: themeIn.primary,
    accent: themeIn.accent,
    fontFamily: themeIn.fontFamily,
    bg: themeIn.bg || '#ffffff',
    text: themeIn.text || '#1f2937',
    sectionStyle: themeIn.sectionStyle || 'rule',
    headerStyle: themeIn.headerStyle || 'left',
    skillStyle: themeIn.skillStyle || 'inline',
    baseSize: themeIn.baseSize || 13.5,
    photoSide: themeIn.photoSide || (photo ? 'left' : 'none'),
    tagline: themeIn.tagline || '',
  };

  const contact = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean);
  const skills = (cv.skills || []).filter((s) => s && String(s).trim());
  const edu = (cv.education || []).filter((e) =>
    [e && e.degree, e && e.institution, e && e.year, e && e.url].filter(Boolean).join(' ').trim().length > 0
  );
  const langs = (cv.languages || []).filter((l) => langText(l).length > 0);
  const certs = (cv.certifications || []).filter((c) => certText(c).length > 0);

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
${baseStyles()}
body { font-family: ${t.fontFamily}; font-size: ${t.baseSize}px; line-height: 1.5; background: ${t.bg}; color: ${t.text}; word-break: break-word; overflow-wrap: anywhere; }
.page-body { padding: 28px 40px; }
.section { margin-bottom: 20px; }
.section:last-child { margin-bottom: 0; }
.section h2 { ${sectionHeaderCss(t)} }
.entry-meta { font-size: ${t.baseSize - 2.5}px; color: #6b7280; }
.entry-link a { color: ${t.primary}; }
${headerCss(t)}
${skillsCss(t)}
.exp { margin-bottom: 14px; }
.exp-row { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
.exp-title { font-weight: bold; font-size: ${t.baseSize + 0.5}px; color: ${t.primary}; }
.exp-dur { font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.12em; color: ${t.accent}; }
.exp-company { font-style: italic; color: #4b5563; font-size: ${t.baseSize - 1}px; margin-top: 2px; }
.exp ul { margin-top: 5px; margin-left: 16px; padding-left: 0; list-style: disc; }
.exp li { font-size: ${t.baseSize - 0.5}px; color: ${t.text}; margin-bottom: 2px; }
.edu-row { font-size: ${t.baseSize}px; color: ${t.text}; margin-bottom: 4px; }
.lang-row { font-size: ${t.baseSize}px; color: ${t.text}; }
.cert-row { font-weight: 600; font-size: ${t.baseSize - 0.5}px; color: ${t.text}; margin-bottom: 4px; }
</style></head><body>
  ${renderGenericHeader(cv, contact, photo, t)}
  <div class="page-body">
    ${cv.summary ? `<div class="section"><h2>Profile</h2><p style="font-size:${t.baseSize}px;color:${t.text};">${escapeHtml(cv.summary)}</p></div>` : ''}
    ${cv.experience && cv.experience.length > 0 ? `
      <div class="section">
        <h2>Experience</h2>
        ${cv.experience.map((r) => `
          <div class="exp">
            <div class="exp-row">
              <div class="exp-title">${escapeHtml(r.title || '')}</div>
              ${r.duration ? `<div class="exp-dur">${escapeHtml(r.duration)}</div>` : ''}
            </div>
            ${r.company ? `<div class="exp-company">${escapeHtml(r.company)}</div>` : ''}
            ${r.bullets && r.bullets.length > 0 ? `<ul>${r.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>` : ''}
          </div>
        `).join('')}
      </div>` : ''}
    ${skills.length > 0 ? `<div class="section"><h2>Skills</h2>${renderGenericSkills(skills, t)}</div>` : ''}
    ${edu.length > 0 ? `
      <div class="section">
        <h2>Education</h2>
        ${edu.map((e) => {
          const parts = [e.degree, e.institution, e.year].filter(Boolean);
          return `<div class="edu-row"><p>${escapeHtml(parts.join(' — '))}</p>${eduExtrasHtml(e)}</div>`;
        }).join('')}
      </div>` : ''}
    ${langs.length > 0 ? `<div class="section"><h2>Languages</h2><div class="lang-row">${escapeHtml(langs.map(langText).join('  ·  '))}</div></div>` : ''}
    ${certs.length > 0 ? `
      <div class="section">
        <h2>Certifications</h2>
        ${certs.map((c) => `<div class="cert-row"><p>${escapeHtml(certText(c))}</p>${certExtrasHtml(c)}</div>`).join('')}
      </div>` : ''}
  </div>
</body></html>`;
}

function sectionHeaderCss(t) {
  // h2 base — variant-specific decoration applied below.
  const base = `font-weight: bold; text-transform: uppercase; font-size: 11.5px; letter-spacing: 0.20em; margin-bottom: 8px; color: ${t.primary};`;
  if (t.sectionStyle === 'block') {
    return `${base} display: inline-block; padding: 2px 8px; border-radius: 3px; background: ${t.primary}; color: #fff; letter-spacing: 0.18em;`;
  }
  if (t.sectionStyle === 'tab') {
    return `${base} padding-left: 8px; border-left: 3px solid ${t.accent};`;
  }
  if (t.sectionStyle === 'plain') {
    return `${base} letter-spacing: 0.22em;`;
  }
  return `${base} padding-bottom: 4px; border-bottom: 1.5px solid ${t.primary}; letter-spacing: 0.18em;`;
}

function headerCss(t) {
  if (t.headerStyle === 'band') {
    return `
.cv-header { padding: 28px 40px; background: ${t.primary}; color: #fff; display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
.cv-header .name { font-size: 28px; font-weight: bold; color: #fff; letter-spacing: -0.01em; line-height: 1.1; }
.cv-header .tagline { font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.22em; color: ${t.accent}; margin-top: 4px; }
.cv-header .contact { font-size: 12px; color: rgba(255,255,255,0.85); margin-top: 8px; word-break: break-all; }
.cv-header .head-body { flex: 1; min-width: 0; }
`;
  }
  if (t.headerStyle === 'centered') {
    return `
.cv-header { padding: 36px 40px 16px; text-align: center; border-bottom: 2px solid ${t.primary}; }
.cv-header .name { font-size: 28px; font-weight: bold; color: ${t.primary}; letter-spacing: 0.04em; line-height: 1.1; }
.cv-header .tagline { font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.30em; color: ${t.accent}; margin-top: 4px; }
.cv-header .contact { font-size: 12px; color: #6b7280; margin-top: 8px; word-break: break-all; }
.cv-photo { margin: 0 auto 12px; }
`;
  }
  return `
.cv-header { padding: 32px 40px 12px; display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
.cv-header .head-body { flex: 1; min-width: 0; }
.cv-header .name { font-size: 28px; font-weight: bold; color: ${t.primary}; letter-spacing: -0.01em; line-height: 1.1; margin-top: 2px; }
.cv-header .tagline { font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.22em; color: ${t.accent}; }
.cv-header .accent-bar { width: 50px; height: 3px; background: ${t.accent}; margin: 8px 0 6px; }
.cv-header .contact { font-size: 12px; color: #6b7280; word-break: break-all; }
`;
}

function skillsCss(t) {
  if (t.skillStyle === 'pills') {
    // Pills get a faint accent tint — replicate Tailwind's `${accent}1f`
    // (≈12% alpha) by appending '1f' to a 6-char hex. Solid color is fine too;
    // most accents are pastel enough that this just reads as a soft chip.
    return `.skill-pills { display: flex; flex-wrap: wrap; gap: 6px; }
.skill-pill { display: inline-block; font-size: 12px; padding: 2px 10px; border-radius: 9999px; background: ${t.accent}33; color: ${t.primary}; }`;
  }
  return `.skill-list { font-size: ${t.baseSize}px; color: ${t.text}; }`;
}

function photoHtml(photo, t, sideOverride) {
  if (!photo) return '';
  const side = sideOverride || t.photoSide;
  if (side === 'none') return '';
  return `<div class="cv-photo" style="width:88px;height:88px;border-radius:50%;border:2px solid ${t.accent};overflow:hidden;flex-shrink:0;"><img src="${photo}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;" /></div>`;
}

function renderGenericHeader(cv, contact, photo, t) {
  const name = escapeHtml(cv.full_name || 'Your Name');
  const tagline = t.tagline ? `<div class="tagline">${escapeHtml(t.tagline)}</div>` : '';
  const contactHtml = contact.length > 0 ? `<div class="contact">${escapeHtml(contact.join('  ·  '))}</div>` : '';
  const showLeftPhoto = t.photoSide === 'left' ? photoHtml(photo, t) : '';
  const showRightPhoto = t.photoSide === 'right' ? photoHtml(photo, t) : '';

  if (t.headerStyle === 'band') {
    return `<div class="cv-header">
      ${showLeftPhoto}
      <div class="head-body">
        <div class="name">${name}</div>
        ${tagline}
        ${contactHtml}
      </div>
      ${showRightPhoto}
    </div>`;
  }
  if (t.headerStyle === 'centered') {
    return `<div class="cv-header">
      ${photo && t.photoSide !== 'none' ? photoHtml(photo, t, 'centered') : ''}
      <div class="name">${name}</div>
      ${tagline}
      ${contactHtml}
    </div>`;
  }
  // left
  return `<div class="cv-header">
    ${showLeftPhoto}
    <div class="head-body">
      ${tagline}
      <div class="name">${name}</div>
      <div class="accent-bar"></div>
      ${contactHtml}
    </div>
    ${showRightPhoto}
  </div>`;
}

function renderGenericSkills(skills, t) {
  if (t.skillStyle === 'pills') {
    return `<div class="skill-pills">${skills.map((s) => `<span class="skill-pill">${escapeHtml(s)}</span>`).join('')}</div>`;
  }
  const sep = t.skillStyle === 'plain' ? '  ·  ' : ', ';
  return `<div class="skill-list">${escapeHtml(skills.join(sep))}</div>`;
}

/* ═══════════════════════ 17 dedicated unique-layout templates ═══════════════════════
 * Pixel-perfect ports of the React files in frontend/components/cv/templates/
 * that DON'T use GenericRenderer. Each function returns a self-contained HTML
 * document. Keep each in sync with its <Name>.tsx counterpart — sharing the
 * same colors, spacing, section header treatment, and signature elements
 * (drop caps, skill bars, sidebars, 3-column grid, etc.).
 * ═══════════════════════════════════════════════════════════════════════════════ */

// Render an experience block matching the common "title + duration right-aligned,
// company italic below, bullet list" pattern most of the 17 templates use.
function uniqExp(cv, opts) {
  if (!cv.experience || cv.experience.length === 0) return '';
  const o = {
    titleColor: '#0f172a',
    durColor: '#6b7280',
    durBold: true,
    durUpper: true,
    durSize: 11,
    companyItalic: true,
    bulletSize: 13,
    titleSize: 14,
    durBg: null,
    durRadius: null,
    durPad: null,
    durFont: null,
    ...opts,
  };
  return cv.experience.map((r) => {
    const titleHtml = `<span style="font-weight:bold;font-size:${o.titleSize}px;color:${o.titleColor};">${escapeHtml(r.title || '')}</span>`;
    let durHtml = '';
    if (r.duration) {
      let s = `font-size:${o.durSize}px;color:${o.durColor};`;
      if (o.durBold) s += 'font-weight:bold;';
      if (o.durUpper) s += 'text-transform:uppercase;letter-spacing:0.12em;';
      if (o.durBg) s += `background:${o.durBg};`;
      if (o.durRadius != null) s += `border-radius:${o.durRadius}px;`;
      if (o.durPad) s += `padding:${o.durPad};`;
      if (o.durFont) s += `font-family:${o.durFont};`;
      durHtml = `<span style="${s}">${escapeHtml(r.duration)}</span>`;
    }
    const company = r.company ? `<div style="font-size:${o.titleSize - 1.5}px;color:#4b5563;${o.companyItalic ? 'font-style:italic;' : ''}margin-top:1px;">${escapeHtml(r.company)}</div>` : '';
    const bullets = r.bullets && r.bullets.length > 0
      ? `<ul style="margin-top:5px;margin-left:18px;padding:0;list-style:disc;">${r.bullets.map((b) => `<li style="font-size:${o.bulletSize}px;color:#1f2937;margin-bottom:2px;">${escapeHtml(b)}</li>`).join('')}</ul>`
      : '';
    return `<div style="margin-bottom:14px;">
      <div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap;">
        <div>${titleHtml}</div>
        ${durHtml ? `<div>${durHtml}</div>` : ''}
      </div>
      ${company}
      ${bullets}
    </div>`;
  }).join('');
}

// ───────────────────────────────────── mono ─────────────────────────────────────
function monoTemplate(cv) {
  const contact = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean);
  const skills = (cv.skills || []).filter((s) => s && String(s).trim());
  const edu = (cv.education || []).filter((e) => [e.degree, e.institution, e.year, e.url].filter(Boolean).length > 0);
  const langs = (cv.languages || []).filter((l) => langText(l).length > 0);
  const certs = (cv.certifications || []).filter((c) => certText(c).length > 0);
  const sec = (title, body, last) => `<section style="${last ? '' : 'margin-bottom:18px;'}"><h2 style="font-weight:900;text-transform:uppercase;font-size:12px;letter-spacing:0.22em;margin-bottom:8px;padding-bottom:4px;border-bottom:3px solid #0a0a0a;color:#0a0a0a;">${title}</h2>${body}</section>`;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
${baseStyles()}
body { font-family: 'Inter','Helvetica Neue',Arial,sans-serif; font-size: 13.5px; line-height: 1.5; color: #1a1a1a; word-break: break-word; overflow-wrap: anywhere; }
.head { background: #0a0a0a; color: #fff; padding: 24px 40px; }
.head h1 { font-weight: 900; text-transform: uppercase; font-size: 30px; letter-spacing: -0.02em; line-height: 1; }
.head .contact { margin-top: 12px; font-size: 12px; color: rgba(255,255,255,0.75); word-break: break-all; }
.body { padding: 24px 40px; }
</style></head><body>
  <div class="head">
    <h1>${escapeHtml(cv.full_name || 'Your Name')}</h1>
    ${contact.length > 0 ? `<div class="contact">${escapeHtml(contact.join('  /  '))}</div>` : ''}
  </div>
  <div class="body">
    ${cv.summary ? sec('Summary', `<p>${escapeHtml(cv.summary)}</p>`) : ''}
    ${cv.experience && cv.experience.length > 0 ? sec('Experience', uniqExp(cv, { titleColor: '#0a0a0a', durColor: '#0a0a0a', durSize: 11, titleSize: 14 })) : ''}
    ${skills.length > 0 ? sec('Skills', `<p style="font-size:13.5px;">${escapeHtml(skills.join(' / '))}</p>`) : ''}
    ${edu.length > 0 ? sec('Education', edu.map((e) => `<div style="margin-bottom:8px;"><p style="font-weight:bold;font-size:13px;text-transform:uppercase;">${escapeHtml([e.degree, e.institution, e.year].filter(Boolean).join(' — '))}</p>${eduExtrasHtml(e)}</div>`).join('')) : ''}
    ${langs.length > 0 ? sec('Languages', `<p style="font-size:13.5px;">${escapeHtml(langs.map(langText).join(' / '))}</p>`) : ''}
    ${certs.length > 0 ? sec('Certifications', certs.map((c) => `<div style="margin-bottom:8px;"><p style="font-size:13px;font-weight:bold;text-transform:uppercase;">${escapeHtml(certText(c))}</p>${certExtrasHtml(c)}</div>`).join(''), true) : ''}
  </div>
</body></html>`;
}

// ───────────────────────────────────── timeline ─────────────────────────────────
function timelineTemplate(cv) {
  const ACCENT = '#2563eb';
  const contact = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean);
  const skills = (cv.skills || []).filter((s) => s && String(s).trim());
  const edu = (cv.education || []).filter((e) => [e.degree, e.institution, e.year, e.url].filter(Boolean).length > 0);
  const langs = (cv.languages || []).filter((l) => langText(l).length > 0);
  const certs = (cv.certifications || []).filter((c) => certText(c).length > 0);
  const sec = (title, body, last) => `<section style="${last ? '' : 'margin-bottom:20px;'}"><h2 style="font-weight:bold;text-transform:uppercase;font-size:11px;letter-spacing:0.18em;margin-bottom:8px;color:#0f172a;">${title}</h2>${body}</section>`;
  const timeline = cv.experience && cv.experience.length > 0
    ? `<div style="position:relative;padding-left:24px;border-left:2px solid ${ACCENT};">${cv.experience.map((r) => `<div style="position:relative;margin-bottom:18px;">
        <span style="position:absolute;left:-31px;top:4px;width:12px;height:12px;border-radius:50%;background:#fff;border:3px solid ${ACCENT};display:block;"></span>
        ${r.duration ? `<p style="font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:0.12em;color:${ACCENT};">${escapeHtml(r.duration)}</p>` : ''}
        <p style="font-weight:bold;font-size:14px;color:#111827;margin-top:2px;">${escapeHtml(r.title || '')}</p>
        ${r.company ? `<p style="font-size:12.5px;color:#6b7280;font-style:italic;">${escapeHtml(r.company)}</p>` : ''}
        ${r.bullets && r.bullets.length > 0 ? `<ul style="margin-top:5px;margin-left:16px;padding:0;list-style:disc;">${r.bullets.map((b) => `<li style="font-size:13px;color:#1f2937;margin-bottom:2px;">${escapeHtml(b)}</li>`).join('')}</ul>` : ''}
      </div>`).join('')}</div>`
    : '';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
${baseStyles()}
body { font-family: 'Inter','Segoe UI',Arial,sans-serif; font-size: 13.5px; line-height: 1.5; color: #111827; padding: 28px 40px; word-break: break-word; overflow-wrap: anywhere; }
</style></head><body>
  <h1 style="font-weight:bold;font-size:26px;color:#0f172a;letter-spacing:-0.01em;line-height:1.1;">${escapeHtml(cv.full_name || 'Your Name')}</h1>
  ${contact.length > 0 ? `<p style="font-size:12px;color:#6b7280;margin-top:4px;word-break:break-all;">${escapeHtml(contact.join('  ·  '))}</p>` : ''}
  <div style="height:2px;background:${ACCENT};margin:14px 0 18px;width:60px;"></div>
  ${cv.summary ? sec('Profile', `<p>${escapeHtml(cv.summary)}</p>`) : ''}
  ${timeline ? sec('Career Timeline', timeline) : ''}
  ${skills.length > 0 ? sec('Skills', `<div style="display:flex;flex-wrap:wrap;gap:6px;">${skills.map((s) => `<span style="font-size:12px;padding:2px 8px;border-radius:3px;background:rgba(37,99,235,0.10);color:${ACCENT};">${escapeHtml(s)}</span>`).join('')}</div>`) : ''}
  ${edu.length > 0 ? sec('Education', edu.map((e) => `<div style="margin-bottom:6px;"><p>${escapeHtml([e.degree, e.institution, e.year].filter(Boolean).join(' — '))}</p>${eduExtrasHtml(e)}</div>`).join('')) : ''}
  ${langs.length > 0 ? sec('Languages', `<p>${escapeHtml(langs.map(langText).join(' · '))}</p>`) : ''}
  ${certs.length > 0 ? sec('Certifications', certs.map((c) => `<div style="margin-bottom:6px;"><p>${escapeHtml(certText(c))}</p>${certExtrasHtml(c)}</div>`).join(''), true) : ''}
</body></html>`;
}

// ───────────────────────────────────── banking ──────────────────────────────────
function bankingTemplate(cv) {
  const NAVY = '#0c1d3d';
  const contact = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean);
  const skills = (cv.skills || []).filter((s) => s && String(s).trim());
  const edu = (cv.education || []).filter((e) => [e.degree, e.institution, e.year, e.url].filter(Boolean).length > 0);
  const langs = (cv.languages || []).filter((l) => langText(l).length > 0);
  const certs = (cv.certifications || []).filter((c) => certText(c).length > 0);
  const sec = (title, body, last) => `<section style="${last ? '' : 'margin-bottom:20px;'}"><h2 style="font-weight:bold;text-transform:uppercase;font-size:11.5px;letter-spacing:0.18em;margin-bottom:8px;padding-bottom:4px;color:${NAVY};border-bottom:1px solid ${NAVY};">${title}</h2>${body}</section>`;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
${baseStyles()}
body { font-family: 'Times New Roman',Georgia,'Garamond',serif; font-size: 14px; line-height: 1.5; color: #111827; padding: 36px 48px; word-break: break-word; overflow-wrap: anywhere; }
.header { border-top: 2px solid ${NAVY}; border-bottom: 1px solid ${NAVY}; padding: 14px 0; text-align: center; }
.header h1 { font-weight: 600; font-size: 26px; color: ${NAVY}; letter-spacing: 0.03em; }
.header .contact { font-size: 12px; color: #374151; margin-top: 8px; word-break: break-all; }
</style></head><body>
  <div class="header">
    <h1>${escapeHtml(cv.full_name || 'Your Name')}</h1>
    ${contact.length > 0 ? `<div class="contact">${escapeHtml(contact.join('  ·  '))}</div>` : ''}
  </div>
  <div style="margin-top:24px;">
    ${cv.summary ? sec('Professional Summary', `<p>${escapeHtml(cv.summary)}</p>`) : ''}
    ${cv.experience && cv.experience.length > 0 ? sec('Professional Experience', uniqExp(cv, { titleColor: NAVY, durColor: '#6b7280', durBold: false, durUpper: false, durSize: 12, titleSize: 14, bulletSize: 13.5 })) : ''}
    ${edu.length > 0 ? sec('Education', edu.map((e) => `<div style="margin-bottom:8px;"><p style="font-weight:600;font-size:13.5px;color:${NAVY};">${escapeHtml([e.degree, e.institution].filter(Boolean).join(' — '))}</p>${e.year ? `<p style="font-size:12px;font-style:italic;color:#6b7280;">${escapeHtml(e.year)}</p>` : ''}${eduExtrasHtml(e)}</div>`).join('')) : ''}
    ${skills.length > 0 ? sec('Areas of Expertise', `<p>${escapeHtml(skills.join('  ·  '))}</p>`) : ''}
    ${certs.length > 0 ? sec('Certifications', certs.map((c) => `<div style="margin-bottom:6px;"><p style="font-weight:600;font-size:13.5px;">${escapeHtml(certText(c))}</p>${certExtrasHtml(c)}</div>`).join('')) : ''}
    ${langs.length > 0 ? sec('Languages', `<p>${escapeHtml(langs.map(langText).join('  ·  '))}</p>`, true) : ''}
  </div>
</body></html>`;
}

// ───────────────────────────────────── healthcare ───────────────────────────────
function healthcareTemplate(cv, photo) {
  const TEAL = '#0d9488';
  const TEAL_DARK = '#115e59';
  const contact = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean);
  const skills = (cv.skills || []).filter((s) => s && String(s).trim());
  const edu = (cv.education || []).filter((e) => [e.degree, e.institution, e.year, e.url].filter(Boolean).length > 0);
  const langs = (cv.languages || []).filter((l) => langText(l).length > 0);
  const certs = (cv.certifications || []).filter((c) => certText(c).length > 0);
  const sec = (title, body, last) => `<section style="${last ? '' : 'margin-bottom:20px;'}"><h2 style="font-weight:bold;text-transform:uppercase;font-size:11px;letter-spacing:0.16em;margin-bottom:8px;padding-bottom:4px;color:${TEAL_DARK};border-bottom:1.5px solid ${TEAL};">${title}</h2>${body}</section>`;
  const photoHtml = photo ? `<div style="width:96px;height:96px;border-radius:50%;border:3px solid ${TEAL};overflow:hidden;flex-shrink:0;"><img src="${photo}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;" /></div>` : '';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
${baseStyles()}
body { font-family: 'Inter','Segoe UI',Arial,sans-serif; font-size: 13.5px; line-height: 1.5; color: #111827; word-break: break-word; overflow-wrap: anywhere; }
.bar { background: ${TEAL}; height: 6px; }
.top { padding: 28px 40px 12px; display: flex; align-items: flex-start; gap: 20px; flex-wrap: wrap; }
.top h1 { font-weight: bold; font-size: 26px; color: ${TEAL_DARK}; letter-spacing: -0.01em; line-height: 1.1; }
.top .contact { font-size: 12px; color: #6b7280; margin-top: 4px; word-break: break-all; }
.top .head-body { flex: 1; min-width: 0; }
.body { padding: 0 40px 28px; }
</style></head><body>
  <div class="bar"></div>
  <div class="top">
    ${photoHtml}
    <div class="head-body">
      <h1>${escapeHtml(cv.full_name || 'Your Name')}</h1>
      ${contact.length > 0 ? `<div class="contact">${escapeHtml(contact.join('  ·  '))}</div>` : ''}
    </div>
  </div>
  <div class="body">
    ${cv.summary ? sec('Profile', `<p>${escapeHtml(cv.summary)}</p>`) : ''}
    ${cv.experience && cv.experience.length > 0 ? sec('Clinical / Professional Experience', uniqExp(cv, { titleColor: TEAL_DARK, durColor: TEAL })) : ''}
    ${skills.length > 0 ? sec('Clinical Competencies', `<div style="display:flex;flex-wrap:wrap;gap:6px;">${skills.map((s) => `<span style="font-size:12px;padding:2px 10px;border-radius:9999px;background:rgba(13,148,136,0.10);color:${TEAL_DARK};">${escapeHtml(s)}</span>`).join('')}</div>`) : ''}
    ${edu.length > 0 ? sec('Education', edu.map((e) => `<div style="margin-bottom:6px;"><p>${escapeHtml([e.degree, e.institution, e.year].filter(Boolean).join(' — '))}</p>${eduExtrasHtml(e)}</div>`).join('')) : ''}
    ${certs.length > 0 ? sec('Licenses & Certifications', certs.map((c) => `<div style="margin-bottom:6px;"><p style="font-weight:600;font-size:13px;">${escapeHtml(certText(c))}</p>${certExtrasHtml(c)}</div>`).join('')) : ''}
    ${langs.length > 0 ? sec('Languages', `<p>${escapeHtml(langs.map(langText).join('  ·  '))}</p>`, true) : ''}
  </div>
</body></html>`;
}

// ───────────────────────────────────── government ───────────────────────────────
function governmentTemplate(cv) {
  const FED_BLUE = '#002868';
  const contact = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean);
  const skills = (cv.skills || []).filter((s) => s && String(s).trim());
  const edu = (cv.education || []).filter((e) => [e.degree, e.institution, e.year, e.url].filter(Boolean).length > 0);
  const langs = (cv.languages || []).filter((l) => langText(l).length > 0);
  const certs = (cv.certifications || []).filter((c) => certText(c).length > 0);
  const sec = (title, body, last) => `<section style="${last ? '' : 'margin-bottom:20px;'}"><h2 style="font-weight:bold;text-transform:uppercase;font-size:12px;letter-spacing:0.18em;margin-bottom:8px;padding-bottom:4px;color:${FED_BLUE};border-bottom:2px solid ${FED_BLUE};">${title}</h2>${body}</section>`;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
${baseStyles()}
body { font-family: 'Times New Roman',Georgia,serif; font-size: 13.5px; line-height: 1.45; color: #111827; padding: 32px 40px; word-break: break-word; overflow-wrap: anywhere; }
h1 { text-align: center; font-weight: bold; text-transform: uppercase; font-size: 22px; color: ${FED_BLUE}; letter-spacing: 0.04em; }
.contact { text-align: center; font-size: 12px; color: #374151; margin-top: 4px; word-break: break-all; }
.divider { border-top: 3px double ${FED_BLUE}; margin: 10px 0 18px; }
</style></head><body>
  <h1>${escapeHtml(cv.full_name || 'Your Name')}</h1>
  ${contact.length > 0 ? `<div class="contact">${escapeHtml(contact.join('  |  '))}</div>` : ''}
  <div class="divider"></div>
  ${cv.summary ? sec('Career Objective', `<p>${escapeHtml(cv.summary)}</p>`) : ''}
  ${cv.experience && cv.experience.length > 0 ? sec('Professional Experience', cv.experience.map((r) => `<div style="margin-bottom:14px;">
    <p style="font-weight:bold;font-size:13.5px;text-transform:uppercase;color:${FED_BLUE};">${escapeHtml(r.title || '')}</p>
    <p style="font-size:12.5px;color:#374151;">${escapeHtml([r.company, r.duration].filter(Boolean).join('   |   '))}</p>
    ${r.bullets && r.bullets.length > 0 ? `<ul style="margin-top:4px;margin-left:18px;padding:0;list-style:disc;">${r.bullets.map((b) => `<li style="font-size:13.5px;color:#1f2937;">${escapeHtml(b)}</li>`).join('')}</ul>` : ''}
  </div>`).join('')) : ''}
  ${edu.length > 0 ? sec('Education', edu.map((e) => `<div style="margin-bottom:6px;"><p style="font-weight:bold;font-size:13.5px;color:${FED_BLUE};">${escapeHtml([e.degree, e.institution].filter(Boolean).join(' — '))}</p>${e.year ? `<p style="font-size:12px;color:#374151;">${escapeHtml(e.year)}</p>` : ''}${eduExtrasHtml(e)}</div>`).join('')) : ''}
  ${skills.length > 0 ? sec('Core Competencies', `<p>${escapeHtml(skills.join('  ·  '))}</p>`) : ''}
  ${certs.length > 0 ? sec('Certifications & Clearances', certs.map((c) => `<div style="margin-bottom:6px;"><p style="font-weight:600;font-size:13px;">${escapeHtml(certText(c))}</p>${certExtrasHtml(c)}</div>`).join('')) : ''}
  ${langs.length > 0 ? sec('Languages', `<p>${escapeHtml(langs.map(langText).join('  ·  '))}</p>`, true) : ''}
</body></html>`;
}

// ───────────────────────────────────── designer ─────────────────────────────────
function designerTemplate(cv, photo) {
  const CORAL = '#fb7185';
  const PEACH = '#fef3ec';
  const INK = '#1f1f2c';
  const contact = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean);
  const skills = (cv.skills || []).filter((s) => s && String(s).trim());
  const edu = (cv.education || []).filter((e) => [e.degree, e.institution, e.year, e.url].filter(Boolean).length > 0);
  const langs = (cv.languages || []).filter((l) => langText(l).length > 0);
  const certs = (cv.certifications || []).filter((c) => certText(c).length > 0);
  const sec = (title, body, last) => `<section style="${last ? '' : 'margin-bottom:20px;'}"><h2 style="display:inline-block;font-weight:bold;text-transform:uppercase;font-size:11px;letter-spacing:0.22em;margin-bottom:8px;padding-bottom:4px;color:${INK};border-bottom:2px solid ${CORAL};">${title}</h2>${body}</section>`;
  const photoHtml = photo ? `<div style="width:92px;height:92px;border-radius:16px;border:2px solid ${CORAL};overflow:hidden;flex-shrink:0;"><img src="${photo}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;" /></div>` : '';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
${baseStyles()}
body { font-family: 'Inter','Segoe UI',Arial,sans-serif; font-size: 13.5px; line-height: 1.55; color: ${INK}; word-break: break-word; overflow-wrap: anywhere; }
.head { padding: 32px 40px 20px; background: ${PEACH}; display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
.head .head-body { flex: 1; min-width: 0; }
.head .kicker { font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.22em; color: ${CORAL}; }
.head h1 { font-weight: bold; font-size: 30px; color: ${INK}; letter-spacing: -0.02em; line-height: 1.1; margin-top: 4px; }
.head .contact { font-size: 12px; color: #5b5b6a; margin-top: 6px; word-break: break-all; }
.body { padding: 28px 40px; }
</style></head><body>
  <div class="head">
    ${photoHtml}
    <div class="head-body">
      <div class="kicker">Portfolio · CV</div>
      <h1>${escapeHtml(cv.full_name || 'Your Name')}</h1>
      ${contact.length > 0 ? `<div class="contact">${escapeHtml(contact.join('  ·  '))}</div>` : ''}
    </div>
  </div>
  <div class="body">
    ${cv.summary ? sec('About', `<p>${escapeHtml(cv.summary)}</p>`) : ''}
    ${cv.experience && cv.experience.length > 0 ? sec('Experience', uniqExp(cv, { titleColor: INK, durColor: CORAL, titleSize: 14.5 })) : ''}
    ${skills.length > 0 ? sec('Skills', `<div style="display:flex;flex-wrap:wrap;gap:6px;">${skills.map((s) => `<span style="font-size:12px;padding:2px 12px;border-radius:9999px;background:${PEACH};color:${INK};border:1px solid ${CORAL}40;">${escapeHtml(s)}</span>`).join('')}</div>`) : ''}
    ${edu.length > 0 ? sec('Education', edu.map((e) => `<div style="margin-bottom:6px;"><p>${escapeHtml([e.degree, e.institution, e.year].filter(Boolean).join(' — '))}</p>${eduExtrasHtml(e)}</div>`).join('')) : ''}
    ${langs.length > 0 ? sec('Languages', `<p>${escapeHtml(langs.map(langText).join('  ·  '))}</p>`) : ''}
    ${certs.length > 0 ? sec('Certifications', certs.map((c) => `<div style="margin-bottom:6px;"><p style="font-weight:600;font-size:13px;">${escapeHtml(certText(c))}</p>${certExtrasHtml(c)}</div>`).join(''), true) : ''}
  </div>
</body></html>`;
}

// ───────────────────────────────────── marketing ────────────────────────────────
function marketingTemplate(cv) {
  const MAGENTA = '#db2777';
  const ORANGE = '#f97316';
  const contact = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean);
  const skills = (cv.skills || []).filter((s) => s && String(s).trim());
  const edu = (cv.education || []).filter((e) => [e.degree, e.institution, e.year, e.url].filter(Boolean).length > 0);
  const langs = (cv.languages || []).filter((l) => langText(l).length > 0);
  const certs = (cv.certifications || []).filter((c) => certText(c).length > 0);
  const sec = (title, body, last) => `<section style="${last ? '' : 'margin-bottom:20px;'}"><h2 style="font-weight:900;text-transform:uppercase;font-size:11.5px;letter-spacing:0.20em;margin-bottom:8px;color:#0f172a;display:flex;align-items:center;gap:8px;"><span style="display:inline-block;width:18px;height:3px;background:${MAGENTA};"></span>${title}</h2>${body}</section>`;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
${baseStyles()}
body { font-family: 'Inter','Segoe UI',Arial,sans-serif; font-size: 13.5px; line-height: 1.5; color: #111827; word-break: break-word; overflow-wrap: anywhere; }
.head { padding: 28px 40px; background: linear-gradient(90deg, ${MAGENTA} 0%, ${ORANGE} 100%); color: #fff; }
.head h1 { font-weight: 900; font-size: 30px; letter-spacing: -0.02em; line-height: 1.1; }
.head .contact { font-size: 12px; color: rgba(255,255,255,0.9); margin-top: 8px; word-break: break-all; }
.body { padding: 28px 40px; }
</style></head><body>
  <div class="head">
    <h1>${escapeHtml(cv.full_name || 'Your Name')}</h1>
    ${contact.length > 0 ? `<div class="contact">${escapeHtml(contact.join('  ·  '))}</div>` : ''}
  </div>
  <div class="body">
    ${cv.summary ? sec('The Pitch', `<p>${escapeHtml(cv.summary)}</p>`) : ''}
    ${cv.experience && cv.experience.length > 0 ? sec('Campaigns & Roles', uniqExp(cv, { titleColor: MAGENTA, durColor: ORANGE, durBg: 'rgba(249,115,22,0.15)', durRadius: 9999, durPad: '2px 8px', durUpper: false })) : ''}
    ${skills.length > 0 ? sec('Toolkit', `<div style="display:flex;flex-wrap:wrap;gap:6px;">${skills.map((s) => `<span style="font-size:12px;padding:2px 10px;border-radius:6px;font-weight:500;background:rgba(219,39,119,0.10);color:${MAGENTA};">${escapeHtml(s)}</span>`).join('')}</div>`) : ''}
    ${edu.length > 0 ? sec('Education', edu.map((e) => `<div style="margin-bottom:6px;"><p>${escapeHtml([e.degree, e.institution, e.year].filter(Boolean).join(' — '))}</p>${eduExtrasHtml(e)}</div>`).join('')) : ''}
    ${certs.length > 0 ? sec('Certifications', certs.map((c) => `<div style="margin-bottom:6px;"><p style="font-weight:600;font-size:13px;">${escapeHtml(certText(c))}</p>${certExtrasHtml(c)}</div>`).join('')) : ''}
    ${langs.length > 0 ? sec('Languages', `<p>${escapeHtml(langs.map(langText).join('  ·  '))}</p>`, true) : ''}
  </div>
</body></html>`;
}

// ───────────────────────────────────── legal ────────────────────────────────────
function legalTemplate(cv) {
  const BURGUNDY = '#7f1d1d';
  const contact = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean);
  const skills = (cv.skills || []).filter((s) => s && String(s).trim());
  const edu = (cv.education || []).filter((e) => [e.degree, e.institution, e.year, e.url].filter(Boolean).length > 0);
  const langs = (cv.languages || []).filter((l) => langText(l).length > 0);
  const certs = (cv.certifications || []).filter((c) => certText(c).length > 0);
  const sec = (title, body, last) => `<section style="${last ? '' : 'margin-bottom:20px;'}"><h2 style="text-align:center;font-weight:bold;text-transform:uppercase;font-size:11.5px;letter-spacing:0.28em;margin-bottom:12px;color:${BURGUNDY};">${title}</h2>${body}</section>`;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
${baseStyles()}
body { font-family: 'Garamond',Georgia,'Times New Roman',serif; font-size: 14.5px; line-height: 1.55; color: #111827; padding: 40px 48px; word-break: break-word; overflow-wrap: anywhere; }
h1 { text-align: center; font-weight: 600; font-size: 28px; color: #1a1a1a; letter-spacing: 0.05em; }
.divider-line { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 8px; }
.divider-line span { display: inline-block; }
.contact { text-align: center; font-size: 12.5px; color: #374151; margin-top: 12px; word-break: break-all; }
</style></head><body>
  <h1>${escapeHtml(cv.full_name || 'Your Name')}</h1>
  <div class="divider-line">
    <span style="width:36px;height:1px;background:${BURGUNDY};"></span>
    <span style="width:6px;height:6px;background:${BURGUNDY};transform:rotate(45deg);"></span>
    <span style="width:36px;height:1px;background:${BURGUNDY};"></span>
  </div>
  ${contact.length > 0 ? `<p class="contact">${escapeHtml(contact.join('  ·  '))}</p>` : ''}
  <div style="margin-top:28px;">
    ${cv.summary ? sec('Summary of Practice', `<p style="font-style:italic;">${escapeHtml(cv.summary)}</p>`) : ''}
    ${cv.experience && cv.experience.length > 0 ? sec('Professional Experience', uniqExp(cv, { titleColor: BURGUNDY, durColor: '#6b7280', durBold: false, durUpper: false, durSize: 12.5, titleSize: 14.5, bulletSize: 14 })) : ''}
    ${edu.length > 0 ? sec('Education', edu.map((e) => `<div style="margin-bottom:8px;"><p style="font-weight:600;font-size:14px;color:${BURGUNDY};">${escapeHtml([e.degree, e.institution].filter(Boolean).join(' — '))}</p>${e.year ? `<p style="font-size:12.5px;font-style:italic;color:#6b7280;">${escapeHtml(e.year)}</p>` : ''}${eduExtrasHtml(e)}</div>`).join('')) : ''}
    ${skills.length > 0 ? sec('Areas of Practice', `<p>${escapeHtml(skills.join('  ·  '))}</p>`) : ''}
    ${certs.length > 0 ? sec('Bar Admissions & Certifications', certs.map((c) => `<div style="margin-bottom:6px;"><p style="font-weight:600;font-size:13.5px;">${escapeHtml(certText(c))}</p>${certExtrasHtml(c)}</div>`).join('')) : ''}
    ${langs.length > 0 ? sec('Languages', `<p>${escapeHtml(langs.map(langText).join('  ·  '))}</p>`, true) : ''}
  </div>
</body></html>`;
}

// ───────────────────────────────────── twotone ──────────────────────────────────
function twotoneTemplate(cv, photo) {
  const SLATE = '#1e293b';
  const ACCENT = '#38bdf8';
  const contact = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean);
  const skills = (cv.skills || []).filter((s) => s && String(s).trim());
  const edu = (cv.education || []).filter((e) => [e.degree, e.institution, e.year, e.url].filter(Boolean).length > 0);
  const langs = (cv.languages || []).filter((l) => langText(l).length > 0);
  const certs = (cv.certifications || []).filter((c) => certText(c).length > 0);
  const sec = (title, body, last) => `<section style="${last ? '' : 'margin-bottom:20px;'}"><h2 style="font-weight:bold;text-transform:uppercase;font-size:11px;letter-spacing:0.20em;margin-bottom:8px;padding-bottom:4px;color:${SLATE};border-bottom:2px solid ${SLATE};">${title}</h2>${body}</section>`;
  const photoHtml = photo ? `<div style="width:96px;height:96px;border-radius:50%;border:3px solid ${ACCENT};overflow:hidden;flex-shrink:0;"><img src="${photo}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;" /></div>` : '';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
${baseStyles()}
body { font-family: 'Inter','Segoe UI',Arial,sans-serif; font-size: 13.5px; line-height: 1.5; color: #111827; word-break: break-word; overflow-wrap: anywhere; }
.head { padding: 32px 40px 28px; background: ${SLATE}; color: #fff; display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
.head .head-body { flex: 1; min-width: 0; }
.head h1 { font-weight: bold; font-size: 28px; color: #fff; letter-spacing: -0.01em; line-height: 1.1; }
.head .accent-bar { width: 50px; height: 3px; background: ${ACCENT}; margin: 8px 0; }
.head .contact { font-size: 12px; color: rgba(255,255,255,0.78); word-break: break-all; }
.body { padding: 28px 40px; }
</style></head><body>
  <div class="head">
    ${photoHtml}
    <div class="head-body">
      <h1>${escapeHtml(cv.full_name || 'Your Name')}</h1>
      <div class="accent-bar"></div>
      ${contact.length > 0 ? `<div class="contact">${escapeHtml(contact.join('  ·  '))}</div>` : ''}
    </div>
  </div>
  <div class="body">
    ${cv.summary ? sec('Profile', `<p>${escapeHtml(cv.summary)}</p>`) : ''}
    ${cv.experience && cv.experience.length > 0 ? sec('Experience', uniqExp(cv, { titleColor: SLATE, durColor: ACCENT, durUpper: false })) : ''}
    ${skills.length > 0 ? sec('Skills', `<p>${escapeHtml(skills.join('  ·  '))}</p>`) : ''}
    ${edu.length > 0 ? sec('Education', edu.map((e) => `<div style="margin-bottom:6px;"><p>${escapeHtml([e.degree, e.institution, e.year].filter(Boolean).join(' — '))}</p>${eduExtrasHtml(e)}</div>`).join('')) : ''}
    ${langs.length > 0 ? sec('Languages', `<p>${escapeHtml(langs.map(langText).join('  ·  '))}</p>`) : ''}
    ${certs.length > 0 ? sec('Certifications', certs.map((c) => `<div style="margin-bottom:6px;"><p style="font-weight:600;font-size:13px;">${escapeHtml(certText(c))}</p>${certExtrasHtml(c)}</div>`).join(''), true) : ''}
  </div>
</body></html>`;
}

// ───────────────────────────────────── startup ──────────────────────────────────
function startupTemplate(cv) {
  const NEON = '#22c55e';
  const INK = '#0a0a0a';
  const contact = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean);
  const skills = (cv.skills || []).filter((s) => s && String(s).trim());
  const edu = (cv.education || []).filter((e) => [e.degree, e.institution, e.year, e.url].filter(Boolean).length > 0);
  const langs = (cv.languages || []).filter((l) => langText(l).length > 0);
  const certs = (cv.certifications || []).filter((c) => certText(c).length > 0);
  const sec = (title, body, last) => `<section style="${last ? '' : 'margin-bottom:20px;'}"><h2 style="font-weight:bold;text-transform:uppercase;font-size:11px;letter-spacing:0.16em;margin-bottom:8px;color:${INK};">${title}</h2>${body}</section>`;
  const expHtml = cv.experience && cv.experience.length > 0
    ? cv.experience.map((r) => `<div style="margin-bottom:14px;">
        <div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap;">
          <span style="font-weight:bold;font-size:14px;color:${INK};">${escapeHtml(r.title || '')}</span>
          ${r.duration ? `<span style="font-size:11px;font-family:'JetBrains Mono','SF Mono',Consolas,monospace;padding:2px 8px;border-radius:3px;background:#f4f4f5;color:#52525b;">${escapeHtml(r.duration)}</span>` : ''}
        </div>
        ${r.company ? `<div style="font-size:12.5px;color:#6b7280;margin-top:1px;"><span style="color:${NEON};font-weight:700;">→</span> ${escapeHtml(r.company)}</div>` : ''}
        ${r.bullets && r.bullets.length > 0 ? `<ul style="list-style:none;margin-top:6px;margin-left:4px;padding:0;">${r.bullets.map((b) => `<li style="font-size:13px;color:#1f2937;margin-bottom:2px;"><span style="color:${NEON};">▸</span> ${escapeHtml(b)}</li>`).join('')}</ul>` : ''}
      </div>`).join('')
    : '';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
${baseStyles()}
body { font-family: 'Inter','SF Pro Text',Arial,sans-serif; font-size: 13.5px; line-height: 1.5; color: #111827; padding: 32px 40px; word-break: break-word; overflow-wrap: anywhere; }
.namerow { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
.namerow h1 { font-weight: 900; font-size: 32px; color: ${INK}; letter-spacing: -0.03em; line-height: 1; }
.namerow .badge { font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.18em; padding: 2px 8px; border-radius: 3px; background: ${NEON}; color: ${INK}; }
.contact { font-size: 12px; color: #6b7280; margin-top: 8px; word-break: break-all; }
</style></head><body>
  <div class="namerow">
    <h1>${escapeHtml(cv.full_name || 'Your Name')}</h1>
    <span class="badge">shipping</span>
  </div>
  ${contact.length > 0 ? `<div class="contact">${escapeHtml(contact.join('  ·  '))}</div>` : ''}
  <div style="margin-top:24px;">
    ${cv.summary ? sec('01 · Mission', `<p>${escapeHtml(cv.summary)}</p>`) : ''}
    ${expHtml ? sec('02 · Track Record', expHtml) : ''}
    ${skills.length > 0 ? sec('03 · Stack', `<div style="display:flex;flex-wrap:wrap;gap:6px;">${skills.map((s) => `<span style="font-size:12px;font-family:'JetBrains Mono','SF Mono',Consolas,monospace;padding:2px 8px;border-radius:6px;background:#f4f4f5;color:${INK};">${escapeHtml(s)}</span>`).join('')}</div>`) : ''}
    ${edu.length > 0 ? sec('04 · Education', edu.map((e) => `<div style="margin-bottom:6px;"><p>${escapeHtml([e.degree, e.institution, e.year].filter(Boolean).join(' — '))}</p>${eduExtrasHtml(e)}</div>`).join('')) : ''}
    ${certs.length > 0 ? sec('05 · Certifications', certs.map((c) => `<div style="margin-bottom:6px;"><p style="font-weight:600;font-size:13px;">${escapeHtml(certText(c))}</p>${certExtrasHtml(c)}</div>`).join('')) : ''}
    ${langs.length > 0 ? sec('06 · Languages', `<p>${escapeHtml(langs.map(langText).join('  ·  '))}</p>`, true) : ''}
  </div>
</body></html>`;
}

// ───────────────────────────────────── realestate ───────────────────────────────
function realestateTemplate(cv) {
  const GOLD = '#b8860b';
  const CHARCOAL = '#1f2937';
  const contact = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean);
  const skills = (cv.skills || []).filter((s) => s && String(s).trim());
  const edu = (cv.education || []).filter((e) => [e.degree, e.institution, e.year, e.url].filter(Boolean).length > 0);
  const langs = (cv.languages || []).filter((l) => langText(l).length > 0);
  const certs = (cv.certifications || []).filter((c) => certText(c).length > 0);
  const sec = (title, body, last) => `<section style="${last ? '' : 'margin-bottom:20px;'}"><h2 style="font-weight:bold;text-transform:uppercase;font-size:11.5px;letter-spacing:0.24em;margin-bottom:8px;padding-bottom:4px;color:${CHARCOAL};border-bottom:1px solid ${GOLD};">${title}</h2>${body}</section>`;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
${baseStyles()}
body { font-family: 'Playfair Display',Georgia,serif; font-size: 14px; line-height: 1.55; color: #111827; padding: 32px 40px; word-break: break-word; overflow-wrap: anywhere; }
.head { text-align: center; padding-bottom: 16px; border-bottom: 3px double ${GOLD}; }
.head h1 { font-weight: bold; font-size: 30px; color: ${CHARCOAL}; letter-spacing: 0.05em; }
.head .tagline { font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.30em; color: ${GOLD}; margin-top: 4px; }
.head .contact { font-size: 12px; color: #374151; margin-top: 8px; word-break: break-all; }
</style></head><body>
  <div class="head">
    <h1>${escapeHtml(cv.full_name || 'Your Name')}</h1>
    <div class="tagline">Licensed Real Estate Professional</div>
    ${contact.length > 0 ? `<div class="contact">${escapeHtml(contact.join('  ·  '))}</div>` : ''}
  </div>
  <div style="margin-top:24px;">
    ${cv.summary ? sec('Profile', `<p style="font-style:italic;">${escapeHtml(cv.summary)}</p>`) : ''}
    ${cv.experience && cv.experience.length > 0 ? sec('Experience', uniqExp(cv, { titleColor: CHARCOAL, durColor: GOLD, durBold: false, durUpper: false, durSize: 12, titleSize: 14.5, bulletSize: 13.5 })) : ''}
    ${skills.length > 0 ? sec('Specializations', `<p>${escapeHtml(skills.join('  ·  '))}</p>`) : ''}
    ${certs.length > 0 ? sec('Licenses & Designations', certs.map((c) => `<div style="margin-bottom:6px;"><p style="font-weight:600;font-size:13.5px;">${escapeHtml(certText(c))}</p>${certExtrasHtml(c)}</div>`).join('')) : ''}
    ${edu.length > 0 ? sec('Education', edu.map((e) => `<div style="margin-bottom:6px;"><p>${escapeHtml([e.degree, e.institution, e.year].filter(Boolean).join(' — '))}</p>${eduExtrasHtml(e)}</div>`).join('')) : ''}
    ${langs.length > 0 ? sec('Languages', `<p>${escapeHtml(langs.map(langText).join('  ·  '))}</p>`, true) : ''}
  </div>
</body></html>`;
}

// ───────────────────────────────────── magazine ─────────────────────────────────
function magazineTemplate(cv) {
  const INK = '#0a0a0a';
  const ACCENT = '#dc2626';
  const contact = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean);
  const skills = (cv.skills || []).filter((s) => s && String(s).trim());
  const edu = (cv.education || []).filter((e) => [e.degree, e.institution, e.year, e.url].filter(Boolean).length > 0);
  const langs = (cv.languages || []).filter((l) => langText(l).length > 0);
  const certs = (cv.certifications || []).filter((c) => certText(c).length > 0);
  const summary = (cv.summary || '').trim();
  const sec = (title, body, last) => `<section style="${last ? '' : 'margin-bottom:20px;'}"><h2 style="font-weight:900;text-transform:uppercase;font-size:13px;letter-spacing:0.20em;margin-bottom:8px;padding-bottom:4px;color:${INK};border-bottom:2px solid ${INK};">${title}</h2>${body}</section>`;
  const dropCap = summary
    ? `<p style="font-size:15px;color:#262626;">
        <span style="font-weight:bold;float:left;margin-right:8px;font-size:40px;color:${ACCENT};line-height:0.9;">${escapeHtml(summary.charAt(0).toUpperCase())}</span>
        ${escapeHtml(summary.slice(1))}
      </p>`
    : '';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
${baseStyles()}
body { font-family: 'Playfair Display',Georgia,'Times New Roman',serif; font-size: 14px; line-height: 1.55; color: #111827; padding: 36px 48px; word-break: break-word; overflow-wrap: anywhere; }
.volume { font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.32em; color: ${ACCENT}; }
h1.title { font-weight: 900; font-size: 48px; color: ${INK}; letter-spacing: -0.025em; line-height: 1.05; margin-top: 4px; }
.contact { font-family: 'Inter',sans-serif; font-size: 12px; color: #374151; margin-top: 8px; word-break: break-all; }
.divider { height: 2px; background: ${INK}; margin: 18px 0; }
</style></head><body>
  <div class="volume">Volume I · Curriculum Vitae</div>
  <h1 class="title">${escapeHtml(cv.full_name || 'Your Name')}</h1>
  ${contact.length > 0 ? `<div class="contact">${escapeHtml(contact.join('  ·  '))}</div>` : ''}
  <div class="divider"></div>
  ${summary ? sec("Editor's Note", dropCap) : ''}
  ${cv.experience && cv.experience.length > 0 ? sec('Feature Story', uniqExp(cv, { titleColor: INK, durColor: ACCENT, titleSize: 15, bulletSize: 14 })) : ''}
  ${skills.length > 0 ? sec('Toolkit', `<p style="color:#262626;">${escapeHtml(skills.join('  ·  '))}</p>`) : ''}
  ${edu.length > 0 ? sec('Education', edu.map((e) => `<div style="margin-bottom:6px;"><p style="color:#262626;">${escapeHtml([e.degree, e.institution, e.year].filter(Boolean).join(' — '))}</p>${eduExtrasHtml(e)}</div>`).join('')) : ''}
  ${certs.length > 0 ? sec('Credentials', certs.map((c) => `<div style="margin-bottom:6px;"><p style="font-weight:600;font-size:13.5px;color:#262626;">${escapeHtml(certText(c))}</p>${certExtrasHtml(c)}</div>`).join('')) : ''}
  ${langs.length > 0 ? sec('Languages', `<p style="color:#262626;">${escapeHtml(langs.map(langText).join('  ·  '))}</p>`, true) : ''}
</body></html>`;
}

// ───────────────────────────────────── rightcol ─────────────────────────────────
function rightcolTemplate(cv, photo) {
  const PRIMARY = '#0e7490';
  const SAND = '#fef3c7';
  const contact = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean);
  const skills = (cv.skills || []).filter((s) => s && String(s).trim());
  const edu = (cv.education || []).filter((e) => [e.degree, e.institution, e.year, e.url].filter(Boolean).length > 0);
  const langs = (cv.languages || []).filter((l) => langText(l).length > 0);
  const certs = (cv.certifications || []).filter((c) => certText(c).length > 0);
  const mainSec = (title, body, last) => `<section style="${last ? '' : 'margin-bottom:20px;'}"><h2 style="font-weight:bold;text-transform:uppercase;font-size:11.5px;letter-spacing:0.20em;margin-bottom:8px;padding-bottom:4px;color:${PRIMARY};border-bottom:2px solid ${PRIMARY};">${title}</h2>${body}</section>`;
  const sideSec = (title, body, last) => `<section style="${last ? '' : 'margin-bottom:20px;'}"><h2 style="font-weight:bold;text-transform:uppercase;font-size:10.5px;letter-spacing:0.22em;margin-bottom:8px;color:${PRIMARY};">${title}</h2>${body}</section>`;
  const photoHtml = photo ? `<div style="width:110px;height:110px;margin:0 auto 16px;border-radius:50%;border:3px solid ${PRIMARY};overflow:hidden;"><img src="${photo}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;" /></div>` : '';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
${baseStyles()}
body { font-family: 'Inter','Segoe UI',Arial,sans-serif; font-size: 13.5px; line-height: 1.5; color: #111827; word-break: break-word; overflow-wrap: anywhere; }
.layout { display: grid; grid-template-columns: 1fr minmax(170px, 32%); min-height: 100%; }
.main { padding: 24px 28px; }
.main h1 { font-weight: bold; font-size: 28px; color: ${PRIMARY}; letter-spacing: -0.01em; line-height: 1.1; }
.main .accent-bar { width: 50px; height: 3px; background: ${PRIMARY}; margin: 8px 0 14px; }
.aside { background: ${SAND}; color: #1f2937; padding: 24px 22px; }
.aside ul { list-style: none; padding: 0; margin: 0; }
</style></head><body>
  <div class="layout">
    <main class="main">
      <h1>${escapeHtml(cv.full_name || 'Your Name')}</h1>
      <div class="accent-bar"></div>
      ${cv.summary ? mainSec('Profile', `<p>${escapeHtml(cv.summary)}</p>`) : ''}
      ${cv.experience && cv.experience.length > 0 ? mainSec('Experience', uniqExp(cv, { titleColor: PRIMARY, durColor: '#a16207' })) : ''}
      ${edu.length > 0 ? mainSec('Education', edu.map((e) => `<div style="margin-bottom:6px;"><p>${escapeHtml([e.degree, e.institution, e.year].filter(Boolean).join(' — '))}</p>${eduExtrasHtml(e)}</div>`).join(''), true) : ''}
    </main>
    <aside class="aside">
      ${photoHtml}
      ${contact.length > 0 ? sideSec('Contact', `<ul>${contact.map((c) => `<li style="font-size:11.5px;color:#374151;margin-bottom:4px;word-break:break-all;">${escapeHtml(c)}</li>`).join('')}</ul>`) : ''}
      ${skills.length > 0 ? sideSec('Skills', `<ul>${skills.map((s) => `<li style="font-size:12px;color:#1f2937;margin-bottom:4px;"><span style="color:${PRIMARY};margin-right:6px;">▸</span>${escapeHtml(s)}</li>`).join('')}</ul>`) : ''}
      ${langs.length > 0 ? sideSec('Languages', `<ul>${langs.map((l) => `<li style="font-size:12px;color:#1f2937;margin-bottom:4px;">${escapeHtml(langText(l))}</li>`).join('')}</ul>`) : ''}
      ${certs.length > 0 ? sideSec('Certifications', `<ul>${certs.map((c) => `<li style="font-size:12px;color:#1f2937;margin-bottom:8px;"><span style="display:block;font-weight:600;">${escapeHtml(certText(c))}</span>${certExtrasHtml(c)}</li>`).join('')}</ul>`, true) : ''}
    </aside>
  </div>
</body></html>`;
}

// ───────────────────────────────────── threecol ─────────────────────────────────
function threecolTemplate(cv) {
  const PRIMARY = '#1e3a8a';
  const ACCENT = '#0ea5e9';
  const contact = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean);
  const skills = (cv.skills || []).filter((s) => s && String(s).trim());
  const edu = (cv.education || []).filter((e) => [e.degree, e.institution, e.year, e.url].filter(Boolean).length > 0);
  const langs = (cv.languages || []).filter((l) => langText(l).length > 0);
  const certs = (cv.certifications || []).filter((c) => certText(c).length > 0);
  const sec = (title, body, last) => `<section style="${last ? '' : 'margin-bottom:16px;'}"><h2 style="font-weight:bold;text-transform:uppercase;font-size:10.5px;letter-spacing:0.20em;margin-bottom:6px;padding-bottom:4px;color:${PRIMARY};border-bottom:1.5px solid ${PRIMARY};">${title}</h2>${body}</section>`;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
${baseStyles()}
body { font-family: 'Inter','Segoe UI',Arial,sans-serif; font-size: 13px; line-height: 1.5; color: #111827; padding: 28px 40px; word-break: break-word; overflow-wrap: anywhere; }
h1.name { font-weight: bold; font-size: 26px; color: ${PRIMARY}; letter-spacing: -0.01em; line-height: 1.1; }
.contact { font-size: 12px; color: #6b7280; margin-top: 4px; word-break: break-all; }
.accent-bar { width: 60px; height: 2px; background: ${ACCENT}; margin: 10px 0 18px; }
.grid { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; }
</style></head><body>
  <h1 class="name">${escapeHtml(cv.full_name || 'Your Name')}</h1>
  ${contact.length > 0 ? `<div class="contact">${escapeHtml(contact.join('  ·  '))}</div>` : ''}
  <div class="accent-bar"></div>
  ${cv.summary ? sec('Profile', `<p>${escapeHtml(cv.summary)}</p>`) : ''}
  <div class="grid">
    <div>
      ${cv.experience && cv.experience.length > 0 ? sec('Experience', uniqExp(cv, { titleColor: PRIMARY, durColor: ACCENT, titleSize: 13.5, durSize: 10.5, bulletSize: 12.5 })) : ''}
    </div>
    <div>
      ${skills.length > 0 ? sec('Skills', `<ul style="list-style:none;padding:0;margin:0;">${skills.map((s) => `<li style="font-size:12.5px;color:#1f2937;margin-bottom:2px;">· ${escapeHtml(s)}</li>`).join('')}</ul>`) : ''}
      ${edu.length > 0 ? sec('Education', edu.map((e) => `<div style="margin-bottom:6px;"><p style="font-size:12.5px;">${escapeHtml([e.degree, e.institution, e.year].filter(Boolean).join(' — '))}</p>${eduExtrasHtml(e)}</div>`).join('')) : ''}
      ${langs.length > 0 ? sec('Languages', `<p style="font-size:12.5px;">${escapeHtml(langs.map(langText).join(' · '))}</p>`) : ''}
      ${certs.length > 0 ? sec('Certifications', certs.map((c) => `<div style="margin-bottom:6px;"><p style="font-size:12.5px;font-weight:600;">${escapeHtml(certText(c))}</p>${certExtrasHtml(c)}</div>`).join(''), true) : ''}
    </div>
  </div>
</body></html>`;
}

// ───────────────────────────────────── horizontal ───────────────────────────────
function horizontalTemplate(cv) {
  const INK = '#0f172a';
  const ACCENT = '#f97316';
  const contact = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean);
  const skills = (cv.skills || []).filter((s) => s && String(s).trim());
  const edu = (cv.education || []).filter((e) => [e.degree, e.institution, e.year, e.url].filter(Boolean).length > 0);
  const langs = (cv.languages || []).filter((l) => langText(l).length > 0);
  const certs = (cv.certifications || []).filter((c) => certText(c).length > 0);
  const sec = (title, body, last) => `<section style="${last ? '' : 'margin-bottom:20px;'}"><h2 style="font-weight:bold;text-transform:uppercase;font-size:11px;letter-spacing:0.22em;margin-bottom:8px;padding-bottom:4px;color:${INK};border-bottom:2px solid ${ACCENT};">${title}</h2>${body}</section>`;
  const expHtml = cv.experience && cv.experience.length > 0
    ? cv.experience.map((r) => `<div style="margin-bottom:16px;display:flex;gap:16px;flex-wrap:wrap;">
        <div style="width:128px;flex-shrink:0;">${r.duration ? `<span style="font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:0.12em;color:${ACCENT};">${escapeHtml(r.duration)}</span>` : ''}</div>
        <div style="flex:1;min-width:0;">
          <p style="font-weight:bold;font-size:14px;color:${INK};">${escapeHtml(r.title || '')}</p>
          ${r.company ? `<p style="font-size:12.5px;color:#6b7280;font-style:italic;margin-top:1px;">${escapeHtml(r.company)}</p>` : ''}
          ${r.bullets && r.bullets.length > 0 ? `<ul style="margin-top:5px;margin-left:16px;padding:0;list-style:disc;">${r.bullets.map((b) => `<li style="font-size:13px;color:#1f2937;margin-bottom:2px;">${escapeHtml(b)}</li>`).join('')}</ul>` : ''}
        </div>
      </div>`).join('')
    : '';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
${baseStyles()}
body { font-family: 'Inter','Segoe UI',Arial,sans-serif; font-size: 13.5px; line-height: 1.5; color: #111827; word-break: break-word; overflow-wrap: anywhere; }
.head { padding: 28px 40px; display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; border-bottom: 4px solid ${ACCENT}; }
.head h1 { font-weight: 900; font-size: 46px; color: ${INK}; letter-spacing: -0.04em; line-height: 1; }
.head .contact { text-align: right; font-size: 11.5px; color: #6b7280; word-break: break-all; }
.head .contact p { margin: 0; }
.body { padding: 24px 40px; }
</style></head><body>
  <div class="head">
    <h1>${escapeHtml(cv.full_name || 'Your Name')}</h1>
    ${contact.length > 0 ? `<div class="contact">${contact.map((c) => `<p>${escapeHtml(c)}</p>`).join('')}</div>` : ''}
  </div>
  <div class="body">
    ${cv.summary ? sec('Profile', `<p>${escapeHtml(cv.summary)}</p>`) : ''}
    ${expHtml ? sec('Experience', expHtml) : ''}
    ${skills.length > 0 ? sec('Skills', `<p>${escapeHtml(skills.join('  ·  '))}</p>`) : ''}
    ${edu.length > 0 ? sec('Education', edu.map((e) => `<div style="margin-bottom:6px;"><p>${escapeHtml([e.degree, e.institution, e.year].filter(Boolean).join(' — '))}</p>${eduExtrasHtml(e)}</div>`).join('')) : ''}
    ${langs.length > 0 ? sec('Languages', `<p>${escapeHtml(langs.map(langText).join('  ·  '))}</p>`) : ''}
    ${certs.length > 0 ? sec('Certifications', certs.map((c) => `<div style="margin-bottom:6px;"><p style="font-weight:600;font-size:13px;">${escapeHtml(certText(c))}</p>${certExtrasHtml(c)}</div>`).join(''), true) : ''}
  </div>
</body></html>`;
}

// ───────────────────────────────────── infographic ──────────────────────────────
function infographicTemplate(cv) {
  const PRIMARY = '#0f766e';
  const ACCENT = '#facc15';
  const contact = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean);
  const skills = (cv.skills || []).filter((s) => s && String(s).trim());
  const edu = (cv.education || []).filter((e) => [e.degree, e.institution, e.year, e.url].filter(Boolean).length > 0);
  const langs = (cv.languages || []).filter((l) => langText(l).length > 0);
  const certs = (cv.certifications || []).filter((c) => certText(c).length > 0);
  const sec = (title, body, last) => `<section style="${last ? '' : 'margin-bottom:20px;'}"><h2 style="font-weight:bold;text-transform:uppercase;font-size:11px;letter-spacing:0.20em;margin-bottom:8px;padding-bottom:4px;color:${PRIMARY};border-bottom:1.5px solid ${PRIMARY};">${title}</h2>${body}</section>`;
  // Skill bars use a deterministic fill (mirroring frontend's 60 + i*13 % 35).
  const skillBars = skills.slice(0, 8).map((s, i) => {
    const fill = 60 + ((i * 13) % 35);
    return `<div style="display:flex;align-items:center;gap:12px;margin-bottom:6px;">
      <span style="font-size:12px;color:#374151;width:128px;flex-shrink:0;">${escapeHtml(s)}</span>
      <div style="flex:1;height:6px;border-radius:9999px;background:#f1f5f9;overflow:hidden;"><div style="width:${fill}%;height:100%;background:${PRIMARY};"></div></div>
    </div>`;
  }).join('');
  const moreSkills = skills.length > 8 ? `<p style="font-size:11.5px;color:#9ca3af;margin-top:8px;">+ ${skills.length - 8} additional</p>` : '';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
${baseStyles()}
body { font-family: 'Inter','Segoe UI',Arial,sans-serif; font-size: 13.5px; line-height: 1.5; color: #111827; padding: 28px 40px; word-break: break-word; overflow-wrap: anywhere; }
h1.name { font-weight: bold; font-size: 28px; color: ${PRIMARY}; letter-spacing: -0.01em; line-height: 1.1; }
.contact { font-size: 12px; color: #6b7280; margin-top: 4px; word-break: break-all; }
.accent-bar { height: 3px; background: ${ACCENT}; margin: 14px 0 18px; width: 60px; }
</style></head><body>
  <h1 class="name">${escapeHtml(cv.full_name || 'Your Name')}</h1>
  ${contact.length > 0 ? `<div class="contact">${escapeHtml(contact.join('  ·  '))}</div>` : ''}
  <div class="accent-bar"></div>
  ${cv.summary ? sec('Profile', `<p>${escapeHtml(cv.summary)}</p>`) : ''}
  ${cv.experience && cv.experience.length > 0 ? sec('Experience', uniqExp(cv, { titleColor: PRIMARY, durColor: ACCENT })) : ''}
  ${skills.length > 0 ? sec('Proficiencies', `<div>${skillBars}${moreSkills}</div>`) : ''}
  ${edu.length > 0 ? sec('Education', edu.map((e) => `<div style="margin-bottom:6px;"><p>${escapeHtml([e.degree, e.institution, e.year].filter(Boolean).join(' — '))}</p>${eduExtrasHtml(e)}</div>`).join('')) : ''}
  ${langs.length > 0 ? sec('Languages', `<p>${escapeHtml(langs.map(langText).join('  ·  '))}</p>`) : ''}
  ${certs.length > 0 ? sec('Certifications', certs.map((c) => `<div style="margin-bottom:6px;"><p style="font-weight:600;font-size:13px;">${escapeHtml(certText(c))}</p>${certExtrasHtml(c)}</div>`).join(''), true) : ''}
</body></html>`;
}

// ───────────────────────────────────── cards ────────────────────────────────────
function cardsTemplate(cv) {
  const PRIMARY = '#312e81';
  const ACCENT = '#818cf8';
  const BG = '#f8fafc';
  const contact = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean);
  const skills = (cv.skills || []).filter((s) => s && String(s).trim());
  const edu = (cv.education || []).filter((e) => [e.degree, e.institution, e.year, e.url].filter(Boolean).length > 0);
  const langs = (cv.languages || []).filter((l) => langText(l).length > 0);
  const certs = (cv.certifications || []).filter((c) => certText(c).length > 0);
  const card = (title, body, last) => `<section style="${last ? '' : 'margin-bottom:12px;'}background:#fff;border-radius:10px;padding:14px 18px;border:1px solid #e2e8f0;"><h2 style="font-weight:bold;text-transform:uppercase;font-size:10.5px;letter-spacing:0.22em;margin-bottom:8px;color:${PRIMARY};">${title}</h2>${body}</section>`;
  const expHtml = cv.experience && cv.experience.length > 0
    ? cv.experience.map((r, i) => `<div style="${i === 0 ? '' : 'margin-top:14px;padding-top:14px;border-top:1px solid #e2e8f0;'}">
        <div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap;">
          <span style="font-weight:bold;font-size:14px;color:${PRIMARY};">${escapeHtml(r.title || '')}</span>
          ${r.duration ? `<span style="font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:0.12em;color:${ACCENT};">${escapeHtml(r.duration)}</span>` : ''}
        </div>
        ${r.company ? `<div style="font-size:12.5px;color:#6b7280;font-style:italic;margin-top:1px;">${escapeHtml(r.company)}</div>` : ''}
        ${r.bullets && r.bullets.length > 0 ? `<ul style="margin-top:5px;margin-left:18px;padding:0;list-style:disc;">${r.bullets.map((b) => `<li style="font-size:13px;color:#1f2937;margin-bottom:2px;">${escapeHtml(b)}</li>`).join('')}</ul>` : ''}
      </div>`).join('')
    : '';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
${baseStyles()}
body { font-family: 'Inter','Segoe UI',Arial,sans-serif; font-size: 13.5px; line-height: 1.5; color: #111827; background: ${BG}; padding: 28px 40px; word-break: break-word; overflow-wrap: anywhere; }
h1.name { font-weight: bold; font-size: 28px; color: ${PRIMARY}; letter-spacing: -0.01em; line-height: 1.1; }
.contact { font-size: 12px; color: #6b7280; margin-top: 4px; word-break: break-all; }
.accent-bar { width: 50px; height: 3px; background: ${ACCENT}; margin: 10px 0 16px; }
</style></head><body>
  <h1 class="name">${escapeHtml(cv.full_name || 'Your Name')}</h1>
  ${contact.length > 0 ? `<div class="contact">${escapeHtml(contact.join('  ·  '))}</div>` : ''}
  <div class="accent-bar"></div>
  ${cv.summary ? card('Profile', `<p>${escapeHtml(cv.summary)}</p>`) : ''}
  ${expHtml ? card('Experience', expHtml) : ''}
  ${skills.length > 0 ? card('Skills', `<div style="display:flex;flex-wrap:wrap;gap:6px;">${skills.map((s) => `<span style="font-size:12px;padding:2px 10px;border-radius:9999px;background:#eef2ff;color:${PRIMARY};">${escapeHtml(s)}</span>`).join('')}</div>`) : ''}
  ${edu.length > 0 ? card('Education', edu.map((e) => `<div style="margin-bottom:6px;"><p>${escapeHtml([e.degree, e.institution, e.year].filter(Boolean).join(' — '))}</p>${eduExtrasHtml(e)}</div>`).join('')) : ''}
  ${langs.length > 0 ? card('Languages', `<p>${escapeHtml(langs.map(langText).join('  ·  '))}</p>`) : ''}
  ${certs.length > 0 ? card('Certifications', certs.map((c) => `<div style="margin-bottom:6px;"><p style="font-weight:600;font-size:13px;">${escapeHtml(certText(c))}</p>${certExtrasHtml(c)}</div>`).join(''), true) : ''}
</body></html>`;
}

module.exports = { generateCVPdfBuffer };
