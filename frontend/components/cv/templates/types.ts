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
  | 'cards'
  | 'nursing'
  | 'faculty'
  | 'dental'
  | 'solicitor'
  | 'police'
  | 'military'
  | 'aviation'
  | 'culinary'
  | 'fitness'
  | 'ngofield'
  | 'translator'
  | 'accountant'
  | 'arctic'
  | 'terracotta'
  | 'lavender'
  | 'emerald'
  | 'sapphire'
  | 'plum'
  | 'mustard'
  | 'seafoam'
  | 'rose'
  | 'coal'
  | 'forest'
  | 'crimson'
  | 'mocha'
  | 'cobalt'
  | 'ash'
  | 'retro'
  | 'modernist'
  | 'ultramin'
  | 'coolgrad'
  | 'chrome'
  | 'pastoral'
  | 'zen'
  | 'industrial'
  | 'paperback'
  | 'midnight'
  | 'coralcalm'
  | 'ashfog'
  | 'goldroyal'
  | 'scarlet'
  | 'tealclean'
  | 'navycoral'
  | 'bronze'
  | 'violet'
  | 'orangebold'
  | 'charcoalserif'
  | 'maroon'
  | 'jade'
  | 'silverelite';

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

  /* ── Industry-specific (12) ──────────────────────────────── */
  nursing: { id: 'nursing', name: 'Nursing Care', description: 'Cardinal-red palette with pill skills. Built for RNs, NPs, and healthcare assistants.', supportsPhoto: true, atsScore: 95, region: 'Global', proOnly: true },
  faculty: { id: 'faculty', name: 'University Faculty', description: 'Forest serif with amber accents. Built for professors, lecturers, and academic staff.', supportsPhoto: true, atsScore: 95, region: 'Global', proOnly: true },
  dental: { id: 'dental', name: 'Dental Practice', description: 'Teal and sage palette with pill skills. Built for dentists, hygienists, and orthodontic roles.', supportsPhoto: true, atsScore: 94, region: 'Global', proOnly: true },
  solicitor: { id: 'solicitor', name: 'Solicitor / Barrister', description: 'Oxblood serif with bronze accents — UK legal profession standard.', supportsPhoto: false, atsScore: 96, region: 'UK / EU', proOnly: true },
  police: { id: 'police', name: 'Law Enforcement', description: 'Navy band with gold accents. Built for police, federal, and security professionals.', supportsPhoto: false, atsScore: 96, region: 'Global', proOnly: true },
  military: { id: 'military', name: 'Military / Veteran', description: 'Olive and tan with centered headers. Built for active-duty, veterans, and defense roles.', supportsPhoto: false, atsScore: 96, region: 'Global', proOnly: true },
  aviation: { id: 'aviation', name: 'Aviation / Pilot', description: 'Slate band with silver accents. Built for pilots, ATC, and aviation maintenance.', supportsPhoto: true, atsScore: 95, region: 'Global', proOnly: true },
  culinary: { id: 'culinary', name: 'Culinary Chef', description: 'Cocoa serif with crimson accents. Built for chefs, F&B, and hospitality leadership.', supportsPhoto: true, atsScore: 92, region: 'Global', proOnly: true },
  fitness: { id: 'fitness', name: 'Fitness Trainer', description: 'High-contrast black band with safety-orange tabs. Built for trainers, coaches, and instructors.', supportsPhoto: true, atsScore: 92, region: 'Global', proOnly: true },
  ngofield: { id: 'ngofield', name: 'NGO Field Worker', description: 'Earthy ochre with amber accents. Built for field staff, programs, and humanitarian work.', supportsPhoto: false, atsScore: 93, region: 'Global', proOnly: true },
  translator: { id: 'translator', name: 'Translator / Linguist', description: 'Indigo with mustard accents. Built for translators, interpreters, and localization staff.', supportsPhoto: false, atsScore: 95, region: 'Global', proOnly: true },
  accountant: { id: 'accountant', name: 'CPA / Accountant', description: 'Forest centered with lime accents. Built for CPAs, auditors, and tax professionals.', supportsPhoto: false, atsScore: 96, region: 'Global', proOnly: true },

  /* ── Aesthetic (15) ─────────────────────────────────────── */
  arctic: { id: 'arctic', name: 'Arctic Minimal', description: 'Ice-blue background with deep teal text. Quiet, cool, modern.', supportsPhoto: true, atsScore: 91, region: 'Global', proOnly: true },
  terracotta: { id: 'terracotta', name: 'Terracotta Earth', description: 'Warm clay palette on cream. Built for designers, makers, and earthy brands.', supportsPhoto: true, atsScore: 89, region: 'Global', proOnly: true },
  lavender: { id: 'lavender', name: 'Lavender Calm', description: 'Soft violet with lilac accents. Calm, considered, inviting.', supportsPhoto: true, atsScore: 90, region: 'Global', proOnly: true },
  emerald: { id: 'emerald', name: 'Emerald Luxe', description: 'Deep emerald band with gold accents. Built for luxury, jewelry, and premium retail.', supportsPhoto: true, atsScore: 91, region: 'Global', proOnly: true },
  sapphire: { id: 'sapphire', name: 'Sapphire Royal', description: 'Sapphire band with silver accents and block-style sections. Bold and regal.', supportsPhoto: true, atsScore: 91, region: 'Global', proOnly: true },
  plum: { id: 'plum', name: 'Plum Modern', description: 'Plum primary with peach accents. Stylish without being loud.', supportsPhoto: true, atsScore: 90, region: 'Global', proOnly: true },
  mustard: { id: 'mustard', name: 'Mustard Bold', description: 'Mustard band with navy tabs. High-contrast, confident statement piece.', supportsPhoto: true, atsScore: 89, region: 'Global', proOnly: true },
  seafoam: { id: 'seafoam', name: 'Seafoam Coastal', description: 'Seafoam teal on cream with sand accents. Built for hospitality and coastal brands.', supportsPhoto: true, atsScore: 90, region: 'Global', proOnly: true },
  rose: { id: 'rose', name: 'Rose Elegant', description: 'Rose serif with blush accents — formal yet warm.', supportsPhoto: true, atsScore: 92, region: 'Global', proOnly: true },
  coal: { id: 'coal', name: 'Coal Industrial', description: 'Charcoal monospace with steel accents. Built for utilities, energy, heavy industry.', supportsPhoto: false, atsScore: 91, region: 'Global', proOnly: true },
  forest: { id: 'forest', name: 'Forest Deep', description: 'Forest green with lime accents. Built for environment, sustainability, outdoor brands.', supportsPhoto: true, atsScore: 92, region: 'Global', proOnly: true },
  crimson: { id: 'crimson', name: 'Crimson Power', description: 'Crimson band with rose accents. Bold, decisive, leadership-ready.', supportsPhoto: false, atsScore: 91, region: 'Global', proOnly: true },
  mocha: { id: 'mocha', name: 'Mocha Warm', description: 'Cocoa serif on warm cream. Built for hospitality, lifestyle, food and beverage roles.', supportsPhoto: true, atsScore: 91, region: 'Global', proOnly: true },
  cobalt: { id: 'cobalt', name: 'Cobalt Tech', description: 'Cobalt monospace with amber tabs. Built for engineers, infra, dev-rel.', supportsPhoto: false, atsScore: 92, region: 'Global', proOnly: true },
  ash: { id: 'ash', name: 'Ash Quiet', description: 'Neutral ash palette — minimal, no color, lots of whitespace.', supportsPhoto: true, atsScore: 93, region: 'Global', proOnly: true },

  /* ── Style / mood (15) ──────────────────────────────────── */
  retro: { id: 'retro', name: 'Retro 80s', description: 'Magenta and cyan synthwave palette in monospace. Bold retro statement.', supportsPhoto: false, atsScore: 87, region: 'Global', proOnly: true },
  modernist: { id: 'modernist', name: 'Modernist Bold', description: 'Heavy black-and-red with strong tabs. High-contrast Bauhaus-inspired.', supportsPhoto: true, atsScore: 90, region: 'Global', proOnly: true },
  ultramin: { id: 'ultramin', name: 'Ultra Minimal', description: 'Black on white with no color. Maximum whitespace, minimum chrome.', supportsPhoto: false, atsScore: 95, region: 'Global', proOnly: false },
  coolgrad: { id: 'coolgrad', name: 'Cool Gradient', description: 'Deep blue band fading to violet pill skills. Modern dev-team energy.', supportsPhoto: true, atsScore: 91, region: 'Global', proOnly: true },
  chrome: { id: 'chrome', name: 'Chrome Metal', description: 'Black band with chrome silver accents in monospace. Cyber-industrial.', supportsPhoto: false, atsScore: 90, region: 'Global', proOnly: true },
  pastoral: { id: 'pastoral', name: 'Pastoral Country', description: 'Warm sepia serif on cream. Vintage countryside aesthetic.', supportsPhoto: true, atsScore: 89, region: 'Global', proOnly: true },
  zen: { id: 'zen', name: 'Zen Japandi', description: 'Cocoa serif on bone with stone accents. Calm, minimal, considered.', supportsPhoto: true, atsScore: 92, region: 'Global', proOnly: true },
  industrial: { id: 'industrial', name: 'Industrial Steel', description: 'Gunmetal band with safety-orange tabs. Built for manufacturing, energy, and ops.', supportsPhoto: false, atsScore: 92, region: 'Global', proOnly: true },
  paperback: { id: 'paperback', name: 'Paperback Novel', description: 'Sepia serif on warm beige. Reads like a paperback book.', supportsPhoto: false, atsScore: 90, region: 'Global', proOnly: true },
  midnight: { id: 'midnight', name: 'Midnight Blue', description: 'Deep navy band with cyan blocks. Premium, sleek, tech-forward.', supportsPhoto: true, atsScore: 91, region: 'Global', proOnly: true },
  coralcalm: { id: 'coralcalm', name: 'Coral Calm', description: 'Burnt coral with peach accents — centered and approachable.', supportsPhoto: true, atsScore: 90, region: 'Global', proOnly: true },
  ashfog: { id: 'ashfog', name: 'Ash Fog', description: 'Slate primary with foggy grey pill skills. Quiet professional.', supportsPhoto: true, atsScore: 92, region: 'Global', proOnly: true },
  goldroyal: { id: 'goldroyal', name: 'Gold Royal', description: 'Black serif with gold rule accents. Premium luxury aesthetic.', supportsPhoto: false, atsScore: 92, region: 'Global', proOnly: true },
  scarlet: { id: 'scarlet', name: 'Scarlet Pro', description: 'Bold scarlet band on cream. Energetic, eye-catching, modern.', supportsPhoto: false, atsScore: 90, region: 'Global', proOnly: true },
  tealclean: { id: 'tealclean', name: 'Teal Clean', description: 'Teal primary with mint pill skills. Fresh, modern, friendly.', supportsPhoto: true, atsScore: 92, region: 'Global', proOnly: true },

  /* ── Final mix (8) ──────────────────────────────────────── */
  navycoral: { id: 'navycoral', name: 'Navy & Coral', description: 'Navy primary with coral accents. Classic professional with a warm twist.', supportsPhoto: true, atsScore: 92, region: 'Global', proOnly: true },
  bronze: { id: 'bronze', name: 'Bronze Warm', description: 'Bronze serif with amber accents — centered and stately.', supportsPhoto: false, atsScore: 91, region: 'Global', proOnly: true },
  violet: { id: 'violet', name: 'Violet Elegant', description: 'Royal violet with silver accents. Refined, modern, distinctive.', supportsPhoto: true, atsScore: 91, region: 'Global', proOnly: true },
  orangebold: { id: 'orangebold', name: 'Orange Bold', description: 'Charcoal band with safety-orange blocks. Confident and direct.', supportsPhoto: false, atsScore: 90, region: 'Global', proOnly: true },
  charcoalserif: { id: 'charcoalserif', name: 'Charcoal Serif', description: 'Centered charcoal serif with grey accents. Editorial executive.', supportsPhoto: true, atsScore: 92, region: 'Global', proOnly: true },
  maroon: { id: 'maroon', name: 'Maroon Classic', description: 'Maroon serif on warm vellum. Traditional, scholarly, timeless.', supportsPhoto: false, atsScore: 92, region: 'Global', proOnly: true },
  jade: { id: 'jade', name: 'Jade Natural', description: 'Jade primary with mint pill skills. Calm, organic, balanced.', supportsPhoto: true, atsScore: 92, region: 'Global', proOnly: true },
  silverelite: { id: 'silverelite', name: 'Silver Elite', description: 'Slate band with silver pill accents. Polished, executive, premium.', supportsPhoto: true, atsScore: 93, region: 'Global', proOnly: true },
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
