'use client';

import type { TemplateProps } from './types';

export default function HarvardClassic({ cv }: TemplateProps) {
  if (!cv) return null;
  const contactParts = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean);

  return (
    <div
      className="bg-white text-gray-900 p-5 sm:p-8 md:p-10 break-words"
      style={{
        fontFamily: "'Calibri', 'Segoe UI', Arial, sans-serif",
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
        lineHeight: 1.4,
        fontSize: '14px',
      }}
    >
      <h1
        className="text-center text-xl sm:text-2xl md:text-[26px] font-bold tracking-tight"
        style={{ color: '#111', letterSpacing: '0.02em' }}
      >
        {cv.full_name || 'Your Name'}
      </h1>

      {contactParts.length > 0 && (
        <p className="text-center text-[11px] sm:text-xs md:text-sm text-gray-600 mt-1 break-all">
          {contactParts.join(' | ')}
        </p>
      )}

      <hr className="my-3 sm:my-4 border-t border-black" />

      {cv.summary && (
        <Section title="Professional Summary">
          <p className="text-[13px] sm:text-sm text-gray-800">{cv.summary}</p>
        </Section>
      )}

      {cv.experience && cv.experience.length > 0 && (
        <Section title="Work Experience">
          {cv.experience.map((role, i) => (
            <div key={i} className="mb-3">
              <p className="font-semibold text-[13px] sm:text-sm text-gray-900">{role.title}</p>
              <p className="text-[12px] sm:text-sm italic text-gray-600">
                {[role.company, role.duration].filter(Boolean).join(' | ')}
              </p>
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

      {cv.skills && cv.skills.length > 0 && (
        <Section title="Skills">
          <p className="text-[13px] sm:text-sm text-gray-800">{cv.skills.join(', ')}</p>
        </Section>
      )}

      {cv.education && cv.education.length > 0 && (
        <Section title="Education">
          {cv.education.map((edu, i) => (
            <p key={i} className="text-[13px] sm:text-sm text-gray-800">
              {[edu.degree, edu.institution, edu.year].filter(Boolean).join(' — ')}
            </p>
          ))}
        </Section>
      )}

      {cv.certifications && cv.certifications.length > 0 && (
        <Section title="Certifications" last>
          {cv.certifications.map((cert, i) => (
            <p key={i} className="text-[13px] sm:text-sm text-gray-800">
              {typeof cert === 'string' ? cert : cert.name || ''}
            </p>
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({ title, children, last }: { title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <section className={last ? '' : 'mb-4'}>
      <h2 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-400 pb-1 mb-2">
        {title}
      </h2>
      {children}
    </section>
  );
}
