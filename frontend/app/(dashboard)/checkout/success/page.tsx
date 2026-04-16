'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CheckoutSuccessPage() {
  const { subscription, fetchSubscription } = useSubscriptionStore();

  useEffect(() => {
    fetchSubscription();
    // Fire confetti
    try {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch {}
  }, [fetchSubscription]);

  const planName = subscription?.plan === 'pro_plus' ? 'Pro+' : subscription?.plan === 'pro' ? 'Pro' : 'Free';

  return (
    <div className="max-w-2xl mx-auto text-center py-16">

      {/* Success icon */}
      <div
        className="inline-flex items-center justify-center h-20 w-20 rounded-full mb-6"
        style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}
      >
        <CheckCircle className="h-10 w-10" style={{ color: '#34d399' }} />
      </div>

      <span className="aivent-subtitle s2">Payment Successful</span>

      <h1
        className="text-white tracking-tight mb-4"
        style={{ fontSize: 'clamp(32px,4vw,48px)', fontWeight: 800 }}
      >
        Welcome to{' '}
        <span style={{ color: 'oklch(0.72 0.19 291)' }}>{planName}</span>!
      </h1>

      <p className="text-white/50 text-base mb-10 max-w-lg mx-auto" style={{ fontWeight: 400 }}>
        Your subscription is now active. You have access to all {planName} features. Start making the most of your upgraded plan.
      </p>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {[
          { href: '/cv', label: 'Analyze a CV', desc: 'Use your upgraded limits' },
          { href: '/cover-letter', label: 'Write a Cover Letter', desc: 'Unlimited access' },
          { href: '/settings', label: 'Manage Subscription', desc: 'View plan details' },
        ].map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="rounded-xl p-5 text-center transition-all hover:scale-[1.02]"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <Sparkles className="h-5 w-5 mx-auto mb-2" style={{ color: 'oklch(0.72 0.19 291)' }} />
            <p className="text-sm text-white font-semibold mb-0.5">{a.label}</p>
            <p className="text-[11px] text-white/40" style={{ fontWeight: 400 }}>{a.desc}</p>
          </Link>
        ))}
      </div>

      <Link
        href="/dashboard"
        className="btn-aivent fx-slide"
        data-hover="GO TO DASHBOARD"
      >
        <span className="flex items-center gap-2">
          Go to Dashboard <ArrowRight className="h-4 w-4" />
        </span>
      </Link>
    </div>
  );
}
