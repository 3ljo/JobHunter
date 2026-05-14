'use client';

import type { TemplateProps } from './types';
import { certText, cleanCerts, cleanEducation, cleanLanguages, langText } from './types';
import { EduExtras, CertExtras } from './TemplateExtras';

const DARK = '#0b1220';
const CYAN = '#22d3ee';

export default function DarkTech({ cv, photo }: TemplateProps) {
  if (!cv) return null;
  const certs = cleanCerts(cv.certifications);
  const edu = cleanEducation(cv.education);
  const langs = cleanLanguages(cv.languages);
  const skills = (cv.skills || []).filter((s) => s && String(s).trim());
  const contactLines = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean) as string[];

  return (
    <div
      className="bg-white text-gray-900 break-words"
      style={{
        fontFamily: "'JetBrains Mono','Inter','Segoe UI',Arial,sans-serif",
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
        lineHeight: 1.5,
        fontSize: '13px',
        display: 'grid',
        gridTemplateColumns: 'minmax(170px,32%) 1fr',
        minHeight: '100%',
      }}
    >
      {/* ── Dark sidebar ───────────────────────────────────────────── */}
      <aside
        className="p-5 sm:p-6"
        style={{ background: DARK, color: '#e5e7eb' }}
      >
        {photo && (
          <div
            className="mb-4 overflow-hidden"
            style={{
              width: 100, height: 100, borderRadius: 12,
              border: `1px solid rgba(34,211,238,0.35)`,
              boxShadow: `0 0 30px rgba(34,211,238,0.20)`,
            }}
          >
            <img src={photo} alt={cv.full_name || 'Profile'} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Terminal-style name tag */}
        <div className="mb-3" style={{ fontFamily: "'JetBrains Mono',monospace" }}>
          <span style={{ color: CYAN, fontSize: 12 }}>$</span>{' '}
          <span style={{ color: 'rgba(229,231,235,0.55)', fontSize: 12 }}>whoami</span>
        </div>
        <h1
          className="font-bold leading-tight mb-1"
          style={{ fontSize: '22px', letterSpacing: '-0.01em', color: '#fff' }}
        >
          {cv.full_name || 'Your Name'}
        </h1>
        <div style={{ height: 2, background: CYAN, width: 28, marginTop: 6, marginBottom: 18 }} />

        {contactLines.length > 0 && (
          <SideSection title="// contact">
            <ul className="space-y-1">
              {contactLines.map((c, i) => (
                <li key={i} className="text-[11.5px] break-all" style={{ color: 'rgba(229,231,235,0.78)' }}>{c}</li>
              ))}
            </ul>
          </SideSection>
        )}

        {skills.length > 0 && (
          <SideSection title="// stack">
            <div className="flex flex-wrap gap-1">
              {skills.map((s, i) => (
                <span
                  key={i}
                  className="text-[11px]"
                  style={{
                    padding: '3px 8px',
                    borderRadius: 4,
                    background: 'rgba(34,211,238,0.10)',
                    border: '1px solid rgba(34,211,238,0.30)',
                    color: '#a5f3fc',
                    fontFamily: "'JetBrains Mono',monospace",
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          </SideSection>
        )}

        {langs.length > 0 && (
          <SideSection title="// langs">
            <ul className="space-y-1">
              {langs.map((l, i) => (
                <li key={i} className="text-[11.5px]" style={{ color: 'rgba(229,231,235,0.85)' }}>{langText(l)}</li>
              ))}
            </ul>
          </SideSection>
        )}

        {certs.length > 0 && (
          <SideSection title="// certs" last>
            <ul className="space-y-2">
              {certs.map((c, i) => (
                <li key={i} className="text-[11.5px]" style={{ color: 'rgba(229,231,235,0.85)' }}>
                  <span className="block font-semibold" style={{ color: '#fff' }}>{certText(c)}</span>
                  <CertExtras cert={c} subSize={11} subColor="white-70" />
                </li>
              ))}
            </ul>
          </SideSection>
        )}
      </aside>

      {/* ── Main column ────────────────────────────────────────────── */}
      <main className="p-5 sm:p-7" style={{ background: '#fafafa' }}>
        {cv.summary && (
          <MainSection title="README.md">
            <p
              className="text-[13px] text-gray-800 rounded p-3"
              style={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                fontFamily: "'Inter',sans-serif",
                lineHeight: 1.6,
              }}
            >
              {cv.summary}
            </p>
          </MainSection>
        )}

        {cv.experience && cv.experience.length > 0 && (
          <MainSection title="experience.log">
            {cv.experience.map((role, i) => (
              <div
                key={i}
                className="mb-3 rounded p-3"
                style={{ background: '#fff', border: '1px solid #e5e7eb' }}
              >
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <p className="font-bold text-[14px]" style={{ color: DARK, fontFamily: "'Inter',sans-serif" }}>
                    {role.title}
                  </p>
                  {role.duration && (
                    <span
                      className="text-[10.5px] font-bold"
                      style={{
                        color: '#0e7490',
                        background: 'rgba(34,211,238,0.10)',
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontFamily: "'JetBrains Mono',monospace",
                      }}
                    >
                      {role.duration}
                    </span>
                  )}
                </div>
                {role.company && (
                  <p className="text-[12px] text-gray-600" style={{ fontFamily: "'Inter',sans-serif" }}>{role.company}</p>
                )}
                {role.bullets && role.bullets.length > 0 && (
                  <ul className="mt-2 space-y-0.5">
                    {role.bullets.map((b, j) => (
                      <li
                        key={j}
                        className="text-[12.5px] text-gray-800 flex gap-2"
                        style={{ fontFamily: "'Inter',sans-serif" }}
                      >
                        <span style={{ color: CYAN, fontFamily: "'JetBrains Mono',monospace" }}>→</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </MainSection>
        )}

        {edu.length > 0 && (
          <MainSection title="education.txt" last>
            {edu.map((e, i) => (
              <div key={i} className="mb-2">
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <p
                    className="font-semibold text-[13px]"
                    style={{ color: DARK, fontFamily: "'Inter',sans-serif" }}
                  >
                    {[e.degree, e.institution].filter(Boolean).join(' — ')}
                  </p>
                  {e.year && (
                    <span
                      className="text-[10.5px] font-bold"
                      style={{
                        color: '#0e7490',
                        fontFamily: "'JetBrains Mono',monospace",
                      }}
                    >{e.year}</span>
                  )}
                </div>
                <EduExtras e={e} subSize={11.5} subColor="gray-600" />
              </div>
            ))}
          </MainSection>
        )}
      </main>
    </div>
  );
}

function SideSection({ title, children, last }: { title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <section className={last ? '' : 'mb-5'}>
      <h2
        className="font-bold mb-2"
        style={{
          color: CYAN,
          fontSize: '11px',
          letterSpacing: '1px',
          fontFamily: "'JetBrains Mono',monospace",
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function MainSection({ title, children, last }: { title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <section className={last ? '' : 'mb-5'}>
      <h2
        className="font-bold mb-3"
        style={{
          color: DARK,
          fontSize: '12px',
          letterSpacing: '1px',
          fontFamily: "'JetBrains Mono',monospace",
        }}
      >
        <span style={{ color: CYAN }}>#</span> {title}
      </h2>
      {children}
    </section>
  );
}
