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
  | 'startup'
  | 'realestate'
  | 'education'
  | 'nonprofit'
  | 'construction'
  | 'journalism'
  | 'finance'
  | 'research'
  | 'media'
  | 'retail'
  | 'logistics'
  | 'pastel'
  | 'noir'
  | 'botanical'
  | 'sunset'
  | 'neon'
  | 'kraft'
  | 'typewriter'
  | 'booklet'
  | 'blocks'
  | 'magazine'
  | 'rightcol'
  | 'threecol'
  | 'horizontal'
  | 'infographic'
  | 'cards';

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
  realestate: {
    id: 'realestate',
    name: 'Real Estate Pro',
    description: 'Playfair serif with gold double-rule. Built for brokers, agents, and property professionals.',
    supportsPhoto: false,
    atsScore: 94,
    region: 'US / UK',
    proOnly: true,
  },
  education: {
    id: 'education',
    name: 'Education Teacher',
    description: 'Friendly green with amber pill skills. Built for teachers, instructors, and curriculum staff.',
    supportsPhoto: true,
    atsScore: 95,
    region: 'Global',
    proOnly: false,
  },
  nonprofit: {
    id: 'nonprofit',
    name: 'Nonprofit Mission',
    description: 'Centered earth-tone palette for mission-driven roles in nonprofit, NGO, and social impact.',
    supportsPhoto: true,
    atsScore: 94,
    region: 'Global',
    proOnly: true,
  },
  construction: {
    id: 'construction',
    name: 'Skilled Trades',
    description: 'Charcoal band with safety-orange tabs. Built for trades, construction, and field roles.',
    supportsPhoto: false,
    atsScore: 95,
    region: 'Global',
    proOnly: false,
  },
  journalism: {
    id: 'journalism',
    name: 'Journalist Editorial',
    description: 'Newspaper-style serif, all monochrome. Built for reporters, editors, and writers.',
    supportsPhoto: false,
    atsScore: 96,
    region: 'Global',
    proOnly: true,
  },
  finance: {
    id: 'finance',
    name: 'Finance Analyst',
    description: 'Forest-green band with emerald accents. Built for analysts, accountants, and FP&A roles.',
    supportsPhoto: false,
    atsScore: 96,
    region: 'Global',
    proOnly: true,
  },
  research: {
    id: 'research',
    name: 'Research Scientist',
    description: 'IBM Plex Sans with lab-blue accents. Built for R&D, biotech, and lab scientists.',
    supportsPhoto: false,
    atsScore: 95,
    region: 'Global',
    proOnly: true,
  },
  media: {
    id: 'media',
    name: 'Media Production',
    description: 'Charcoal band with rose accents. Built for film, broadcast, and content production roles.',
    supportsPhoto: true,
    atsScore: 92,
    region: 'Global',
    proOnly: true,
  },
  retail: {
    id: 'retail',
    name: 'Retail Manager',
    description: 'Centered burgundy with amber rule. Built for store managers, ops, and customer-facing roles.',
    supportsPhoto: false,
    atsScore: 94,
    region: 'Global',
    proOnly: false,
  },
  logistics: {
    id: 'logistics',
    name: 'Logistics & Supply Chain',
    description: 'Steel-blue palette with clean typography. Built for supply chain, ops, and procurement.',
    supportsPhoto: false,
    atsScore: 95,
    region: 'Global',
    proOnly: true,
  },
  pastel: {
    id: 'pastel',
    name: 'Pastel Soft',
    description: 'Soft fuchsia palette with pill skills on a blush background. Friendly modern aesthetic.',
    supportsPhoto: true,
    atsScore: 88,
    region: 'Global',
    proOnly: true,
  },
  noir: {
    id: 'noir',
    name: 'Noir Cinema',
    description: 'Charcoal band with cinematic red tab accents. Bold, high-contrast personality.',
    supportsPhoto: true,
    atsScore: 90,
    region: 'Global',
    proOnly: true,
  },
  botanical: {
    id: 'botanical',
    name: 'Botanical Sage',
    description: 'Cormorant serif on warm cream with sage olive. Calm and natural — designers and editors.',
    supportsPhoto: true,
    atsScore: 90,
    region: 'Global',
    proOnly: true,
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset Gradient',
    description: 'Warm orange band with amber accents on cream. Energetic — sales, hospitality, marketing.',
    supportsPhoto: true,
    atsScore: 90,
    region: 'Global',
    proOnly: true,
  },
  neon: {
    id: 'neon',
    name: 'Neon Cyber',
    description: 'JetBrains Mono with violet/cyan blocks. Built for cyber, infra, and dev-rel roles.',
    supportsPhoto: false,
    atsScore: 89,
    region: 'Global',
    proOnly: true,
  },
  kraft: {
    id: 'kraft',
    name: 'Kraft Paper',
    description: 'Vintage kraft-paper background with brown ink and Courier text. Distinctive, tactile feel.',
    supportsPhoto: false,
    atsScore: 86,
    region: 'Global',
    proOnly: true,
  },
  typewriter: {
    id: 'typewriter',
    name: 'Typewriter Mono',
    description: 'All Courier monospace with hard rules. Mechanical, deliberate — for writers and engineers.',
    supportsPhoto: false,
    atsScore: 92,
    region: 'Global',
    proOnly: false,
  },
  booklet: {
    id: 'booklet',
    name: 'Booklet Centered',
    description: 'Crimson Pro serif with centered headers and ample margins. Reads like a published booklet.',
    supportsPhoto: true,
    atsScore: 93,
    region: 'Global',
    proOnly: true,
  },
  blocks: {
    id: 'blocks',
    name: 'Color Blocks',
    description: 'Indigo block-style section labels with violet pill skills. Bold, structured, modern.',
    supportsPhoto: true,
    atsScore: 91,
    region: 'Global',
    proOnly: true,
  },
  magazine: {
    id: 'magazine',
    name: 'Magazine Editorial',
    description: 'Volume-style header with red drop-cap on the summary. Editorial flair for senior creatives.',
    supportsPhoto: false,
    atsScore: 89,
    region: 'Global',
    proOnly: true,
  },
  rightcol: {
    id: 'rightcol',
    name: 'Right Sidebar',
    description: 'Sand-yellow sidebar on the right with photo, contact, skills. Mirror of the classic two-column.',
    supportsPhoto: true,
    atsScore: 91,
    region: 'Global',
    proOnly: true,
  },
  threecol: {
    id: 'threecol',
    name: 'Three Column',
    description: 'Two-thirds experience, one-third skills/edu/certs. Dense, fits a lot on one page.',
    supportsPhoto: false,
    atsScore: 93,
    region: 'Global',
    proOnly: true,
  },
  horizontal: {
    id: 'horizontal',
    name: 'Horizontal Header',
    description: 'Oversized name with side-by-side contact and date column for experience. Wide, modern.',
    supportsPhoto: false,
    atsScore: 94,
    region: 'Global',
    proOnly: true,
  },
  infographic: {
    id: 'infographic',
    name: 'Infographic Visual',
    description: 'Skill proficiency bars and teal headers. Visual — useful when skills are the headline.',
    supportsPhoto: false,
    atsScore: 89,
    region: 'Global',
    proOnly: true,
  },
  cards: {
    id: 'cards',
    name: 'Section Cards',
    description: 'Each section in its own white card on a soft slate background. Clean, app-like feel.',
    supportsPhoto: true,
    atsScore: 91,
    region: 'Global',
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
