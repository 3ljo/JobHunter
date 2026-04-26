'use client';

// Generic share-card modal used by both the post-hire flow and the
// ATS ≥90% flow. Given an OG image URL + a LinkedIn-friendly caption
// + share link, it renders the preview, lets the user download the PNG,
// and opens LinkedIn's share dialog pre-populated.

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { Download, Share2, Copy, Check } from 'lucide-react';

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
  /** Link that goes into the share post (also shown as copy). */
  shareUrl: string;
}

export default function ShareCardModal({
  open, onClose, title, description, imageUrl, downloadFilename, shareText, shareUrl,
}: ShareCardModalProps) {
  const [downloading, setDownloading] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

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
    // from the target page. Caption goes into clipboard for manual paste
    // since LinkedIn no longer honours the `summary` param.
    const encoded = encodeURIComponent(shareUrl);
    navigator.clipboard.writeText(shareText).catch(() => {});
    toast.success('Caption copied to clipboard — paste into LinkedIn');
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`, '_blank', 'noopener,noreferrer');
  };

  const handleTwitter = () => {
    const text = encodeURIComponent(`${shareText}\n\n${shareUrl}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
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
      </DialogContent>
    </Dialog>
  );
}
