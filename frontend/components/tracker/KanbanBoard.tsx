'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrackerJob } from '@/types';
import { updateTrackerJob, deleteTrackerJob } from '@/lib/api';
import EditJobModal from './EditJobModal';
import toast from 'react-hot-toast';
import { Pencil, Trash2, ExternalLink, GripVertical, MessageSquare, X } from 'lucide-react';

const columns = [
  { key: 'saved', label: 'Saved', color: 'border-zinc-600', dot: 'bg-zinc-500' },
  { key: 'applied', label: 'Applied', color: 'border-blue-500/40', dot: 'bg-blue-400' },
  { key: 'interview', label: 'Interview', color: 'border-amber-500/40', dot: 'bg-amber-400' },
  { key: 'offer', label: 'Offer', color: 'border-emerald-500/40', dot: 'bg-emerald-400' },
  { key: 'rejected', label: 'Rejected', color: 'border-red-500/40', dot: 'bg-red-400' },
];

interface KanbanBoardProps {
  jobs: TrackerJob[];
  onRefresh: () => void;
}

export default function KanbanBoard({ jobs, onRefresh }: KanbanBoardProps) {
  const [editJob, setEditJob] = useState<TrackerJob | null>(null);
  const [noteJob, setNoteJob] = useState<TrackerJob | null>(null);
  const [draggedJob, setDraggedJob] = useState<TrackerJob | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, job: TrackerJob) => {
    setDraggedJob(job);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, colKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(colKey);
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    setDragOverCol(null);
    if (!draggedJob || draggedJob.status === newStatus) {
      setDraggedJob(null);
      return;
    }
    try {
      await updateTrackerJob(draggedJob.id, { status: newStatus as TrackerJob['status'] });
      toast.success(`Moved to ${newStatus}`);
      onRefresh();
    } catch {
      toast.error('Failed to move');
    }
    setDraggedJob(null);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTrackerJob(id);
      toast.success('Job deleted');
      onRefresh();
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {columns.map((col) => {
          const colJobs = jobs.filter((j) => j.status === col.key);
          const isDragOver = dragOverCol === col.key;
          return (
            <div
              key={col.key}
              className={`flex-shrink-0 w-64 rounded-2xl border bg-zinc-900/30 flex flex-col transition-all ${
                isDragOver
                  ? `${col.color} bg-zinc-900/60`
                  : 'border-white/[0.06]'
              }`}
              onDragOver={(e) => handleDragOver(e, col.key)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.key)}
            >
              {/* Column header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.04]">
                <div className={`h-2 w-2 rounded-full ${col.dot}`} />
                <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">{col.label}</span>
                <span className="ml-auto text-[11px] text-zinc-600 tabular-nums">{colJobs.length}</span>
              </div>

              {/* Cards */}
              <div className="flex-1 p-2 space-y-2 min-h-[120px] overflow-y-auto max-h-[calc(100vh-380px)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {colJobs.length === 0 && (
                  <div className="flex items-center justify-center h-20 text-[11px] text-zinc-700">
                    Drop here
                  </div>
                )}
                {colJobs.map((job) => (
                  <div
                    key={job.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, job)}
                    className={`group rounded-xl border border-white/[0.04] bg-zinc-950/50 p-3 cursor-grab active:cursor-grabbing transition-all hover:border-white/[0.08] hover:bg-zinc-950/80 ${
                      draggedJob?.id === job.id ? 'opacity-40' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-200 truncate">{job.company_name}</p>
                        <p className="text-xs text-zinc-500 truncate">{job.job_title}</p>
                      </div>
                      <GripVertical className="h-3.5 w-3.5 text-zinc-700 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-zinc-600 tabular-nums">
                        {new Date(job.applied_at).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {job.job_url && (
                          <a
                            href={job.job_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-500 hover:text-violet-400 hover:bg-zinc-800 transition-all"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {job.notes && (
                          <button
                            onClick={() => setNoteJob(job)}
                            className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-500 hover:text-violet-400 hover:bg-zinc-800 transition-all"
                          >
                            <MessageSquare className="h-3 w-3" />
                          </button>
                        )}
                        <button
                          onClick={() => setEditJob(job)}
                          className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(job.id)}
                          className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-all"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Notes popup */}
      {noteJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setNoteJob(null)}>
          <div
            className="relative w-full max-w-md max-h-[50vh] mx-4 rounded-2xl border border-white/[0.06] bg-zinc-950 shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 pb-3 shrink-0">
              <div>
                <h3 className="text-sm font-semibold text-white">{noteJob.company_name}</h3>
                <p className="text-xs text-zinc-500">{noteJob.job_title}</p>
              </div>
              <button onClick={() => setNoteJob(null)} className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-5 pb-5 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{noteJob.notes}</p>
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
