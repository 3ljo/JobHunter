'use client';

import type { TemplateProps } from './types';
import { certText, cleanCerts, cleanEducation, cleanLanguages, langText } from './types';
import { EduExtras, CertExtras } from './TemplateExtras';

const ACCENT = '#7c3aed';
const ACCENT_2 = '#ec4899';

export default function CreativeBold({ cv, photo }: TemplateProps) {
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
        lineHeight: 1.5,
        fontSize: '13.5px',
      }}
    >
      {/* ── Hero header ────────────────────────────────────────────── */}
      <header
        className="px-5 py-7 sm:px-8 sm:py-9 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_2} 100%)`,
          color: '#fff',
        }}
      >
        {/* Decorative orbs — print-safe (no animations) */}
        <div
          aria-hidden
          style={{
            position: 'absolute', right: -40, top: -40, width: 200, height: 200,
            borderRadius: '50%', background: 'rgba(255,255,255,0.08)',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute', right: 60, bottom: -60, width: 140, height: 140,
            borderRadius: '50%', background: 'rgba(255,255,255,0.06)',
          }}
        />

        <div className="relative flex items-center gap-5 flex-wrap">
          {photo && (
            <div
              className="overflow-hidden shrink-0"
              style={{
                width: 96, height: 96, borderRadius: '50%',
                border: '3px solid rgba(255,255,255,0.85)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              }}
            >
              <img src={photo} alt={cv.full_name || 'Profile'} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="min-w-0">
            <h1
              className="font-extrabold leading-none"
              style={{ fontSize: 'clamp(28px,5vw,40px)', letterSpacing: '-0.025em', color: '#fff' }}
            >
              {cv.full_name || 'Your Name'}
            </h1>
            {contactLine && (
              <p
                className="mt-3 break-all"
                style={{ color: 'rgba(255,255,255,0.92)', fontSize: '12.5px', letterSpacing: '0.3px' }}
              >
                {contactLine}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* ── Body ───────────────────────────────────────────────────── */}
      <div className="px-5 py-6 sm:px-8 sm:py-7">
        {cv.summary && (
          <Section title="About">
            <p className="text-[13.5px] text-gray-800" style={{ lineHeight: 1.6 }}>{cv.summary}</p>
          </Section>
        )}

        {cv.experience && cv.experience.length > 0 && (
          <Section title="Experience">
            {cv.experience.map((role, i) => (
              <div key={i} className="mb-4 relative pl-4" style={{ borderLeft: `3px solid ${ACCENT}` }}>
                <div
                  aria-hidden
                  style={{
                    position: 'absolute', left: -7, top: 4, width: 11, height: 11,
                    borderRadius: '50%', background: ACCENT,
                    boxShadow: '0 0 0 3px #fff',
                  }}
                />
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <p className="font-bold text-[14.5px] text-gray-900">{role.title}</p>
                  {role.duration && (
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[10.5px] font-bold"
                      style={{ background: 'rgba(124,58,237,0.10)', color: ACCENT, letterSpacing: '0.5px' }}
                    >
                      {role.duration}
                    </span>
                  )}
                </div>
                {role.company && (
                  <p className="text-[12.5px] text-gray-600 italic">{role.company}</p>
                )}
                {role.bullets && role.bullets.length > 0 && (
                  <ul className="mt-1.5 space-y-0.5">
                    {role.bullets.map((b, j) => (
                      <li key={j} className="text-[13px] text-gray-800 flex gap-2">
                        <span style={{ color: ACCENT_2, fontWeight: 700 }}>›</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </Section>
        )}

        {skills.length > 0 && (
          <Section title="Skills">
            <div className="flex flex-wrap gap-1.5">
              {skills.map((s, i) => (
                <span
                  key={i}
                  className="rounded-full px-3 py-1 text-[12px] font-semibold"
                  style={{
                    background: `linear-gradient(135deg, rgba(124,58,237,0.10) 0%, rgba(236,72,153,0.10) 100%)`,
                    color: '#581c87',
                    border: '1px solid rgba(124,58,237,0.20)',
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
                    <span className="text-[11px] font-bold" style={{ color: ACCENT, letterSpacing: '0.5px' }}>{e.year}</span>
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
      <div className="flex items-center gap-3 mb-3">
        <span
          style={{
            display: 'inline-block', width: 24, height: 3, borderRadius: 2,
            background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT_2})`,
          }}
        />
        <h2
          className="font-extrabold"
          style={{
            fontSize: '12px',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            color: '#1f2937',
          }}
        >
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}
