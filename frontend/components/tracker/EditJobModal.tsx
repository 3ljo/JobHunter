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
import { getMyReferralInfo, updateTrackerJob } from '@/lib/api';
import { TrackerJob } from '@/types';
import toast from 'react-hot-toast';
import { Check } from 'lucide-react';
import ShareCardModal from '@/components/share/ShareCardModal';
import { useAccountStore } from '@/store/accountStore';

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
    applied_at: string;
    notes: string;
  }>({
    company_name: '',
    job_title: '',
    job_url: '',
    status: 'saved',
    applied_at: '',
    notes: '',
  });

  // Share-card state — opened when status transitions to 'offer'.
  const [shareOpen, setShareOpen] = useState(false);
  const [shareImgUrl, setShareImgUrl] = useState('');
  const [shareCompany, setShareCompany] = useState('');
  const [shareRefUrl, setShareRefUrl] = useState('');
  const { profile } = useAccountStore();
  const firstName = (profile?.full_name || '').split(' ')[0] || '';

  useEffect(() => {
    if (job) {
      setForm({
        company_name: job.company_name,
        job_title: job.job_title,
        job_url: job.job_url || '',
        status: job.status,
        applied_at: job.applied_at ? job.applied_at.split('T')[0] : '',
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

      // If the user just flipped this job to "offer" (from something
      // else), fire the share-card flow. Non-blocking — we ignore
      // failure and still close the edit modal.
      const becameOffer = form.status === 'offer' && job.status !== 'offer';
      if (becameOffer) {
        try {
          const refRes = await getMyReferralInfo();
          const code = refRes.data.code;
          const company = form.company_name.trim();
          const params = new URLSearchParams();
          if (firstName) params.set('name', firstName);
          if (company) params.set('company', company);
          if (code) params.set('ref', code);
          setShareImgUrl(`/api/og/hired?${params.toString()}`);
          setShareCompany(company);
          setShareRefUrl(refRes.data.share_url);
          setShareOpen(true);
          // Don't close the parent modal yet — the share dialog renders
          // on top. We close after share is dismissed.
          return;
        } catch {
          /* referral fetch failed, fall through to normal close */
        }
      }

      onClose();
      onUpdated();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update');
    } finally {
      setLoading(false);
    }
  };

  const handleShareClose = () => {
    setShareOpen(false);
    onClose();
    onUpdated();
  };

  return (
    <>
    <ShareCardModal
      open={shareOpen}
      onClose={handleShareClose}
      title="🎉 You landed it — share the win"
      description="Download the badge or post it to LinkedIn. Every referral-link conversion earns you $10+."
      imageUrl={shareImgUrl}
      downloadFilename={`cvclimber-hired${shareCompany ? '-' + shareCompany.toLowerCase().replace(/[^a-z0-9]/g, '-') : ''}.png`}
      shareText={`Just accepted an offer${shareCompany ? ` at ${shareCompany}` : ''}! 🎉\n\nCvClimber helped me tailor every CV + cover letter and practice the interview. Try it free:`}
      referralUrl={shareRefUrl}
      eventName="hire_share"
      eventMeta={{ company: shareCompany || null }}
    />
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Application</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Company Name</Label>
            <Input
              value={form.company_name}
              onChange={(e) => update('company_name', e.target.value)}
              className="h-10 rounded-xl border-border bg-card/80 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Job Title</Label>
            <Input
              value={form.job_title}
              onChange={(e) => update('job_title', e.target.value)}
              className="h-10 rounded-xl border-border bg-card/80 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Job URL</Label>
            <Input
              value={form.job_url}
              onChange={(e) => update('job_url', e.target.value)}
              className="h-10 rounded-xl border-border bg-card/80 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</Label>
            <select
              value={form.status}
              onChange={(e) => update('status', e.target.value)}
              className="flex h-10 w-full rounded-xl border border-border bg-card/80 px-3 py-2 text-sm text-foreground transition-all focus:border-violet-500/40 focus:outline-none focus:ring-1 focus:ring-violet-500/20"
            >
              <option value="saved">Saved</option>
              <option value="applied">Applied</option>
              <option value="interview">Interview</option>
              <option value="offer">Offer</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Date Applied</Label>
            <Input
              type="date"
              value={form.applied_at}
              onChange={(e) => update('applied_at', e.target.value)}
              className="h-10 rounded-xl border-border bg-card/80 text-sm text-foreground focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20 "
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Notes</Label>
            <textarea
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              className="flex min-h-[80px] w-full rounded-xl border border-border bg-card/80 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 transition-all focus:border-violet-500/40 focus:outline-none focus:ring-1 focus:ring-violet-500/20 resize-none"
            />
          </div>
          <Button
            type="submit"
            className="group w-full h-10 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-violet-500/20 active:scale-[0.98]"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="lds-roller-sm" style={{ color: '#fff' }}><span /><span /><span /><span /><span /><span /><span /><span /></span>
                Saving...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Check className="h-4 w-4" />
                Save Changes
              </span>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
}
