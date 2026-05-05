'use client';

import type { TemplateProps } from './types';
import { certText, cleanCerts, cleanEducation, cleanLanguages, langText } from './types';
import { EduExtras, CertExtras } from './TemplateExtras';

const FED_BLUE = '#002868';

export default function GovernmentFederal({ cv }: TemplateProps) {
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
        fontFamily: "'Times New Roman', Georgia, serif",
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
        lineHeight: 1.45,
        fontSize: '13.5px',
      }}
    >
      <h1 className="text-center font-bold uppercase" style={{ fontSize: '22px', color: FED_BLUE, letterSpacing: '0.04em' }}>
        {cv.full_name || 'Your Name'}
      </h1>
      {contactParts.length > 0 && (
        <p className="text-center text-[12px] text-gray-700 mt-1 break-all">
          {contactParts.join('  |  ')}
        </p>
      )}
      <div style={{ borderTop: `3px double ${FED_BLUE}`, marginTop: 10, marginBottom: 18 }} />

      {cv.summary && (
        <Section title="Career Objective">
          <p className="text-[13.5px] text-gray-800">{cv.summary}</p>
        </Section>
      )}

      {cv.experience && cv.experience.length > 0 && (
        <Section title="Professional Experience">
          {cv.experience.map((role, i) => (
            <div key={i} className="mb-3.5">
              <p className="font-bold text-[13.5px] uppercase" style={{ color: FED_BLUE }}>{role.title}</p>
              <p className="text-[12.5px] text-gray-700">
                {[role.company, role.duration].filter(Boolean).join('   |   ')}
              </p>
              {role.bullets && role.bullets.length > 0 && (
                <ul className="mt-1 ml-5 space-y-0.5">
                  {role.bullets.map((b, j) => (
                    <li key={j} className="text-[13.5px] text-gray-800 list-disc">{b}</li>
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
            <div key={i} className="mb-1.5">
              <p className="font-bold text-[13.5px]" style={{ color: FED_BLUE }}>
                {[e.degree, e.institution].filter(Boolean).join(' — ')}
              </p>
              {e.year && <p className="text-[12px] text-gray-700">{e.year}</p>}
              <EduExtras e={e} subSize={12} subColor="gray-600" />
            </div>
          ))}
        </Section>
      )}

      {skills.length > 0 && (
        <Section title="Core Competencies">
          <p className="text-[13.5px] text-gray-800">{skills.join('  ·  ')}</p>
        </Section>
      )}

      {certs.length > 0 && (
        <Section title="Certifications & Clearances">
          {certs.map((c, i) => (
            <div key={i} className="mb-1.5">
              <p className="font-semibold text-[13px] text-gray-800">{certText(c)}</p>
              <CertExtras cert={c} subSize={12} subColor="gray-600" />
            </div>
          ))}
        </Section>
      )}

      {langs.length > 0 && (
        <Section title="Languages" last>
          <p className="text-[13.5px] text-gray-800">{langs.map((l) => langText(l)).join('  ·  ')}</p>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children, last }: { title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <section className={last ? '' : 'mb-5'}>
      <h2
        className="font-bold uppercase mb-2 pb-1"
        style={{
          fontSize: '12px',
          letterSpacing: '0.18em',
          color: FED_BLUE,
          borderBottom: `2px solid ${FED_BLUE}`,
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
