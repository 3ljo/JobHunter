'use client';

import type { TemplateProps } from './types';
import { certText, cleanCerts, cleanEducation, cleanLanguages, langText } from './types';
import { EduExtras, CertExtras } from './TemplateExtras';

const ACCENT = '#2563eb';

export default function TimelineCareer({ cv }: TemplateProps) {
  if (!cv) return null;
  const contactParts = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean) as string[];
  const certs = cleanCerts(cv.certifications);
  const edu = cleanEducation(cv.education);
  const langs = cleanLanguages(cv.languages);
  const skills = (cv.skills || []).filter((s) => s && String(s).trim());
  const exp = cv.experience || [];

  return (
    <div
      className="bg-white text-gray-900 px-6 sm:px-10 py-7 break-words"
      style={{
        fontFamily: "'Inter','Segoe UI',Arial,sans-serif",
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
        lineHeight: 1.5,
        fontSize: '13.5px',
      }}
    >
      <h1 className="font-bold" style={{ fontSize: '26px', color: '#0f172a', letterSpacing: '-0.01em' }}>
        {cv.full_name || 'Your Name'}
      </h1>
      {contactParts.length > 0 && (
        <p className="text-[12px] text-gray-600 mt-1 break-all">{contactParts.join('  ·  ')}</p>
      )}

      <div style={{ height: 2, background: ACCENT, marginTop: 14, marginBottom: 18, width: 60 }} />

      {cv.summary && (
        <Section title="Profile">
          <p className="text-[13.5px] text-gray-800">{cv.summary}</p>
        </Section>
      )}

      {exp.length > 0 && (
        <Section title="Career Timeline">
          <div className="relative pl-6" style={{ borderLeft: `2px solid ${ACCENT}` }}>
            {exp.map((role, i) => (
              <div key={i} className="relative mb-5">
                <span
                  aria-hidden
                  className="absolute"
                  style={{
                    left: -31,
                    top: 4,
                    width: 12,
                    height: 12,
                    borderRadius: 999,
                    background: '#fff',
                    border: `3px solid ${ACCENT}`,
                  }}
                />
                {role.duration && (
                  <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: ACCENT }}>
                    {role.duration}
                  </p>
                )}
                <p className="font-bold text-[14px] text-gray-900 mt-0.5">{role.title}</p>
                {role.company && <p className="text-[12.5px] text-gray-600 italic">{role.company}</p>}
                {role.bullets && role.bullets.length > 0 && (
                  <ul className="mt-1.5 ml-4 list-disc space-y-0.5">
                    {role.bullets.map((b, j) => (
                      <li key={j} className="text-[13px] text-gray-800">{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {skills.length > 0 && (
        <Section title="Skills">
          <div className="flex flex-wrap gap-1.5">
            {skills.map((s, i) => (
              <span
                key={i}
                className="text-[12px] px-2 py-0.5 rounded"
                style={{ background: 'rgba(37,99,235,0.10)', color: ACCENT }}
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
            <div key={i} className="mb-1.5">
              <p className="text-[13.5px] text-gray-800">
                {[e.degree, e.institution, e.year].filter(Boolean).join(' — ')}
              </p>
              <EduExtras e={e} subSize={12} subColor="gray-600" />
            </div>
          ))}
        </Section>
      )}

      {langs.length > 0 && (
        <Section title="Languages">
          <p className="text-[13.5px] text-gray-800">{langs.map((l) => langText(l)).join(' · ')}</p>
        </Section>
      )}

      {certs.length > 0 && (
        <Section title="Certifications" last>
          {certs.map((c, i) => (
            <div key={i} className="mb-1.5">
              <p className="text-[13px] text-gray-800">{certText(c)}</p>
              <CertExtras cert={c} subSize={12} subColor="gray-600" />
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({ title, children, last }: { title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <section className={last ? '' : 'mb-5'}>
      <h2
        className="font-bold uppercase mb-2"
        style={{ fontSize: '11px', letterSpacing: '0.18em', color: '#0f172a' }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
