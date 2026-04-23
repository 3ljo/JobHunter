'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import Link from 'next/link';
import toast from 'react-hot-toast';

type PlanKey = 'free' | 'starter' | 'pro' | 'pro_voice';
type Cadence = 'month' | 'year';

interface Plan {
  key: PlanKey;
  bg: string;
  name: string;
  tagline?: string;
  monthly: number;
  yearly: number;
  oneTime?: number;
  features: string[];
  cta: string;
  highlight: boolean;
  oneTimeOnly?: boolean;
}

const plans: Plan[] = [
  {
    key: 'free',
    bg: '/aivent/misc/l3.webp',
    name: 'Free',
    tagline: 'Try the core tools',
    monthly: 0,
    yearly: 0,
    features: [
      '1 CV analysis',
      '2 cover letters',
      'ATS score & keyword report',
      'PDF downloads',
      'Job tracker — up to 15 jobs',
    ],
    cta: 'Current Plan',
    highlight: false,
  },
  {
    key: 'starter',
    bg: '/aivent/misc/l3.webp',
    name: '7-Day Pass',
    tagline: 'One-time · No auto-renew',
    monthly: 9,
    yearly: 9,
    oneTime: 9,
    features: [
      'Unlimited CV analyses (7 days)',
      'Unlimited cover letters (7 days)',
      'Full ATS audit & optimization',
      'AI quick edits',
      '2 text mock interviews',
      'Unlimited job tracker',
      'No subscription — pay once',
    ],
    cta: 'Get 7-Day Pass',
    highlight: false,
    oneTimeOnly: true,
  },
  {
    key: 'pro',
    bg: '/aivent/misc/l4.webp',
    name: 'Pro',
    tagline: 'For active job seekers',
    monthly: 19,
    yearly: 149,
    features: [
      'Unlimited CV analyses',
      'Unlimited cover letters',
      'Full ATS audit & optimization',
      'AI quick edits',
      '5 text mock interviews / month',
      'Priority AI processing',
      'Full CV history & analytics',
      'Unlimited job tracker',
    ],
    cta: 'Start Pro',
    highlight: true,
  },
  {
    key: 'pro_voice',
    bg: '/aivent/misc/l5.webp',
    name: 'Pro Voice',
    tagline: 'With AI voice interview coach',
    monthly: 39,
    yearly: 299,
    features: [
      'Everything in Pro',
      'Voice Mock Interview — 8 sessions / month',
      'Voice feedback report',
      'Interview prep library',
      'LinkedIn-ready CV export',
      'Priority AI processing',
    ],
    cta: 'Start Pro Voice',
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <Suspense>
      <PricingContent />
    </Suspense>
  );
}

