'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatsCards from '@/components/tracker/StatsCards';
import JobTrackerTable from '@/components/tracker/JobTrackerTable';
import AddJobModal from '@/components/tracker/AddJobModal';
import { getAllTrackerJobs, getTrackerStats } from '@/lib/api';
import { TrackerJob, TrackerStats } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

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
      {stats && <StatsCards stats={stats} />}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Applications</CardTitle>
          <AddJobModal onAdded={load} />
        </CardHeader>
        <CardContent>
          <JobTrackerTable jobs={jobs} onRefresh={load} />
        </CardContent>
      </Card>
    </div>
  );
}
