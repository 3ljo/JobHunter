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

// Endpoints where a 401 is a *normal* response (bad credentials / invalid
// reset token / expired verification link) — the calling page handles the
// error inline. The global redirect-to-login interceptor below only fires
// for 401s on *authenticated* endpoints (i.e. genuinely expired sessions).
const UNAUTH_401_ENDPOINTS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/resend-verification',
  '/api/auth/reset-password',
];

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Strip query string and baseURL before comparing so both relative
      // and absolute request URLs match the allowlist.
      const url: string = error.config?.url || '';
      const path = url.split('?')[0];
      const isUnauthEndpoint = UNAUTH_401_ENDPOINTS.some((e) => path.endsWith(e));
      if (!isUnauthEndpoint) {
        useAuthStore.getState().logout();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const registerUser = (email: string, password: string) =>
  api.post<{ message: string; user: User }>('/api/auth/register', {
    email,
    password,
  });

export const loginUser = (email: string, password: string) =>
  api.post<{ user: User; session: { access_token: string } }>('/api/auth/login', { email, password });

export const forgotPassword = (email: string) =>
  api.post<{ message: string }>('/api/auth/forgot-password', { email });

export const resendVerification = (email: string) =>
  api.post<{ message: string }>('/api/auth/resend-verification', { email });

export const resetPassword = (access_token: string, new_password: string) =>
  api.post<{ message: string }>('/api/auth/reset-password', { access_token, new_password });

export const getMe = () =>
  api.get<{ user: User }>('/api/auth/me');

// Profile
export const getProfile = () =>
  api.get<{ profile: Profile | null }>('/api/profile');

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

export interface CreateCVData {
  full_name: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  summary?: string;
  experience?: Array<{ title?: string; company?: string; duration?: string; bullets?: string[] }>;
  education?: Array<{ degree?: string; institution?: string; year?: string }>;
  skills?: string[];
  certifications?: string[];
  languages?: Array<{ name: string; level?: string }>;
}

export const createCV = (cv: CreateCVData, template?: string, photo?: string | null) =>
  api.post<{ cv_record_id: string; final_cv: any }>('/api/cv/create', {
    cv,
    template,
    photo: photo || null,
  }, { timeout: 30000 });

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

// Account deletion
export const deleteAccount = () =>
  api.delete<{ message: string }>('/api/auth/account');

// Usage
export const getMyUsage = () =>
  api.get('/api/profile/usage');

// Promo codes
export const validatePromoCode = (code: string) =>
  api.post<{ valid: boolean; promo: { id: string; code: string; discount_type: 'percent' | 'fixed'; discount_amount: number } }>('/api/promo/validate', { code });

// Admin promo codes
export const getAdminPromos = () =>
  api.get('/api/admin/promos');

export const createAdminPromo = (data: { code: string; discount_type: string; discount_amount: number; max_uses?: number; expires_at?: string }) =>
  api.post('/api/admin/promos', data);

export const updateAdminPromo = (id: string, data: Record<string, any>) =>
  api.put(`/api/admin/promos/${id}`, data);

export const deleteAdminPromo = (id: string) =>
  api.delete(`/api/admin/promos/${id}`);

// Gift-a-Pass
export interface GiftLookup {
  recipient_email: string;
  message: string | null;
  redeemed: boolean;
  created_at: string;
}

export const createGiftCheckout = (recipient_email: string, message?: string) =>
  api.post<{ url: string }>('/api/gift/checkout', { recipient_email, message });

export const lookupGift = (code: string) =>
  api.get<GiftLookup>(`/api/gift/${encodeURIComponent(code)}`);

export const redeemGift = (code: string) =>
  api.post<{ ok: true; expires_at: string }>(`/api/gift/${encodeURIComponent(code)}/redeem`);

// Subscription
export const getSubscription = () =>
  api.get<SubscriptionResponse>('/api/subscription');

export const createCheckoutSession = (plan: string, interval: 'month' | 'year' | 'once', payment_method?: string) =>
  api.post<{ url: string }>('/api/subscription/checkout', { plan, interval, payment_method });

export const createPortalSession = () =>
  api.post<{ url: string }>('/api/subscription/portal');

// Self-heal: re-pull the caller's latest subscription from Lemon
// Squeezy and upsert our DB row. Used when a user paid but the
// webhook didn't land (test-mode misconfig, 5xx retry, etc). Safe
// no-op if LS has nothing for this email.
export const resyncSubscription = () =>
  api.post<{
    ok: boolean;
    changed: boolean;
    message?: string;
    subscription?: {
      plan: string;
      status: string;
      billing_interval: string | null;
      current_period_end: string | null;
    };
  }>('/api/subscription/resync');

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

// ═════════════════════ Mock Interview (Pro Voice only for voice; Pro gets text) ═════════════════════

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
