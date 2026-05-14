'use client';

import type { TemplateProps } from './types';
import { certText, cleanCerts, cleanEducation, cleanLanguages, langText } from './types';
import { EduExtras, CertExtras } from './TemplateExtras';

const PRIMARY = '#312e81';
const ACCENT = '#818cf8';
const BG = '#f8fafc';

export default function SectionCards({ cv }: TemplateProps) {
  if (!cv) return null;
  const contact = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean) as string[];
  const certs = cleanCerts(cv.certifications);
  const edu = cleanEducation(cv.education);
  const langs = cleanLanguages(cv.languages);
  const skills = (cv.skills || []).filter((s) => s && String(s).trim());

  return (
    <div
      className="text-gray-900 px-6 sm:px-10 py-7 break-words"
      style={{ fontFamily: "'Inter','Segoe UI',Arial,sans-serif", wordBreak: 'break-word', overflowWrap: 'anywhere', lineHeight: 1.5, fontSize: '13.5px', background: BG }}
    >
      <h1 className="font-bold leading-tight" style={{ fontSize: '28px', color: PRIMARY, letterSpacing: '-0.01em' }}>
        {cv.full_name || 'Your Name'}
      </h1>
      {contact.length > 0 && <p className="text-[12px] text-gray-600 mt-1 break-all">{contact.join('  ·  ')}</p>}
      <div style={{ width: 50, height: 3, background: ACCENT, marginTop: 10, marginBottom: 16 }} />

      {cv.summary && <Card title="Profile"><p className="text-[13.5px] text-gray-800">{cv.summary}</p></Card>}
      {cv.experience && cv.experience.length > 0 && (
        <Card title="Experience">
          {cv.experience.map((r, i) => (
            <div key={i} className={i === 0 ? '' : 'mt-3 pt-3'} style={i === 0 ? {} : { borderTop: '1px solid #e2e8f0' }}>
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
        </Card>
      )}
      {skills.length > 0 && (
        <Card title="Skills">
          <div className="flex flex-wrap gap-1.5">
            {skills.map((s, i) => (
              <span key={i} className="text-[12px] px-2.5 py-0.5 rounded-full" style={{ background: '#eef2ff', color: PRIMARY }}>{s}</span>
            ))}
          </div>
        </Card>
      )}
      {edu.length > 0 && (
        <Card title="Education">
          {edu.map((e, i) => (<div key={i} className="mb-1.5"><p className="text-[13.5px] text-gray-800">{[e.degree, e.institution, e.year].filter(Boolean).join(' — ')}</p><EduExtras e={e} subSize={12} subColor="gray-600" /></div>))}
        </Card>
      )}
      {langs.length > 0 && <Card title="Languages"><p className="text-[13.5px] text-gray-800">{langs.map((l) => langText(l)).join('  ·  ')}</p></Card>}
      {certs.length > 0 && (
        <Card title="Certifications" last>
          {certs.map((c, i) => (<div key={i} className="mb-1.5"><p className="text-[13px] font-semibold text-gray-800">{certText(c)}</p><CertExtras cert={c} subSize={12} subColor="gray-600" /></div>))}
        </Card>
      )}
    </div>
  );
}

function Card({ title, children, last }: { title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <section
      className={last ? '' : 'mb-3'}
      style={{ background: '#ffffff', borderRadius: 10, padding: '14px 16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
    >
      <h2 className="font-bold uppercase mb-2" style={{ fontSize: '10.5px', letterSpacing: '0.22em', color: PRIMARY }}>{title}</h2>
      {children}
    </section>
  );
}
