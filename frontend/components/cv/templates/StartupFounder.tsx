'use client';

import type { TemplateProps } from './types';
import { certText, cleanCerts, cleanEducation, cleanLanguages, langText } from './types';
import { EduExtras, CertExtras } from './TemplateExtras';

const NEON = '#22c55e';
const INK = '#0a0a0a';

export default function StartupFounder({ cv }: TemplateProps) {
  if (!cv) return null;
  const contactParts = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean) as string[];
  const certs = cleanCerts(cv.certifications);
  const edu = cleanEducation(cv.education);
  const langs = cleanLanguages(cv.languages);
  const skills = (cv.skills || []).filter((s) => s && String(s).trim());

  return (
    <div
      className="bg-white text-gray-900 px-6 sm:px-10 py-8 break-words"
      style={{
        fontFamily: "'Inter','SF Pro Text',Arial,sans-serif",
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
        lineHeight: 1.5,
        fontSize: '13.5px',
      }}
    >
      <div className="flex items-baseline gap-3 flex-wrap">
        <h1 className="font-black leading-none" style={{ fontSize: '32px', color: INK, letterSpacing: '-0.03em' }}>
          {cv.full_name || 'Your Name'}
        </h1>
        <span
          className="text-[10px] font-bold uppercase tracking-[0.18em] px-2 py-0.5 rounded"
          style={{ background: NEON, color: INK }}
        >
          shipping
        </span>
      </div>
      {contactParts.length > 0 && (
        <p className="text-[12px] text-gray-600 mt-2 break-all">{contactParts.join('  ·  ')}</p>
      )}

      <div className="mt-6">
        {cv.summary && (
          <Section title="01 · Mission">
            <p className="text-[14px] text-gray-800">{cv.summary}</p>
          </Section>
        )}

        {cv.experience && cv.experience.length > 0 && (
          <Section title="02 · Track Record">
            {cv.experience.map((role, i) => (
              <div key={i} className="mb-4">
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <p className="font-bold text-[14px]" style={{ color: INK }}>
                    {role.title}
                  </p>
                  {role.duration && (
                    <p className="text-[11px] font-mono px-2 py-0.5 rounded" style={{ background: '#f4f4f5', color: '#52525b' }}>
                      {role.duration}
                    </p>
                  )}
                </div>
                {role.company && (
                  <p className="text-[12.5px] text-gray-600">
                    <span style={{ color: NEON, fontWeight: 700 }}>→</span> {role.company}
                  </p>
                )}
                {role.bullets && role.bullets.length > 0 && (
                  <ul className="mt-1.5 ml-1 space-y-0.5">
                    {role.bullets.map((b, j) => (
                      <li key={j} className="text-[13px] text-gray-800 flex gap-2">
                        <span style={{ color: NEON }}>▸</span>
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
          <Section title="03 · Stack">
            <div className="flex flex-wrap gap-1.5">
              {skills.map((s, i) => (
                <span
                  key={i}
                  className="text-[12px] px-2 py-0.5 rounded-md font-mono"
                  style={{ background: '#f4f4f5', color: INK }}
                >
                  {s}
                </span>
              ))}
            </div>
          </Section>
        )}

        {edu.length > 0 && (
          <Section title="04 · Education">
            {edu.map((e, i) => (
              <div key={i} className="mb-1.5">
                <p className="text-[13.5px] text-gray-800">{[e.degree, e.institution, e.year].filter(Boolean).join(' — ')}</p>
                <EduExtras e={e} subSize={12} subColor="gray-600" />
              </div>
            ))}
          </Section>
        )}

        {certs.length > 0 && (
          <Section title="05 · Certifications">
            {certs.map((c, i) => (
              <div key={i} className="mb-1.5">
                <p className="text-[13px] font-semibold text-gray-800">{certText(c)}</p>
                <CertExtras cert={c} subSize={12} subColor="gray-600" />
              </div>
            ))}
          </Section>
        )}

        {langs.length > 0 && (
          <Section title="06 · Languages" last>
            <p className="text-[13.5px] text-gray-800">{langs.map((l) => langText(l)).join('  ·  ')}</p>
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
        className="font-bold uppercase mb-2"
        style={{ fontSize: '11px', letterSpacing: '0.16em', color: INK }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
