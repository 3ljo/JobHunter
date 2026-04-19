// CV PDF Service
// Generates PDF from structured CV data using Puppeteer.
// Supports 10 ATS-optimized templates.

const puppeteer = require('puppeteer');

const DEFAULT_TEMPLATE = 'harvard';
const TEMPLATES = [
  'harvard', 'modern', 'minimalist', 'european',
  'tech', 'compact', 'executive', 'academic', 'consulting', 'swiss',
];

const generateCVPdfBuffer = async (finalCV, options = {}) => {
  const templateId = TEMPLATES.includes(options.template) ? options.template : DEFAULT_TEMPLATE;
  const photo = templateId === 'european' && typeof options.photo === 'string' && options.photo.startsWith('data:image/')
    ? options.photo
    : null;

  const html = buildCVHtml(finalCV, templateId, photo);

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '0.6in', bottom: '0.6in', left: '0.7in', right: '0.7in' },
      printBackground: true,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
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
  switch (templateId) {
    case 'modern':      return modernTemplate(cv);
    case 'minimalist':  return minimalistTemplate(cv);
    case 'european':    return europeanTemplate(cv, photo);
    case 'tech':        return techTemplate(cv);
    case 'compact':     return compactTemplate(cv);
    case 'executive':   return executiveTemplate(cv);
    case 'academic':    return academicTemplate(cv);
    case 'consulting':  return consultingTemplate(cv);
    case 'swiss':       return swissTemplate(cv);
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

function renderEducation(cv) {
  const entries = (cv.education || []).filter((edu) =>
    [edu && edu.degree, edu && edu.institution, edu && edu.year].filter(Boolean).join(' ').trim().length > 0
  );
  if (entries.length === 0) return '';
  return `
    <div class="section">
      <h2>EDUCATION</h2>
      ${entries.map((edu) => {
        const parts = [edu.degree, edu.institution, edu.year].filter(Boolean);
        return `<p>${escapeHtml(parts.join(' — '))}</p>`;
      }).join('')}
    </div>
  `;
}

function certText(cert) {
  if (!cert) return '';
  if (typeof cert === 'string') return cert.trim();
  return String(cert.name || '').trim();
}

function renderCertifications(cv) {
  const entries = (cv.certifications || []).filter((c) => certText(c).length > 0);
  if (entries.length === 0) return '';
  return `
    <div class="section">
      <h2>CERTIFICATIONS</h2>
      ${entries.map((cert) => `<p>${escapeHtml(certText(cert))}</p>`).join('')}
    </div>
  `;
}

function baseStyles() {
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { color: #1a1a1a; }
    ul { padding-left: 20px; margin-top: 4px; }
    li { margin-bottom: 3px; }
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
  ${renderCertifications(cv)}
</body></html>`;
}

/* ═══════════════════════ Executive Narrative ═══════════════════════ */

function executiveTemplate(cv) {
  const contactParts = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean);

  const summaryBlock = !cv.summary ? '' : `
    <div class="summary-box">
      <p class="summary-text">${escapeHtml(cv.summary)}</p>
    </div>
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
  <div class="name">${escapeHtml(cv.full_name)}</div>
  ${contactParts.length > 0 ? `<div class="contact">${escapeHtml(contactParts.join('  ·  '))}</div>` : ''}
  <div class="rule"></div>
  ${summaryBlock}
  ${experienceHtml}
  ${renderSkills(cv, '  ·  ', 'Core Competencies')}
  ${renderEducation(cv)}
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
        .filter((e) => [e.degree, e.institution, e.year].filter(Boolean).length > 0)
        .map((e) => `
          <div class="edu-row">
            <span class="edu-main"><strong>${escapeHtml(e.degree || 'Degree')}</strong>${e.institution ? `, <em>${escapeHtml(e.institution)}</em>` : ''}</span>
            ${e.year ? `<span class="edu-year">${escapeHtml(e.year)}</span>` : ''}
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
      ${pubs.map((p) => `<p class="pub">${escapeHtml(certText(p))}</p>`).join('')}
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
  ${renderCertifications(cv)}
</body></html>`;
}

/* ═══════════════════════ Swiss Grid ═══════════════════════ */

function swissTemplate(cv) {
  const contactParts = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean);

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
        .filter((e) => [e.degree, e.institution, e.year].filter(Boolean).length > 0)
        .map((e) => `
          <div class="grid-row">
            ${e.year ? `<div class="grid-left">${escapeHtml(e.year)}</div>` : '<div class="grid-left"></div>'}
            <div class="grid-right"><p>${escapeHtml([e.degree, e.institution].filter(Boolean).join(' — '))}</p></div>
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
  <div class="name">${escapeHtml(cv.full_name)}</div>
  ${contactParts.length > 0 ? `<div class="contact">${escapeHtml(contactParts.join('   /   '))}</div>` : ''}
  <div class="rule"></div>
  ${cv.summary ? `<div class="section"><h2>01 / Profile</h2><p>${escapeHtml(cv.summary)}</p></div>` : ''}
  ${experienceHtml}
  ${educationHtml}
  ${renderSkills(cv, ' / ', '04 / Skills')}
  ${renderCertifications(cv)}
</body></html>`;
}

module.exports = { generateCVPdfBuffer };
