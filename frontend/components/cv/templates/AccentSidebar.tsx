'use client';

import type { TemplateProps } from './types';
import { certText, cleanCerts, cleanEducation, cleanLanguages, langText } from './types';
import { EduExtras, CertExtras } from './TemplateExtras';

const NAVY = '#0f1f3d';
const AMBER = '#d97706';

export default function AccentSidebar({ cv, photo }: TemplateProps) {
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
        fontFamily: "'Inter','Segoe UI',Arial,sans-serif",
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
        lineHeight: 1.5,
        fontSize: '13.5px',
        display: 'grid',
        gridTemplateColumns: 'minmax(180px,34%) 1fr',
        minHeight: '100%',
      }}
    >
      {/* ── Left sidebar ───────────────────────────────────────────── */}
      <aside
        className="p-5 sm:p-6"
        style={{ background: NAVY, color: '#f8fafc' }}
      >
        {photo && (
          <div
            className="mx-auto mb-4 overflow-hidden"
            style={{
              width: 110, height: 110, borderRadius: '50%',
              border: `3px solid ${AMBER}`,
            }}
          >
            <img src={photo} alt={cv.full_name || 'Profile'} className="w-full h-full object-cover" />
          </div>
        )}

        <h1
          className="font-bold leading-tight"
          style={{ fontSize: '22px', letterSpacing: '-0.01em', color: '#fff' }}
        >
          {cv.full_name || 'Your Name'}
        </h1>
        <div style={{ width: 36, height: 3, background: AMBER, marginTop: 8, marginBottom: 14 }} />

        {contactLines.length > 0 && (
          <SideSection title="Contact">
            <ul className="space-y-1">
              {contactLines.map((c, i) => (
                <li key={i} className="text-[11.5px] break-all" style={{ color: 'rgba(255,255,255,0.78)' }}>{c}</li>
              ))}
            </ul>
          </SideSection>
        )}

        {skills.length > 0 && (
          <SideSection title="Skills">
            <ul className="space-y-1">
              {skills.map((s, i) => (
                <li key={i} className="text-[12px]" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  <span style={{ color: AMBER, marginRight: 6 }}>▸</span>{s}
                </li>
              ))}
            </ul>
          </SideSection>
        )}

        {langs.length > 0 && (
          <SideSection title="Languages">
            <ul className="space-y-1">
              {langs.map((l, i) => (
                <li key={i} className="text-[12px]" style={{ color: 'rgba(255,255,255,0.85)' }}>{langText(l)}</li>
              ))}
            </ul>
          </SideSection>
        )}

        {certs.length > 0 && (
          <SideSection title="Certifications" last>
            <ul className="space-y-2">
              {certs.map((c, i) => (
                <li key={i} className="text-[12px]" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  <span className="block font-semibold" style={{ color: '#fff' }}>{certText(c)}</span>
                  <CertExtras cert={c} subSize={11} subColor="white-70" />
                </li>
              ))}
            </ul>
          </SideSection>
        )}
      </aside>

      {/* ── Main column ────────────────────────────────────────────── */}
      <main className="p-5 sm:p-7">
        {cv.summary && (
          <MainSection title="Profile">
            <p className="text-[13.5px] text-gray-800">{cv.summary}</p>
          </MainSection>
        )}

        {cv.experience && cv.experience.length > 0 && (
          <MainSection title="Experience">
            {cv.experience.map((role, i) => (
              <div key={i} className="mb-4">
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <p className="font-bold text-[14px]" style={{ color: NAVY }}>{role.title}</p>
                  {role.duration && (
                    <p className="text-[11px] font-bold uppercase" style={{ color: AMBER, letterSpacing: '1px' }}>
                      {role.duration}
                    </p>
                  )}
                </div>
                {role.company && (
                  <p className="text-[12.5px] italic text-gray-600">{role.company}</p>
                )}
                {role.bullets && role.bullets.length > 0 && (
                  <ul className="mt-1.5 ml-4 space-y-0.5">
                    {role.bullets.map((b, j) => (
                      <li key={j} className="text-[13px] text-gray-800 list-disc">{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </MainSection>
        )}

        {edu.length > 0 && (
          <MainSection title="Education" last>
            {edu.map((e, i) => (
              <div key={i} className="mb-2">
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <p className="font-semibold text-[13px]" style={{ color: NAVY }}>
                    {[e.degree, e.institution].filter(Boolean).join(' — ')}
                  </p>
                  {e.year && (
                    <p className="text-[11px] font-bold uppercase" style={{ color: AMBER, letterSpacing: '1px' }}>{e.year}</p>
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
          color: AMBER,
          fontSize: '10.5px',
          letterSpacing: '2.5px',
          textTransform: 'uppercase',
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
        className="font-bold uppercase mb-2 pb-1"
        style={{
          color: NAVY,
          fontSize: '11.5px',
          letterSpacing: '3px',
          borderBottom: `2px solid ${NAVY}`,
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
