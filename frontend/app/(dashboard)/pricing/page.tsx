'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import Link from 'next/link';
import toast from 'react-hot-toast';

const plans = [
  {
    key: 'free',
    bg: '/aivent/misc/l3.webp',
    name: 'Free',
    monthly: 0,
    yearly: 0,
    features: [
      '3 CV analyses per day',
      '5 cover letters per day',
      'ATS score & keyword report',
      'PDF downloads',
    ],
    cta: 'Current Plan',
    highlight: false,
  },
  {
    key: 'pro',
    bg: '/aivent/misc/l4.webp',
    name: 'Pro',
    monthly: 9.99,
    yearly: 99.99,
    features: [
      '25 CV analyses per day',
      'Unlimited cover letters',
      'Full ATS audit & optimization',
      'AI quick edits',
      'Priority AI processing',
      'Full CV history & analytics',
    ],
    cta: 'Start Pro',
    highlight: true,
  },
  {
    key: 'pro_plus',
    bg: '/aivent/misc/l5.webp',
    name: 'Pro+',
    monthly: 14.99,
    yearly: 149.99,
    features: [
      'Unlimited CV analyses',
      'Unlimited cover letters',
      'Full ATS audit & optimization',
      'AI quick edits',
      'Job application tracker',
      'Priority AI processing',
      'Full CV history & analytics',
      'Advanced voice matching',
    ],
    cta: 'Start Pro+',
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
  const [interval, setInterval] = useState<'month' | 'year'>('month');
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
    <div className="max-w-6xl mx-auto">

      {/* Header — uses aivent-subtitle like landing page */}
      <div className="text-center mb-10">
        <span className="aivent-subtitle s2">Pricing Plans</span>
        <h2 className="text-white tracking-tight" style={{ fontSize: 'clamp(32px,4vw,48px)', fontWeight: 800 }}>
          Choose Your Plan
        </h2>
        <p className="text-white/55 text-lg mt-4 max-w-2xl mx-auto" style={{ fontWeight: 400 }}>
          Start free. Upgrade when you need more power.
        </p>
      </div>

      {/* Monthly / Yearly toggle — styled like AIvent .btn-main toggle */}
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
          data-hover="YEARLY — SAVE 17%"
          style={{ minWidth: '180px' }}
        >
          <span>Yearly — Save 17%</span>
        </button>
      </div>

      {/* Plan cards — same structure as landing page pricing section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((p) => {
          const isCurrentPlan = currentPlan === p.key;
          const price = interval === 'month' ? p.monthly : p.yearly;
          const period = interval === 'month' ? '/mo' : '/yr';
          const perMonth = interval === 'year' && p.monthly > 0
            ? `$${(p.yearly / 12).toFixed(2)}/mo`
            : null;

          return (
            <div key={p.key}>
              {/* Top card — d-ticket-card with background image, same as landing page */}
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
                {/* Dark overlay */}
                <div className="absolute inset-0" style={{ background: 'rgba(16,20,53,0.82)', borderRadius: '10px 10px 0 0' }} />

                <div className="relative" style={{ zIndex: 1 }}>
                  <img src="/aivent/logo.png" alt="" style={{ height: '28px', marginBottom: '20px', opacity: 0.8 }} />

                  <h2 className="text-white mb-1" style={{ fontSize: '1.875rem', fontWeight: 800 }}>
                    {p.name}
                  </h2>

                  <h4 className="text-white/80 mb-4" style={{ fontWeight: 600 }}>
                    <span className="text-white" style={{ fontSize: '2.25rem', fontWeight: 800 }}>
                      ${price === 0 ? '0' : price.toFixed(2)}
                    </span>
                    <span className="text-white/50 ml-1" style={{ fontSize: '1rem', fontWeight: 400 }}>
                      {period}
                    </span>
                  </h4>

                  {perMonth && (
                    <p className="text-sm mb-2" style={{ color: '#34d399', fontWeight: 500 }}>
                      {perMonth} billed yearly
                    </p>
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

              {/* Bottom section — features + CTA, same as landing page */}
              <div
                className="rounded-t-none rounded-b-xl px-6 py-6"
                style={{
                  background: '#1A1E42',
                  border: p.highlight
                    ? '2px solid oklch(0.59 0.245 291)'
                    : '2px solid rgba(255,255,255,0.08)',
                  borderTop: 'none',
                }}
              >
                <ul className="ul-check mb-6 space-y-2">
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
                    href={`/checkout?plan=${p.key}&interval=${interval}`}
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
        Cancel anytime. No hidden fees. Secure payments powered by Stripe.
      </p>
    </div>
  );
}
