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
  education?: Array<{
    degree?: string;
    institution?: string;
    year?: string;
  }>;
  certifications?: Array<string | { name?: string }>;
}

export interface TemplateProps {
  cv: CVData;
  photo?: string | null;
}

export type TemplateId = 'harvard' | 'modern' | 'minimalist' | 'european';

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
};

export const DEFAULT_TEMPLATE: TemplateId = 'harvard';
