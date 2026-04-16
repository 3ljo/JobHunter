'use client';

import type { TemplateProps } from './types';

export default function MinimalistExecutive({ cv }: TemplateProps) {
  if (!cv) return null;
  const contactParts = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean);

  return (
    <div
      className="bg-white text-gray-900 p-6 sm:p-10 md:p-12 break-words"
      style={{
        fontFamily: "'Garamond', 'Times New Roman', Georgia, serif",
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
        lineHeight: 1.55,
        fontSize: '14px',
      }}
    >
      {/* Name — large, letter-spaced, understated */}
      <h1
        className="text-center text-2xl sm:text-3xl md:text-[34px] font-normal"
        style={{ color: '#111', letterSpacing: '0.14em', textTransform: 'uppercase' }}
      >
        {cv.full_name || 'Your Name'}
      </h1>

      {contactParts.length > 0 && (
        <p
          className="text-center text-[11px] sm:text-xs md:text-sm text-gray-600 mt-2 break-all"
          style={{ letterSpacing: '0.05em' }}
        >
          {contactParts.join('   ·   ')}
        </p>
      )}

      <hr className="my-5 sm:my-6 border-0 h-px bg-gray-300" />

      {cv.summary && (
        <Section title="Profile">
          <p className="text-[13px] sm:text-[15px] text-gray-800 leading-relaxed">{cv.summary}</p>
        </Section>
      )}

      {cv.experience && cv.experience.length > 0 && (
        <Section title="Experience">
          {cv.experience.map((role, i) => (
            <div key={i} className="mb-4">
              <p className="font-semibold text-[13px] sm:text-[15px] text-gray-900">{role.title}</p>
              <p className="text-[12px] sm:text-sm text-gray-600 italic">
                {[role.company, role.duration].filter(Boolean).join(' — ')}
              </p>
              {role.bullets && role.bullets.length > 0 && (
                <ul className="mt-1.5 ml-5 list-disc space-y-1">
                  {role.bullets.map((b, j) => (
                    <li key={j} className="text-[13px] sm:text-[15px] text-gray-800 leading-relaxed">{b}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </Section>
      )}

      {cv.skills && cv.skills.length > 0 && (
        <Section title="Expertise">
          <p className="text-[13px] sm:text-[15px] text-gray-800">{cv.skills.join(' · ')}</p>
        </Section>
      )}

      {cv.education && cv.education.length > 0 && (
        <Section title="Education">
          {cv.education.map((edu, i) => (
            <p key={i} className="text-[13px] sm:text-[15px] text-gray-800">
              {[edu.degree, edu.institution, edu.year].filter(Boolean).join(' — ')}
            </p>
          ))}
        </Section>
      )}

      {cv.certifications && cv.certifications.length > 0 && (
        <Section title="Certifications" last>
          {cv.certifications.map((cert, i) => (
            <p key={i} className="text-[13px] sm:text-[15px] text-gray-800">
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
    <section className={last ? '' : 'mb-5'}>
      <h2
        className="text-[10px] sm:text-[11px] font-bold uppercase text-gray-900 mb-2"
        style={{ letterSpacing: '0.22em' }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
