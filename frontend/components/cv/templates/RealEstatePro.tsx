'use client';

import type { TemplateProps } from './types';
import { certText, cleanCerts, cleanEducation, cleanLanguages, langText } from './types';
import { EduExtras, CertExtras } from './TemplateExtras';

const GOLD = '#b8860b';
const CHARCOAL = '#1f2937';

export default function RealEstatePro({ cv }: TemplateProps) {
  if (!cv) return null;
  const contact = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean) as string[];
  const certs = cleanCerts(cv.certifications);
  const edu = cleanEducation(cv.education);
  const langs = cleanLanguages(cv.languages);
  const skills = (cv.skills || []).filter((s) => s && String(s).trim());

  return (
    <div
      className="bg-white text-gray-900 px-6 sm:px-10 py-8 break-words"
      style={{ fontFamily: "'Playfair Display','Georgia',serif", wordBreak: 'break-word', overflowWrap: 'anywhere', lineHeight: 1.55, fontSize: '14px' }}
    >
      <div className="text-center pb-4" style={{ borderBottom: `3px double ${GOLD}` }}>
        <h1 className="font-bold tracking-wide" style={{ fontSize: '30px', color: CHARCOAL, letterSpacing: '0.05em' }}>
          {cv.full_name || 'Your Name'}
        </h1>
        <p className="text-[11px] font-bold uppercase tracking-[0.30em] mt-1" style={{ color: GOLD }}>Licensed Real Estate Professional</p>
        {contact.length > 0 && <p className="text-[12px] text-gray-700 mt-2 break-all">{contact.join('  ·  ')}</p>}
      </div>

      <div className="mt-6">
        {cv.summary && <Section title="Profile"><p className="text-[14px] italic text-gray-800">{cv.summary}</p></Section>}
        {cv.experience && cv.experience.length > 0 && (
          <Section title="Experience">
            {cv.experience.map((r, i) => (
              <div key={i} className="mb-4">
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <p className="font-bold text-[14.5px]" style={{ color: CHARCOAL }}>{r.title}</p>
                  {r.duration && <p className="text-[12px] italic" style={{ color: GOLD }}>{r.duration}</p>}
                </div>
                {r.company && <p className="text-[12.5px] italic text-gray-600">{r.company}</p>}
                {r.bullets && r.bullets.length > 0 && (
                  <ul className="mt-1 ml-5 list-disc space-y-0.5">
                    {r.bullets.map((b, j) => <li key={j} className="text-[13.5px] text-gray-800">{b}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </Section>
        )}
        {skills.length > 0 && <Section title="Specializations"><p className="text-[14px] text-gray-800">{skills.join('  ·  ')}</p></Section>}
        {certs.length > 0 && (
          <Section title="Licenses & Designations">
            {certs.map((c, i) => (<div key={i} className="mb-1.5"><p className="text-[13.5px] font-semibold text-gray-800">{certText(c)}</p><CertExtras cert={c} subSize={12} subColor="gray-600" /></div>))}
          </Section>
        )}
        {edu.length > 0 && (
          <Section title="Education">
            {edu.map((e, i) => (<div key={i} className="mb-1.5"><p className="text-[13.5px] text-gray-800">{[e.degree, e.institution, e.year].filter(Boolean).join(' — ')}</p><EduExtras e={e} subSize={12} subColor="gray-600" /></div>))}
          </Section>
        )}
        {langs.length > 0 && <Section title="Languages" last><p className="text-[14px] text-gray-800">{langs.map(l => langText(l)).join('  ·  ')}</p></Section>}
      </div>
    </div>
  );
}

function Section({ title, children, last }: { title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <section className={last ? '' : 'mb-5'}>
      <h2 className="font-bold uppercase mb-2 pb-1" style={{ fontSize: '11.5px', letterSpacing: '0.24em', color: CHARCOAL, borderBottom: `1px solid ${GOLD}` }}>{title}</h2>
      {children}
    </section>
  );
}
