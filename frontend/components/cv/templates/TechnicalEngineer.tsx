'use client';

import type { TemplateProps } from './types';
import { certText, cleanCerts, cleanEducation, cleanLanguages, langText } from './types';
import { EduExtras, CertExtras } from './TemplateExtras';

export default function TechnicalEngineer({ cv }: TemplateProps) {
  if (!cv) return null;
  const contactParts = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean);
  const certs = cleanCerts(cv.certifications);
  const edu = cleanEducation(cv.education);
  const langs = cleanLanguages(cv.languages);
  const skills = (cv.skills || []).filter((s) => s && String(s).trim());

  return (
    <div
      className="bg-white text-gray-900 p-5 sm:p-8 md:p-10 break-words"
      style={{
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
        lineHeight: 1.4,
        fontSize: '14px',
      }}
    >
      <h1
        className="text-2xl sm:text-[26px] font-bold tracking-tight"
        style={{ color: '#0f172a', letterSpacing: '-0.01em' }}
      >
        {cv.full_name || 'Your Name'}
      </h1>

      {contactParts.length > 0 && (
        <p className="text-[11px] sm:text-xs md:text-sm text-gray-600 mt-1 break-all">
          {contactParts.join('  ·  ')}
        </p>
      )}

      <div style={{ height: '2px', background: '#0ea5e9', margin: '10px 0 14px' }} />

      {skills.length > 0 && (
        <Section title="Technical Skills">
          <p
            className="text-[13px] sm:text-sm text-gray-800"
            style={{ fontFamily: "'JetBrains Mono', 'Consolas', 'Menlo', monospace", fontSize: '12.5px' }}
          >
            {skills.join(' · ')}
          </p>
        </Section>
      )}

      {cv.summary && (
        <Section title="Summary">
          <p className="text-[13px] sm:text-sm text-gray-800">{cv.summary}</p>
        </Section>
      )}

      {cv.experience && cv.experience.length > 0 && (
        <Section title="Experience">
          {cv.experience.map((role, i) => (
            <div key={i} className="mb-3">
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <p className="font-semibold text-[13px] sm:text-sm text-gray-900">
                  {role.title}
                  {role.company && <span className="font-normal text-gray-700"> — {role.company}</span>}
                </p>
                {role.duration && (
                  <span className="text-[12px] text-gray-500 whitespace-nowrap">{role.duration}</span>
                )}
              </div>
              {role.bullets && role.bullets.length > 0 && (
                <ul className="mt-1 ml-5 list-disc space-y-0.5">
                  {role.bullets.map((b, j) => (
                    <li key={j} className="text-[13px] sm:text-sm text-gray-800">{b}</li>
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
              <p className="text-[13px] sm:text-sm text-gray-800">
                {[e.degree, e.institution, e.year].filter(Boolean).join(' — ')}
              </p>
              <EduExtras e={e} subSize={12} subColor="gray-600" />
            </div>
          ))}
        </Section>
      )}

      {langs.length > 0 && (
        <Section title="Languages">
          <p className="text-[13px] sm:text-sm text-gray-800">
            {langs.map((l) => langText(l)).join(' · ')}
          </p>
        </Section>
      )}

      {certs.length > 0 && (
        <Section title="Certifications" last>
          {certs.map((cert, i) => (
            <div key={i} className="mb-1.5">
              <p className="text-[13px] sm:text-sm text-gray-800">{certText(cert)}</p>
              <CertExtras cert={cert} subSize={12} subColor="gray-600" />
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({ title, children, last }: { title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <section className={last ? '' : 'mb-4'}>
      <h2
        className="text-[11px] sm:text-xs font-bold uppercase mb-2"
        style={{ color: '#0ea5e9', letterSpacing: '2px' }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
