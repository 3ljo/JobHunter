import { create } from 'zustand';
import {
  startInterview as apiStart,
  submitInterviewAnswer as apiAnswer,
  finishInterview as apiFinish,
  type InterviewQuestion,
  type InterviewAnswer,
  type InterviewReport,
  type StartInterviewBody,
} from '@/lib/api';
import toast from 'react-hot-toast';

type Phase = 'setup' | 'session' | 'report';

interface InterviewState {
  phase: Phase;
  sessionId: string | null;
  questions: InterviewQuestion[];
  answers: Record<string, InterviewAnswer>; // keyed by question_id
  currentIndex: number;
  report: InterviewReport | null;
  jobTitle: string;

  starting: boolean;
  scoring: boolean;
  finalizing: boolean;
  error: string | null;

  start: (body: StartInterviewBody) => Promise<void>;
  submitAnswer: (questionId: string, transcript: string) => Promise<boolean>;
  finish: () => Promise<void>;
  next: () => void;
  reset: () => void;
  goToIndex: (i: number) => void;
}

const STORAGE_KEY = 'interview_session_v1';

const persist = (state: Partial<InterviewState>) => {
  if (typeof window === 'undefined') return;
  try {
    const snapshot = {
      phase: state.phase,
      sessionId: state.sessionId,
      questions: state.questions,
      answers: state.answers,
      currentIndex: state.currentIndex,
      report: state.report,
      jobTitle: state.jobTitle,
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch { /* noop */ }
};

const load = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

export const useInterviewStore = create<InterviewState>((set, get) => {
  const saved = load();

  return {
    phase: saved?.phase ?? 'setup',
    sessionId: saved?.sessionId ?? null,
    questions: saved?.questions ?? [],
    answers: saved?.answers ?? {},
    currentIndex: saved?.currentIndex ?? 0,
    report: saved?.report ?? null,
    jobTitle: saved?.jobTitle ?? '',

    starting: false,
    scoring: false,
    finalizing: false,
    error: null,

    start: async (body) => {
      if (get().starting) return;
      set({ starting: true, error: null });
      try {
        const res = await apiStart(body);
        const next: Partial<InterviewState> = {
          phase: 'session',
          sessionId: res.data.id,
          questions: res.data.questions,
          answers: {},
          currentIndex: 0,
          report: null,
          jobTitle: body.job_title || '',
        };
        set({ ...next, starting: false });
        persist({ ...get(), ...next });
      } catch (err: any) {
        const msg = err.response?.data?.error || 'Failed to start interview';
        set({ starting: false, error: msg });
        toast.error(msg);
      }
    },

    submitAnswer: async (questionId, transcript) => {
      const { sessionId } = get();
      if (!sessionId) return false;
      set({ scoring: true, error: null });
      try {
        const res = await apiAnswer(sessionId, questionId, transcript);
        const answer: InterviewAnswer = {
          question_id: questionId,
          transcript,
          score: res.data.score,
          feedback: res.data.feedback,
          missing_signals: res.data.missing_signals || [],
        };
        const state = get();
        const nextAnswers = { ...state.answers, [questionId]: answer };
        set({ answers: nextAnswers, scoring: false });
        persist({ ...state, answers: nextAnswers });
        return true;
      } catch (err: any) {
        const msg = err.response?.data?.error || 'Failed to score answer';
        set({ scoring: false, error: msg });
        toast.error(msg);
        return false;
      }
    },

    finish: async () => {
      const { sessionId } = get();
      if (!sessionId) return;
      set({ finalizing: true, error: null });
      try {
        const res = await apiFinish(sessionId);
        const next: Partial<InterviewState> = {
          phase: 'report',
          report: res.data.final_report,
        };
        set({ ...next, finalizing: false });
        persist({ ...get(), ...next });
      } catch (err: any) {
        const msg = err.response?.data?.error || 'Failed to generate report';
        set({ finalizing: false, error: msg });
        toast.error(msg);
      }
    },

    next: () => {
      const state = get();
      const nextIdx = Math.min(state.currentIndex + 1, state.questions.length - 1);
      const update = { currentIndex: nextIdx };
      set(update);
      persist({ ...state, ...update });
    },

    goToIndex: (i) => {
      const state = get();
      const clamped = Math.max(0, Math.min(i, state.questions.length - 1));
      set({ currentIndex: clamped });
      persist({ ...state, currentIndex: clamped });
    },

    reset: () => {
      try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
      set({
        phase: 'setup',
        sessionId: null,
        questions: [],
        answers: {},
        currentIndex: 0,
        report: null,
        jobTitle: '',
        starting: false,
        scoring: false,
        finalizing: false,
        error: null,
      });
    },
  };
});
