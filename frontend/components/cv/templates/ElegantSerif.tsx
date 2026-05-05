'use client';

import type { TemplateProps } from './types';
import { certText, cleanCerts, cleanEducation, cleanLanguages, langText } from './types';
import { EduExtras, CertExtras } from './TemplateExtras';

const INK = '#111827';
const GOLD = '#b45309';

// Premium serif executive look — Playfair-inspired headers, fine gold
// rule, tasteful proportions. Single column so ATS can still parse it.
export default function ElegantSerif({ cv, photo }: TemplateProps) {
  if (!cv) return null;
  const certs = cleanCerts(cv.certifications);
  const edu = cleanEducation(cv.education);
  const langs = cleanLanguages(cv.languages);
  const skills = (cv.skills || []).filter((s) => s && String(s).trim());
  const contactLine = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean).join('   ·   ');

  const SERIF_HEAD = "'Playfair Display','Georgia','Times New Roman',serif";
  const SERIF_BODY = "'Source Serif Pro','Georgia','Times New Roman',serif";

  return (
    <div
      className="bg-white text-gray-900 break-words p-5 sm:p-9 md:p-12"
      style={{
        fontFamily: SERIF_BODY,
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
        lineHeight: 1.65,
        fontSize: '13.5px',
        color: INK,
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="text-center">
        {photo && (
          <div
            className="mx-auto mb-4 overflow-hidden"
            style={{
              width: 96, height: 96, borderRadius: '50%',
              border: `2px solid ${GOLD}`,
              padding: 3,
            }}
          >
            <img
              src={photo}
              alt={cv.full_name || 'Profile'}
              className="w-full h-full object-cover"
              style={{ borderRadius: '50%' }}
            />
          </div>
        )}
        <h1
          className="leading-none"
          style={{
            fontFamily: SERIF_HEAD,
            fontSize: 'clamp(32px,5.5vw,44px)',
            fontWeight: 700,
            letterSpacing: '-0.01em',
            color: INK,
          }}
        >
          {cv.full_name || 'Your Name'}
        </h1>

        {/* Gold double-rule with center mark */}
        <div className="flex items-center justify-center gap-3 mt-4 mb-3">
          <span style={{ height: 1, width: 60, background: GOLD }} />
          <span style={{ width: 5, height: 5, background: GOLD, transform: 'rotate(45deg)' }} />
          <span style={{ height: 1, width: 60, background: GOLD }} />
        </div>

        {contactLine && (
          <p
            className="break-all"
            style={{
              color: '#374151',
              fontSize: '12.5px',
              fontStyle: 'italic',
              letterSpacing: '0.4px',
            }}
          >
            {contactLine}
          </p>
        )}
      </header>

      {/* ── Body ───────────────────────────────────────────────────── */}
      <div className="mt-8">
        {cv.summary && (
          <Section title="Profile">
            <p
              className="text-[14px]"
              style={{
                fontFamily: SERIF_BODY,
                color: '#1f2937',
                lineHeight: 1.75,
                textAlign: 'justify',
              }}
            >
              {cv.summary}
            </p>
          </Section>
        )}

        {cv.experience && cv.experience.length > 0 && (
          <Section title="Experience">
            {cv.experience.map((role, i) => (
              <div key={i} className="mb-4">
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <p
                    className="font-semibold text-[15px]"
                    style={{ fontFamily: SERIF_HEAD, color: INK }}
                  >
                    {role.title}
                  </p>
                  {role.duration && (
                    <p
                      className="text-[11.5px] italic"
                      style={{ color: GOLD, letterSpacing: '0.5px' }}
                    >
                      {role.duration}
                    </p>
                  )}
                </div>
                {role.company && (
                  <p className="text-[13px] italic" style={{ color: '#4b5563' }}>{role.company}</p>
                )}
                {role.bullets && role.bullets.length > 0 && (
                  <ul className="mt-1.5 ml-5 space-y-0.5">
                    {role.bullets.map((b, j) => (
                      <li
                        key={j}
                        className="text-[13.5px]"
                        style={{ color: '#1f2937', listStyleType: '"—  "', paddingLeft: 4 }}
                      >
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </Section>
        )}

        {skills.length > 0 && (
          <Section title="Areas of Expertise">
            <p
              className="text-[13.5px] text-center"
              style={{ color: '#1f2937', fontStyle: 'italic', lineHeight: 1.8 }}
            >
              {skills.join('  ·  ')}
            </p>
          </Section>
        )}

        {edu.length > 0 && (
          <Section title="Education">
            {edu.map((e, i) => (
              <div key={i} className="mb-2">
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <p
                    className="font-semibold text-[13.5px]"
                    style={{ fontFamily: SERIF_HEAD, color: INK }}
                  >
                    {[e.degree, e.institution].filter(Boolean).join(' — ')}
                  </p>
                  {e.year && (
                    <p
                      className="text-[11.5px] italic"
                      style={{ color: GOLD, letterSpacing: '0.5px' }}
                    >
                      {e.year}
                    </p>
                  )}
                </div>
                <EduExtras e={e} subSize={12} subColor="gray-600" />
              </div>
            ))}
          </Section>
        )}

        {langs.length > 0 && (
          <Section title="Languages">
            <p className="text-[13px]" style={{ color: '#1f2937', textAlign: 'center', fontStyle: 'italic' }}>
              {langs.map((l) => langText(l)).join('   ·   ')}
            </p>
          </Section>
        )}

        {certs.length > 0 && (
          <Section title="Certifications" last>
            {certs.map((c, i) => (
              <div key={i} className="mb-2">
                <p
                  className="font-semibold text-[13px]"
                  style={{ fontFamily: SERIF_HEAD, color: INK }}
                >
                  {certText(c)}
                </p>
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
    <section className={last ? '' : 'mb-6'}>
      <h2
        className="text-center"
        style={{
          fontFamily: "'Playfair Display','Georgia','Times New Roman',serif",
          color: INK,
          fontSize: '14px',
          letterSpacing: '6px',
          textTransform: 'uppercase',
          fontWeight: 600,
          marginBottom: 14,
          paddingBottom: 4,
          borderBottom: `1px solid ${GOLD}`,
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
