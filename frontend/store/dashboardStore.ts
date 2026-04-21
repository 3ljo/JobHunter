import { create } from 'zustand';
import { TrackerJob, TrackerStats } from '@/types';
import { getAllTrackerJobs, getTrackerStats, getCVHistory } from '@/lib/api';

// Shared cache for data that drives the dashboard home and tracker pages.
// Both surfaces need `stats` and `jobs`; only the dashboard needs `cvCount`.
// Keeping them in one store lets a mutation on either page invalidate once
// and have both pages reflect the change on next mount.

interface DashboardState {
  stats: TrackerStats | null;
  jobs: TrackerJob[];
  cvCount: number;
  loaded: boolean;
  isLoading: boolean;

  _lastFetchedAt: number | null;
  _inFlight: Promise<void> | null;

  load: () => Promise<void>;
  refresh: () => Promise<void>;
  invalidate: () => void;
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
      cvCount: cvRes.data.cvs.length,
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
  cvCount: 0,
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

  clear: () => set({
    stats: null,
    jobs: [],
    cvCount: 0,
    loaded: false,
    isLoading: false,
    _lastFetchedAt: null,
    _inFlight: null,
  }),
}));
