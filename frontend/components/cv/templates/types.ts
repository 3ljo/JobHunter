export interface CVLanguage {
  name?: string;
  level?: string;
}

export interface CVEducation {
  degree?: string;
  institution?: string;
  year?: string;
  city?: string;
  country?: string;
  url?: string;
}

export interface CVCertification {
  name?: string;
  issuer?: string;
  year?: string;
  url?: string;
}

export interface CVData {
  full_name?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  summary?: string;
  experience?: Array<{
    title?: string;
    company?: string;
    duration?: string;
    bullets?: string[];
  }>;
  skills?: string[];
  education?: Array<CVEducation>;
  certifications?: Array<string | CVCertification>;
  languages?: Array<string | CVLanguage>;
}

export interface TemplateProps {
  cv: CVData;
  photo?: string | null;
}

export type TemplateId =
  | 'harvard'
  | 'modern'
  | 'minimalist'
  | 'european'
  | 'tech'
  | 'compact'
  | 'executive'
  | 'academic'
  | 'consulting'
  | 'swiss';

export interface TemplateMeta {
  id: TemplateId;
  name: string;
  description: string;
  supportsPhoto: boolean;
  atsScore: number;
  region: string;
  proOnly: boolean;
}

export const TEMPLATES: Record<TemplateId, TemplateMeta> = {
  harvard: {
    id: 'harvard',
    name: 'Harvard Classic',
    description: 'The gold standard — Harvard OCS format used by corporate recruiters worldwide.',
    supportsPhoto: false,
    atsScore: 99,
    region: 'US / UK / Canada',
    proOnly: false,
  },
  modern: {
    id: 'modern',
    name: 'Modern Professional',
    description: "Jake's Resume-inspired — the top-rated ATS-friendly format on r/resumes.",
    supportsPhoto: false,
    atsScore: 97,
    region: 'Global',
    proOnly: false,
  },
  minimalist: {
    id: 'minimalist',
    name: 'Minimalist Executive',
    description: 'Clean whitespace-first format used by McKinsey, BCG, and Bain candidates.',
    supportsPhoto: false,
    atsScore: 96,
    region: 'Global',
    proOnly: true,
  },
  european: {
    id: 'european',
    name: 'European CV',
    description: 'Europass-inspired with optional photo. Standard for DE, CH, AT, FR applications.',
    supportsPhoto: true,
    atsScore: 94,
    region: 'Europe',
    proOnly: true,
  },
  tech: {
    id: 'tech',
    name: 'Technical Engineer',
    description: 'Skills front-and-center. Ideal for software, data, and engineering roles.',
    supportsPhoto: false,
    atsScore: 98,
    region: 'Global',
    proOnly: false,
  },
  compact: {
    id: 'compact',
    name: 'Compact One-Page',
    description: 'Tight spacing for senior candidates with lots of content that must fit on one page.',
    supportsPhoto: false,
    atsScore: 97,
    region: 'Global',
    proOnly: false,
  },
  executive: {
    id: 'executive',
    name: 'Executive Narrative',
    description: 'Strong summary opening, serif typography, optional photo — built for director and VP roles.',
    supportsPhoto: true,
    atsScore: 96,
    region: 'Global',
    proOnly: true,
  },
  academic: {
    id: 'academic',
    name: 'Academic / Research',
    description: 'Traditional academic layout with Publications section (uses Certifications field).',
    supportsPhoto: false,
    atsScore: 95,
    region: 'Global',
    proOnly: true,
  },
  consulting: {
    id: 'consulting',
    name: 'Consulting Metrics',
    description: 'McKinsey-style with numbers-first bullets. Built for consulting and strategy roles.',
    supportsPhoto: false,
    atsScore: 97,
    region: 'US / UK',
    proOnly: true,
  },
  swiss: {
    id: 'swiss',
    name: 'Swiss Grid',
    description: 'Minimalist Swiss typography with strict hierarchy, optional photo (DACH standard).',
    supportsPhoto: true,
    atsScore: 96,
    region: 'Europe / Global',
    proOnly: true,
  },
};

export const DEFAULT_TEMPLATE: TemplateId = 'harvard';

/* ─── Helpers used by every template to hide truly-empty sections ─── */

export function certText(cert: string | CVCertification | undefined | null): string {
  if (!cert) return '';
  if (typeof cert === 'string') return cert.trim();
  return (cert.name || '').trim();
}

export function certUrl(cert: string | CVCertification | undefined | null): string {
  if (!cert || typeof cert === 'string') return '';
  return (cert.url || '').trim();
}

export function certIssuer(cert: string | CVCertification | undefined | null): string {
  if (!cert || typeof cert === 'string') return '';
  return (cert.issuer || '').trim();
}

export function certYear(cert: string | CVCertification | undefined | null): string {
  if (!cert || typeof cert === 'string') return '';
  return (cert.year || '').trim();
}

export function cleanCerts(list: Array<string | CVCertification> | undefined | null): Array<string | CVCertification> {
  if (!Array.isArray(list)) return [];
  return list.filter((c) => certText(c).length > 0);
}

export function hasNonEmpty(list: unknown[] | undefined | null): boolean {
  if (!Array.isArray(list)) return false;
  return list.some((v) => {
    if (v == null) return false;
    if (typeof v === 'string') return v.trim().length > 0;
    return true;
  });
}

export function eduText(e: CVEducation | undefined | null): string {
  if (!e) return '';
  return [e.degree, e.institution, e.year, e.city, e.country, e.url]
    .filter(Boolean)
    .map((s) => String(s).trim())
    .join(' ');
}

export function eduLocation(e: CVEducation | undefined | null): string {
  if (!e) return '';
  return [e.city, e.country].filter((s) => s && String(s).trim().length > 0).join(', ');
}

export function cleanEducation<T extends CVEducation>(list: T[] | undefined | null): T[] {
  if (!Array.isArray(list)) return [];
  return list.filter((e) => eduText(e).length > 0);
}

export function langText(lang: string | CVLanguage | undefined | null): string {
  if (!lang) return '';
  if (typeof lang === 'string') return lang.trim();
  const name = (lang.name || '').trim();
  const level = (lang.level || '').trim();
  if (name && level) return `${name} — ${level}`;
  return name || level;
}

export function cleanLanguages(list: Array<string | CVLanguage> | undefined | null): Array<string | CVLanguage> {
  if (!Array.isArray(list)) return [];
  return list.filter((l) => langText(l).length > 0);
}
