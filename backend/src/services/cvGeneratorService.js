// CV Generator Service
// Generates ATS-compliant DOCX files from structured CV data

const fs = require('fs');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
} = require('docx');

// Build the docx Document object from final CV JSON (in-memory only).
const buildCVDocxDocument = (finalCV) => {
  const sections = [];

  // ── Name heading ──
  sections.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [
        new TextRun({
          text: finalCV.full_name || '',
          bold: true,
          size: 48, // 24pt
          font: 'Calibri',
        }),
      ],
    })
  );

  // ── Contact info line ──
  const contactParts = [
    finalCV.email,
    finalCV.phone,
    finalCV.location,
    finalCV.linkedin,
  ].filter(Boolean);

  sections.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: contactParts.join(' | '),
          size: 22, // 11pt
          font: 'Calibri',
        }),
      ],
    })
  );

  // ── Horizontal divider ──
  sections.push(
    new Paragraph({
      spacing: { after: 200 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      },
      children: [],
    })
  );

  // ── Professional Summary ──
  if (finalCV.summary) {
    sections.push(createSectionHeading('Professional Summary'));
    sections.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: finalCV.summary,
            size: 22,
            font: 'Calibri',
          }),
        ],
      })
    );
  }

  // ── Work Experience ──
  if (finalCV.experience && finalCV.experience.length > 0) {
    sections.push(createSectionHeading('Work Experience'));

    for (const role of finalCV.experience) {
      // Job title (bold)
      sections.push(
        new Paragraph({
          spacing: { before: 100, after: 0 },
          children: [
            new TextRun({
              text: role.title || '',
              bold: true,
              size: 22,
              font: 'Calibri',
            }),
          ],
        })
      );

      // Company + duration (italic)
      sections.push(
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({
              text: `${role.company || ''}  |  ${role.duration || ''}`,
              italics: true,
              size: 22,
              font: 'Calibri',
            }),
          ],
        })
      );

      // Bullet points
      if (role.bullets && role.bullets.length > 0) {
        for (const bullet of role.bullets) {
          sections.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { after: 40 },
              children: [
                new TextRun({
                  text: bullet,
                  size: 22,
                  font: 'Calibri',
                }),
              ],
            })
          );
        }
      }
    }
  }

  // ── Skills ──
  if (finalCV.skills && finalCV.skills.length > 0) {
    sections.push(createSectionHeading('Skills'));
    sections.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: finalCV.skills.join(', '),
            size: 22,
            font: 'Calibri',
          }),
        ],
      })
    );
  }

  // ── Education ──
  if (finalCV.education && finalCV.education.length > 0) {
    sections.push(createSectionHeading('Education'));

    for (const edu of finalCV.education) {
      const eduText = [edu.degree, edu.institution, edu.year].filter(Boolean).join(' — ');
      sections.push(
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({
              text: eduText,
              size: 22,
              font: 'Calibri',
            }),
          ],
        })
      );
    }
  }

  // ── Certifications ──
  if (finalCV.certifications && finalCV.certifications.length > 0) {
    sections.push(createSectionHeading('Certifications'));

    for (const cert of finalCV.certifications) {
      const certText = typeof cert === 'string' ? cert : cert.name || JSON.stringify(cert);
      sections.push(
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({
              text: certText,
              size: 22,
              font: 'Calibri',
            }),
          ],
        })
      );
    }
  }

  return new Document({
    sections: [
      {
        properties: {},
        children: sections,
      },
    ],
  });
};

// Generate a DOCX as an in-memory Buffer (used by the download endpoint).
const generateCVDocxBuffer = async (finalCV) => {
  const doc = buildCVDocxDocument(finalCV);
  return Packer.toBuffer(doc);
};

// Generate a DOCX file on disk (kept for any future scripted use).
const generateCVDocx = async (finalCV, outputPath) => {
  const buffer = await generateCVDocxBuffer(finalCV);
  fs.writeFileSync(outputPath, buffer);
  return outputPath;
};

// Generate a plain-text rendering of the final CV. ATS-friendly,
// good for pasting into job-board text fields.
const generateCVTxt = (finalCV) => {
  const lines = [];
  const push = (s = '') => lines.push(s);
  const rule = () => push('-'.repeat(60));

  if (finalCV.full_name) push(finalCV.full_name);
  const contactParts = [
    finalCV.email,
    finalCV.phone,
    finalCV.location,
    finalCV.linkedin,
  ].filter(Boolean);
  if (contactParts.length) push(contactParts.join(' | '));
  rule();
  push();

  if (finalCV.summary) {
    push('PROFESSIONAL SUMMARY');
    push(finalCV.summary);
    push();
  }

  if (Array.isArray(finalCV.experience) && finalCV.experience.length > 0) {
    push('WORK EXPERIENCE');
    for (const role of finalCV.experience) {
      const header = [role.title, role.company].filter(Boolean).join(' — ');
      if (header) push(header);
      if (role.duration) push(role.duration);
      if (Array.isArray(role.bullets)) {
        for (const b of role.bullets) push(`  • ${b}`);
      }
      push();
    }
  }

  if (Array.isArray(finalCV.skills) && finalCV.skills.length > 0) {
    push('SKILLS');
    push(finalCV.skills.join(', '));
    push();
  }

  if (Array.isArray(finalCV.education) && finalCV.education.length > 0) {
    push('EDUCATION');
    for (const edu of finalCV.education) {
      const text = [edu.degree, edu.institution, edu.year].filter(Boolean).join(' — ');
      if (text) push(text);
    }
    push();
  }

  if (Array.isArray(finalCV.certifications) && finalCV.certifications.length > 0) {
    push('CERTIFICATIONS');
    for (const cert of finalCV.certifications) {
      const text = typeof cert === 'string' ? cert : (cert?.name || '');
      if (text) push(text);
    }
    push();
  }

  if (Array.isArray(finalCV.languages) && finalCV.languages.length > 0) {
    push('LANGUAGES');
    push(finalCV.languages.map(l => (l?.level ? `${l.name} (${l.level})` : l?.name)).filter(Boolean).join(', '));
    push();
  }

  return lines.join('\r\n');
};

// Helper to create a standard section heading
function createSectionHeading(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 100 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 26, // 13pt
        font: 'Calibri',
        allCaps: true,
      }),
    ],
  });
}

module.exports = { generateCVDocx, generateCVDocxBuffer, generateCVTxt };
