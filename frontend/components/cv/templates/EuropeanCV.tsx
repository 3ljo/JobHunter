'use client';

import type { TemplateProps } from './types';

export default function EuropeanCV({ cv, photo }: TemplateProps) {
  if (!cv) return null;
  const contactParts = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean);

  return (
    <div
      className="bg-white text-gray-900 p-5 sm:p-8 md:p-10 break-words"
      style={{
        fontFamily: "'Calibri', 'Segoe UI', Arial, sans-serif",
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
        lineHeight: 1.45,
        fontSize: '14px',
      }}
    >
      {/* Header: photo + name/contact */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 pb-4 border-b-2" style={{ borderColor: '#1e3a8a' }}>
        {photo && (
          <img
            src={photo}
            alt={cv.full_name || 'Profile'}
            className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-md shrink-0"
            style={{ border: '1px solid #d4d4d4' }}
          />
        )}
        <div className="flex-1 min-w-0 text-center sm:text-left">
          <h1
            className="text-xl sm:text-2xl md:text-[28px] font-bold"
            style={{ color: '#1e3a8a', letterSpacing: '-0.01em', lineHeight: 1.15 }}
          >
            {cv.full_name || 'Your Name'}
          </h1>
          {contactParts.length > 0 && (
            <p className="text-[11px] sm:text-xs md:text-sm text-gray-700 mt-1 break-all">
              {contactParts.join('  |  ')}
            </p>
          )}
        </div>
      </div>

      {cv.summary && (
        <Section title="Personal Statement">
          <p className="text-[13px] sm:text-sm text-gray-800">{cv.summary}</p>
        </Section>
      )}

      {cv.experience && cv.experience.length > 0 && (
        <Section title="Work Experience">
          {cv.experience.map((role, i) => (
            <div key={i} className="mb-3">
              <p className="font-semibold text-[13px] sm:text-sm text-gray-900">{role.title}</p>
              <p className="text-[12px] sm:text-sm text-gray-700">
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

      {cv.education && cv.education.length > 0 && (
        <Section title="Education">
          {cv.education.map((edu, i) => (
            <p key={i} className="text-[13px] sm:text-sm text-gray-800">
              {[edu.degree, edu.institution, edu.year].filter(Boolean).join(' — ')}
            </p>
          ))}
        </Section>
      )}

      {cv.skills && cv.skills.length > 0 && (
        <Section title="Skills">
          <p className="text-[13px] sm:text-sm text-gray-800">{cv.skills.join(', ')}</p>
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
    <section className={last ? 'mt-4' : 'mt-4 mb-1'}>
      <h2
        className="text-[11px] sm:text-xs font-bold uppercase tracking-wider pb-1 mb-2"
        style={{ color: '#1e3a8a', borderBottom: '1px solid #dbeafe' }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
