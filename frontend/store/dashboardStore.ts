import { create } from 'zustand';
import { TrackerJob, TrackerStats, CVRecord } from '@/types';
import { getAllTrackerJobs, getTrackerStats, getCVHistory } from '@/lib/api';

// Shared cache for the dashboard home, tracker, and CV history pages. All three
// consume pieces of the same three endpoints, so one cached fetch serves them all —
// visiting any two in sequence no longer triggers duplicate network calls.

interface DashboardState {
  stats: TrackerStats | null;
  jobs: TrackerJob[];
  cvs: CVRecord[];
  loaded: boolean;
  isLoading: boolean;

  _lastFetchedAt: number | null;
  _inFlight: Promise<void> | null;

  load: () => Promise<void>;
  refresh: () => Promise<void>;
  invalidate: () => void;
  // Apply a local mutation without refetching (e.g. after a CV delete)
  setCvs: (cvs: CVRecord[]) => void;
  clear: () => void;
}

const TTL_MS = 60_000;

async function runFetch(set: (partial: Partial<DashboardState>) => void): Promise<void> {
  set({ isLoading: true });
  try {
    const [jobsRes, statsRes, cvRes] = await Promise.all([
      getAllTrackerJobs(),
      getTrackerStats(),
      getCVHistory(),
    ]);
    set({
      jobs: jobsRes.data.jobs,
      stats: statsRes.data.stats,
      cvs: cvRes.data.cvs,
      loaded: true,
      isLoading: false,
      _lastFetchedAt: Date.now(),
    });
  } catch {
    set({ isLoading: false, loaded: true, _lastFetchedAt: Date.now() });
  }
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  stats: null,
  jobs: [],
  cvs: [],
  loaded: false,
  isLoading: false,
  _lastFetchedAt: null,
  _inFlight: null,

  load: async () => {
    const { _lastFetchedAt, _inFlight } = get();
    if (_inFlight) return _inFlight;
    if (_lastFetchedAt && Date.now() - _lastFetchedAt < TTL_MS) return;

    const promise = runFetch(set).finally(() => set({ _inFlight: null }));
    set({ _inFlight: promise });
    return promise;
  },

  refresh: async () => {
    const { _inFlight } = get();
    if (_inFlight) return _inFlight;
    const promise = runFetch(set).finally(() => set({ _inFlight: null }));
    set({ _inFlight: promise });
    return promise;
  },

  invalidate: () => set({ _lastFetchedAt: null }),

  setCvs: (cvs) => set({ cvs }),

  clear: () => set({
    stats: null,
    jobs: [],
    cvs: [],
    loaded: false,
    isLoading: false,
    _lastFetchedAt: null,
    _inFlight: null,
  }),
}));
