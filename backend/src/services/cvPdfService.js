// CV PDF Service
// Generates PDF from structured CV data using Puppeteer

const puppeteer = require('puppeteer');

const generateCVPdfBuffer = async (finalCV) => {
  const html = buildCVHtml(finalCV);

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
      margin: { top: '0.7in', bottom: '0.7in', left: '0.75in', right: '0.75in' },
      printBackground: true,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
};

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildCVHtml(cv) {
  const contactParts = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean);

  let experienceHtml = '';
  if (cv.experience && cv.experience.length > 0) {
    experienceHtml = `
      <div class="section">
        <h2>WORK EXPERIENCE</h2>
        ${cv.experience.map((role) => `
          <div class="role">
            <div class="role-title">${escapeHtml(role.title)}</div>
            <div class="role-meta">${escapeHtml(role.company)}  |  ${escapeHtml(role.duration)}</div>
            ${role.bullets && role.bullets.length > 0 ? `
              <ul>
                ${role.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}
              </ul>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  let skillsHtml = '';
  if (cv.skills && cv.skills.length > 0) {
    skillsHtml = `
      <div class="section">
        <h2>SKILLS</h2>
        <p>${escapeHtml(cv.skills.join(', '))}</p>
      </div>
    `;
  }

  let educationHtml = '';
  if (cv.education && cv.education.length > 0) {
    educationHtml = `
      <div class="section">
        <h2>EDUCATION</h2>
        ${cv.education.map((edu) => {
          const parts = [edu.degree, edu.institution, edu.year].filter(Boolean);
          return `<p>${escapeHtml(parts.join(' — '))}</p>`;
        }).join('')}
      </div>
    `;
  }

  let certificationsHtml = '';
  if (cv.certifications && cv.certifications.length > 0) {
    certificationsHtml = `
      <div class="section">
        <h2>CERTIFICATIONS</h2>
        ${cv.certifications.map((cert) => {
          const text = typeof cert === 'string' ? cert : cert.name || JSON.stringify(cert);
          return `<p>${escapeHtml(text)}</p>`;
        }).join('')}
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: Calibri, 'Segoe UI', Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.4;
    color: #1a1a1a;
  }
  .name {
    text-align: center;
    font-size: 24pt;
    font-weight: bold;
    margin-bottom: 4px;
  }
  .contact {
    text-align: center;
    font-size: 11pt;
    color: #444;
    margin-bottom: 12px;
  }
  .divider {
    border-bottom: 1px solid #000;
    margin-bottom: 14px;
  }
  .section { margin-bottom: 14px; }
  h2 {
    font-size: 13pt;
    font-weight: bold;
    text-transform: uppercase;
    border-bottom: 1px solid #ccc;
    padding-bottom: 2px;
    margin-bottom: 8px;
    letter-spacing: 0.5px;
  }
  .summary { margin-bottom: 14px; }
  .role { margin-bottom: 10px; }
  .role-title { font-weight: bold; font-size: 11pt; }
  .role-meta { font-style: italic; font-size: 11pt; color: #444; margin-bottom: 4px; }
  ul { padding-left: 20px; margin-top: 4px; }
  li { margin-bottom: 3px; font-size: 11pt; }
  p { font-size: 11pt; margin-bottom: 4px; }
</style>
</head>
<body>
  <div class="name">${escapeHtml(cv.full_name)}</div>
  <div class="contact">${escapeHtml(contactParts.join(' | '))}</div>
  <div class="divider"></div>
  ${cv.summary ? `
    <div class="section summary">
      <h2>PROFESSIONAL SUMMARY</h2>
      <p>${escapeHtml(cv.summary)}</p>
    </div>
  ` : ''}
  ${experienceHtml}
  ${skillsHtml}
  ${educationHtml}
  ${certificationsHtml}
</body>
</html>`;
}

module.exports = { generateCVPdfBuffer };
