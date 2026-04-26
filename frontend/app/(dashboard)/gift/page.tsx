'use client';

// /gift — Gift-a-Pass ($9 one-time). Buyer enters a recipient email +
// optional message, pays via Lemon Squeezy, and the webhook records a
// gifted_passes row. The recipient gets a redeem link (/redeem/<code>).

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Gift, ArrowRight, Check } from 'lucide-react';
import { createGiftCheckout } from '@/lib/api';

export default function GiftPage() {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBuy = async () => {
    const email = recipientEmail.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error('Enter a valid recipient email');
      return;
    }
    setLoading(true);
    try {
      const res = await createGiftCheckout(email, message.trim() || undefined);
      window.location.href = res.data.url;
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to start checkout');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      <header className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-700/10 ring-1 ring-emerald-500/25">
          <Gift className="h-4 w-4 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-xl font-black text-foreground tracking-tight">Gift a 7-Day Pass</h1>
          <p className="text-muted-foreground/60 text-xs">$9 one-time. Help a friend land their next role.</p>
        </div>
      </header>

      {/* Form */}
      <section
        className="rounded-2xl p-6 space-y-4"
        style={{ background: 'rgba(0,0,0,0.28)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="space-y-1.5">
          <label className="text-[11px] font-black uppercase tracking-widest text-white/55">Recipient email</label>
          <input
            type="email"
            placeholder="friend@example.com"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            className="w-full h-11 rounded-xl px-4 text-sm text-white placeholder:text-white/30"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', outline: 'none' }}
          />
          <p className="text-[11px] text-white/35">They&apos;ll need to sign up with exactly this email to redeem.</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-black uppercase tracking-widest text-white/55">
            Personal message <span className="text-white/30">(optional)</span>
          </label>
          <textarea
            placeholder="Good luck with the job hunt!"
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 500))}
            rows={3}
            className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 resize-none"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', outline: 'none' }}
          />
          <p className="text-[11px] text-white/35">{500 - message.length} characters left</p>
        </div>

        <div
          className="rounded-xl p-4 space-y-2"
          style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)' }}
        >
          <p className="text-sm font-bold text-white flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-emerald-400" /> 7 days of unlimited CV analyses + cover letters
          </p>
          <p className="text-sm font-bold text-white flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-emerald-400" /> Full ATS audit + job tracker
          </p>
          <p className="text-sm font-bold text-white flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-emerald-400" /> Your friend keeps the pass; no subscription, no surprise charges
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          <div>
            <p className="text-2xl font-black text-white">$9<span className="text-sm font-normal text-white/40">.00</span></p>
            <p className="text-[11px] text-white/40">One-time · No auto-renew</p>
          </div>
          <button
            onClick={handleBuy}
            disabled={loading || !recipientEmail.trim()}
            className="btn-aivent fx-slide disabled:opacity-50 disabled:cursor-not-allowed"
            data-hover="SEND GIFT — $9"
            style={{ minWidth: '180px', height: '44px' }}
          >
            <span>{loading ? 'Redirecting…' : 'Send gift — $9'}</span>
          </button>
        </div>
      </section>

      <p className="text-center text-[11px] text-white/35">
        Payment via Lemon Squeezy. Your friend redeems at{' '}
        <span className="text-white/60">cvclimber.lol/redeem/&lt;code&gt;</span>
        . The code is emailed after checkout.
      </p>

      <div className="text-center">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-white/55 hover:text-white"
        >
          Back to dashboard <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
