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
  | 'original'
  | 'harvard'
  | 'modern'
  | 'minimalist'
  | 'european'
  | 'tech'
  | 'compact'
  | 'executive'
  | 'academic'
  | 'consulting'
  | 'swiss'
  | 'sidebar'
  | 'creative'
  | 'darktech'
  | 'sales'
  | 'functional'
  | 'serif'
  | 'mono'
  | 'timeline'
  | 'banking'
  | 'healthcare'
  | 'government'
  | 'designer'
  | 'marketing'
  | 'legal'
  | 'twotone'
  | 'startup';

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
  original: {
    id: 'original',
    name: 'Original PDF',
    description: 'Preview-only. Shows your uploaded file as-is. AI edits still apply — switch to a template to see them rendered.',
    supportsPhoto: false,
    atsScore: 0,
    region: 'Preview only',
    proOnly: false,
  },
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
  sidebar: {
    id: 'sidebar',
    name: 'Two-Column Sidebar',
    description: 'Navy sidebar with photo, skills, and contact — clean main column for experience.',
    supportsPhoto: true,
    atsScore: 92,
    region: 'Global',
    proOnly: true,
  },
  creative: {
    id: 'creative',
    name: 'Creative Bold',
    description: 'Full-width violet→pink gradient header with optional photo. For designers, marketers, and creatives.',
    supportsPhoto: true,
    atsScore: 90,
    region: 'Global',
    proOnly: true,
  },
  darktech: {
    id: 'darktech',
    name: 'Dark Tech',
    description: 'Charcoal sidebar with cyan terminal accents. Built for engineers, infra, and security roles.',
    supportsPhoto: true,
    atsScore: 91,
    region: 'Global',
    proOnly: true,
  },
  sales: {
    id: 'sales',
    name: 'Sales Performance',
    description: 'Auto-paints quotas, %, and revenue figures as green KPI pills. Built for sales, BD, and revenue roles.',
    supportsPhoto: false,
    atsScore: 96,
    region: 'Global',
    proOnly: true,
  },
  functional: {
    id: 'functional',
    name: 'Career Changer',
    description: 'Skills-first functional layout with strengths grid up top. Ideal for re-entry and pivots.',
    supportsPhoto: false,
    atsScore: 94,
    region: 'Global',
    proOnly: true,
  },
  serif: {
    id: 'serif',
    name: 'Elegant Serif',
    description: 'Premium Playfair-style serif with gold double-rule. For director, partner, and senior consulting roles.',
    supportsPhoto: true,
    atsScore: 95,
    region: 'Global',
    proOnly: true,
  },
  mono: {
    id: 'mono',
    name: 'Monochrome Bold',
    description: 'Brutalist black-and-white with a heavy name block. Maximum contrast, zero distraction.',
    supportsPhoto: false,
    atsScore: 95,
    region: 'Global',
    proOnly: false,
  },
  timeline: {
    id: 'timeline',
    name: 'Timeline Career',
    description: 'Vertical timeline with date markers — visualises career progression at a glance.',
    supportsPhoto: false,
    atsScore: 92,
    region: 'Global',
    proOnly: true,
  },
  banking: {
    id: 'banking',
    name: 'Banking Conservative',
    description: 'Centered serif with double-rule borders. Standard for IB, PE, and asset management.',
    supportsPhoto: false,
    atsScore: 96,
    region: 'US / UK',
    proOnly: true,
  },
  healthcare: {
    id: 'healthcare',
    name: 'Healthcare Professional',
    description: 'Teal accent with optional photo and competency pills. Built for clinical and medical roles.',
    supportsPhoto: true,
    atsScore: 94,
    region: 'Global',
    proOnly: true,
  },
  government: {
    id: 'government',
    name: 'Government Federal',
    description: 'USAJOBS-inspired layout with double-rule header and federal blue. Built for public-sector applications.',
    supportsPhoto: false,
    atsScore: 98,
    region: 'US Federal',
    proOnly: true,
  },
  designer: {
    id: 'designer',
    name: 'Designer Portfolio',
    description: 'Coral and peach palette with rounded photo. Built for designers, illustrators, and creatives.',
    supportsPhoto: true,
    atsScore: 88,
    region: 'Global',
    proOnly: true,
  },
  marketing: {
    id: 'marketing',
    name: 'Marketing Spotlight',
    description: 'Magenta-to-orange gradient header with pill date tags. Built for marketing, brand, and growth roles.',
    supportsPhoto: false,
    atsScore: 90,
    region: 'Global',
    proOnly: true,
  },
  legal: {
    id: 'legal',
    name: 'Legal Formal',
    description: 'Garamond serif with burgundy diamond divider. Standard for law firms and judicial clerkships.',
    supportsPhoto: false,
    atsScore: 96,
    region: 'US / UK',
    proOnly: true,
  },
  twotone: {
    id: 'twotone',
    name: 'Modern Two-Tone',
    description: 'Slate header block with sky-blue accent and optional photo. Polished hybrid of formal and modern.',
    supportsPhoto: true,
    atsScore: 93,
    region: 'Global',
    proOnly: true,
  },
  startup: {
    id: 'startup',
    name: 'Startup Founder',
    description: 'Numbered sections with monospace dates and "shipping" pill. Built for founders, PMs, and early-stage hires.',
    supportsPhoto: false,
    atsScore: 92,
    region: 'Global',
    proOnly: false,
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
