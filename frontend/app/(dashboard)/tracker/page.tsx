'use client';

import { useEffect, useState, useCallback } from 'react';
import StatsCards from '@/components/tracker/StatsCards';
import JobTrackerTable from '@/components/tracker/JobTrackerTable';
import AddJobModal from '@/components/tracker/AddJobModal';
import { getAllTrackerJobs, getTrackerStats } from '@/lib/api';
import { TrackerJob, TrackerStats } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Kanban } from 'lucide-react';

export default function TrackerPage() {
  const [jobs, setJobs] = useState<TrackerJob[]>([]);
  const [stats, setStats] = useState<TrackerStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [jobsRes, statsRes] = await Promise.all([getAllTrackerJobs(), getTrackerStats()]);
      setJobs(jobsRes.data.jobs);
      setStats(statsRes.data.stats);
    } catch {
      // handled silently
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingSpinner className="mt-20" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Kanban className="h-5 w-5 text-violet-400" />
            <h1 className="text-2xl font-bold text-white">Job Tracker</h1>
          </div>
          <p className="text-zinc-400 text-sm">Track your job applications.</p>
        </div>
        <AddJobModal onAdded={load} />
      </div>

      {stats && <StatsCards stats={stats} />}

      <div className="rounded-xl bg-zinc-900/50 border border-white/[0.06] p-5">
        <JobTrackerTable jobs={jobs} onRefresh={load} />
      </div>
    </div>
  );
}
