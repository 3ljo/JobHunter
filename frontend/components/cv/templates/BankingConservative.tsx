'use client';

import type { TemplateProps } from './types';
import { certText, cleanCerts, cleanEducation, cleanLanguages, langText } from './types';
import { EduExtras, CertExtras } from './TemplateExtras';

const NAVY = '#0c1d3d';

export default function BankingConservative({ cv }: TemplateProps) {
  if (!cv) return null;
  const contactParts = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean) as string[];
  const certs = cleanCerts(cv.certifications);
  const edu = cleanEducation(cv.education);
  const langs = cleanLanguages(cv.languages);
  const skills = (cv.skills || []).filter((s) => s && String(s).trim());

  return (
    <div
      className="bg-white text-gray-900 px-6 sm:px-12 py-9 break-words"
      style={{
        fontFamily: "'Times New Roman', Georgia, 'Garamond', serif",
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
        lineHeight: 1.5,
        fontSize: '14px',
      }}
    >
      <div style={{ borderTop: `2px solid ${NAVY}`, borderBottom: `1px solid ${NAVY}`, padding: '14px 0' }}>
        <h1
          className="text-center font-semibold"
          style={{ fontSize: '26px', color: NAVY, letterSpacing: '0.03em' }}
        >
          {cv.full_name || 'Your Name'}
        </h1>
        {contactParts.length > 0 && (
          <p className="text-center text-[12px] text-gray-700 mt-2 break-all">
            {contactParts.join('  ·  ')}
          </p>
        )}
      </div>

      <div className="mt-6">
        {cv.summary && (
          <Section title="Professional Summary">
            <p className="text-[14px] text-gray-800">{cv.summary}</p>
          </Section>
        )}

        {cv.experience && cv.experience.length > 0 && (
          <Section title="Professional Experience">
            {cv.experience.map((role, i) => (
              <div key={i} className="mb-4">
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <p className="font-bold text-[14px]" style={{ color: NAVY }}>{role.title}</p>
                  {role.duration && <p className="text-[12px] italic text-gray-600">{role.duration}</p>}
                </div>
                {role.company && <p className="text-[13px] italic text-gray-700">{role.company}</p>}
                {role.bullets && role.bullets.length > 0 && (
                  <ul className="mt-1 ml-5 list-disc space-y-0.5">
                    {role.bullets.map((b, j) => (
                      <li key={j} className="text-[13.5px] text-gray-800">{b}</li>
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
                <p className="font-semibold text-[13.5px]" style={{ color: NAVY }}>
                  {[e.degree, e.institution].filter(Boolean).join(' — ')}
                </p>
                {e.year && <p className="text-[12px] italic text-gray-600">{e.year}</p>}
                <EduExtras e={e} subSize={12} subColor="gray-600" />
              </div>
            ))}
          </Section>
        )}

        {skills.length > 0 && (
          <Section title="Areas of Expertise">
            <p className="text-[14px] text-gray-800">{skills.join('  ·  ')}</p>
          </Section>
        )}

        {certs.length > 0 && (
          <Section title="Certifications">
            {certs.map((c, i) => (
              <div key={i} className="mb-1.5">
                <p className="text-[13.5px] text-gray-800 font-semibold">{certText(c)}</p>
                <CertExtras cert={c} subSize={12} subColor="gray-600" />
              </div>
            ))}
          </Section>
        )}

        {langs.length > 0 && (
          <Section title="Languages" last>
            <p className="text-[14px] text-gray-800">{langs.map((l) => langText(l)).join('  ·  ')}</p>
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
        className="font-bold uppercase mb-2 pb-1"
        style={{
          fontSize: '11.5px',
          letterSpacing: '0.18em',
          color: NAVY,
          borderBottom: `1px solid ${NAVY}`,
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
