'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateTrackerJob } from '@/lib/api';
import { TrackerJob } from '@/types';
import toast from 'react-hot-toast';

interface EditJobModalProps {
  job: TrackerJob | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export default function EditJobModal({ job, open, onClose, onUpdated }: EditJobModalProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<{
    company_name: string;
    job_title: string;
    job_url: string;
    status: 'applied' | 'interview' | 'offer' | 'rejected' | 'saved';
    notes: string;
  }>({
    company_name: '',
    job_title: '',
    job_url: '',
    status: 'saved',
    notes: '',
  });

  useEffect(() => {
    if (job) {
      setForm({
        company_name: job.company_name,
        job_title: job.job_title,
        job_url: job.job_url || '',
        status: job.status,
        notes: job.notes || '',
      });
    }
  }, [job]);

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job) return;
    setLoading(true);
    try {
      await updateTrackerJob(job.id, form);
      toast.success('Job updated');
      onClose();
      onUpdated();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Application</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Company Name</Label>
            <Input value={form.company_name} onChange={(e) => update('company_name', e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Job Title</Label>
            <Input value={form.job_title} onChange={(e) => update('job_title', e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Job URL</Label>
            <Input value={form.job_url} onChange={(e) => update('job_url', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <select
              value={form.status}
              onChange={(e) => update('status', e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="saved">Saved</option>
              <option value="applied">Applied</option>
              <option value="interview">Interview</option>
              <option value="offer">Offer</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <textarea
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
