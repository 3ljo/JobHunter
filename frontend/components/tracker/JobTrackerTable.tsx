'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrackerJob } from '@/types';
import { deleteTrackerJob } from '@/lib/api';
import EditJobModal from './EditJobModal';
import toast from 'react-hot-toast';

const statusColors: Record<string, string> = {
  applied: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
  interview: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
  offer: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
  rejected: 'bg-red-500/10 text-red-500 dark:bg-red-500/20 dark:text-red-400',
  saved: 'bg-muted text-muted-foreground',
};

interface JobTrackerTableProps {
  jobs: TrackerJob[];
  onRefresh: () => void;
}

export default function JobTrackerTable({ jobs, onRefresh }: JobTrackerTableProps) {
  const [editJob, setEditJob] = useState<TrackerJob | null>(null);
  const [sortField, setSortField] = useState<'created_at' | 'status'>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const toggleSort = (field: 'created_at' | 'status') => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sorted = [...jobs].sort((a, b) => {
    const va = a[sortField];
    const vb = b[sortField];
    const cmp = va < vb ? -1 : va > vb ? 1 : 0;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const handleDelete = async (id: string) => {
    try {
      await deleteTrackerJob(id);
      toast.success('Job deleted');
      onRefresh();
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (jobs.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p className="text-lg">No applications yet</p>
        <p className="text-sm mt-1">Add your first application to start tracking</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2 font-medium">Company</th>
              <th className="pb-2 font-medium">Job Title</th>
              <th
                className="pb-2 font-medium cursor-pointer hover:text-foreground"
                onClick={() => toggleSort('status')}
              >
                Status {sortField === 'status' ? (sortDir === 'asc' ? '\u2191' : '\u2193') : ''}
              </th>
              <th
                className="pb-2 font-medium cursor-pointer hover:text-foreground"
                onClick={() => toggleSort('created_at')}
              >
                Date {sortField === 'created_at' ? (sortDir === 'asc' ? '\u2191' : '\u2193') : ''}
              </th>
              <th className="pb-2 font-medium">Notes</th>
              <th className="pb-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((job) => (
              <tr key={job.id} className="border-b last:border-0">
                <td className="py-3 font-medium text-foreground">{job.company_name}</td>
                <td className="py-3 text-muted-foreground">{job.job_title}</td>
                <td className="py-3">
                  <Badge variant="secondary" className={statusColors[job.status]}>
                    {job.status}
                  </Badge>
                </td>
                <td className="py-3 text-muted-foreground">
                  {new Date(job.created_at).toLocaleDateString()}
                </td>
                <td className="py-3 text-muted-foreground max-w-[200px] truncate">{job.notes}</td>
                <td className="py-3">
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditJob(job)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => handleDelete(job.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {sorted.map((job) => (
          <div key={job.id} className="rounded-lg border border-border p-4 space-y-3 transition-colors hover:bg-accent/30">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-bold text-muted-foreground">
                  {job.company_name?.charAt(0)?.toUpperCase() || 'C'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{job.company_name}</p>
                  <p className="text-sm text-muted-foreground truncate">{job.job_title}</p>
                </div>
              </div>
              <Badge variant="secondary" className={`shrink-0 ${statusColors[job.status]}`}>
                {job.status}
              </Badge>
            </div>
            {job.notes && (
              <p className="text-xs text-muted-foreground line-clamp-2">{job.notes}</p>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {new Date(job.created_at).toLocaleDateString()}
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditJob(job)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-500 hover:text-red-600"
                  onClick={() => handleDelete(job.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <EditJobModal
        job={editJob}
        open={!!editJob}
        onClose={() => setEditJob(null)}
        onUpdated={onRefresh}
      />
    </>
  );
}
