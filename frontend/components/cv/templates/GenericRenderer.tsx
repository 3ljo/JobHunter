'use client';

import type { CVData, TemplateProps } from './types';
import { certText, cleanCerts, cleanEducation, cleanLanguages, langText } from './types';
import { EduExtras, CertExtras } from './TemplateExtras';

export interface ThemeTokens {
  primary: string;
  accent: string;
  fontFamily: string;
  bg?: string;
  text?: string;
  /** 'rule' = horizontal rule under section title; 'block' = colored chip bg; 'tab' = left bar */
  sectionStyle?: 'rule' | 'block' | 'tab' | 'plain';
  /** 'centered' = centered name + double rule; 'left' = left aligned; 'band' = solid color band */
  headerStyle?: 'centered' | 'left' | 'band';
  /** label under name in header */
  tagline?: string;
  /** 'plain' = dotted, 'pills' = pill chips, 'inline' = comma list */
  skillStyle?: 'plain' | 'pills' | 'inline';
  baseSize?: number;
  /** show photo on right (default left) */
  photoSide?: 'left' | 'right' | 'none';
}

interface Props extends TemplateProps {
  theme: ThemeTokens;
}

export default function GenericRenderer({ cv, photo, theme }: Props) {
  if (!cv) return null;
  const t = {
    primary: theme.primary,
    accent: theme.accent,
    fontFamily: theme.fontFamily,
    bg: theme.bg || '#ffffff',
    text: theme.text || '#1f2937',
    sectionStyle: theme.sectionStyle || 'rule',
    headerStyle: theme.headerStyle || 'left',
    skillStyle: theme.skillStyle || 'inline',
    baseSize: theme.baseSize || 13.5,
    photoSide: theme.photoSide || (photo ? 'left' : 'none'),
  };

  const contact = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean) as string[];
  const certs = cleanCerts(cv.certifications);
  const edu = cleanEducation(cv.education);
  const langs = cleanLanguages(cv.languages);
  const skills = (cv.skills || []).filter((s) => s && String(s).trim());

  return (
    <div
      className="break-words"
      style={{
        fontFamily: t.fontFamily,
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
        lineHeight: 1.5,
        fontSize: `${t.baseSize}px`,
        background: t.bg,
        color: t.text,
      }}
    >
      <Header cv={cv} contact={contact} photo={photo || null} theme={t} tagline={theme.tagline} />

      <div className="px-6 sm:px-10 py-7">
        {cv.summary && (
          <SectionTitle theme={t} title="Profile">
            <p style={{ fontSize: t.baseSize, color: t.text }}>{cv.summary}</p>
          </SectionTitle>
        )}

        {cv.experience && cv.experience.length > 0 && (
          <SectionTitle theme={t} title="Experience">
            {cv.experience.map((r, i) => (
              <div key={i} className="mb-4">
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <p className="font-bold" style={{ fontSize: t.baseSize + 0.5, color: t.primary }}>{r.title}</p>
                  {r.duration && (
                    <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: t.accent }}>{r.duration}</p>
                  )}
                </div>
                {r.company && <p className="italic text-gray-600" style={{ fontSize: t.baseSize - 1 }}>{r.company}</p>}
                {r.bullets && r.bullets.length > 0 && (
                  <ul className="mt-1.5 ml-4 list-disc space-y-0.5">
                    {r.bullets.map((b, j) => (<li key={j} style={{ fontSize: t.baseSize - 0.5, color: t.text }}>{b}</li>))}
                  </ul>
                )}
              </div>
            ))}
          </SectionTitle>
        )}

        {skills.length > 0 && (
          <SectionTitle theme={t} title="Skills">
            <SkillsView skills={skills} theme={t} />
          </SectionTitle>
        )}

        {edu.length > 0 && (
          <SectionTitle theme={t} title="Education">
            {edu.map((e, i) => (
              <div key={i} className="mb-1.5">
                <p style={{ fontSize: t.baseSize, color: t.text }}>
                  {[e.degree, e.institution, e.year].filter(Boolean).join(' — ')}
                </p>
                <EduExtras e={e} subSize={t.baseSize - 1.5} subColor="gray-600" />
              </div>
            ))}
          </SectionTitle>
        )}

        {langs.length > 0 && (
          <SectionTitle theme={t} title="Languages">
            <p style={{ fontSize: t.baseSize, color: t.text }}>{langs.map((l) => langText(l)).join('  ·  ')}</p>
          </SectionTitle>
        )}

        {certs.length > 0 && (
          <SectionTitle theme={t} title="Certifications" last>
            {certs.map((c, i) => (
              <div key={i} className="mb-1.5">
                <p className="font-semibold" style={{ fontSize: t.baseSize - 0.5, color: t.text }}>{certText(c)}</p>
                <CertExtras cert={c} subSize={t.baseSize - 1.5} subColor="gray-600" />
              </div>
            ))}
          </SectionTitle>
        )}
      </div>
    </div>
  );
}

