'use client';

import type { TemplateProps } from './types';
import { certText, cleanCerts, cleanEducation, cleanLanguages, langText } from './types';
import { EduExtras, CertExtras } from './TemplateExtras';

const MAGENTA = '#db2777';
const ORANGE = '#f97316';

export default function MarketingSpotlight({ cv }: TemplateProps) {
  if (!cv) return null;
  const contactParts = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean) as string[];
  const certs = cleanCerts(cv.certifications);
  const edu = cleanEducation(cv.education);
  const langs = cleanLanguages(cv.languages);
  const skills = (cv.skills || []).filter((s) => s && String(s).trim());

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
      <div
        className="px-6 sm:px-10 py-7 text-white"
        style={{ background: `linear-gradient(90deg, ${MAGENTA} 0%, ${ORANGE} 100%)` }}
      >
        <h1 className="font-black leading-tight" style={{ fontSize: '30px', letterSpacing: '-0.02em' }}>
          {cv.full_name || 'Your Name'}
        </h1>
        {contactParts.length > 0 && (
          <p className="text-[12px] mt-2 break-all" style={{ color: 'rgba(255,255,255,0.9)' }}>
            {contactParts.join('  ·  ')}
          </p>
        )}
      </div>

      <div className="px-6 sm:px-10 py-7">
        {cv.summary && (
          <Section title="The Pitch">
            <p className="text-[14px] text-gray-800">{cv.summary}</p>
          </Section>
        )}

        {cv.experience && cv.experience.length > 0 && (
          <Section title="Campaigns & Roles">
            {cv.experience.map((role, i) => (
              <div key={i} className="mb-4">
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <p className="font-bold text-[14px]" style={{ color: MAGENTA }}>{role.title}</p>
                  {role.duration && (
                    <p
                      className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(249,115,22,0.15)', color: ORANGE }}
                    >
                      {role.duration}
                    </p>
                  )}
                </div>
                {role.company && <p className="text-[12.5px] italic text-gray-600">{role.company}</p>}
                {role.bullets && role.bullets.length > 0 && (
                  <ul className="mt-1.5 ml-4 list-disc space-y-0.5">
                    {role.bullets.map((b, j) => (
                      <li key={j} className="text-[13px] text-gray-800">{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </Section>
        )}

        {skills.length > 0 && (
          <Section title="Toolkit">
            <div className="flex flex-wrap gap-1.5">
              {skills.map((s, i) => (
                <span
                  key={i}
                  className="text-[12px] px-2.5 py-0.5 rounded-md font-medium"
                  style={{ background: 'rgba(219,39,119,0.10)', color: MAGENTA }}
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
                <p className="text-[13.5px] text-gray-800">{[e.degree, e.institution, e.year].filter(Boolean).join(' — ')}</p>
                <EduExtras e={e} subSize={12} subColor="gray-600" />
              </div>
            ))}
          </Section>
        )}

        {certs.length > 0 && (
          <Section title="Certifications">
            {certs.map((c, i) => (
              <div key={i} className="mb-1.5">
                <p className="text-[13px] font-semibold text-gray-800">{certText(c)}</p>
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
    </div>
  );
}

function Section({ title, children, last }: { title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <section className={last ? '' : 'mb-5'}>
      <h2 className="font-black uppercase mb-2 flex items-center gap-2" style={{ fontSize: '11.5px', letterSpacing: '0.20em', color: '#0f172a' }}>
        <span style={{ width: 18, height: 3, background: MAGENTA, display: 'inline-block' }} />
        {title}
      </h2>
      {children}
    </section>
  );
}
