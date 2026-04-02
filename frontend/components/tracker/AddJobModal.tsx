'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addTrackerJob } from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, ArrowRight } from 'lucide-react';

interface AddJobModalProps {
  onAdded: () => void;
}

export default function AddJobModal({ onAdded }: AddJobModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    company_name: '',
    job_title: '',
    job_url: '',
    status: 'saved' as const,
    applied_at: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company_name.trim() || !form.job_title.trim()) {
      toast.error('Company and job title are required');
      return;
    }
    setLoading(true);
    try {
      await addTrackerJob(form);
      toast.success('Job added');
      setOpen(false);
      setForm({ company_name: '', job_title: '', job_url: '', status: 'saved', applied_at: new Date().toISOString().split('T')[0], notes: '' });
      onAdded();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to add job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white hover:shadow-lg hover:shadow-violet-500/20 transition-all" />}>
        <Plus className="h-4 w-4" />
        Add Application
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Application</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-zinc-500">Company Name</Label>
            <Input
              value={form.company_name}
              onChange={(e) => update('company_name', e.target.value)}
              placeholder="e.g. Google"
              className="h-10 rounded-xl border-zinc-800 bg-zinc-900/50 text-sm text-white placeholder:text-zinc-600 focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-zinc-500">Job Title</Label>
            <Input
              value={form.job_title}
              onChange={(e) => update('job_title', e.target.value)}
              placeholder="e.g. Frontend Engineer"
              className="h-10 rounded-xl border-zinc-800 bg-zinc-900/50 text-sm text-white placeholder:text-zinc-600 focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-zinc-500">Job URL</Label>
            <Input
              value={form.job_url}
              onChange={(e) => update('job_url', e.target.value)}
              placeholder="https://..."
              className="h-10 rounded-xl border-zinc-800 bg-zinc-900/50 text-sm text-white placeholder:text-zinc-600 focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-zinc-500">Status</Label>
            <select
              value={form.status}
              onChange={(e) => update('status', e.target.value)}
              className="flex h-10 w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-white transition-all focus:border-violet-500/40 focus:outline-none focus:ring-1 focus:ring-violet-500/20"
            >
              <option value="saved">Saved</option>
              <option value="applied">Applied</option>
              <option value="interview">Interview</option>
              <option value="offer">Offer</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-zinc-500">Date Applied</Label>
            <Input
              type="date"
              value={form.applied_at}
              onChange={(e) => update('applied_at', e.target.value)}
              className="h-10 rounded-xl border-zinc-800 bg-zinc-900/50 text-sm text-white focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20 [color-scheme:dark]"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-zinc-500">Notes</Label>
            <textarea
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              className="flex min-h-[80px] w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 transition-all focus:border-violet-500/40 focus:outline-none focus:ring-1 focus:ring-violet-500/20 resize-none"
              placeholder="Optional notes..."
            />
          </div>
          <Button
            type="submit"
            className="group w-full h-10 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-violet-500/20 active:scale-[0.98]"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Adding...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Add Application
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
