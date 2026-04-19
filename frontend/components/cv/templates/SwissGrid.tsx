'use client';

import type { TemplateProps } from './types';
import { certText, cleanCerts, cleanEducation, cleanLanguages, langText } from './types';

export default function SwissGrid({ cv, photo }: TemplateProps) {
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
        lineHeight: 1.5,
        fontSize: '13.5px',
      }}
    >
      {photo ? (
        <div className="flex items-start justify-between gap-5">
          <div className="flex-1 min-w-0">
            <h1
              className="text-3xl sm:text-[32px] font-bold"
              style={{ color: '#111', letterSpacing: '-0.02em', lineHeight: 1.05 }}
            >
              {cv.full_name || 'Your Name'}
            </h1>
            {contactParts.length > 0 && (
              <p className="text-[11px] sm:text-xs text-gray-600 mt-2 break-all" style={{ letterSpacing: '0.5px' }}>
                {contactParts.join('   /   ')}
              </p>
            )}
          </div>
          <img
            src={photo}
            alt={cv.full_name || 'Profile'}
            className="w-24 h-24 sm:w-28 sm:h-28 object-cover shrink-0"
            style={{ borderRadius: 0 }}
          />
        </div>
      ) : (
        <>
          <h1
            className="text-3xl sm:text-[32px] font-bold"
            style={{ color: '#111', letterSpacing: '-0.02em', lineHeight: 1.05 }}
          >
            {cv.full_name || 'Your Name'}
          </h1>
          {contactParts.length > 0 && (
            <p className="text-[11px] sm:text-xs text-gray-600 mt-2 break-all" style={{ letterSpacing: '0.5px' }}>
              {contactParts.join('   /   ')}
            </p>
          )}
        </>
      )}

      <div style={{ height: '4px', background: '#111', margin: '16px 0 20px', width: '48px' }} />

      {cv.summary && (
        <Section title="01 / Profile">
          <p className="text-[13px] sm:text-sm text-gray-800">{cv.summary}</p>
        </Section>
      )}

      {cv.experience && cv.experience.length > 0 && (
        <Section title="02 / Experience">
          {cv.experience.map((role, i) => (
            <div key={i} className="mb-4 grid grid-cols-12 gap-3">
              {role.duration && (
                <div className="col-span-4 sm:col-span-3">
                  <p className="text-[11px] sm:text-xs text-gray-500 font-semibold uppercase" style={{ letterSpacing: '1.2px' }}>
                    {role.duration}
                  </p>
                </div>
              )}
              <div className={role.duration ? 'col-span-8 sm:col-span-9' : 'col-span-12'}>
                <p className="text-[13px] sm:text-sm font-bold text-gray-900">{role.title}</p>
                {role.company && (
                  <p className="text-[12.5px] sm:text-sm text-gray-600">{role.company}</p>
                )}
                {role.bullets && role.bullets.length > 0 && (
                  <ul className="mt-1.5 ml-5 list-disc space-y-0.5">
                    {role.bullets.map((b, j) => (
                      <li key={j} className="text-[13px] sm:text-sm text-gray-800">{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </Section>
      )}

      {edu.length > 0 && (
        <Section title="03 / Education">
          {edu.map((e, i) => (
            <div key={i} className="grid grid-cols-12 gap-3 mb-1">
              {e.year && (
                <div className="col-span-4 sm:col-span-3">
                  <p className="text-[11px] sm:text-xs text-gray-500 font-semibold uppercase" style={{ letterSpacing: '1.2px' }}>
                    {e.year}
                  </p>
                </div>
              )}
              <div className={e.year ? 'col-span-8 sm:col-span-9' : 'col-span-12'}>
                <p className="text-[13px] sm:text-sm text-gray-800">
                  {[e.degree, e.institution].filter(Boolean).join(' — ')}
                </p>
              </div>
            </div>
          ))}
        </Section>
      )}

      {skills.length > 0 && (
        <Section title="04 / Skills">
          <p className="text-[13px] sm:text-sm text-gray-800">{skills.join(' / ')}</p>
        </Section>
      )}

      {langs.length > 0 && (
        <Section title="05 / Languages">
          <p className="text-[13px] sm:text-sm text-gray-800">
            {langs.map((l) => langText(l)).join(' / ')}
          </p>
        </Section>
      )}

      {certs.length > 0 && (
        <Section title="06 / Certifications" last>
          {certs.map((cert, i) => (
            <p key={i} className="text-[13px] sm:text-sm text-gray-800">{certText(cert)}</p>
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({ title, children, last }: { title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <section className={last ? '' : 'mb-6'}>
      <h2
        className="text-[11px] sm:text-xs font-bold uppercase text-gray-900 mb-3"
        style={{ letterSpacing: '3px' }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
