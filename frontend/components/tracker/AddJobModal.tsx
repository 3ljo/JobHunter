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
      setForm({ company_name: '', job_title: '', job_url: '', status: 'saved', notes: '' });
      onAdded();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to add job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        Add Application
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Application</DialogTitle>
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
            <Input value={form.job_url} onChange={(e) => update('job_url', e.target.value)} placeholder="https://..." />
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
              placeholder="Optional notes..."
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Adding...' : 'Add Application'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
