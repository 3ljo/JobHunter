'use client';

import type { TemplateProps } from './types';
import { certText, cleanCerts, cleanEducation, cleanLanguages, langText } from './types';
import { EduExtras, CertExtras } from './TemplateExtras';

const CORAL = '#fb7185';
const PEACH = '#fef3ec';
const INK = '#1f1f2c';

export default function DesignerPortfolio({ cv, photo }: TemplateProps) {
  if (!cv) return null;
  const contactParts = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean) as string[];
  const certs = cleanCerts(cv.certifications);
  const edu = cleanEducation(cv.education);
  const langs = cleanLanguages(cv.languages);
  const skills = (cv.skills || []).filter((s) => s && String(s).trim());

  return (
    <div
      className="bg-white break-words"
      style={{
        fontFamily: "'Inter','Segoe UI',Arial,sans-serif",
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
        lineHeight: 1.55,
        fontSize: '13.5px',
        color: INK,
      }}
    >
      <div className="px-6 sm:px-10 pt-8 pb-5" style={{ background: PEACH }}>
        <div className="flex items-center gap-5 flex-wrap">
          {photo && (
            <div
              className="overflow-hidden shrink-0"
              style={{ width: 92, height: 92, borderRadius: 16, border: `2px solid ${CORAL}` }}
            >
              <img src={photo} alt={cv.full_name || 'Profile'} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: CORAL }}>
              Portfolio · CV
            </p>
            <h1 className="font-bold leading-tight mt-1" style={{ fontSize: '30px', color: INK, letterSpacing: '-0.02em' }}>
              {cv.full_name || 'Your Name'}
            </h1>
            {contactParts.length > 0 && (
              <p className="text-[12px] mt-1.5 break-all" style={{ color: '#5b5b6a' }}>
                {contactParts.join('  ·  ')}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 sm:px-10 py-7">
        {cv.summary && (
          <Section title="About">
            <p className="text-[13.5px]">{cv.summary}</p>
          </Section>
        )}

        {cv.experience && cv.experience.length > 0 && (
          <Section title="Experience">
            {cv.experience.map((role, i) => (
              <div key={i} className="mb-4">
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <p className="font-bold text-[14.5px]" style={{ color: INK }}>{role.title}</p>
                  {role.duration && (
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: CORAL }}>
                      {role.duration}
                    </p>
                  )}
                </div>
                {role.company && <p className="text-[12.5px] italic" style={{ color: '#6b6b7a' }}>{role.company}</p>}
                {role.bullets && role.bullets.length > 0 && (
                  <ul className="mt-1.5 ml-4 space-y-0.5">
                    {role.bullets.map((b, j) => (
                      <li key={j} className="text-[13px] list-disc" style={{ color: '#3d3d4d' }}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </Section>
        )}

        {skills.length > 0 && (
          <Section title="Skills">
            <div className="flex flex-wrap gap-1.5">
              {skills.map((s, i) => (
                <span
                  key={i}
                  className="text-[12px] px-3 py-0.5 rounded-full"
                  style={{ background: PEACH, color: INK, border: `1px solid ${CORAL}40` }}
                >
                  {s}
                </span>
              ))}
            </div>
          </Section>
        )}

        {edu.length > 0 && (
          <Section title="Education">
            {edu.map((e, i) => (
              <div key={i} className="mb-1.5">
                <p className="text-[13.5px]">{[e.degree, e.institution, e.year].filter(Boolean).join(' — ')}</p>
                <EduExtras e={e} subSize={12} subColor="gray-600" />
              </div>
            ))}
          </Section>
        )}

        {langs.length > 0 && (
          <Section title="Languages">
            <p className="text-[13.5px]">{langs.map((l) => langText(l)).join('  ·  ')}</p>
          </Section>
        )}

        {certs.length > 0 && (
          <Section title="Certifications" last>
            {certs.map((c, i) => (
              <div key={i} className="mb-1.5">
                <p className="text-[13px] font-semibold">{certText(c)}</p>
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
        className="font-bold uppercase mb-2 inline-block pb-1"
        style={{ fontSize: '11px', letterSpacing: '0.22em', color: INK, borderBottom: `2px solid ${CORAL}` }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