function Header({
  cv,
  contact,
  photo,
  theme: t,
  tagline,
}: {
  cv: CVData;
  contact: string[];
  photo: string | null;
  theme: Required<Omit<ThemeTokens, 'tagline'>>;
  tagline?: string;
}) {
  const showPhoto = photo && t.photoSide !== 'none';
  const photoEl = showPhoto && (
    <div
      className="overflow-hidden shrink-0"
      style={{ width: 92, height: 92, borderRadius: '50%', border: `3px solid ${t.accent}` }}
    >
      <img src={photo!} alt={cv.full_name || 'Profile'} className="w-full h-full object-cover" />
    </div>
  );

  if (t.headerStyle === 'band') {
    return (
      <div className="px-6 sm:px-10 py-7 text-white" style={{ background: t.primary }}>
        <div className="flex items-center gap-5 flex-wrap">
          {t.photoSide === 'left' && photoEl}
          <div className="min-w-0 flex-1">
            <h1 className="font-bold leading-tight" style={{ fontSize: '28px', color: '#fff', letterSpacing: '-0.01em' }}>
              {cv.full_name || 'Your Name'}
            </h1>
            {tagline && (
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] mt-1" style={{ color: t.accent }}>{tagline}</p>
            )}
            {contact.length > 0 && (
              <p className="text-[12px] mt-2 break-all" style={{ color: 'rgba(255,255,255,0.85)' }}>{contact.join('  ·  ')}</p>
            )}
          </div>
          {t.photoSide === 'right' && photoEl}
        </div>
      </div>
    );
  }

  if (t.headerStyle === 'centered') {
    return (
      <div className="px-6 sm:px-10 pt-9 pb-4 text-center" style={{ borderBottom: `2px solid ${t.primary}` }}>
        {showPhoto && (
          <div className="mx-auto mb-3 overflow-hidden" style={{ width: 88, height: 88, borderRadius: '50%', border: `2px solid ${t.accent}` }}>
            <img src={photo!} alt={cv.full_name || 'Profile'} className="w-full h-full object-cover" />
          </div>
        )}
        <h1 className="font-bold" style={{ fontSize: '28px', color: t.primary, letterSpacing: '0.04em' }}>
          {cv.full_name || 'Your Name'}
        </h1>
        {tagline && <p className="text-[11px] font-bold uppercase tracking-[0.30em] mt-1" style={{ color: t.accent }}>{tagline}</p>}
        {contact.length > 0 && <p className="text-[12px] text-gray-600 mt-2 break-all">{contact.join('  ·  ')}</p>}
      </div>
    );
  }

  return (
    <div className="px-6 sm:px-10 pt-8 pb-3">
      <div className="flex items-center gap-5 flex-wrap">
        {t.photoSide === 'left' && photoEl}
        <div className="min-w-0 flex-1">
          {tagline && <p className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: t.accent }}>{tagline}</p>}
          <h1 className="font-bold leading-tight mt-0.5" style={{ fontSize: '28px', color: t.primary, letterSpacing: '-0.01em' }}>
            {cv.full_name || 'Your Name'}
          </h1>
          <div style={{ width: 50, height: 3, background: t.accent, marginTop: 8, marginBottom: 6 }} />
          {contact.length > 0 && <p className="text-[12px] text-gray-600 break-all">{contact.join('  ·  ')}</p>}
        </div>
        {t.photoSide === 'right' && photoEl}
      </div>
    </div>
  );
}

function SectionTitle({
  theme: t,
  title,
  children,
  last,
}: {
  theme: Required<Omit<ThemeTokens, 'tagline'>>;
  title: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  let header: React.ReactNode = null;
  if (t.sectionStyle === 'block') {
    header = (
      <h2 className="font-bold uppercase mb-2 inline-block px-2 py-0.5 rounded" style={{ fontSize: '11px', letterSpacing: '0.18em', background: t.primary, color: '#fff' }}>{title}</h2>
    );
  } else if (t.sectionStyle === 'tab') {
    header = (
      <h2 className="font-bold uppercase mb-2 pl-2" style={{ fontSize: '11.5px', letterSpacing: '0.20em', color: t.primary, borderLeft: `3px solid ${t.accent}` }}>{title}</h2>
    );
  } else if (t.sectionStyle === 'plain') {
    header = (
      <h2 className="font-bold uppercase mb-2" style={{ fontSize: '11.5px', letterSpacing: '0.22em', color: t.primary }}>{title}</h2>
    );
  } else {
    header = (
      <h2 className="font-bold uppercase mb-2 pb-1" style={{ fontSize: '11.5px', letterSpacing: '0.18em', color: t.primary, borderBottom: `1.5px solid ${t.primary}` }}>{title}</h2>
    );
  }
  return (
    <section className={last ? '' : 'mb-5'}>
      {header}
      {children}
    </section>
  );
}

function SkillsView({ skills, theme: t }: { skills: string[]; theme: Required<Omit<ThemeTokens, 'tagline'>> }) {
  if (t.skillStyle === 'pills') {
    return (
      <div className="flex flex-wrap gap-1.5">
        {skills.map((s, i) => (
          <span key={i} className="text-[12px] px-2.5 py-0.5 rounded-full" style={{ background: `${t.accent}1f`, color: t.primary }}>{s}</span>
        ))}
      </div>
    );
  }
  if (t.skillStyle === 'plain') {
    return <p style={{ fontSize: t.baseSize, color: t.text }}>{skills.join('  ·  ')}</p>;
  }
  return <p style={{ fontSize: t.baseSize, color: t.text }}>{skills.join(', ')}</p>;
}
