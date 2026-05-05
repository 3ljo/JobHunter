import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import { readCsrfToken } from '@/lib/csrf';
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
  // Send the httpOnly session cookie + readable CSRF cookie on every
  // request. Backend CORS already allows credentials.
  withCredentials: true,
});

// Attach the access token as `Authorization: Bearer <t>` on every
// request. Cookie auth is still primary on browsers that allow it;
// this is the fallback for environments where the third-party cookie
// is blocked (mobile Safari/Chrome, desktop Chrome since 2024). The
// backend's requireAuth checks both transports — whichever arrives
// first wins. Don't overwrite an Authorization header the caller has
// already set (e.g. password reset / OAuth exchange use one-shot
// recovery tokens).
api.interceptors.request.use((config) => {
  const headers = (config.headers || {}) as Record<string, string>;
  if (!headers['Authorization'] && !headers['authorization']) {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  // Echo the CSRF cookie back as X-CSRF-Token on every state-changing
  // request. The backend's csrfMiddleware compares header to cookie;
  // an attacker on a different origin can't read the cookie due to
  // the Same-Origin Policy, so they can't forge a matching header.
  // (When auth rides in the Authorization header, csrfMiddleware
  // skips the check anyway — but harmless to send.)
  const method = (config.method || 'get').toLowerCase();
  if (method !== 'get' && method !== 'head' && method !== 'options') {
    const csrf = readCsrfToken();
    if (csrf) headers['X-CSRF-Token'] = csrf;
  }

  config.headers = headers as any;
  return config;
});

// Endpoints where 401/403 are *normal* responses (bad credentials,
// invalid reset token, expired verification link, MFA-required) and
// the calling page handles the error inline.
const UNAUTH_ENDPOINTS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/resend-verification',
  '/api/auth/reset-password',
  '/api/auth/mfa/login/challenge',
  '/api/auth/mfa/login/verify',
];

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401) {
      const url: string = error.config?.url || '';
      const path = url.split('?')[0];
      const isUnauthEndpoint = UNAUTH_ENDPOINTS.some((e) => path.endsWith(e));
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
export type LoginResponse =
  | { user: User; session: { access_token: string }; mfa_required?: false }
  | {
      mfa_required: true;
      partial_session: { access_token: string };
      factor_id: string;
    };

export const registerUser = (email: string, password: string) =>
  api.post<{ message: string }>('/api/auth/register', { email, password });

export const loginUser = (email: string, password: string) =>
  api.post<LoginResponse>('/api/auth/login', { email, password });

export const logoutUser = () =>
  api.post<{ message: string }>('/api/auth/logout');

export const forgotPassword = (email: string) =>
  api.post<{ message: string }>('/api/auth/forgot-password', { email });

export const resendVerification = (email: string) =>
  api.post<{ message: string }>('/api/auth/resend-verification', { email });

// Recovery token rides in the Authorization header so it doesn't end
// up in access logs / APM body capture.
export const resetPassword = (recoveryToken: string, new_password: string) =>
  api.post<{ message: string }>(
    '/api/auth/reset-password',
    { new_password },
    { headers: { Authorization: `Bearer ${recoveryToken}` } }
  );

export const getMe = () =>
  api.get<{ user: User }>('/api/auth/me');

// Exchange an OAuth-issued access_token (received in the URL hash on
// /auth/callback) for an httpOnly session cookie. The token is sent
// once via the Authorization header and discarded afterward.
export const exchangeSession = (token: string) =>
  api.post<{ user: User }>(
    '/api/auth/session/exchange',
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );

// ─── MFA ──────────────────────────────────────────────────────────────
export interface MfaFactor {
  id: string;
  factor_type: 'totp' | 'phone';
  status: 'verified' | 'unverified';
  friendly_name?: string;
  created_at: string;
}

export const listMfaFactors = () =>
  api.get<{ factors: { all: MfaFactor[]; totp: MfaFactor[] } }>('/api/auth/mfa/factors');

export const enrollMfa = (friendly_name?: string) =>
  api.post<{ factor_id: string; qr_code: string; secret: string; uri: string }>(
    '/api/auth/mfa/enroll',
    { friendly_name }
  );

export const verifyMfaEnroll = (factor_id: string, code: string) =>
  api.post<{ ok: true }>('/api/auth/mfa/enroll/verify', { factor_id, code });

export const challengeMfa = (factor_id: string) =>
  api.post<{ challenge_id: string }>('/api/auth/mfa/challenge', { factor_id });

export const verifyMfa = (factor_id: string, challenge_id: string, code: string) =>
  api.post<{ session: { access_token: string } }>('/api/auth/mfa/challenge/verify', {
    factor_id,
    challenge_id,
    code,
  });

export const removeMfaFactor = (factor_id: string) =>
  api.delete<{ ok: true }>(`/api/auth/mfa/factor/${factor_id}`);

// MFA during login — uses the partial (aal1) access_token in the
// Authorization header instead of cookies.
export const challengeMfaLogin = (partialToken: string, factor_id: string) =>
  api.post<{ challenge_id: string }>(
    '/api/auth/mfa/login/challenge',
    { factor_id },
    { headers: { Authorization: `Bearer ${partialToken}` } }
  );

export const verifyMfaLogin = (
  partialToken: string,
  factor_id: string,
  challenge_id: string,
  code: string
) =>
  api.post<{ user: User; session: { access_token: string } }>(
    '/api/auth/mfa/login/verify',
    { factor_id, challenge_id, code },
    { headers: { Authorization: `Bearer ${partialToken}` } }
  );

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

// Streaming CV analysis. The backend returns NDJSON — one JSON event per line:
//   {type:'parsed', parsed}
//   {type:'audit',  audit, scores}
//   {type:'rewrite', final_cv}
//   {type:'done',   result, cv_record_id}
//   {type:'error',  error}
// The caller gets each event via `onEvent` so the UI can render partial results
// as they arrive instead of waiting for the whole pipeline.
export type CVAnalyzeEvent =
  | { type: 'parsed'; parsed: any }
  | { type: 'audit'; audit: any; scores: any }
  | { type: 'rewrite'; final_cv: any }
  | { type: 'done'; result: CVAnalysisResult; cv_record_id: string | null }
  | { type: 'error'; error: string };

export const analyzeCVStream = async (
  formData: FormData,
  onEvent: (event: CVAnalyzeEvent) => void,
  signal?: AbortSignal,
): Promise<CVAnalysisResult> => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const token = useAuthStore.getState().accessToken;
  const csrf = readCsrfToken();

  const headers: Record<string, string> = {
    Accept: 'application/x-ndjson',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (csrf) headers['X-CSRF-Token'] = csrf;
  // Don't set Content-Type — the browser sets the multipart boundary itself.

  const resp = await fetch(`${baseUrl}/api/cv/analyze`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
    headers,
    signal,
  });

  // 4xx errors return regular JSON (validation, quota, auth).
  if (!resp.ok) {
    const ct = resp.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const body = await resp.json().catch(() => ({}));
      const err: any = new Error(body.error || `Analyze failed (${resp.status})`);
      err.response = { status: resp.status, data: body };
      throw err;
    }
    const text = await resp.text().catch(() => '');
    const err: any = new Error(text || `Analyze failed (${resp.status})`);
    err.response = { status: resp.status, data: { error: text } };
    throw err;
  }

  if (!resp.body) {
    throw new Error('Streaming not supported by this browser');
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finalResult: CVAnalysisResult | null = null;
  let errorMessage: string | null = null;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let nlIdx = buffer.indexOf('\n');
    while (nlIdx >= 0) {
      const line = buffer.slice(0, nlIdx).trim();
      buffer = buffer.slice(nlIdx + 1);
      if (line) {
        try {
          const event = JSON.parse(line) as CVAnalyzeEvent;
          onEvent(event);
          if (event.type === 'done') finalResult = event.result;
          if (event.type === 'error') errorMessage = event.error;
        } catch {
          // Tolerate one bad line — the next one will be valid.
        }
      }
      nlIdx = buffer.indexOf('\n');
    }
  }

  // Flush any trailing line that didn't end with \n
  const tail = buffer.trim();
  if (tail) {
    try {
      const event = JSON.parse(tail) as CVAnalyzeEvent;
      onEvent(event);
      if (event.type === 'done') finalResult = event.result;
      if (event.type === 'error') errorMessage = event.error;
    } catch { /* ignore */ }
  }

  if (errorMessage) {
    const err: any = new Error(errorMessage);
    err.response = { status: 500, data: { error: errorMessage } };
    throw err;
  }
  if (!finalResult) throw new Error('Analysis stream ended without a final result');
  return finalResult;
};

