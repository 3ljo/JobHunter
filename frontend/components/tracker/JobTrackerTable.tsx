'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrackerJob } from '@/types';
import { deleteTrackerJob } from '@/lib/api';
import EditJobModal from './EditJobModal';
import toast from 'react-hot-toast';

const statusColors: Record<string, string> = {
  applied: 'bg-blue-100 text-blue-800',
  interview: 'bg-yellow-100 text-yellow-800',
  offer: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  saved: 'bg-gray-100 text-gray-800',
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
      <div className="py-12 text-center text-gray-500">
        <p className="text-lg">No applications yet</p>
        <p className="text-sm mt-1">Add your first application to start tracking</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="pb-2 font-medium">Company</th>
              <th className="pb-2 font-medium">Job Title</th>
              <th
                className="pb-2 font-medium cursor-pointer hover:text-gray-900"
                onClick={() => toggleSort('status')}
              >
                Status {sortField === 'status' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th
                className="pb-2 font-medium cursor-pointer hover:text-gray-900"
                onClick={() => toggleSort('created_at')}
              >
                Date {sortField === 'created_at' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th className="pb-2 font-medium">Notes</th>
              <th className="pb-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((job) => (
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
                <td className="py-3 text-gray-500 max-w-[200px] truncate">{job.notes}</td>
                <td className="py-3">
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditJob(job)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
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
      <EditJobModal
        job={editJob}
        open={!!editJob}
        onClose={() => setEditJob(null)}
        onUpdated={onRefresh}
      />
    </>
  );
}
