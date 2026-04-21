'use client';

import { useEffect, useState, useMemo } from 'react';
import StatsCards from '@/components/tracker/StatsCards';
import JobTrackerTable from '@/components/tracker/JobTrackerTable';
import AddJobModal from '@/components/tracker/AddJobModal';
import { useDashboardStore } from '@/store/dashboardStore';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Input } from '@/components/ui/input';
import { Kanban, Search, LayoutGrid, List } from 'lucide-react';
import KanbanBoard from '@/components/tracker/KanbanBoard';

const statusTabs = [
  { key: 'all', label: 'All' },
  { key: 'saved', label: 'Saved' },
  { key: 'applied', label: 'Applied' },
  { key: 'interview', label: 'Interview' },
  { key: 'offer', label: 'Offer' },
  { key: 'rejected', label: 'Rejected' },
];

const tabColors: Record<string, string> = {
  all: 'text-foreground bg-muted',
  saved: 'text-foreground/80 bg-muted-foreground/20',
  applied: 'text-blue-400 bg-blue-500/15',
  interview: 'text-amber-400 bg-amber-500/15',
  offer: 'text-emerald-400 bg-emerald-500/15',
  rejected: 'text-red-400 bg-red-500/15',
};

const TRACKER_UI_KEY = 'tracker_ui_state';

function loadTrackerUI() {
  if (typeof window === 'undefined') return null;
  try {
    const s = sessionStorage.getItem(TRACKER_UI_KEY);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

export default function TrackerPage() {
  const { jobs, stats, loaded, load, refresh } = useDashboardStore();
  const [search, setSearch] = useState(() => loadTrackerUI()?.search ?? '');
  const [statusFilter, setStatusFilter] = useState(() => loadTrackerUI()?.statusFilter ?? 'all');
  const [view, setView] = useState<'table' | 'kanban'>(() => loadTrackerUI()?.view ?? 'table');

  useEffect(() => { load(); }, [load]);

  // Persist UI preferences across tab switches
  useEffect(() => {
    sessionStorage.setItem(TRACKER_UI_KEY, JSON.stringify({ search, statusFilter, view }));
  }, [search, statusFilter, view]);

  const filteredJobs = useMemo(() => {
    let result = jobs;
    if (statusFilter !== 'all') {
      result = result.filter((j) => j.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (j) =>
          j.company_name.toLowerCase().includes(q) ||
          j.job_title.toLowerCase().includes(q)
      );
    }
    return result;
  }, [jobs, statusFilter, search]);

  if (!loaded) return <LoadingSpinner className="mt-32" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-700/10 ring-1 ring-violet-500/25 shadow-[0_0_16px_rgba(118,77,240,0.15)]">
            <Kanban className="h-4.5 w-4.5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-foreground tracking-tight">Job Tracker</h1>
            <p className="text-muted-foreground/60 text-xs">Track and manage your applications</p>
          </div>
        </div>
        <AddJobModal onAdded={refresh} />
      </div>

      {stats && <StatsCards stats={stats} />}

      {/* Search + Filter + View Toggle */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <Input
              placeholder="Search company or title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 rounded-lg border-white/[0.08] bg-card pl-9 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20"
            />
          </div>

          {/* View toggle */}
          <div className="flex items-center rounded-lg bg-card border border-white/[0.07] p-0.5">
            <button
              onClick={() => setView('table')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${
                view === 'table' ? 'bg-muted text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground/80'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              onClick={() => setView('kanban')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${
                view === 'kanban' ? 'bg-muted text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground/80'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Board</span>
            </button>
          </div>
        </div>

        {/* Status filter tabs */}
        {view === 'table' && (
          <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {statusTabs.map((tab) => {
              const isActive = statusFilter === tab.key;
              const count = tab.key === 'all' ? jobs.length : jobs.filter((j) => j.status === tab.key).length;
              return (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? tabColors[tab.key]
                      : 'text-muted-foreground/60 hover:text-muted-foreground hover:bg-card/80'
                  }`}
                >
                  {tab.label}
                  <span className={`tabular-nums ${isActive ? 'opacity-70' : 'opacity-50'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Content */}
      {view === 'table' ? (
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-card">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/25 to-transparent" />
          <JobTrackerTable jobs={filteredJobs} onRefresh={refresh} />
        </div>
      ) : (
        <KanbanBoard jobs={jobs} onRefresh={refresh} />
      )}
    </div>
  );
}
