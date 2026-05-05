'use client';

import type { TemplateProps } from './types';
import { certText, cleanCerts, cleanEducation, cleanLanguages, langText } from './types';
import { EduExtras, CertExtras } from './TemplateExtras';

const TEAL = '#0d9488';
const TEAL_DARK = '#115e59';

export default function HealthcareProfessional({ cv, photo }: TemplateProps) {
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
      <div style={{ background: TEAL, height: 6 }} />
      <div className="px-6 sm:px-10 pt-7 pb-3 flex items-start gap-5 flex-wrap">
        {photo && (
          <div
            className="overflow-hidden shrink-0"
            style={{ width: 96, height: 96, borderRadius: '50%', border: `3px solid ${TEAL}` }}
          >
            <img src={photo} alt={cv.full_name || 'Profile'} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="font-bold leading-tight" style={{ fontSize: '26px', color: TEAL_DARK, letterSpacing: '-0.01em' }}>
            {cv.full_name || 'Your Name'}
          </h1>
          {contactParts.length > 0 && (
            <p className="text-[12px] text-gray-600 mt-1 break-all">{contactParts.join('  ·  ')}</p>
          )}
        </div>
      </div>

      <div className="px-6 sm:px-10 pb-7">
        {cv.summary && (
          <Section title="Profile">
            <p className="text-[13.5px] text-gray-800">{cv.summary}</p>
          </Section>
        )}

        {cv.experience && cv.experience.length > 0 && (
          <Section title="Clinical / Professional Experience">
            {cv.experience.map((role, i) => (
              <div key={i} className="mb-3.5">
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <p className="font-bold text-[14px]" style={{ color: TEAL_DARK }}>{role.title}</p>
                  {role.duration && (
                    <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: TEAL }}>
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
          <Section title="Clinical Competencies">
            <div className="flex flex-wrap gap-1.5">
              {skills.map((s, i) => (
                <span
                  key={i}
                  className="text-[12px] px-2.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(13,148,136,0.10)', color: TEAL_DARK }}
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

        {certs.length > 0 && (
          <Section title="Licenses & Certifications">
            {certs.map((c, i) => (
              <div key={i} className="mb-1.5">
                <p className="text-[13px] text-gray-800 font-semibold">{certText(c)}</p>
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
      <h2
        className="font-bold uppercase mb-2 pb-1"
        style={{
          fontSize: '11px',
          letterSpacing: '0.16em',
          color: TEAL_DARK,
          borderBottom: `1.5px solid ${TEAL}`,
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
