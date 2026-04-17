'use client';

import type { TemplateProps } from './types';
import { certText, cleanCerts, cleanEducation } from './types';

export default function ModernProfessional({ cv }: TemplateProps) {
  if (!cv) return null;
  const contactParts = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean);
  const certs = cleanCerts(cv.certifications);
  const edu = cleanEducation(cv.education);
  const skills = (cv.skills || []).filter((s) => s && String(s).trim());

  return (
    <div
      className="bg-white text-gray-900 p-5 sm:p-8 md:p-10 break-words"
      style={{
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
        lineHeight: 1.45,
        fontSize: '14px',
      }}
    >
      {/* Header: centered name, tight contact row */}
      <div className="text-center pb-3">
        <h1
          className="text-xl sm:text-[26px] md:text-[28px] font-bold tracking-tight"
          style={{ color: '#0f172a', letterSpacing: '-0.01em' }}
        >
          {cv.full_name || 'Your Name'}
        </h1>
        {contactParts.length > 0 && (
          <p className="text-[11px] sm:text-xs md:text-sm text-gray-600 mt-1 break-all">
            {contactParts.join('  •  ')}
          </p>
        )}
      </div>

      {cv.summary && (
        <Section title="Summary">
          <p className="text-[13px] sm:text-sm text-gray-800">{cv.summary}</p>
        </Section>
      )}

      {cv.experience && cv.experience.length > 0 && (
        <Section title="Experience">
          {cv.experience.map((role, i) => (
            <div key={i} className="mb-3">
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-0 sm:gap-4">
                <p className="font-semibold text-[13px] sm:text-sm text-gray-900">
                  {role.title}{role.company ? ` — ${role.company}` : ''}
                </p>
                {role.duration && (
                  <p className="text-[12px] sm:text-sm text-gray-600 shrink-0">{role.duration}</p>
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

      {skills.length > 0 && (
        <Section title="Skills">
          <p className="text-[13px] sm:text-sm text-gray-800">{skills.join(' · ')}</p>
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
        className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.12em] text-gray-900 pb-1 mb-2"
        style={{ borderBottom: '1.5px solid #0f172a' }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
