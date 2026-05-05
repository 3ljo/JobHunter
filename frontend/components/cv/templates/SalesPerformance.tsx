'use client';

import type { TemplateProps } from './types';
import { certText, cleanCerts, cleanEducation, cleanLanguages, langText } from './types';
import { EduExtras, CertExtras } from './TemplateExtras';

const FOREST = '#065f46';
const EMERALD = '#10b981';

// Extract the first KPI-style number from a bullet (e.g. "120%", "$2.4M", "47", "+25%")
// so we can paint it as a green pill on the left and feel "sales-y" without
// fabricating numbers.
const KPI_REGEX = /([+\-]?\$?\d[\d,.]*[KMBkmb]?%?)/;
const extractKPI = (text: string): { kpi: string | null; rest: string } => {
  const trimmed = text.trim();
  const m = trimmed.match(KPI_REGEX);
  if (!m || m.index === undefined) return { kpi: null, rest: trimmed };
  // Only treat as a KPI if it's a "real" metric: contains $, %, or 2+ digits.
  const raw = m[0];
  const looksLikeMetric = /[\$%]/.test(raw) || /\d{2,}/.test(raw) || /[KMBkmb]/.test(raw);
  if (!looksLikeMetric) return { kpi: null, rest: trimmed };
  // Drop the matched KPI plus a single trailing space/punct.
  const before = trimmed.slice(0, m.index);
  const after = trimmed.slice(m.index + raw.length).replace(/^[\s\-—:.,]*/, '');
  const rest = (before + after).replace(/\s+/g, ' ').trim();
  return { kpi: raw, rest };
};

export default function SalesPerformance({ cv }: TemplateProps) {
  if (!cv) return null;
  const certs = cleanCerts(cv.certifications);
  const edu = cleanEducation(cv.education);
  const langs = cleanLanguages(cv.languages);
  const skills = (cv.skills || []).filter((s) => s && String(s).trim());
  const contactLine = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean).join('  •  ');

  return (
    <div
      className="bg-white text-gray-900 break-words"
      style={{
        fontFamily: "'Inter','Segoe UI',Arial,sans-serif",
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
        lineHeight: 1.55,
        fontSize: '13.5px',
      }}
    >
      {/* ── Header band ────────────────────────────────────────────── */}
      <header className="px-5 py-6 sm:px-8 sm:py-7" style={{ borderTop: `5px solid ${FOREST}` }}>
        <div className="flex items-baseline justify-between gap-4 flex-wrap">
          <h1
            className="font-extrabold leading-tight"
            style={{ fontSize: 'clamp(26px,4.5vw,34px)', letterSpacing: '-0.02em', color: '#0a0a0a' }}
          >
            {cv.full_name || 'Your Name'}
          </h1>
          <span
            className="rounded-full px-3 py-1 text-[11px] font-extrabold"
            style={{
              background: 'rgba(16,185,129,0.10)',
              color: FOREST,
              border: `1px solid rgba(16,185,129,0.30)`,
              letterSpacing: '0.5px',
            }}
          >
            QUOTA · ACHIEVEMENT · GROWTH
          </span>
        </div>
        {contactLine && (
          <p className="mt-2 break-all" style={{ color: '#4b5563', fontSize: '12.5px' }}>
            {contactLine}
          </p>
        )}
      </header>

      {/* ── Body ───────────────────────────────────────────────────── */}
      <div className="px-5 pb-7 sm:px-8">
        {cv.summary && (
          <Section title="Performance Summary">
            <p className="text-[13.5px] text-gray-800">{cv.summary}</p>
          </Section>
        )}

        {cv.experience && cv.experience.length > 0 && (
          <Section title="Track Record">
            {cv.experience.map((role, i) => (
              <div key={i} className="mb-4">
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <p className="font-bold text-[14.5px]" style={{ color: '#0a0a0a' }}>{role.title}</p>
                    {role.company && (
                      <p className="text-[12.5px] text-gray-600">{role.company}</p>
                    )}
                  </div>
                  {role.duration && (
                    <p className="text-[11px] font-bold uppercase" style={{ color: FOREST, letterSpacing: '1px' }}>
                      {role.duration}
                    </p>
                  )}
                </div>
                {role.bullets && role.bullets.length > 0 && (
                  <ul className="mt-2 space-y-1.5">
                    {role.bullets.map((b, j) => {
                      const { kpi, rest } = extractKPI(b);
                      return (
                        <li key={j} className="flex items-start gap-2.5 text-[13px] text-gray-800">
                          {kpi ? (
                            <span
                              className="shrink-0 rounded font-extrabold tabular-nums"
                              style={{
                                background: EMERALD,
                                color: '#fff',
                                padding: '3px 8px',
                                fontSize: 11.5,
                                minWidth: 50,
                                textAlign: 'center',
                                letterSpacing: '0.3px',
                                marginTop: 1,
                              }}
                            >
                              {kpi}
                            </span>
                          ) : (
                            <span
                              className="shrink-0"
                              style={{
                                width: 6, height: 6, marginTop: 7,
                                background: FOREST, borderRadius: '50%',
                              }}
                            />
                          )}
                          <span>{kpi ? rest : b}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ))}
          </Section>
        )}

        {skills.length > 0 && (
          <Section title="Core Competencies">
            <div className="flex flex-wrap gap-1.5">
              {skills.map((s, i) => (
                <span
                  key={i}
                  className="rounded px-2.5 py-1 text-[12px] font-semibold"
                  style={{
                    background: '#f0fdf4',
                    color: FOREST,
                    border: `1px solid rgba(16,185,129,0.25)`,
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          </Section>
        )}

        {edu.length > 0 && (
          <Section title="Education">
            {edu.map((e, i) => (
              <div key={i} className="mb-2">
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <p className="font-semibold text-[13px] text-gray-900">
                    {[e.degree, e.institution].filter(Boolean).join(' — ')}
                  </p>
                  {e.year && (
                    <p className="text-[11px] font-bold uppercase" style={{ color: FOREST, letterSpacing: '1px' }}>{e.year}</p>
                  )}
                </div>
                <EduExtras e={e} subSize={12} subColor="gray-600" />
              </div>
            ))}
          </Section>
        )}

        {langs.length > 0 && (
          <Section title="Languages">
            <p className="text-[13px] text-gray-800">{langs.map((l) => langText(l)).join('  •  ')}</p>
          </Section>
        )}

        {certs.length > 0 && (
          <Section title="Certifications" last>
            {certs.map((c, i) => (
              <div key={i} className="mb-2">
                <p className="font-semibold text-[13px] text-gray-900">{certText(c)}</p>
                <CertExtras cert={c} subSize={12} subColor="gray-600" />
              </div>
            ))}
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({ title, children, last }: { title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <section className={last ? '' : 'mb-5'}>
      <h2
        className="font-extrabold uppercase mb-2 pb-1 inline-block"
        style={{
          color: FOREST,
          fontSize: '11.5px',
          letterSpacing: '2.5px',
          borderBottom: `2px solid ${EMERALD}`,
          paddingRight: 14,
        }}
      >
        {title}
      </h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}
