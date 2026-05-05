'use client';

import type { TemplateProps } from './types';
import { certText, cleanCerts, cleanEducation, cleanLanguages, langText } from './types';
import { EduExtras, CertExtras } from './TemplateExtras';

const INK = '#0a0a0a';
const ACCENT = '#dc2626';

export default function MagazineEditorial({ cv }: TemplateProps) {
  if (!cv) return null;
  const contact = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean) as string[];
  const certs = cleanCerts(cv.certifications);
  const edu = cleanEducation(cv.education);
  const langs = cleanLanguages(cv.languages);
  const skills = (cv.skills || []).filter((s) => s && String(s).trim());
  const summaryFirst = cv.summary?.trim() || '';

  return (
    <div
      className="bg-white text-gray-900 px-6 sm:px-12 py-9 break-words"
      style={{ fontFamily: "'Playfair Display','Georgia','Times New Roman',serif", wordBreak: 'break-word', overflowWrap: 'anywhere', lineHeight: 1.55, fontSize: '14px' }}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.32em]" style={{ color: ACCENT }}>Volume I · Curriculum Vitae</p>
      <h1 className="font-black leading-tight mt-1" style={{ fontSize: '48px', color: INK, letterSpacing: '-0.025em' }}>
        {cv.full_name || 'Your Name'}
      </h1>
      {contact.length > 0 && (
        <p className="text-[12px] text-gray-700 mt-2 break-all" style={{ fontFamily: "'Inter',sans-serif" }}>
          {contact.join('  ·  ')}
        </p>
      )}
      <div style={{ height: 2, background: INK, marginTop: 16, marginBottom: 18 }} />

      {summaryFirst && (
        <Section title="Editor's Note">
          <p className="text-[15px]" style={{ color: '#262626' }}>
            <span className="font-bold float-left mr-2 leading-none" style={{ fontSize: '40px', color: ACCENT, lineHeight: 0.9 }}>
              {summaryFirst.charAt(0).toUpperCase()}
            </span>
            {summaryFirst.slice(1)}
          </p>
        </Section>
      )}

      {cv.experience && cv.experience.length > 0 && (
        <Section title="Feature Story">
          {cv.experience.map((r, i) => (
            <div key={i} className="mb-4">
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <p className="font-bold text-[15px]" style={{ color: INK }}>{r.title}</p>
                {r.duration && <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: ACCENT }}>{r.duration}</p>}
              </div>
              {r.company && <p className="italic text-[13px] text-gray-600">{r.company}</p>}
              {r.bullets && r.bullets.length > 0 && (
                <ul className="mt-1 ml-5 list-disc space-y-0.5">
                  {r.bullets.map((b, j) => <li key={j} className="text-[14px]" style={{ color: '#262626' }}>{b}</li>)}
                </ul>
              )}
            </div>
          ))}
        </Section>
      )}

      {skills.length > 0 && <Section title="Toolkit"><p className="text-[14px]" style={{ color: '#262626' }}>{skills.join('  ·  ')}</p></Section>}

      {edu.length > 0 && (
        <Section title="Education">
          {edu.map((e, i) => (<div key={i} className="mb-1.5"><p className="text-[14px]" style={{ color: '#262626' }}>{[e.degree, e.institution, e.year].filter(Boolean).join(' — ')}</p><EduExtras e={e} subSize={12} subColor="gray-600" /></div>))}
        </Section>
      )}

      {certs.length > 0 && (
        <Section title="Credentials">
          {certs.map((c, i) => (<div key={i} className="mb-1.5"><p className="text-[13.5px] font-semibold" style={{ color: '#262626' }}>{certText(c)}</p><CertExtras cert={c} subSize={12} subColor="gray-600" /></div>))}
        </Section>
      )}

      {langs.length > 0 && <Section title="Languages" last><p className="text-[14px]" style={{ color: '#262626' }}>{langs.map((l) => langText(l)).join('  ·  ')}</p></Section>}
    </div>
  );
}

function Section({ title, children, last }: { title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <section className={last ? '' : 'mb-5'}>
      <h2 className="font-black uppercase mb-2 pb-1" style={{ fontSize: '13px', letterSpacing: '0.20em', color: INK, borderBottom: `2px solid ${INK}` }}>{title}</h2>
      {children}
    </section>
  );
}
