import { create } from 'zustand';
import { CVAnalysisResult } from '@/types';
import { analyzeCV } from '@/lib/api';
import toast from 'react-hot-toast';
import { DEFAULT_TEMPLATE, type TemplateId } from '@/components/cv/templates';
import { useSubscriptionStore } from '@/store/subscriptionStore';

const STEPS = ['Parsing & auditing...', 'Rewriting & humanizing...', 'Done'];
const TEMPLATE_KEY = 'cv_template_id';
const PHOTO_KEY = 'cv_photo_data';
const SUGGESTIONS_ONLY_KEY = 'cv_suggestions_only';

interface CVAnalysisState {
  loading: boolean;
  step: number;
  steps: string[];
  error: string | null;
  result: CVAnalysisResult | null;
  template: TemplateId;
  photo: string | null;
  suggestionsOnly: boolean;
  startAnalysis: (file: File, jobDescription: string) => void;
  setResult: (result: CVAnalysisResult | null) => void;
  setTemplate: (t: TemplateId) => void;
  setPhoto: (photo: string | null) => void;
  setSuggestionsOnly: (v: boolean) => void;
  reset: () => void;
}

export const useCVAnalysisStore = create<CVAnalysisState>((set, get) => ({
  loading: false,
  step: 0,
  steps: STEPS,
  error: null,
  result: (() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = sessionStorage.getItem('cv_analysis_result');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })(),
  template: (() => {
    if (typeof window === 'undefined') return DEFAULT_TEMPLATE;
    const saved = localStorage.getItem(TEMPLATE_KEY) as TemplateId | null;
    return saved || DEFAULT_TEMPLATE;
  })(),
  photo: (() => {
    if (typeof window === 'undefined') return null;
    try { return localStorage.getItem(PHOTO_KEY); } catch { return null; }
  })(),
  suggestionsOnly: (() => {
    if (typeof window === 'undefined') return false;
    try { return localStorage.getItem(SUGGESTIONS_ONLY_KEY) === '1'; } catch { return false; }
  })(),

  startAnalysis: async (file: File, jobDescription: string) => {
    if (get().loading) return;

    set({ loading: true, step: 0, error: null });

    const interval = setInterval(() => {
      const { step } = get();
      if (step < STEPS.length - 2) {
        set({ step: step + 1 });
      }
    }, 3000);

    try {
      const formData = new FormData();
      formData.append('cv_file', file);
      formData.append('job_description', jobDescription);
      const res = await analyzeCV(formData);

      clearInterval(interval);
      set({ step: STEPS.length - 1, result: res.data, loading: false });

      // Persist result and cover letter data
      sessionStorage.setItem('cv_analysis_result', JSON.stringify(res.data));
      sessionStorage.setItem('cl_job_description', jobDescription);
      if (res.data?.parsed?.raw_text) {
        sessionStorage.setItem('cl_cv_text', res.data.parsed.raw_text);
      } else if (res.data?.final?.final_cv) {
        sessionStorage.setItem('cl_cv_text', JSON.stringify(res.data.final.final_cv));
      }

      toast.success('CV analysis complete!');
      // Bump local usage so the meter on the CV page reflects this run
      // without needing a full subscription refetch.
      try { useSubscriptionStore.getState().bumpLocalUsage('cv'); } catch { /* noop */ }
    } catch (err: any) {
      clearInterval(interval);
      const status = err.response?.status;
      const message = err.response?.data?.error || 'Analysis failed';
      set({ loading: false, error: message });

      if (status === 429) {
        // Refresh subscription so the lock UI kicks in without a reload
        try { useSubscriptionStore.getState().fetchSubscription(); } catch { /* noop */ }
        toast.error(message, { duration: 6000 });
      } else {
        toast.error(message);
      }
    }
  },

  setResult: (result) => {
    if (result) {
      sessionStorage.setItem('cv_analysis_result', JSON.stringify(result));
    } else {
      sessionStorage.removeItem('cv_analysis_result');
    }
    set({ result });
  },

  setTemplate: (t) => {
    try { localStorage.setItem(TEMPLATE_KEY, t); } catch {}
    set({ template: t });
  },

  setPhoto: (photo) => {
    try {
      if (photo) localStorage.setItem(PHOTO_KEY, photo);
      else localStorage.removeItem(PHOTO_KEY);
    } catch {}
    set({ photo });
  },

  setSuggestionsOnly: (v) => {
    try { localStorage.setItem(SUGGESTIONS_ONLY_KEY, v ? '1' : '0'); } catch {}
    set({ suggestionsOnly: v });
  },

  reset: () => {
    sessionStorage.removeItem('cv_analysis_result');
    set({ loading: false, step: 0, error: null, result: null });
  },
}));
