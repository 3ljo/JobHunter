export interface User {
  id: string;
  email: string;
  created_at?: string;
}

export interface Profile {
  id?: string;
  user_id?: string;
  full_name: string;
  location: string;
  linkedin_url: string;
  website_url: string;
  avatar_url: string;
}

export interface Onboarding {
  id?: string;
  user_id?: string;
  job_title: string;
  career_level: string;
  job_type: string;
  preferred_locations: string[];
  preferred_industries: string[];
  skills: string[];
}

export interface TrackerJob {
  id: string;
  user_id?: string;
  company_name: string;
  job_title: string;
  job_url: string;
  status: 'applied' | 'interview' | 'offer' | 'rejected' | 'saved';
  notes: string;
  created_at: string;
  updated_at?: string;
}

export interface CVRecord {
  id: string;
  user_id?: string;
  file_name: string;
  ats_score: number;
  projected_score: number;
  download_url: string;
  created_at: string;
}

export interface JobSearchResult {
  title: string;
  company: string;
  location: string;
  type: string;
  description: string;
  url: string;
  logo_url?: string;
  salary?: string;
}

export interface SuggestedSite {
  name: string;
  url: string;
  reason: string;
  is_free: boolean;
}

export interface ATSScores {
  current_ats: number;
  projected_ats: number;
  formatting: number;
  keyword_match: number;
  bullet_quality: number;
  section_structure: number;
}

export interface CVAnalysisResult {
  parsed: any;
  audit: any;
  rewrite: any;
  final: any;
  scores: ATSScores;
  download_url: string;
}

export interface TrackerStats {
  total: number;
  applied: number;
  interview: number;
  offer: number;
  rejected: number;
  saved: number;
}

export interface ApiResponse<T> {
  message?: string;
  data?: T;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  jobs?: JobSearchResult[];
  search_performed?: boolean;
}
