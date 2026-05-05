'use client';

import type { TemplateProps } from './types';
import { certText, cleanCerts, cleanEducation, cleanLanguages, langText } from './types';
import { EduExtras, CertExtras } from './TemplateExtras';

const INK = '#0f172a';
const ACCENT = '#f97316';

export default function HorizontalHeader({ cv }: TemplateProps) {
  if (!cv) return null;
  const contact = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean) as string[];
  const certs = cleanCerts(cv.certifications);
  const edu = cleanEducation(cv.education);
  const langs = cleanLanguages(cv.languages);
  const skills = (cv.skills || []).filter((s) => s && String(s).trim());

  return (
    <div
      className="bg-white text-gray-900 break-words"
      style={{ fontFamily: "'Inter','Segoe UI',Arial,sans-serif", wordBreak: 'break-word', overflowWrap: 'anywhere', lineHeight: 1.5, fontSize: '13.5px' }}
    >
      <div className="px-6 sm:px-10 py-7 flex items-end justify-between gap-4 flex-wrap" style={{ borderBottom: `4px solid ${ACCENT}` }}>
        <h1 className="font-black leading-none" style={{ fontSize: '46px', color: INK, letterSpacing: '-0.04em' }}>
          {cv.full_name || 'Your Name'}
        </h1>
        {contact.length > 0 && (
          <div className="text-right text-[11.5px] text-gray-600 break-all">
            {contact.map((c, i) => <p key={i}>{c}</p>)}
          </div>
        )}
      </div>

      <div className="px-6 sm:px-10 py-6">
        {cv.summary && <Section title="Profile"><p className="text-[13.5px] text-gray-800">{cv.summary}</p></Section>}
        {cv.experience && cv.experience.length > 0 && (
          <Section title="Experience">
            {cv.experience.map((r, i) => (
              <div key={i} className="mb-4 flex gap-4 flex-wrap">
                <div className="w-32 shrink-0">
                  {r.duration && <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: ACCENT }}>{r.duration}</p>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[14px]" style={{ color: INK }}>{r.title}</p>
                  {r.company && <p className="text-[12.5px] italic text-gray-600">{r.company}</p>}
                  {r.bullets && r.bullets.length > 0 && (
                    <ul className="mt-1.5 ml-4 list-disc space-y-0.5">
                      {r.bullets.map((b, j) => <li key={j} className="text-[13px] text-gray-800">{b}</li>)}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </Section>
        )}
        {skills.length > 0 && <Section title="Skills"><p className="text-[13.5px] text-gray-800">{skills.join('  ·  ')}</p></Section>}
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
    </div>
  );
}

function Section({ title, children, last }: { title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <section className={last ? '' : 'mb-5'}>
      <h2 className="font-bold uppercase mb-2 pb-1" style={{ fontSize: '11px', letterSpacing: '0.22em', color: INK, borderBottom: `2px solid ${ACCENT}` }}>{title}</h2>
      {children}
    </section>
  );
}