function PricingContent() {
  const [interval, setInterval] = useState<Cadence>('month');
  const { subscription, fetchSubscription } = useSubscriptionStore();
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  useEffect(() => {
    if (searchParams.get('checkout') === 'canceled') {
      toast.error('Checkout was canceled');
    }
  }, [searchParams]);

  const currentPlan = subscription?.plan || 'free';

  return (
    <div className="max-w-7xl mx-auto">

      {/* Header */}
      <div className="text-center mb-10">
        <span className="aivent-subtitle s2">Pricing Plans</span>
        <h2 className="text-white tracking-tight" style={{ fontSize: 'clamp(32px,4vw,48px)', fontWeight: 800 }}>
          Choose Your Plan
        </h2>
        <p className="text-white/55 text-lg mt-4 max-w-2xl mx-auto" style={{ fontWeight: 400 }}>
          Start free, grab a one-time 7-day pass for a burst job search, or subscribe for the long haul.
        </p>
      </div>

      {/* Monthly / Yearly toggle */}
      <div className="flex items-center justify-center gap-2 mb-12">
        <button
          onClick={() => setInterval('month')}
          className={`btn-aivent fx-slide ${interval === 'month' ? '' : 'btn-line'}`}
          data-hover="MONTHLY"
          style={{ minWidth: '120px' }}
        >
          <span>Monthly</span>
        </button>
        <button
          onClick={() => setInterval('year')}
          className={`btn-aivent fx-slide ${interval === 'year' ? '' : 'btn-line'}`}
          data-hover="YEARLY — SAVE 35%"
          style={{ minWidth: '200px' }}
        >
          <span>Yearly — Save 35%</span>
        </button>
      </div>

      {/* Plan cards — 4-column grid that drops to 2 on md, 1 on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {plans.map((p) => {
          const isCurrentPlan = currentPlan === p.key;
          const isPaidSubscription = p.key === 'pro' || p.key === 'pro_voice';
          const isOneTime = p.oneTimeOnly === true;

          // Price math
          const price = isOneTime
            ? p.oneTime ?? 0
            : interval === 'month'
              ? p.monthly
              : p.yearly;

          const period = isOneTime
            ? 'one-time'
            : interval === 'month'
              ? '/mo'
              : '/yr';

          const perMonth = isPaidSubscription && interval === 'year' && p.monthly > 0
            ? `$${(p.yearly / 12).toFixed(2)}/mo`
            : null;

          const savings = isPaidSubscription && interval === 'year' && p.monthly > 0
            ? Math.round(((p.monthly * 12 - p.yearly) / (p.monthly * 12)) * 100)
            : 0;

          // CTA link: subscription → interval param; one-time → interval=once
          const checkoutHref = isOneTime
            ? `/checkout?plan=${p.key}&interval=once`
            : `/checkout?plan=${p.key}&interval=${interval}`;

          return (
            <div key={p.key}>
              {/* Top card */}
              <div
                className="d-ticket-card mb-0 rounded-b-none"
                style={{
                  backgroundImage: `url(${p.bg})`,
                  border: p.highlight
                    ? '2px solid oklch(0.59 0.245 291)'
                    : '2px solid rgba(255,255,255,0.08)',
                  borderBottom: 'none',
                }}
              >
                <div className="absolute inset-0" style={{ background: 'rgba(16,20,53,0.82)', borderRadius: '10px 10px 0 0' }} />

                <div className="relative" style={{ zIndex: 1 }}>
                  <img src="/aivent/logo.png" alt="" style={{ height: '48px', marginBottom: '16px', opacity: 0.8 }} />

                  <h2 className="text-white mb-1" style={{ fontSize: '1.625rem', fontWeight: 800 }}>
                    {p.name}
                  </h2>

                  {p.tagline && (
                    <p className="text-white/50 text-xs mb-3" style={{ fontWeight: 500 }}>
                      {p.tagline}
                    </p>
                  )}

                  <h4 className="text-white/80 mb-3" style={{ fontWeight: 600 }}>
                    <span className="text-white" style={{ fontSize: '2rem', fontWeight: 800 }}>
                      ${price === 0 ? '0' : price.toFixed(price >= 100 ? 0 : 2)}
                    </span>
                    <span className="text-white/50 ml-1" style={{ fontSize: '0.95rem', fontWeight: 400 }}>
                      {period}
                    </span>
                  </h4>

                  {perMonth && (
                    <p className="text-xs mb-2" style={{ color: '#34d399', fontWeight: 500 }}>
                      {perMonth} · Save {savings}%
                    </p>
                  )}

                  {isOneTime && (
                    <span
                      className="inline-block px-3 py-1 rounded-full text-xs uppercase tracking-widest text-white"
                      style={{ fontWeight: 700, background: 'rgba(52,211,153,0.18)', color: '#34d399' }}
                    >
                      Pay once
                    </span>
                  )}

                  {p.highlight && (
                    <span
                      className="inline-block px-3 py-1 rounded-full text-xs uppercase tracking-widest text-white"
                      style={{ fontWeight: 700, background: 'oklch(0.59 0.245 291)' }}
                    >
                      Most Popular
                    </span>
                  )}

                  {isCurrentPlan && (
                    <span
                      className="inline-block px-3 py-1 rounded-full text-xs uppercase tracking-widest text-white"
                      style={{ fontWeight: 700, background: 'rgba(255,255,255,0.15)' }}
                    >
                      Current Plan
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom: features + CTA */}
              <div
                className="rounded-t-none rounded-b-xl px-5 py-5"
                style={{
                  background: '#1A1E42',
                  border: p.highlight
                    ? '2px solid oklch(0.59 0.245 291)'
                    : '2px solid rgba(255,255,255,0.08)',
                  borderTop: 'none',
                }}
              >
                <ul className="ul-check mb-5 space-y-2 text-sm">
                  {p.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>

                {isCurrentPlan ? (
                  <div
                    className="w-full text-center block py-3 rounded-lg text-sm"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      color: 'rgba(255,255,255,0.3)',
                      fontWeight: 600,
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    Current Plan
                  </div>
                ) : p.key === 'free' ? (
                  <div
                    className="w-full text-center block py-3 rounded-lg text-sm"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      color: 'rgba(255,255,255,0.3)',
                      fontWeight: 600,
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    Free Forever
                  </div>
                ) : (
                  <Link
                    href={checkoutHref}
                    className="btn-aivent fx-slide w-full text-center block"
                    data-hover={p.cta.toUpperCase()}
                  >
                    <span>{p.cta}</span>
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <p className="text-center text-white/30 text-sm mt-10" style={{ fontWeight: 400 }}>
        Cancel anytime. No hidden fees. Secure payments powered by Lemon Squeezy.
      </p>
    </div>
  );
}
