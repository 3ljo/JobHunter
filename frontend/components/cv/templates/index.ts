import HarvardClassic from './HarvardClassic';
import ModernProfessional from './ModernProfessional';
import MinimalistExecutive from './MinimalistExecutive';
import EuropeanCV from './EuropeanCV';
import { TEMPLATES, DEFAULT_TEMPLATE, type TemplateId, type TemplateMeta, type TemplateProps, type CVData } from './types';

export const TEMPLATE_COMPONENTS: Record<TemplateId, React.FC<TemplateProps>> = {
  harvard: HarvardClassic,
  modern: ModernProfessional,
  minimalist: MinimalistExecutive,
  european: EuropeanCV,
};

export { TEMPLATES, DEFAULT_TEMPLATE };
export type { TemplateId, TemplateMeta, TemplateProps, CVData };
