'use client';

import type { TemplateProps } from './types';
import { certText, cleanCerts, cleanEducation, cleanLanguages, langText } from './types';
import { EduExtras, CertExtras } from './TemplateExtras';

export default function AcademicResearch({ cv }: TemplateProps) {
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
        fontFamily: "'Times New Roman', Times, serif",
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
        lineHeight: 1.45,
        fontSize: '14px',
      }}
    >
      <h1 className="text-center text-2xl sm:text-[26px] font-bold" style={{ color: '#111' }}>
        {cv.full_name || 'Your Name'}
      </h1>

      {contactParts.length > 0 && (
        <p className="text-center text-[11px] sm:text-xs text-gray-700 mt-1 break-all">
          {contactParts.join(', ')}
        </p>
      )}

      <hr className="my-3 border-t border-black" />

      {/* Education first — academic convention */}
      {edu.length > 0 && (
        <Section title="Education">
          {edu.map((e, i) => (
            <div key={i} className="mb-1.5">
              <p className="text-[13px] sm:text-sm text-gray-900 font-bold">
                {e.degree || 'Degree'}
                {e.year && <span className="float-right font-normal">{e.year}</span>}
              </p>
              {e.institution && (
                <p className="text-[12.5px] sm:text-sm text-gray-700 italic">{e.institution}</p>
              )}
              <EduExtras e={e} subSize={12} subColor="gray-600" />
            </div>
          ))}
        </Section>
      )}

      {cv.summary && (
        <Section title="Research Interests">
          <p className="text-[13px] sm:text-sm text-gray-800">{cv.summary}</p>
        </Section>
      )}

      {cv.experience && cv.experience.length > 0 && (
        <Section title="Academic &amp; Research Experience">
          {cv.experience.map((role, i) => (
            <div key={i} className="mb-3">
              <p className="text-[13px] sm:text-sm text-gray-900 font-bold">
                {role.title}
                {role.duration && <span className="float-right font-normal italic">{role.duration}</span>}
              </p>
              {role.company && (
                <p className="text-[12.5px] sm:text-sm text-gray-700 italic">{role.company}</p>
              )}
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

      {certs.length > 0 && (
        <Section title="Publications &amp; Honors">
          {certs.map((cert, i) => (
            <div key={i} className="mb-1">
              <p className="text-[13px] sm:text-sm text-gray-800">{certText(cert)}</p>
              <CertExtras cert={cert} subSize={12} subColor="gray-600" />
            </div>
          ))}
        </Section>
      )}

      {skills.length > 0 && (
        <Section title="Technical &amp; Methodological Skills">
          <p className="text-[13px] sm:text-sm text-gray-800">{skills.join('; ')}</p>
        </Section>
      )}

      {langs.length > 0 && (
        <Section title="Languages" last>
          <p className="text-[13px] sm:text-sm text-gray-800">
            {langs.map((l) => langText(l)).join('; ')}
          </p>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children, last }: { title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <section className={last ? '' : 'mb-4'}>
      <h2
        className="text-[12px] sm:text-[13px] font-bold uppercase text-gray-900 mb-1.5"
        style={{ letterSpacing: '1px', borderBottom: '0.5px solid #555', paddingBottom: '2px' }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
