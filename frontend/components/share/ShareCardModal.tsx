'use client';

// Generic share-card modal used by both the post-hire flow (Phase 7) and
// the ATS ≥90% flow (Phase 8). Given an OG image URL + a LinkedIn-friendly
// caption + referral link, it renders the preview, lets the user download
// the PNG, and opens LinkedIn's share dialog pre-populated.

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { Download, Share2, Copy, Check } from 'lucide-react';
import { logReferralEvent } from '@/lib/api';

export interface ShareCardModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  /** Absolute or relative URL that returns a 1200x630 PNG. */
  imageUrl: string;
  /** Suggested filename for the downloaded PNG. */
  downloadFilename: string;
  /** Pre-filled LinkedIn/Twitter caption. */
  shareText: string;
  /** Referral link that goes into the share post (also shown as copy). */
  referralUrl: string;
  /** Telemetry: which canonical event to fire when the modal opens. */
  eventName?: 'ats_share' | 'hire_share';
  /** Optional extra metadata to include with the event. */
  eventMeta?: Record<string, unknown>;
}

export default function ShareCardModal({
  open, onClose, title, description, imageUrl, downloadFilename, shareText, referralUrl,
  eventName, eventMeta,
}: ShareCardModalProps) {
  const [downloading, setDownloading] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // Fire the telemetry event once per open transition. Non-blocking;
  // failures are swallowed so a telemetry outage never breaks the share.
  useEffect(() => {
    if (open && eventName) {
      logReferralEvent(eventName, eventMeta || {}).catch(() => {});
    }
    // Intentionally exclude eventMeta from deps — callers typically pass a
    // fresh object each render which would double-fire. One event per open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, eventName]);

  const absoluteImage = imageUrl.startsWith('http')
    ? imageUrl
    : typeof window !== 'undefined' ? `${window.location.origin}${imageUrl}` : imageUrl;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(absoluteImage);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = downloadFilename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objUrl);
    } catch {
      toast.error('Download failed — try right-clicking the image.');
    } finally {
      setDownloading(false);
    }
  };

  const handleLinkedIn = () => {
    // LinkedIn's share-URL API only accepts a URL — it scrapes OG tags
    // from the target page. So we open the share dialog pointing at the
    // user's referral link (which serves a <meta og:image> that could
    // later point at this same card). Caption goes into clipboard for
    // manual paste since LinkedIn no longer honours the `summary` param.
    const encoded = encodeURIComponent(referralUrl);
    navigator.clipboard.writeText(shareText).catch(() => {});
    toast.success('Caption copied to clipboard — paste into LinkedIn');
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`, '_blank', 'noopener,noreferrer');
  };

  const handleTwitter = () => {
    const text = encodeURIComponent(`${shareText}\n\n${referralUrl}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(`${shareText}\n\n${referralUrl}`);
    setCopiedText(true);
    toast.success('Copied!');
    setTimeout(() => setCopiedText(false), 1800);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground mb-3">{description}</p>

        {/* Card preview */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: '#0a0d24', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={absoluteImage}
            alt="Share card preview"
            width={1200}
            height={630}
            style={{ display: 'block', width: '100%', height: 'auto' }}
          />
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
          <Button onClick={handleDownload} disabled={downloading} className="gap-1.5">
            <Download className="h-3.5 w-3.5" />
            {downloading ? 'Saving…' : 'Download PNG'}
          </Button>
          <Button onClick={handleLinkedIn} variant="outline" className="gap-1.5">
            <Share2 className="h-3.5 w-3.5" />
            LinkedIn
          </Button>
          <Button onClick={handleTwitter} variant="outline" className="gap-1.5">
            <Share2 className="h-3.5 w-3.5" />
            X / Twitter
          </Button>
          <Button onClick={handleCopyText} variant="outline" className="gap-1.5">
            {copiedText ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copiedText ? 'Copied' : 'Copy text'}
          </Button>
        </div>

        <p className="text-[11px] text-muted-foreground/60 mt-2">
          Every click on your referral link in the post is worth <span className="text-emerald-400 font-semibold">$10+</span> if it converts.
        </p>
      </DialogContent>
    </Dialog>
  );
}
