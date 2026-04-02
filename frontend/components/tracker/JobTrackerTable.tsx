'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrackerJob } from '@/types';
import { deleteTrackerJob } from '@/lib/api';
import EditJobModal from './EditJobModal';
import toast from 'react-hot-toast';
import { Pencil, Trash2, ArrowUpDown, Briefcase, Plus, ExternalLink, MessageSquare, X } from 'lucide-react';

const statusColors: Record<string, string> = {
  applied: 'bg-blue-500/15 text-blue-400',
  interview: 'bg-amber-500/15 text-amber-400',
  offer: 'bg-emerald-500/15 text-emerald-400',
  rejected: 'bg-red-500/15 text-red-400',
  saved: 'bg-muted text-muted-foreground',
};

interface JobTrackerTableProps {
  jobs: TrackerJob[];
  onRefresh: () => void;
}

export default function JobTrackerTable({ jobs, onRefresh }: JobTrackerTableProps) {
  const [editJob, setEditJob] = useState<TrackerJob | null>(null);
  const [noteJob, setNoteJob] = useState<TrackerJob | null>(null);
  const [sortField, setSortField] = useState<'applied_at' | 'status'>('applied_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const toggleSort = (field: 'applied_at' | 'status') => {
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
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50 mb-4">
          <Briefcase className="h-6 w-6 text-muted-foreground/60" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">No applications yet</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Add your first application to start tracking</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Company</th>
              <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Job Title</th>
              <th
                className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground/80 transition-colors group"
                onClick={() => toggleSort('status')}
              >
                <span className="inline-flex items-center gap-1.5">
                  Status
                  <ArrowUpDown className="h-3 w-3 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                </span>
              </th>
              <th
                className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground/80 transition-colors group"
                onClick={() => toggleSort('applied_at')}
              >
                <span className="inline-flex items-center gap-1.5">
                  Date
                  <ArrowUpDown className="h-3 w-3 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                </span>
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Link</th>
              <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Notes</th>
              <th className="px-6 py-3.5 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((job, i) => (
              <tr
                key={job.id}
                className={`transition-colors hover:bg-accent/50 ${i < sorted.length - 1 ? 'border-b border-border/50' : ''}`}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold text-muted-foreground ring-1 ring-border">
                      {job.company_name?.charAt(0)?.toUpperCase() || 'C'}
                    </div>
                    <span className="font-medium text-foreground/90">{job.company_name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-muted-foreground">{job.job_title}</td>
                <td className="px-6 py-4">
                  <Badge variant="secondary" className={`text-[11px] ${statusColors[job.status]}`}>
                    {job.status}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-muted-foreground tabular-nums">
                  {new Date(job.applied_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  {job.job_url ? (
                    <a
                      href={job.job_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      View
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground/40">—</span>
                  )}
                </td>
                <td className="px-6 py-4 max-w-[200px]">
                  {job.notes ? (
                    <button
                      onClick={() => setNoteJob(job)}
                      className="group flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground/80 transition-colors max-w-[180px] text-left cursor-pointer"
                    >
                      <span className="truncate">{job.notes}</span>
                      <MessageSquare className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-violet-400" />
                    </button>
                  ) : (
                    <span className="text-xs text-muted-foreground/40">—</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => setEditJob(job)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="text-muted-foreground hover:text-red-400"
                      onClick={() => handleDelete(job.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2 p-2">
        {sorted.map((job) => (
          <div key={job.id} className="rounded-xl border border-border/50 bg-white/[0.01] p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-bold text-muted-foreground ring-1 ring-border">
                  {job.company_name?.charAt(0)?.toUpperCase() || 'C'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground/90 truncate">{job.company_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{job.job_title}</p>
                </div>
              </div>
              <Badge variant="secondary" className={`shrink-0 text-[11px] ${statusColors[job.status]}`}>
                {job.status}
              </Badge>
            </div>
            {job.job_url && (
              <a
                href={job.job_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View job posting
              </a>
            )}
            {job.notes && (
              <button
                onClick={() => setNoteJob(job)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-violet-400 transition-colors"
              >
                <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                <span className="line-clamp-1">View notes</span>
              </button>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <span className="text-[11px] text-muted-foreground/60 tabular-nums">
                {new Date(job.applied_at).toLocaleDateString()}
              </span>
              <div className="flex gap-1">
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => setEditJob(job)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="text-muted-foreground hover:text-red-400"
                  onClick={() => handleDelete(job.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Notes popup */}
      {noteJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setNoteJob(null)}>
          <div
            className="relative w-full max-w-md max-h-[50vh] mx-4 rounded-2xl border border-border bg-background shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 pb-3 shrink-0">
              <div>
                <h3 className="text-sm font-semibold text-foreground">{noteJob.company_name}</h3>
                <p className="text-xs text-muted-foreground">{noteJob.job_title}</p>
              </div>
              <button
                onClick={() => setNoteJob(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-5 pb-5 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{noteJob.notes}</p>
            </div>
          </div>
        </div>
      )}

      <EditJobModal
        job={editJob}
        open={!!editJob}
        onClose={() => setEditJob(null)}
        onUpdated={onRefresh}
      />
    </>
  );
}
