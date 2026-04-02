import { create } from 'zustand';
import { generateCoverLetter as generateCoverLetterApi, generateFromPdf as generateFromPdfApi, refineCoverLetter as refineCoverLetterApi } from '@/lib/api';
import toast from 'react-hot-toast';

const CL_STORAGE_KEY = 'cv_cover_letter_state';
const CL_PAGE_KEY = 'cover_letter_page_state';

interface CoverLetterState {
  // Inline (CV Analyzer page) state
  inlineResult: string;
  inlineLoading: boolean;
  inlineTone: string;
  inlineRefining: boolean;

  // Standalone (Cover Letter page) state
  pageResult: string;
  pageLoading: boolean;
  pageTone: string;
  pageRefining: boolean;
  pageJobDescription: string;

  // Inline actions
  setInlineTone: (tone: string) => void;
  generateInline: (cvText: string, jobDescription: string, tone: string) => Promise<void>;
  refineInline: (coverLetter: string, instructions: string) => Promise<void>;
  setInlineResult: (result: string) => void;
  resetInline: () => void;

  // Page actions
  setPageTone: (tone: string) => void;
  setPageJobDescription: (jd: string) => void;
  generateFromPdf: (file: File, jobDescription: string, tone: string) => Promise<void>;
  refinePage: (coverLetter: string, instructions: string) => Promise<void>;
  setPageResult: (result: string) => void;
  resetPage: () => void;
}

function loadInlineState() {
  if (typeof window === 'undefined') return {};
  try {
    const saved = sessionStorage.getItem(CL_STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function loadPageState() {
  if (typeof window === 'undefined') return {};
  try {
    const saved = sessionStorage.getItem(CL_PAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

export const useCoverLetterStore = create<CoverLetterState>((set, get) => {
  const inlineSaved = loadInlineState();
  const pageSaved = loadPageState();

  return {
    // Inline state
    inlineResult: inlineSaved.clResult || '',
    inlineLoading: false,
    inlineTone: inlineSaved.clTone || 'balanced',
    inlineRefining: false,

    // Page state
    pageResult: pageSaved.result || '',
    pageLoading: false,
    pageTone: pageSaved.tone || 'balanced',
    pageRefining: false,
    pageJobDescription: pageSaved.jobDescription || '',

    // Inline actions
    setInlineTone: (tone) => {
      set({ inlineTone: tone });
      const saved = loadInlineState();
      sessionStorage.setItem(CL_STORAGE_KEY, JSON.stringify({ ...saved, clTone: tone }));
    },

    generateInline: async (cvText, jobDescription, tone) => {
      if (get().inlineLoading) return;
      set({ inlineLoading: true });
      try {
        const res = await generateCoverLetterApi({ cv_text: cvText, job_description: jobDescription, tone });
        set({ inlineResult: res.data.cover_letter, inlineLoading: false });
        sessionStorage.setItem(CL_STORAGE_KEY, JSON.stringify({
          showCL: true,
          clTone: tone,
          clResult: res.data.cover_letter,
        }));
        toast.success('Cover letter generated!');
      } catch (err: any) {
        set({ inlineLoading: false });
        toast.error(err.response?.data?.error || 'Failed to generate');
      }
    },

    refineInline: async (coverLetter, instructions) => {
      if (get().inlineRefining) return;
      set({ inlineRefining: true });
      try {
        const res = await refineCoverLetterApi({ cover_letter: coverLetter, instructions });
        const newResult = res.data.cover_letter;
        set({ inlineResult: newResult, inlineRefining: false });
        const saved = loadInlineState();
        sessionStorage.setItem(CL_STORAGE_KEY, JSON.stringify({ ...saved, clResult: newResult }));
        toast.success('Cover letter updated!');
      } catch (err: any) {
        set({ inlineRefining: false });
        toast.error(err.response?.data?.error || 'Failed to refine');
      }
    },

    setInlineResult: (result) => {
      set({ inlineResult: result });
      const saved = loadInlineState();
      sessionStorage.setItem(CL_STORAGE_KEY, JSON.stringify({ ...saved, clResult: result }));
    },

    resetInline: () => {
      set({ inlineResult: '', inlineTone: 'balanced', inlineLoading: false, inlineRefining: false });
      sessionStorage.removeItem(CL_STORAGE_KEY);
    },

    // Page actions
    setPageTone: (tone) => {
      set({ pageTone: tone });
      const saved = loadPageState();
      sessionStorage.setItem(CL_PAGE_KEY, JSON.stringify({ ...saved, tone }));
    },

    setPageJobDescription: (jd) => {
      set({ pageJobDescription: jd });
      const saved = loadPageState();
      sessionStorage.setItem(CL_PAGE_KEY, JSON.stringify({ ...saved, jobDescription: jd }));
    },

    generateFromPdf: async (file, jobDescription, tone) => {
      if (get().pageLoading) return;
      set({ pageLoading: true });
      try {
        const res = await generateFromPdfApi(file, jobDescription, tone);
        const newResult = res.data.cover_letter;
        set({ pageResult: newResult, pageLoading: false });
        sessionStorage.setItem(CL_PAGE_KEY, JSON.stringify({
          jobDescription,
          tone,
          result: newResult,
        }));
        toast.success('Cover letter generated!');
      } catch (err: any) {
        set({ pageLoading: false });
        toast.error(err.response?.data?.error || 'Failed to generate');
      }
    },

    refinePage: async (coverLetter, instructions) => {
      if (get().pageRefining) return;
      set({ pageRefining: true });
      try {
        const res = await refineCoverLetterApi({ cover_letter: coverLetter, instructions });
        const newResult = res.data.cover_letter;
        set({ pageResult: newResult, pageRefining: false });
        const saved = loadPageState();
        sessionStorage.setItem(CL_PAGE_KEY, JSON.stringify({ ...saved, result: newResult }));
        toast.success('Cover letter updated!');
      } catch (err: any) {
        set({ pageRefining: false });
        toast.error(err.response?.data?.error || 'Failed to refine');
      }
    },

    setPageResult: (result) => {
      set({ pageResult: result });
      const saved = loadPageState();
      sessionStorage.setItem(CL_PAGE_KEY, JSON.stringify({ ...saved, result }));
    },

    resetPage: () => {
      set({ pageResult: '', pageTone: 'balanced', pageLoading: false, pageRefining: false, pageJobDescription: '' });
      sessionStorage.removeItem(CL_PAGE_KEY);
    },
  };
});