export const getCVHistory = () =>
  api.get<{ cvs: CVRecord[] }>('/api/cv/history');

export const deleteCV = (cvId: string) =>
  api.delete<{ message: string }>(`/api/cv/${cvId}`);

export type CVExportFormat = 'pdf' | 'docx' | 'txt';

export interface CVExportOptions {
  template?: string;
  photo?: string | null;
  format?: CVExportFormat;
  filename?: string;
}

const FORMAT_META: Record<CVExportFormat, { mime: string; ext: string }> = {
  pdf:  { mime: 'application/pdf', ext: 'pdf' },
  docx: { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', ext: 'docx' },
  txt:  { mime: 'text/plain;charset=utf-8', ext: 'txt' },
};

export const downloadCVPdf = async (cvId: string, options: CVExportOptions = {}) => {
  const format: CVExportFormat = options.format ?? 'pdf';
  const meta = FORMAT_META[format];
  const filename = (options.filename || 'cv_optimized').replace(/\.[a-z0-9]+$/i, '');

  const res = await api.post(`/api/cv/download/${cvId}`, { ...options, format, filename }, {
    responseType: 'blob',
    timeout: 60000,
  });
  const blob = new Blob([res.data], { type: meta.mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.${meta.ext}`;
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

// Direct field patch — bypasses AI entirely. Used by the QuickEditBox fast-path
// for atomic edits the frontend can detect deterministically (bare LinkedIn URL,
// email, phone). Backend whitelists which fields can be touched this way.
export const patchCV = (cvId: string, patch: Record<string, string>) =>
  api.post<{ final_cv: any; changes_applied: string[] }>('/api/cv/patch', {
    cv_id: cvId,
    patch,
  }, { timeout: 15000 });

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

// Password — current_password is mandatory now (re-authentication
// requirement; without it a stolen session can rotate the password).
export const changePassword = (currentPassword: string, newPassword: string) =>
  api.post<{ message: string }>('/api/auth/change-password', {
    current_password: currentPassword,
    new_password: newPassword,
  });

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

export interface CryptoPayment {
  payment_id: string;
  pay_address: string;
  pay_amount: number;
  pay_currency: string;
  price_amount: number;
  price_currency: string;
  expires_at: string | null;
}

export interface CheckoutResponse {
  url?: string;
  provider?: 'nowpayments';
  payment?: CryptoPayment;
}

export const createCheckoutSession = (
  plan: string,
  interval: 'month' | 'year' | 'once',
  payment_method?: string,
  provider?: 'lemonsqueezy' | 'paypal' | 'nowpayments',
) =>
  api.post<CheckoutResponse>('/api/subscription/checkout', { plan, interval, payment_method, provider });

export const getNowpaymentsStatus = (paymentId: string) =>
  api.get<{ status: string; payment_id: string }>('/api/subscription/nowpayments/status', { params: { id: paymentId } });

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

// ═════════════════════ Job Hunter ═════════════════════

export interface JobHunterJob {
  title: string;
  company: string;
  location: string | null;
  url: string;
  source: 'remotive' | 'arbeitnow' | 'adzuna' | 'jooble' | string;
  snippet?: string | null;
  posted_at?: string | null;
  score: number;
}

export interface JobHunterQuery {
  title?: string;
  country?: string | null;
  country_name?: string | null;
  location?: string | null;
}

export interface JobHunterMatch {
  id?: string;
  cv_id?: string | null;
  query: JobHunterQuery;
  results: JobHunterJob[];
  source_counts: Record<string, number>;
  created_at: string;
}

export interface FindJobsParams {
  query: string;
  country?: string | null;
  location?: string | null;
}

// Pulls jobs live from all configured sources (Remotive, Arbeitnow,
// Adzuna, Jooble) for a manual keyword + optional country. Replaces any
// previously cached match-set for this user. Long timeout because the
// parallel fan-out + dedupe can take a few seconds.
export const findJobs = (params: FindJobsParams) =>
  api.post<{ match: JobHunterMatch; warning?: string }>(
    '/api/job-hunter/find',
    params,
    { timeout: 60000 }
  );

export const getLatestJobMatches = () =>
  api.get<{ match: JobHunterMatch | null }>('/api/job-hunter/latest');

export const clearJobMatches = () =>
  api.delete<{ message: string }>('/api/job-hunter/clear');

// ═════════════════════ Chatbot (public) ═════════════════════

export interface ChatBotMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const sendChatBotMessage = (message: string, history: ChatBotMessage[]) =>
  api.post<{ reply: string }>(
    '/api/chatbot',
    { message, history },
    { timeout: 60000 }
  );

export default api;
