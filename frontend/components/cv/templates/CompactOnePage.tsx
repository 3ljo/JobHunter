'use client';

import type { TemplateProps } from './types';
import { certText, certUrl, cleanCerts, cleanEducation, cleanLanguages, langText } from './types';
import { EduExtras } from './TemplateExtras';

export default function CompactOnePage({ cv }: TemplateProps) {
  if (!cv) return null;
  const contactParts = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean);
  const certs = cleanCerts(cv.certifications);
  const edu = cleanEducation(cv.education);
  const langs = cleanLanguages(cv.languages);
  const skills = (cv.skills || []).filter((s) => s && String(s).trim());

  return (
    <div
      className="bg-white text-gray-900 p-4 sm:p-6 md:p-7 break-words"
      style={{
        fontFamily: "Arial, 'Helvetica', sans-serif",
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
        lineHeight: 1.25,
        fontSize: '12.5px',
      }}
    >
      <h1 className="text-xl sm:text-[22px] font-bold" style={{ color: '#111' }}>
        {cv.full_name || 'Your Name'}
      </h1>

      {contactParts.length > 0 && (
        <p className="text-[11px] sm:text-xs text-gray-700 mt-0.5 break-all">
          {contactParts.join(' | ')}
        </p>
      )}

      <hr className="my-2 border-t border-gray-700" />

      {cv.summary && (
        <Section title="Summary">
          <p className="text-[12px] text-gray-800">{cv.summary}</p>
        </Section>
      )}

      {cv.experience && cv.experience.length > 0 && (
        <Section title="Experience">
          {cv.experience.map((role, i) => (
            <div key={i} className="mb-1.5">
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <p className="font-bold text-[12.5px] text-gray-900">
                  {role.title}
                  {role.company && <span className="font-normal text-gray-700"> · {role.company}</span>}
                </p>
                {role.duration && (
                  <span className="text-[11px] text-gray-600 whitespace-nowrap">{role.duration}</span>
                )}
              </div>
              {role.bullets && role.bullets.length > 0 && (
                <ul className="mt-0.5 ml-4 list-disc">
                  {role.bullets.map((b, j) => (
                    <li key={j} className="text-[12px] text-gray-800" style={{ marginBottom: 0 }}>{b}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </Section>
      )}

      {skills.length > 0 && (
        <Section title="Skills">
          <p className="text-[12px] text-gray-800">{skills.join(' · ')}</p>
        </Section>
      )}

      {edu.length > 0 && (
        <Section title="Education">
          {edu.map((e, i) => (
            <div key={i}>
              <p className="text-[12px] text-gray-800" style={{ marginBottom: 0 }}>
                {[e.degree, e.institution, e.year].filter(Boolean).join(' — ')}
              </p>
              <EduExtras e={e} subSize={10.5} subColor="gray-600" />
            </div>
          ))}
        </Section>
      )}

      {langs.length > 0 && (
        <Section title="Languages">
          <p className="text-[12px] text-gray-800">
            {langs.map((l) => langText(l)).join(' · ')}
          </p>
        </Section>
      )}

      {certs.length > 0 && (
        <Section title="Certifications" last>
          {certs.some((c) => certUrl(c)) ? (
            <div className="space-y-0.5">
              {certs.map((c, i) => {
                const url = certUrl(c);
                return (
                  <p key={i} className="text-[12px] text-gray-800" style={{ marginBottom: 0 }}>
                    {certText(c)}
                    {url && (
                      <>
                        {' — '}
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline break-all"
                          style={{ color: '#1d4ed8', fontSize: 10.5, wordBreak: 'break-all' }}
                        >
                          {url}
                        </a>
                      </>
                    )}
                  </p>
                );
              })}
            </div>
          ) : (
            <p className="text-[12px] text-gray-800">
              {certs.map((c) => certText(c)).filter(Boolean).join(' · ')}
            </p>
          )}
        </Section>
      )}
    </div>
  );
}

function Section({ title, children, last }: { title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <section className={last ? '' : 'mb-2'}>
      <h2 className="text-[11px] font-bold uppercase text-gray-900 border-b border-gray-400 pb-0.5 mb-1">
        {title}
      </h2>
      {children}
    </section>
  );
}
