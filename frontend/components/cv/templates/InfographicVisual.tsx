'use client';

import type { TemplateProps } from './types';
import { certText, cleanCerts, cleanEducation, cleanLanguages, langText } from './types';
import { EduExtras, CertExtras } from './TemplateExtras';

const PRIMARY = '#0f766e';
const ACCENT = '#facc15';

export default function InfographicVisual({ cv }: TemplateProps) {
  if (!cv) return null;
  const contact = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean) as string[];
  const certs = cleanCerts(cv.certifications);
  const edu = cleanEducation(cv.education);
  const langs = cleanLanguages(cv.languages);
  const skills = (cv.skills || []).filter((s) => s && String(s).trim());

  return (
    <div
      className="bg-white text-gray-900 px-6 sm:px-10 py-7 break-words"
      style={{ fontFamily: "'Inter','Segoe UI',Arial,sans-serif", wordBreak: 'break-word', overflowWrap: 'anywhere', lineHeight: 1.5, fontSize: '13.5px' }}
    >
      <h1 className="font-bold leading-tight" style={{ fontSize: '28px', color: PRIMARY, letterSpacing: '-0.01em' }}>
        {cv.full_name || 'Your Name'}
      </h1>
      {contact.length > 0 && <p className="text-[12px] text-gray-600 mt-1 break-all">{contact.join('  ·  ')}</p>}

      <div style={{ height: 3, background: ACCENT, marginTop: 14, marginBottom: 18, width: 60 }} />

      {cv.summary && <Section title="Profile"><p className="text-[13.5px] text-gray-800">{cv.summary}</p></Section>}

      {cv.experience && cv.experience.length > 0 && (
        <Section title="Experience">
          {cv.experience.map((r, i) => (
            <div key={i} className="mb-4">
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <p className="font-bold text-[14px]" style={{ color: PRIMARY }}>{r.title}</p>
                {r.duration && <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: ACCENT }}>{r.duration}</p>}
              </div>
              {r.company && <p className="text-[12.5px] italic text-gray-600">{r.company}</p>}
              {r.bullets && r.bullets.length > 0 && (
                <ul className="mt-1.5 ml-4 list-disc space-y-0.5">
                  {r.bullets.map((b, j) => <li key={j} className="text-[13px] text-gray-800">{b}</li>)}
                </ul>
              )}
            </div>
          ))}
        </Section>
      )}

      {skills.length > 0 && (
        <Section title="Proficiencies">
          <div className="space-y-1.5">
            {skills.slice(0, 8).map((s, i) => {
              const fill = 60 + ((i * 13) % 35);
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-[12px] text-gray-700 w-32 shrink-0">{s}</span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#f1f5f9' }}>
                    <div style={{ width: `${fill}%`, height: '100%', background: PRIMARY }} />
                  </div>
                </div>
              );
            })}
            {skills.length > 8 && (
              <p className="text-[11.5px] text-gray-500 mt-2">+ {skills.length - 8} additional</p>
            )}
          </div>
        </Section>
      )}

      {edu.length > 0 && (
        <Section title="Education">
          {edu.map((e, i) => (<div key={i} className="mb-1.5"><p className="text-[13.5px] text-gray-800">{[e.degree, e.institution, e.year].filter(Boolean).join(' — ')}</p><EduExtras e={e} subSize={12} subColor="gray-600" /></div>))}
        </Section>
      )}

      {langs.length > 0 && <Section title="Languages"><p className="text-[13.5px] text-gray-800">{langs.map((l) => langText(l)).join('  ·  ')}</p></Section>}

      {certs.length > 0 && (
        <Section title="Certifications" last>
          {certs.map((c, i) => (<div key={i} className="mb-1.5"><p className="text-[13px] font-semibold text-gray-800">{certText(c)}</p><CertExtras cert={c} subSize={12} subColor="gray-600" /></div>))}
        </Section>
      )}
    </div>
  );
}

function Section({ title, children, last }: { title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <section className={last ? '' : 'mb-5'}>
      <h2 className="font-bold uppercase mb-2 pb-1" style={{ fontSize: '11px', letterSpacing: '0.20em', color: PRIMARY, borderBottom: `1.5px solid ${PRIMARY}` }}>{title}</h2>
      {children}
    </section>
  );
}
