'use client';

import type { TemplateProps } from './types';
import { certText, cleanCerts, cleanEducation, cleanLanguages, langText } from './types';
import { EduExtras, CertExtras } from './TemplateExtras';

const PLUM = '#5b21b6';
const TEAL = '#0d9488';

// Skills-first / functional layout: groups skills into a hero block at top
// and condenses experience underneath. Built for career changers who want
// transferable skills to lead.
export default function CareerChanger({ cv }: TemplateProps) {
  if (!cv) return null;
  const certs = cleanCerts(cv.certifications);
  const edu = cleanEducation(cv.education);
  const langs = cleanLanguages(cv.languages);
  const skills = (cv.skills || []).filter((s) => s && String(s).trim());
  const contactLine = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean).join('  ·  ');

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
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="px-5 py-6 sm:px-8 sm:py-7 text-center" style={{ background: '#faf5ff' }}>
        <h1
          className="font-extrabold leading-tight"
          style={{ fontSize: 'clamp(28px,4.8vw,36px)', letterSpacing: '-0.02em', color: PLUM }}
        >
          {cv.full_name || 'Your Name'}
        </h1>
        {contactLine && (
          <p className="mt-2 break-all" style={{ color: '#6b7280', fontSize: '12.5px' }}>{contactLine}</p>
        )}
        {cv.summary && (
          <p
            className="mt-3 mx-auto"
            style={{ color: '#374151', fontSize: '13.5px', maxWidth: 640, lineHeight: 1.6 }}
          >
            {cv.summary}
          </p>
        )}
      </header>

      {/* ── Skills hero ─────────────────────────────────────────────── */}
      <div className="px-5 pt-6 sm:px-8">
        {skills.length > 0 && (
          <Section title="Core Strengths" subtitle="Transferable skills built across roles">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {skills.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2"
                  style={{
                    background: i % 2 === 0 ? 'rgba(91,33,182,0.06)' : 'rgba(13,148,136,0.06)',
                    border: i % 2 === 0
                      ? '1px solid rgba(91,33,182,0.18)'
                      : '1px solid rgba(13,148,136,0.20)',
                  }}
                >
                  <span
                    className="shrink-0 rounded-full"
                    style={{
                      width: 8, height: 8,
                      background: i % 2 === 0 ? PLUM : TEAL,
                    }}
                  />
                  <span className="text-[13px] font-semibold text-gray-800 truncate">{s}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {cv.experience && cv.experience.length > 0 && (
          <Section title="Experience" subtitle="Most relevant roles">
            {cv.experience.map((role, i) => (
              <div key={i} className="mb-3.5">
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <p className="font-bold text-[14px]" style={{ color: PLUM }}>{role.title}</p>
                  {role.duration && (
                    <p className="text-[11px] font-bold uppercase" style={{ color: TEAL, letterSpacing: '1px' }}>
                      {role.duration}
                    </p>
                  )}
                </div>
                {role.company && (
                  <p className="text-[12.5px] text-gray-600 italic">{role.company}</p>
                )}
                {role.bullets && role.bullets.length > 0 && (
                  <ul className="mt-1.5 space-y-0.5">
                    {role.bullets.map((b, j) => (
                      <li key={j} className="text-[13px] text-gray-800 flex gap-2">
                        <span style={{ color: TEAL, fontWeight: 700 }}>✓</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
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
                    <p className="text-[11px] font-bold uppercase" style={{ color: TEAL, letterSpacing: '1px' }}>{e.year}</p>
                  )}
                </div>
                <EduExtras e={e} subSize={12} subColor="gray-600" />
              </div>
            ))}
          </Section>
        )}

        {langs.length > 0 && (
          <Section title="Languages">
            <p className="text-[13px] text-gray-800">{langs.map((l) => langText(l)).join('  ·  ')}</p>
          </Section>
        )}

        {certs.length > 0 && (
          <Section title="Certifications & Training" last>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {certs.map((c, i) => (
                <div
                  key={i}
                  className="rounded-lg px-3 py-2"
                  style={{ background: '#fafafa', border: '1px solid #e5e7eb' }}
                >
                  <p className="font-semibold text-[12.5px] text-gray-900">{certText(c)}</p>
                  <CertExtras cert={c} subSize={11.5} subColor="gray-600" />
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>

      <div className="pb-6" />
    </div>
  );
}

function Section({ title, subtitle, children, last }: {
  title: string; subtitle?: string; children: React.ReactNode; last?: boolean;
}) {
  return (
    <section className={last ? '' : 'mb-6'}>
      <div className="flex items-baseline gap-3 mb-3">
        <h2
          className="font-extrabold"
          style={{
            color: PLUM,
            fontSize: '13px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <span className="text-[11px]" style={{ color: '#9ca3af' }}>— {subtitle}</span>
        )}
      </div>
      {children}
    </section>
  );
}
