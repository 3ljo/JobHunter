'use client';

import type { TemplateProps } from './types';
import { certText, cleanCerts, cleanEducation, cleanLanguages, langText } from './types';
import { EduExtras, CertExtras } from './TemplateExtras';

const BURGUNDY = '#7f1d1d';

export default function LegalFormal({ cv }: TemplateProps) {
  if (!cv) return null;
  const contactParts = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean) as string[];
  const certs = cleanCerts(cv.certifications);
  const edu = cleanEducation(cv.education);
  const langs = cleanLanguages(cv.languages);
  const skills = (cv.skills || []).filter((s) => s && String(s).trim());

  return (
    <div
      className="bg-white text-gray-900 px-6 sm:px-12 py-10 break-words"
      style={{
        fontFamily: "'Garamond', 'Georgia', 'Times New Roman', serif",
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
        lineHeight: 1.55,
        fontSize: '14.5px',
      }}
    >
      <div className="text-center">
        <h1
          className="font-semibold tracking-tight"
          style={{ fontSize: '28px', color: '#1a1a1a', letterSpacing: '0.05em' }}
        >
          {cv.full_name || 'Your Name'}
        </h1>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span style={{ width: 36, height: 1, background: BURGUNDY }} />
          <span style={{ width: 6, height: 6, background: BURGUNDY, transform: 'rotate(45deg)' }} />
          <span style={{ width: 36, height: 1, background: BURGUNDY }} />
        </div>
        {contactParts.length > 0 && (
          <p className="text-[12.5px] text-gray-700 mt-3 break-all">{contactParts.join('  ·  ')}</p>
        )}
      </div>

      <div className="mt-7">
        {cv.summary && (
          <Section title="Summary of Practice">
            <p className="text-[14.5px] text-gray-800 italic">{cv.summary}</p>
          </Section>
        )}

        {cv.experience && cv.experience.length > 0 && (
          <Section title="Professional Experience">
            {cv.experience.map((role, i) => (
              <div key={i} className="mb-4">
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <p className="font-bold text-[14.5px]" style={{ color: BURGUNDY }}>{role.title}</p>
                  {role.duration && <p className="text-[12.5px] italic text-gray-600">{role.duration}</p>}
                </div>
                {role.company && <p className="text-[13px] italic text-gray-700">{role.company}</p>}
                {role.bullets && role.bullets.length > 0 && (
                  <ul className="mt-1 ml-5 list-disc space-y-0.5">
                    {role.bullets.map((b, j) => (
                      <li key={j} className="text-[14px] text-gray-800">{b}</li>
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
                <p className="font-semibold text-[14px]" style={{ color: BURGUNDY }}>
                  {[e.degree, e.institution].filter(Boolean).join(' — ')}
                </p>
                {e.year && <p className="text-[12.5px] italic text-gray-600">{e.year}</p>}
                <EduExtras e={e} subSize={12.5} subColor="gray-600" />
              </div>
            ))}
          </Section>
        )}

        {skills.length > 0 && (
          <Section title="Areas of Practice">
            <p className="text-[14px] text-gray-800">{skills.join('  ·  ')}</p>
          </Section>
        )}

        {certs.length > 0 && (
          <Section title="Bar Admissions & Certifications">
            {certs.map((c, i) => (
              <div key={i} className="mb-1.5">
                <p className="text-[13.5px] font-semibold text-gray-800">{certText(c)}</p>
                <CertExtras cert={c} subSize={12.5} subColor="gray-600" />
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
        className="text-center font-bold uppercase mb-3"
        style={{ fontSize: '11.5px', letterSpacing: '0.28em', color: BURGUNDY }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
