import HarvardClassic from './HarvardClassic';
import ModernProfessional from './ModernProfessional';
import MinimalistExecutive from './MinimalistExecutive';
import EuropeanCV from './EuropeanCV';
import TechnicalEngineer from './TechnicalEngineer';
import CompactOnePage from './CompactOnePage';
import ExecutiveNarrative from './ExecutiveNarrative';
import AcademicResearch from './AcademicResearch';
import ConsultingMetrics from './ConsultingMetrics';
import SwissGrid from './SwissGrid';
import { TEMPLATES, DEFAULT_TEMPLATE, type TemplateId, type TemplateMeta, type TemplateProps, type CVData } from './types';

// 'original' is handled specially by CVPreview (renders the uploaded PDF in an iframe).
// Fall back to Harvard so accidental direct usage still produces something.
export const TEMPLATE_COMPONENTS: Record<TemplateId, React.FC<TemplateProps>> = {
  original: HarvardClassic,
  harvard: HarvardClassic,
  modern: ModernProfessional,
  minimalist: MinimalistExecutive,
  european: EuropeanCV,
  tech: TechnicalEngineer,
  compact: CompactOnePage,
  executive: ExecutiveNarrative,
  academic: AcademicResearch,
  consulting: ConsultingMetrics,
  swiss: SwissGrid,
};

export { TEMPLATES, DEFAULT_TEMPLATE };
export type { TemplateId, TemplateMeta, TemplateProps, CVData };
