'use client';

import type { TemplateProps } from './types';
import { certText, cleanCerts, cleanEducation, cleanLanguages, langText } from './types';

// Bold any %, $, # or numeric impact inside a bullet so metrics pop visually
// while remaining plain text for ATS parsers.
function highlightMetrics(text: string): Array<{ text: string; bold: boolean }> {
  if (!text) return [{ text: '', bold: false }];
  const regex = /(\$?\d[\d,]*(?:\.\d+)?%?\+?|\d+x)/g;
  const parts: Array<{ text: string; bold: boolean }> = [];
  let lastIndex = 0;
  for (const match of text.matchAll(regex)) {
    const idx = match.index ?? 0;
    if (idx > lastIndex) parts.push({ text: text.slice(lastIndex, idx), bold: false });
    parts.push({ text: match[0], bold: true });
    lastIndex = idx + match[0].length;
  }
  if (lastIndex < text.length) parts.push({ text: text.slice(lastIndex), bold: false });
  return parts;
}

export default function ConsultingMetrics({ cv }: TemplateProps) {
  if (!cv) return null;
  const contactParts = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean);
  const certs = cleanCerts(cv.certifications);
  const edu = cleanEducation(cv.education);
  const langs = cleanLanguages(cv.languages);
  const skills = (cv.skills || []).filter((s) => s && String(s).trim());

  return (
    <div
      className="bg-white text-gray-900 p-5 sm:p-8 md:p-10 break-words"
      style={{
        fontFamily: "Arial, Helvetica, sans-serif",
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
        lineHeight: 1.42,
        fontSize: '14px',
      }}
    >
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <h1 className="text-2xl sm:text-[26px] font-bold" style={{ color: '#0c2340' }}>
          {cv.full_name || 'Your Name'}
        </h1>
      </div>

      {contactParts.length > 0 && (
        <p className="text-[11px] sm:text-xs text-gray-700 mt-1 break-all">
          {contactParts.join(' · ')}
        </p>
      )}

      <div style={{ height: '3px', background: '#0c2340', margin: '10px 0 14px' }} />

      {cv.summary && (
        <Section title="Value Proposition">
          <p className="text-[13px] sm:text-sm text-gray-800">{cv.summary}</p>
        </Section>
      )}

      {cv.experience && cv.experience.length > 0 && (
        <Section title="Professional Experience">
          {cv.experience.map((role, i) => (
            <div key={i} className="mb-3">
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <p className="text-[13px] sm:text-sm text-gray-900">
                  <span className="font-bold">{role.title}</span>
                  {role.company && <span className="text-gray-700">, {role.company}</span>}
                </p>
                {role.duration && (
                  <span className="text-[12px] text-gray-600 whitespace-nowrap font-semibold">{role.duration}</span>
                )}
              </div>
              {role.bullets && role.bullets.length > 0 && (
                <ul className="mt-1 ml-5 list-disc space-y-0.5">
                  {role.bullets.map((b, j) => (
                    <li key={j} className="text-[13px] sm:text-sm text-gray-800">
                      {highlightMetrics(b).map((p, k) =>
                        p.bold ? (
                          <strong key={k} style={{ color: '#0c2340' }}>{p.text}</strong>
                        ) : (
                          <span key={k}>{p.text}</span>
                        )
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </Section>
      )}

      {skills.length > 0 && (
        <Section title="Expertise">
          <p className="text-[13px] sm:text-sm text-gray-800">{skills.join(' · ')}</p>
        </Section>
      )}

      {edu.length > 0 && (
        <Section title="Education">
          {edu.map((e, i) => (
            <p key={i} className="text-[13px] sm:text-sm text-gray-800">
              {[e.degree, e.institution, e.year].filter(Boolean).join(' — ')}
            </p>
          ))}
        </Section>
      )}

      {langs.length > 0 && (
        <Section title="Languages">
          <p className="text-[13px] sm:text-sm text-gray-800">
            {langs.map((l) => langText(l)).join(' · ')}
          </p>
        </Section>
      )}

      {certs.length > 0 && (
        <Section title="Certifications" last>
          {certs.map((cert, i) => (
            <p key={i} className="text-[13px] sm:text-sm text-gray-800">{certText(cert)}</p>
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({ title, children, last }: { title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <section className={last ? '' : 'mb-4'}>
      <h2
        className="text-[11px] sm:text-xs font-bold uppercase mb-2"
        style={{ color: '#0c2340', letterSpacing: '1.5px', borderBottom: '1px solid #cbd5e1', paddingBottom: '2px' }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
