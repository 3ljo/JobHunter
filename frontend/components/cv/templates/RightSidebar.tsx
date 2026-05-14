'use client';

import type { TemplateProps } from './types';
import { certText, cleanCerts, cleanEducation, cleanLanguages, langText } from './types';
import { EduExtras, CertExtras } from './TemplateExtras';

const PRIMARY = '#0e7490';
const SAND = '#fef3c7';

export default function RightSidebar({ cv, photo }: TemplateProps) {
  if (!cv) return null;
  const certs = cleanCerts(cv.certifications);
  const edu = cleanEducation(cv.education);
  const langs = cleanLanguages(cv.languages);
  const skills = (cv.skills || []).filter((s) => s && String(s).trim());
  const contact = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean) as string[];

  return (
    <div
      className="bg-white text-gray-900 break-words"
      style={{
        fontFamily: "'Inter','Segoe UI',Arial,sans-serif",
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
        lineHeight: 1.5,
        fontSize: '13.5px',
        display: 'grid',
        gridTemplateColumns: '1fr minmax(170px,32%)',
        minHeight: '100%',
      }}
    >
      <main className="p-5 sm:p-7">
        <h1 className="font-bold leading-tight" style={{ fontSize: '28px', color: PRIMARY, letterSpacing: '-0.01em' }}>
          {cv.full_name || 'Your Name'}
        </h1>
        <div style={{ width: 50, height: 3, background: PRIMARY, marginTop: 8, marginBottom: 14 }} />

        {cv.summary && <Main title="Profile"><p className="text-[13.5px] text-gray-800">{cv.summary}</p></Main>}
        {cv.experience && cv.experience.length > 0 && (
          <Main title="Experience">
            {cv.experience.map((r, i) => (
              <div key={i} className="mb-4">
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <p className="font-bold text-[14px]" style={{ color: PRIMARY }}>{r.title}</p>
                  {r.duration && <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#a16207' }}>{r.duration}</p>}
                </div>
                {r.company && <p className="text-[12.5px] italic text-gray-600">{r.company}</p>}
                {r.bullets && r.bullets.length > 0 && (
                  <ul className="mt-1.5 ml-4 list-disc space-y-0.5">
                    {r.bullets.map((b, j) => <li key={j} className="text-[13px] text-gray-800">{b}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </Main>
        )}
        {edu.length > 0 && (
          <Main title="Education" last>
            {edu.map((e, i) => (<div key={i} className="mb-1.5"><p className="text-[13.5px] text-gray-800">{[e.degree, e.institution, e.year].filter(Boolean).join(' — ')}</p><EduExtras e={e} subSize={12} subColor="gray-600" /></div>))}
          </Main>
        )}
      </main>

      <aside className="p-5 sm:p-6" style={{ background: SAND, color: '#1f2937' }}>
        {photo && (
          <div className="mx-auto mb-4 overflow-hidden" style={{ width: 110, height: 110, borderRadius: '50%', border: `3px solid ${PRIMARY}` }}>
            <img src={photo} alt={cv.full_name || 'Profile'} className="w-full h-full object-cover" />
          </div>
        )}
        {contact.length > 0 && (
          <Side title="Contact">
            <ul className="space-y-1">
              {contact.map((c, i) => (<li key={i} className="text-[11.5px] break-all text-gray-700">{c}</li>))}
            </ul>
          </Side>
        )}
        {skills.length > 0 && (
          <Side title="Skills">
            <ul className="space-y-1">
              {skills.map((s, i) => (<li key={i} className="text-[12px] text-gray-800"><span style={{ color: PRIMARY, marginRight: 6 }}>▸</span>{s}</li>))}
            </ul>
          </Side>
        )}
        {langs.length > 0 && (
          <Side title="Languages">
            <ul className="space-y-1">
              {langs.map((l, i) => <li key={i} className="text-[12px] text-gray-800">{langText(l)}</li>)}
            </ul>
          </Side>
        )}
        {certs.length > 0 && (
          <Side title="Certifications" last>
            <ul className="space-y-2">
              {certs.map((c, i) => (<li key={i} className="text-[12px] text-gray-800"><span className="block font-semibold">{certText(c)}</span><CertExtras cert={c} subSize={11} subColor="gray-600" /></li>))}
            </ul>
          </Side>
        )}
      </aside>
    </div>
  );
}

function Main({ title, children, last }: { title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <section className={last ? '' : 'mb-5'}>
      <h2 className="font-bold uppercase mb-2 pb-1" style={{ fontSize: '11.5px', letterSpacing: '0.20em', color: PRIMARY, borderBottom: `2px solid ${PRIMARY}` }}>{title}</h2>
      {children}
    </section>
  );
}

function Side({ title, children, last }: { title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <section className={last ? '' : 'mb-5'}>
      <h2 className="font-bold uppercase mb-2" style={{ fontSize: '10.5px', letterSpacing: '0.22em', color: PRIMARY }}>{title}</h2>
      {children}
    </section>
  );
}
