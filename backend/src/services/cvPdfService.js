// CV PDF Service
// Generates PDF from structured CV data using Puppeteer.
// Supports 4 ATS-optimized templates (harvard, modern, minimalist, european).

const puppeteer = require('puppeteer');

const DEFAULT_TEMPLATE = 'harvard';
const TEMPLATES = ['harvard', 'modern', 'minimalist', 'european'];

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

module.exports = { generateCVPdfBuffer };
