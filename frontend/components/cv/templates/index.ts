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
import AccentSidebar from './AccentSidebar';
import CreativeBold from './CreativeBold';
import DarkTech from './DarkTech';
import SalesPerformance from './SalesPerformance';
import CareerChanger from './CareerChanger';
import ElegantSerif from './ElegantSerif';
import MonochromeBold from './MonochromeBold';
import TimelineCareer from './TimelineCareer';
import BankingConservative from './BankingConservative';
import HealthcareProfessional from './HealthcareProfessional';
import GovernmentFederal from './GovernmentFederal';
import DesignerPortfolio from './DesignerPortfolio';
import MarketingSpotlight from './MarketingSpotlight';
import LegalFormal from './LegalFormal';
import ModernTwoTone from './ModernTwoTone';
import StartupFounder from './StartupFounder';
import RealEstatePro from './RealEstatePro';
import EducationTeacher from './EducationTeacher';
import NonprofitMission from './NonprofitMission';
import ConstructionTrades from './ConstructionTrades';
import JournalistEditorial from './JournalistEditorial';
import FinanceAnalyst from './FinanceAnalyst';
import ScientistResearch from './ScientistResearch';
import MediaProduction from './MediaProduction';
import RetailManager from './RetailManager';
import LogisticsSupply from './LogisticsSupply';
import PastelSoft from './PastelSoft';
import NoirCinema from './NoirCinema';
import BotanicalSage from './BotanicalSage';
import SunsetGradient from './SunsetGradient';
import NeonCyber from './NeonCyber';
import KraftPaper from './KraftPaper';
import TypewriterMono from './TypewriterMono';
import BookletCenter from './BookletCenter';
import ColorBlocks from './ColorBlocks';
import MagazineEditorial from './MagazineEditorial';
import RightSidebar from './RightSidebar';
import ThreeColumn from './ThreeColumn';
import HorizontalHeader from './HorizontalHeader';
import InfographicVisual from './InfographicVisual';
import SectionCards from './SectionCards';
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
  sidebar: AccentSidebar,
  creative: CreativeBold,
  darktech: DarkTech,
  sales: SalesPerformance,
  functional: CareerChanger,
  serif: ElegantSerif,
  mono: MonochromeBold,
  timeline: TimelineCareer,
  banking: BankingConservative,
  healthcare: HealthcareProfessional,
  government: GovernmentFederal,
  designer: DesignerPortfolio,
  marketing: MarketingSpotlight,
  legal: LegalFormal,
  twotone: ModernTwoTone,
  startup: StartupFounder,
  realestate: RealEstatePro,
  education: EducationTeacher,
  nonprofit: NonprofitMission,
  construction: ConstructionTrades,
  journalism: JournalistEditorial,
  finance: FinanceAnalyst,
  research: ScientistResearch,
  media: MediaProduction,
  retail: RetailManager,
  logistics: LogisticsSupply,
  pastel: PastelSoft,
  noir: NoirCinema,
  botanical: BotanicalSage,
  sunset: SunsetGradient,
  neon: NeonCyber,
  kraft: KraftPaper,
  typewriter: TypewriterMono,
  booklet: BookletCenter,
  blocks: ColorBlocks,
  magazine: MagazineEditorial,
  rightcol: RightSidebar,
  threecol: ThreeColumn,
  horizontal: HorizontalHeader,
  infographic: InfographicVisual,
  cards: SectionCards,
};

export { TEMPLATES, DEFAULT_TEMPLATE };
export type { TemplateId, TemplateMeta, TemplateProps, CVData };
