'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { getTrackerStats, getAllTrackerJobs, getCVHistory } from '@/lib/api';
import { TrackerStats, TrackerJob } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const statusColors: Record<string, string> = {
  applied: 'bg-blue-100 text-blue-800',
  interview: 'bg-yellow-100 text-yellow-800',
  offer: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  saved: 'bg-gray-100 text-gray-800',
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<TrackerStats | null>(null);
  const [recentJobs, setRecentJobs] = useState<TrackerJob[]>([]);
  const [cvCount, setCvCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, jobsRes, cvRes] = await Promise.all([
          getTrackerStats(),
          getAllTrackerJobs(),
          getCVHistory(),
        ]);
        setStats(statsRes.data.stats);
        setRecentJobs(jobsRes.data.jobs.slice(0, 5));
        setCvCount(cvRes.data.cvs.length);
      } catch {
        // Stats will remain null — handled in UI
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LoadingSpinner className="mt-20" />;

  const statCards = [
    { label: 'Total Applications', value: stats?.total || 0 },
    { label: 'Interviews Scheduled', value: stats?.interview || 0 },
    { label: 'Offers Received', value: stats?.offer || 0 },
    { label: 'CVs Analyzed', value: cvCount },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">
          Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}
        </h2>
        <p className="text-gray-500 mt-1">Here&apos;s an overview of your job search</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-3">
        <Link href="/jobs">
          <Button>Find Jobs</Button>
        </Link>
        <Link href="/cv">
          <Button variant="outline">Analyze CV</Button>
        </Link>
        <Link href="/tracker">
          <Button variant="outline">Add Application</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Applications</CardTitle>
        </CardHeader>
        <CardContent>
          {recentJobs.length === 0 ? (
            <p className="text-sm text-gray-500">No applications yet. Start tracking your job search!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-2 font-medium">Company</th>
                    <th className="pb-2 font-medium">Job Title</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentJobs.map((job) => (
                    <tr key={job.id} className="border-b last:border-0">
                      <td className="py-3 font-medium text-gray-900">{job.company_name}</td>
                      <td className="py-3 text-gray-600">{job.job_title}</td>
                      <td className="py-3">
                        <Badge variant="secondary" className={statusColors[job.status]}>
                          {job.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-gray-500">
                        {new Date(job.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
