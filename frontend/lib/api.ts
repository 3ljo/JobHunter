import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import {
  User,
  Profile,
  Onboarding,
  TrackerJob,
  CVAnalysisResult,
  CVRecord,
  JobSearchResult,
  SuggestedSite,
  TrackerStats,
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
export const registerUser = (email: string, password: string) =>
  api.post<{ message: string; user: User }>('/api/auth/register', { email, password });

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

// Jobs
export const searchJobsWithAI = (message: string, conversation_history: any[]) =>
  api.post<{ ai_message: string; jobs: JobSearchResult[]; search_performed: boolean; search_query: string }>(
    '/api/jobs/search',
    { message, conversation_history }
  );

export const getSuggestedSites = (data: { job_title: string; career_level: string; preferred_locations: string }) =>
  api.post<{ suggested_sites: SuggestedSite[] }>('/api/jobs/suggested-sites', data);

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

export default api;
