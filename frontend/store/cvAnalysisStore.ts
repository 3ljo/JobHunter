import { create } from 'zustand';
import { CVAnalysisResult } from '@/types';
import { analyzeCVStream } from '@/lib/api';
import toast from 'react-hot-toast';
import { DEFAULT_TEMPLATE, type TemplateId } from '@/components/cv/templates';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useDashboardStore } from '@/store/dashboardStore';

const STEPS = ['Parsing your CV...', 'Auditing & rewriting...', 'Almost done...'];
const TEMPLATE_KEY = 'cv_template_id';
const PHOTO_KEY = 'cv_photo_data';
const ORIGINAL_PDF_KEY = 'cv_original_pdf_data_url';
const EDITS_KEY = 'cv_edits_applied';

// What stage of the streaming analysis are we in? Drives the live preview UI.
//   idle    — no analysis running
//   parsing — Stage 1a in flight (parse + JD fingerprint)
//   working — parsed; audit + rewrite running in parallel
//   finalizing — both LLM stages done, controller is saving the record
export type AnalysisPhase = 'idle' | 'parsing' | 'working' | 'finalizing';

interface CVAnalysisState {
  loading: boolean;
  step: number;
  steps: string[];
  phase: AnalysisPhase;
  /** Partial parsed data emitted by Stage 1a — name, role, skills, experience. */
  liveParsed: any | null;
  /** Partial audit data emitted by Stage 1b — used to show ATS score early. */
  liveAudit: any | null;
  /** Partial rewritten CV emitted by Stage 3 — shown when it lands ahead of `done`. */
  liveFinalCV: any | null;
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
  phase: 'idle',
  liveParsed: null,
  liveAudit: null,
  liveFinalCV: null,
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
    set({
      loading: true,
      step: 0,
      phase: 'parsing',
      liveParsed: null,
      liveAudit: null,
      liveFinalCV: null,
      error: null,
      editsApplied: 0,
    });

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

    try {
      const formData = new FormData();
      formData.append('cv_file', file);
      formData.append('job_description', jobDescription);

      let saveError: string | null = null;
      const result = await analyzeCVStream(formData, (event) => {
        switch (event.type) {
          case 'parsed':
            // Stage 1a finished — we now know the candidate's name, role, skills.
            // Move into "working" phase: audit + rewrite are running in parallel.
            set({ liveParsed: event.parsed, phase: 'working', step: 1 });
            break;
          case 'audit':
            // ATS score is in — render it live in the mini preview.
            set({ liveAudit: event.audit });
            break;
          case 'rewrite':
            // Final CV is ready — only the DB save remains.
            set({ liveFinalCV: event.final_cv, phase: 'finalizing', step: 2 });
            break;
          case 'error':
            // Surfaced on the rejection path below — nothing to do here.
            break;
          case 'done':
            // Capture the DB save error (if any) so we can warn the user
            // that AI edit + download will be unavailable for this run.
            saveError = event.save_error ?? null;
            break;
        }
      });

      set({
        step: STEPS.length - 1,
        phase: 'idle',
        result,
        loading: false,
      });

      // Persist result and cover letter data
      sessionStorage.setItem('cv_analysis_result', JSON.stringify(result));
      sessionStorage.setItem('cl_job_description', jobDescription);
      if (result?.parsed?.raw_text) {
        sessionStorage.setItem('cl_cv_text', result.parsed.raw_text);
      } else if (result?.final?.final_cv) {
        sessionStorage.setItem('cl_cv_text', JSON.stringify(result.final.final_cv));
      }

      // If the DB save failed, the AI editor and Download buttons can't work
      // for this run (both need a cv_record_id). Tell the user up-front with
      // the actual reason — much better than a useless "CV record not ready"
      // toast later when they click Edit or Download.
      if (saveError || !result?.cv_record_id) {
        toast.error(
          `CV analyzed, but couldn't save to your history — AI edits and downloads won't work for this run. Reason: ${saveError || 'unknown'}. Try re-running, or contact support if it keeps failing.`,
          { duration: 10000 },
        );
      } else {
        toast.success('CV analysis complete!');
      }
      // Bump local usage so the meter on the CV page reflects this run
      // without needing a full subscription refetch.
      try { useSubscriptionStore.getState().bumpLocalUsage('cv'); } catch { /* noop */ }
      // Dashboard's CV count is now stale — drop cache so next visit refetches
      try { useDashboardStore.getState().invalidate(); } catch { /* noop */ }
    } catch (err: any) {
      const status = err.response?.status;
      const message = err.response?.data?.error || err.message || 'Analysis failed';
      set({ loading: false, phase: 'idle', error: message });

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
      phase: 'idle',
      liveParsed: null,
      liveAudit: null,
      liveFinalCV: null,
      error: null,
      result: null,
      originalPdfDataUrl: null,
      editsApplied: 0,
    });
  },
}));
