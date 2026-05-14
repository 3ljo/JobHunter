'use client';

import type { TemplateProps } from './types';
import { certText, cleanCerts, cleanEducation, cleanLanguages, langText } from './types';
import { EduExtras, CertExtras } from './TemplateExtras';

const SLATE = '#1e293b';
const ACCENT = '#38bdf8';

export default function ModernTwoTone({ cv, photo }: TemplateProps) {
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
        fontFamily: "'Inter','Segoe UI',Arial,sans-serif",
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
        lineHeight: 1.5,
        fontSize: '13.5px',
      }}
    >
      <div className="px-6 sm:px-10 pt-8 pb-7" style={{ background: SLATE, color: '#fff' }}>
        <div className="flex items-center gap-5 flex-wrap">
          {photo && (
            <div
              className="overflow-hidden shrink-0"
              style={{ width: 96, height: 96, borderRadius: '50%', border: `3px solid ${ACCENT}` }}
            >
              <img src={photo} alt={cv.full_name || 'Profile'} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="font-bold leading-tight" style={{ fontSize: '28px', color: '#fff', letterSpacing: '-0.01em' }}>
              {cv.full_name || 'Your Name'}
            </h1>
            <div style={{ width: 50, height: 3, background: ACCENT, marginTop: 8, marginBottom: 8 }} />
            {contactParts.length > 0 && (
              <p className="text-[12px] break-all" style={{ color: 'rgba(255,255,255,0.78)' }}>
                {contactParts.join('  ·  ')}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 sm:px-10 py-7">
        {cv.summary && (
          <Section title="Profile">
            <p className="text-[13.5px] text-gray-800">{cv.summary}</p>
          </Section>
        )}

        {cv.experience && cv.experience.length > 0 && (
          <Section title="Experience">
            {cv.experience.map((role, i) => (
              <div key={i} className="mb-4">
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <p className="font-bold text-[14px]" style={{ color: SLATE }}>{role.title}</p>
                  {role.duration && <p className="text-[11px] font-bold" style={{ color: ACCENT }}>{role.duration}</p>}
                </div>
                {role.company && <p className="text-[12.5px] italic text-gray-600">{role.company}</p>}
                {role.bullets && role.bullets.length > 0 && (
                  <ul className="mt-1.5 ml-4 list-disc space-y-0.5">
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
            <p className="text-[13.5px] text-gray-800">{skills.join('  ·  ')}</p>
          </Section>
        )}

        {edu.length > 0 && (
          <Section title="Education">
            {edu.map((e, i) => (
              <div key={i} className="mb-1.5">
                <p className="text-[13.5px] text-gray-800">{[e.degree, e.institution, e.year].filter(Boolean).join(' — ')}</p>
                <EduExtras e={e} subSize={12} subColor="gray-600" />
              </div>
            ))}
          </Section>
        )}

        {langs.length > 0 && (
          <Section title="Languages">
            <p className="text-[13.5px] text-gray-800">{langs.map((l) => langText(l)).join('  ·  ')}</p>
          </Section>
        )}

        {certs.length > 0 && (
          <Section title="Certifications" last>
            {certs.map((c, i) => (
              <div key={i} className="mb-1.5">
                <p className="text-[13px] font-semibold text-gray-800">{certText(c)}</p>
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
        className="font-bold uppercase mb-2 pb-1"
        style={{ fontSize: '11px', letterSpacing: '0.20em', color: SLATE, borderBottom: `2px solid ${SLATE}` }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
