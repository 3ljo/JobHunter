import { create } from 'zustand';
import { CVAnalysisResult } from '@/types';
import { analyzeCV } from '@/lib/api';
import toast from 'react-hot-toast';
import { DEFAULT_TEMPLATE, type TemplateId } from '@/components/cv/templates';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useDashboardStore } from '@/store/dashboardStore';

const STEPS = ['Parsing & auditing...', 'Rewriting & humanizing...', 'Done'];
const TEMPLATE_KEY = 'cv_template_id';
const PHOTO_KEY = 'cv_photo_data';
const ORIGINAL_PDF_KEY = 'cv_original_pdf_data_url';
const EDITS_KEY = 'cv_edits_applied';

interface CVAnalysisState {
  loading: boolean;
  step: number;
  steps: string[];
  error: string | null;
  result: CVAnalysisResult | null;
  template: TemplateId;
  photo: string | null;
  originalPdfDataUrl: string | null;
  /** Number of AI edits applied since the last analysis. Resets on reset/new analysis. */
  editsApplied: number;
  startAnalysis: (file: File, jobDescription: string) => void;
  setResult: (result: CVAnalysisResult | null) => void;
  setTemplate: (t: TemplateId) => void;
  setPhoto: (photo: string | null) => void;
  bumpEdits: () => void;
  reset: () => void;
}

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

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
  originalPdfDataUrl: (() => {
    if (typeof window === 'undefined') return null;
    try { return sessionStorage.getItem(ORIGINAL_PDF_KEY); } catch { return null; }
  })(),
  editsApplied: (() => {
    if (typeof window === 'undefined') return 0;
    try {
      const raw = sessionStorage.getItem(EDITS_KEY);
      const n = raw ? parseInt(raw, 10) : 0;
      return Number.isFinite(n) && n > 0 ? n : 0;
    } catch {
      return 0;
    }
  })(),

  startAnalysis: async (file: File, jobDescription: string) => {
    if (get().loading) return;

    // Reset edits counter for the new analysis.
    try { sessionStorage.setItem(EDITS_KEY, '0'); } catch {}
    set({ loading: true, step: 0, error: null, editsApplied: 0 });

    // Stash the original PDF as a data URL so "Keep my CV" mode can show it.
    // Skip if the file is too large to fit in sessionStorage (~5MB after base64).
    try {
      if (file.size <= 3 * 1024 * 1024) {
        const dataUrl = await fileToDataUrl(file);
        sessionStorage.setItem(ORIGINAL_PDF_KEY, dataUrl);
        set({ originalPdfDataUrl: dataUrl });
      } else {
        sessionStorage.removeItem(ORIGINAL_PDF_KEY);
        set({ originalPdfDataUrl: null });
      }
    } catch {
      sessionStorage.removeItem(ORIGINAL_PDF_KEY);
      set({ originalPdfDataUrl: null });
    }

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
      // Dashboard's CV count is now stale — drop cache so next visit refetches
      try { useDashboardStore.getState().invalidate(); } catch { /* noop */ }
    } catch (err: any) {
      clearInterval(interval);
      const status = err.response?.status;
      const message = err.response?.data?.error || 'Analysis failed';
      set({ loading: false, error: message });

      if (status === 429) {
        // Force-refresh subscription so the lock UI kicks in without a reload
        try { useSubscriptionStore.getState().refresh(); } catch { /* noop */ }
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

  bumpEdits: () => {
    const next = get().editsApplied + 1;
    try { sessionStorage.setItem(EDITS_KEY, String(next)); } catch {}
    set({ editsApplied: next });
  },

  reset: () => {
    sessionStorage.removeItem('cv_analysis_result');
    sessionStorage.removeItem(ORIGINAL_PDF_KEY);
    sessionStorage.removeItem(EDITS_KEY);
    set({
      loading: false,
      step: 0,
      error: null,
      result: null,
      originalPdfDataUrl: null,
      editsApplied: 0,
    });
  },
}));
