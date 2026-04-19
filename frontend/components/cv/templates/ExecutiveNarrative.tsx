'use client';

import type { TemplateProps } from './types';
import { certText, cleanCerts, cleanEducation, cleanLanguages, langText } from './types';

export default function ExecutiveNarrative({ cv, photo }: TemplateProps) {
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
        fontFamily: "Georgia, 'Times New Roman', serif",
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
        lineHeight: 1.5,
        fontSize: '14px',
      }}
    >
      {photo ? (
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
          <img
            src={photo}
            alt={cv.full_name || 'Profile'}
            className="w-24 h-24 sm:w-[104px] sm:h-[104px] object-cover rounded-full shrink-0"
            style={{ border: '2px solid #7c2d12' }}
          />
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <h1 className="text-2xl sm:text-[28px] font-normal" style={{ color: '#1f2937', letterSpacing: '0.02em' }}>
              {cv.full_name || 'Your Name'}
            </h1>
            {contactParts.length > 0 && (
              <p className="text-[11px] sm:text-xs text-gray-600 mt-1 break-all">
                {contactParts.join('  ·  ')}
              </p>
            )}
          </div>
        </div>
      ) : (
        <>
          <h1 className="text-center text-2xl sm:text-[28px] font-normal" style={{ color: '#1f2937', letterSpacing: '0.02em' }}>
            {cv.full_name || 'Your Name'}
          </h1>
          {contactParts.length > 0 && (
            <p className="text-center text-[11px] sm:text-xs text-gray-600 mt-1 break-all">
              {contactParts.join('  ·  ')}
            </p>
          )}
        </>
      )}

      <div style={{ height: '1px', background: '#7c2d12', margin: '12px auto 16px', width: '48%' }} />

      {cv.summary && (
        <div
          className="mb-5 px-4 py-3"
          style={{
            background: '#fafaf9',
            borderLeft: '3px solid #7c2d12',
          }}
        >
          <p className="text-[13px] sm:text-sm text-gray-800 italic leading-relaxed">
            {cv.summary}
          </p>
        </div>
      )}

      {cv.experience && cv.experience.length > 0 && (
        <Section title="Professional Experience">
          {cv.experience.map((role, i) => (
            <div key={i} className="mb-4">
              <p className="font-bold text-[14px] sm:text-[15px] text-gray-900">{role.title}</p>
              <p className="text-[12.5px] sm:text-sm text-gray-600 italic">
                {[role.company, role.duration].filter(Boolean).join(' — ')}
              </p>
              {role.bullets && role.bullets.length > 0 && (
                <ul className="mt-1.5 ml-5 list-disc space-y-0.5">
                  {role.bullets.map((b, j) => (
                    <li key={j} className="text-[13px] sm:text-sm text-gray-800">{b}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </Section>
      )}

      {skills.length > 0 && (
        <Section title="Core Competencies">
          <p className="text-[13px] sm:text-sm text-gray-800">{skills.join('  ·  ')}</p>
        </Section>
      )}

      {edu.length > 0 && (
        <Section title="Education">
          {edu.map((e, i) => (
            <p key={i} className="text-[13px] sm:text-sm text-gray-800">
              {[e.degree, e.institution, e.year].filter(Boolean).join(' — ')}
            </p>
          ))}
        </Section>
      )}

      {langs.length > 0 && (
        <Section title="Languages">
          <p className="text-[13px] sm:text-sm text-gray-800">
            {langs.map((l) => langText(l)).join('  ·  ')}
          </p>
        </Section>
      )}

      {certs.length > 0 && (
        <Section title="Certifications" last>
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
    <section className={last ? '' : 'mb-4'}>
      <h2
        className="text-center text-[11px] sm:text-xs font-bold uppercase mb-3"
        style={{ color: '#7c2d12', letterSpacing: '4px' }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
