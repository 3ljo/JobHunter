'use client';

// Post-checkout landing after a Gift-a-Pass purchase. The webhook creates
// the gifted_passes row asynchronously — we can't show the pass_code here
// reliably, so we direct the buyer to their Referrals dashboard where
// sent gifts will surface (via an RLS-protected query — coming in a
// follow-up). For v1 we just confirm the purchase succeeded.

import Link from 'next/link';
import { CheckCircle2, Gift, ArrowRight } from 'lucide-react';

export default function GiftSuccessPage() {
  return (
    <div className="max-w-xl mx-auto py-14 text-center space-y-5">
      <div
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(52,211,153,0.25), rgba(52,211,153,0.1))',
          border: '1px solid rgba(52,211,153,0.45)',
        }}
      >
        <CheckCircle2 className="h-6 w-6" style={{ color: '#34d399' }} />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-black text-white">Gift sent!</h1>
        <p className="text-white/55 text-sm max-w-sm mx-auto">
          We emailed the redeem link to your recipient. They&apos;ll need to sign
          up at CvClimber with the exact email you provided.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <Link
          href="/referrals"
          className="btn-aivent fx-slide"
          data-hover="VIEW REFERRALS"
          style={{ minWidth: '180px', height: '44px' }}
        >
          <span>View your referrals</span>
        </Link>
        <Link
          href="/gift"
          className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}
        >
          <Gift className="h-3.5 w-3.5" />
          Send another
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
