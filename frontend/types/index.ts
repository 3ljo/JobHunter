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
  applied_at: string;
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
  download_url: string | null;
  cv_record_id: string | null;
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

