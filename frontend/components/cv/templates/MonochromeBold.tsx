'use client';

import type { TemplateProps } from './types';
import { certText, cleanCerts, cleanEducation, cleanLanguages, langText } from './types';
import { EduExtras, CertExtras } from './TemplateExtras';

export default function MonochromeBold({ cv }: TemplateProps) {
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
        fontFamily: "'Inter','Helvetica Neue',Arial,sans-serif",
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
        lineHeight: 1.5,
        fontSize: '13.5px',
      }}
    >
      <div style={{ background: '#0a0a0a', color: '#fff' }} className="px-6 sm:px-10 py-6">
        <h1
          className="font-black uppercase leading-none"
          style={{ fontSize: '30px', letterSpacing: '-0.02em' }}
        >
          {cv.full_name || 'Your Name'}
        </h1>
        {contactParts.length > 0 && (
          <p className="mt-3 text-[12px] break-all" style={{ color: 'rgba(255,255,255,0.75)' }}>
            {contactParts.join('  /  ')}
          </p>
        )}
      </div>

      <div className="px-6 sm:px-10 py-6">
        {cv.summary && (
          <Section title="Summary">
            <p className="text-[13.5px] text-gray-800">{cv.summary}</p>
          </Section>
        )}

        {cv.experience && cv.experience.length > 0 && (
          <Section title="Experience">
            {cv.experience.map((role, i) => (
              <div key={i} className="mb-4">
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <p className="font-bold text-[14px] uppercase">{role.title}</p>
                  {role.duration && <p className="text-[11px] font-bold">{role.duration}</p>}
                </div>
                {role.company && <p className="text-[12.5px] text-gray-600">{role.company}</p>}
                {role.bullets && role.bullets.length > 0 && (
                  <ul className="mt-1.5 ml-5 list-disc space-y-0.5">
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
          <Section title="Skills">
            <p className="text-[13.5px] text-gray-800">{skills.join(' / ')}</p>
          </Section>
        )}

        {edu.length > 0 && (
          <Section title="Education">
            {edu.map((e, i) => (
              <div key={i} className="mb-2">
                <p className="font-bold text-[13px] uppercase">
                  {[e.degree, e.institution, e.year].filter(Boolean).join(' — ')}
                </p>
                <EduExtras e={e} subSize={12} subColor="gray-600" />
              </div>
            ))}
          </Section>
        )}

        {langs.length > 0 && (
          <Section title="Languages">
            <p className="text-[13.5px] text-gray-800">{langs.map((l) => langText(l)).join(' / ')}</p>
          </Section>
        )}

        {certs.length > 0 && (
          <Section title="Certifications" last>
            {certs.map((c, i) => (
              <div key={i} className="mb-2">
                <p className="text-[13px] font-bold uppercase">{certText(c)}</p>
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
    <section className={last ? '' : 'mb-5'}>
      <h2
        className="font-black uppercase mb-2 pb-1"
        style={{ fontSize: '12px', letterSpacing: '0.22em', borderBottom: '3px solid #0a0a0a' }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
