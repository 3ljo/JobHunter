'use client';

import type { TemplateProps } from './types';
import { certText, cleanCerts, cleanEducation, cleanLanguages, langText } from './types';
import { EduExtras, CertExtras } from './TemplateExtras';

const PRIMARY = '#1e3a8a';
const ACCENT = '#0ea5e9';

export default function ThreeColumn({ cv }: TemplateProps) {
  if (!cv) return null;
  const certs = cleanCerts(cv.certifications);
  const edu = cleanEducation(cv.education);
  const langs = cleanLanguages(cv.languages);
  const skills = (cv.skills || []).filter((s) => s && String(s).trim());
  const contact = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean) as string[];

  return (
    <div
      className="bg-white text-gray-900 px-6 sm:px-10 py-7 break-words"
      style={{ fontFamily: "'Inter','Segoe UI',Arial,sans-serif", wordBreak: 'break-word', overflowWrap: 'anywhere', lineHeight: 1.5, fontSize: '13px' }}
    >
      <h1 className="font-bold leading-tight" style={{ fontSize: '26px', color: PRIMARY, letterSpacing: '-0.01em' }}>
        {cv.full_name || 'Your Name'}
      </h1>
      {contact.length > 0 && <p className="text-[12px] text-gray-600 mt-1 break-all">{contact.join('  ·  ')}</p>}
      <div style={{ width: 60, height: 2, background: ACCENT, marginTop: 10, marginBottom: 18 }} />

      {cv.summary && (
        <Section title="Profile">
          <p className="text-[13px] text-gray-800">{cv.summary}</p>
        </Section>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="sm:col-span-2">
          {cv.experience && cv.experience.length > 0 && (
            <Section title="Experience">
              {cv.experience.map((r, i) => (
                <div key={i} className="mb-3.5">
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <p className="font-bold text-[13.5px]" style={{ color: PRIMARY }}>{r.title}</p>
                    {r.duration && <p className="text-[10.5px] font-bold uppercase tracking-wider" style={{ color: ACCENT }}>{r.duration}</p>}
                  </div>
                  {r.company && <p className="text-[12px] italic text-gray-600">{r.company}</p>}
                  {r.bullets && r.bullets.length > 0 && (
                    <ul className="mt-1 ml-4 list-disc space-y-0.5">
                      {r.bullets.map((b, j) => <li key={j} className="text-[12.5px] text-gray-800">{b}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </Section>
          )}
        </div>
        <div>
          {skills.length > 0 && (
            <Section title="Skills">
              <ul className="space-y-0.5">
                {skills.map((s, i) => <li key={i} className="text-[12.5px] text-gray-800">· {s}</li>)}
              </ul>
            </Section>
          )}
          {edu.length > 0 && (
            <Section title="Education">
              {edu.map((e, i) => (<div key={i} className="mb-1.5"><p className="text-[12.5px] text-gray-800">{[e.degree, e.institution, e.year].filter(Boolean).join(' — ')}</p><EduExtras e={e} subSize={11} subColor="gray-600" /></div>))}
            </Section>
          )}
          {langs.length > 0 && (
            <Section title="Languages">
              <p className="text-[12.5px] text-gray-800">{langs.map((l) => langText(l)).join(' · ')}</p>
            </Section>
          )}
          {certs.length > 0 && (
            <Section title="Certifications" last>
              {certs.map((c, i) => (<div key={i} className="mb-1.5"><p className="text-[12.5px] font-semibold text-gray-800">{certText(c)}</p><CertExtras cert={c} subSize={11} subColor="gray-600" /></div>))}
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children, last }: { title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <section className={last ? '' : 'mb-4'}>
      <h2 className="font-bold uppercase mb-1.5 pb-1" style={{ fontSize: '10.5px', letterSpacing: '0.20em', color: PRIMARY, borderBottom: `1.5px solid ${PRIMARY}` }}>{title}</h2>
      {children}
    </section>
  );
}
