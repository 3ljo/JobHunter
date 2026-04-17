import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import {
  User,
  Profile,
  Onboarding,
  TrackerJob,
  CVAnalysisResult,
  CVRecord,
  TrackerStats,
  SubscriptionResponse,
} from '@/types';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const registerUser = (email: string, password: string, referral_code?: string) =>
  api.post<{ message: string; user: User }>('/api/auth/register', { email, password, referral_code });

export const loginUser = (email: string, password: string) =>
  api.post<{ user: User; session: { access_token: string } }>('/api/auth/login', { email, password });

export const forgotPassword = (email: string) =>
  api.post<{ message: string }>('/api/auth/forgot-password', { email });

export const getMe = () =>
  api.get<{ user: User }>('/api/auth/me');

// Profile
export const getProfile = () =>
  api.get<{ profile: Profile }>('/api/profile');

export const updateProfile = (data: Partial<Profile>) =>
  api.put<{ message: string; profile: Profile }>('/api/profile', data);

// Onboarding
export const getOnboarding = () =>
  api.get<{ onboarding: Onboarding }>('/api/onboarding');

export const saveOnboarding = (data: Partial<Onboarding>) =>
  api.post<{ message: string; onboarding: Onboarding }>('/api/onboarding', data);

// CV
export const analyzeCV = (formData: FormData) =>
  api.post<CVAnalysisResult>('/api/cv/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  });

export const getCVHistory = () =>
  api.get<{ cvs: CVRecord[] }>('/api/cv/history');

export const deleteCV = (cvId: string) =>
  api.delete<{ message: string }>(`/api/cv/${cvId}`);

export interface CVExportOptions {
  template?: string;
  photo?: string | null;
}

export const downloadCVPdf = async (cvId: string, options: CVExportOptions = {}) => {
  const res = await api.post(`/api/cv/download/${cvId}`, options, {
    responseType: 'blob',
    timeout: 60000,
  });
  const blob = new Blob([res.data], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'cv_optimized.pdf';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const previewCVPdf = async (cvId: string, options: CVExportOptions = {}): Promise<string> => {
  const res = await api.post(`/api/cv/preview/${cvId}`, options, {
    responseType: 'blob',
    timeout: 60000,
  });
  const blob = new Blob([res.data], { type: 'application/pdf' });
  return URL.createObjectURL(blob);
};

export const refineCV = (cvId: string, instructions: string) =>
  api.post<{ final_cv: any; changes_applied: string[] }>('/api/cv/refine', {
    cv_id: cvId,
    instructions,
  }, { timeout: 60000 });

// Tracker
export const getAllTrackerJobs = () =>
  api.get<{ jobs: TrackerJob[] }>('/api/tracker');

export const addTrackerJob = (data: Omit<TrackerJob, 'id' | 'user_id' | 'created_at' | 'updated_at'>) =>
  api.post<{ message: string; job: TrackerJob }>('/api/tracker', data);

export const updateTrackerJob = (jobId: string, data: Partial<TrackerJob>) =>
  api.put<{ message: string; job: TrackerJob }>(`/api/tracker/${jobId}`, data);

export const deleteTrackerJob = (jobId: string) =>
  api.delete<{ message: string }>(`/api/tracker/${jobId}`);

export const getTrackerStats = () =>
  api.get<{ stats: TrackerStats }>('/api/tracker/stats');

// Cover Letter
export const generateCoverLetter = (data: {
  cv_text: string;
  job_description: string;
  company_name?: string;
  job_title?: string;
  tone?: string;
}) =>
  api.post<{ cover_letter: string }>('/api/cover-letter/generate', data, { timeout: 120000 });

export const generateFromPdf = (file: File, jobDescription: string, tone: string) => {
  const formData = new FormData();
  formData.append('cv_file', file);
  formData.append('job_description', jobDescription);
  formData.append('tone', tone);
  return api.post<{ cover_letter: string }>('/api/cover-letter/generate-from-pdf', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  });
};

export const refineCoverLetter = (data: { cover_letter: string; instructions: string }) =>
  api.post<{ cover_letter: string }>('/api/cover-letter/refine', data, { timeout: 60000 });

// Password
export const changePassword = (newPassword: string) =>
  api.post<{ message: string }>('/api/auth/change-password', { new_password: newPassword });

// Usage
export const getMyUsage = () =>
  api.get('/api/profile/usage');

// Promo codes
export const validatePromoCode = (code: string) =>
  api.post<{ valid: boolean; promo: { id: string; code: string; discount_type: 'percent' | 'fixed'; discount_amount: number } }>('/api/promo/validate', { code });

// Referrals
export const getMyReferralCode = () =>
  api.get<{ referral_code: { id: string; user_id: string; code: string; times_used: number } }>('/api/referral/my-code');

export const getMyReferrals = () =>
  api.get<{ referrals: Array<{ id: string; referred_user_id: string; referred_email: string; referrer_reward_applied: boolean; referred_reward_applied: boolean; created_at: string }> }>('/api/referral/my-referrals');

export const validateReferralCode = (code: string) =>
  api.post<{ valid: boolean; referral_code: string }>('/api/referral/validate', { code });

export const checkReferralDiscount = () =>
  api.get<{ has_discount: boolean; discount_type?: string; discount_amount?: number; label?: string }>('/api/referral/check-discount');

// Admin promo codes
export const getAdminPromos = () =>
  api.get('/api/admin/promos');

export const createAdminPromo = (data: { code: string; discount_type: string; discount_amount: number; max_uses?: number; expires_at?: string }) =>
  api.post('/api/admin/promos', data);

export const updateAdminPromo = (id: string, data: Record<string, any>) =>
  api.put(`/api/admin/promos/${id}`, data);

export const deleteAdminPromo = (id: string) =>
  api.delete(`/api/admin/promos/${id}`);

// Admin referrals
export const getAdminReferrals = () =>
  api.get('/api/admin/referrals');

// Subscription
export const getSubscription = () =>
  api.get<SubscriptionResponse>('/api/subscription');

export const createCheckoutSession = (plan: string, interval: 'month' | 'year', payment_method?: string) =>
  api.post<{ url: string }>('/api/subscription/checkout', { plan, interval, payment_method });

export const createPortalSession = () =>
  api.post<{ url: string }>('/api/subscription/portal');

// Admin
export const checkAdmin = () =>
  api.get<{ isAdmin: boolean; email: string }>('/api/admin/check');

export const getAdminDashboard = () =>
  api.get('/api/admin/dashboard');

export const getAdminUsers = () =>
  api.get('/api/admin/users');

export const getAdminUsage = (days = 30) =>
  api.get(`/api/admin/usage?days=${days}`);

export const getAdminSettings = () =>
  api.get('/api/admin/settings');

export const updateAdminSettings = (settings: Record<string, any>) =>
  api.put('/api/admin/settings', settings);

// ═════════════════════ Mock Interview (Pro+ only) ═════════════════════

export interface InterviewQuestion {
  id: string;
  text: string;
  kind: 'behavioral' | 'technical' | 'situational';
  expected_signals?: string[];
}

export interface InterviewAnswer {
  question_id: string;
  transcript: string;
  score: number;
  feedback: string;
  missing_signals?: string[];
}

export interface InterviewReport {
  overall_score: number;
  strengths: string[];
  weaknesses: string[];
  top_improvements: string[];
}

export interface StartInterviewBody {
  cv_id?: string | null;
  job_description: string;
  job_title?: string;
  difficulty?: 'standard' | 'challenging' | 'stress';
}

export interface InterviewHistoryItem {
  id: string;
  job_title: string | null;
  difficulty: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  final_report: InterviewReport | null;
}

export const startInterview = (body: StartInterviewBody) =>
  api.post<{ id: string; questions: InterviewQuestion[] }>('/api/interview/start', body, { timeout: 120000 });

export const submitInterviewAnswer = (interviewId: string, questionId: string, transcript: string) =>
  api.post<{
    question_id: string;
    score: number;
    feedback: string;
    missing_signals: string[];
  }>(`/api/interview/${interviewId}/answer`, { question_id: questionId, transcript }, { timeout: 60000 });

export const finishInterview = (interviewId: string) =>
  api.post<{ id: string; final_report: InterviewReport }>(`/api/interview/${interviewId}/finish`, {}, { timeout: 90000 });

export const getInterview = (interviewId: string) =>
  api.get(`/api/interview/${interviewId}`);

export const getInterviewHistory = () =>
  api.get<{ interviews: InterviewHistoryItem[] }>('/api/interview/history');

export default api;
