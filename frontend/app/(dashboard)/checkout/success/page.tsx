'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import {
  CheckCircle2, ArrowRight, Sparkles, FileText, PenLine, Settings,
  Crown, Zap, Loader2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

// Map the backend plan key → user-facing name + accent color.
// Kept in one place so the Welcome banner, the pill, and the feature
// tile colors stay in sync when we add new tiers.
const PLAN_META: Record<
  string,
  { name: string; accent: string; glow: string; subtitle: string }
> = {
  pro_voice: {
    name: 'Pro Voice',
    accent: 'oklch(0.72 0.19 291)',
    glow: 'rgba(192,132,252,0.22)',
    subtitle: 'Everything in Pro + 8 voice mock interviews a month.',
  },
  pro_plus: {
    name: 'Pro Voice',
    accent: 'oklch(0.72 0.19 291)',
    glow: 'rgba(192,132,252,0.22)',
    subtitle: 'Everything in Pro + 8 voice mock interviews a month.',
  },
  pro: {
    name: 'Pro',
    accent: 'oklch(0.59 0.245 291)',
    glow: 'rgba(118,77,240,0.25)',
    subtitle: 'Unlimited CV analyses, cover letters and tracker seats.',
  },
  starter: {
    name: '7-Day Pass',
    accent: '#34d399',
    glow: 'rgba(52,211,153,0.2)',
    subtitle: 'Seven days of full Pro access — no subscription.',
  },
};

export default function CheckoutSuccessPage() {
  const { subscription, refresh } = useSubscriptionStore();
  // Hold back the banner until we have a non-free plan from the backend,
  // otherwise the first paint flashes "Welcome to Free!" (zustand store
  // is null on mount; the force-refresh below takes ~300ms to resolve).
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Webhooks from Lemon Squeezy aren't instantaneous — poll subscription
    // status until the plan upgrades off 'free' or we hit the retry cap.
    // Without this, the banner either flashes "Free" or sits empty until
    // the 60s store-TTL naturally expires.
    const poll = async () => {
      for (let attempt = 0; attempt < 12; attempt++) {
        if (cancelled) return;
        await refresh();
        const current = useSubscriptionStore.getState().subscription;
        const planKey = current?.plan;
        if (planKey && planKey !== 'free') {
          if (!cancelled) setReady(true);
          return;
        }
        // Back off: 500ms → 1s → 1.5s ... capped ~1.5s
        await new Promise((r) => setTimeout(r, Math.min(500 + attempt * 200, 1500)));
      }
      // Webhook still hadn't arrived — unblock the UI anyway. The user
      // paid; we'd rather show a slightly-stale banner than a spinner.
      if (!cancelled) setReady(true);
    };

    poll();
    try {
      confetti({ particleCount: 120, spread: 75, origin: { y: 0.55 } });
    } catch {}

    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const meta = PLAN_META[subscription?.plan || ''] || PLAN_META.pro;

  return (
    <div className="relative min-h-[calc(100vh-64px)] overflow-hidden">
      {/* ── Aurora glow backdrop ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute rounded-full"
          style={{
            width: 700,
            height: 700,
            top: '-15%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: `radial-gradient(circle, ${meta.glow} 0%, transparent 70%)`,
            filter: 'blur(80px)',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 500,
            height: 500,
            bottom: '-10%',
            right: '-10%',
            background: 'radial-gradient(circle, rgba(118,77,240,0.16) 0%, transparent 70%)',
            filter: 'blur(70px)',
          }}
        />
      </div>

      {/* Dot grid */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.55) 1px, transparent 1px)',
          backgroundSize: '42px 42px',
          opacity: 0.03,
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-16">
        {!ready ? (
          <LoadingState />
        ) : (
          <SuccessContent meta={meta} />
        )}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-2xl mb-6"
        style={{
          background: 'rgba(118,77,240,0.10)',
          border: '1px solid rgba(118,77,240,0.22)',
        }}
      >
        <Loader2 className="h-7 w-7 animate-spin" style={{ color: 'oklch(0.72 0.19 291)' }} />
      </div>
      <span className="aivent-subtitle s2">Activating your plan</span>
      <h2
        className="text-white tracking-tight"
        style={{ fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 800 }}
      >
        Hang tight — finalising your upgrade
      </h2>
      <p className="text-white/45 text-sm mt-3 max-w-md" style={{ fontWeight: 400 }}>
        This only takes a moment. Your payment is processed; we're just provisioning
        your new plan.
      </p>
    </div>
  );
}

function SuccessContent({
  meta,
}: {
  meta: { name: string; accent: string; glow: string; subtitle: string };
}) {
  return (
    <div className="text-center">
      {/* ── Hero robot — mirrors the register page's right-panel mascot ── */}
      <div className="relative mx-auto mb-10" style={{ maxWidth: 380 }}>
        {/* Outer glow halo */}
        <div
          className="pointer-events-none absolute -inset-6 rounded-[28px]"
          style={{
            background: `radial-gradient(ellipse at center, ${meta.glow} 0%, transparent 70%)`,
            filter: 'blur(30px)',
          }}
        />
        {/* Framed image box */}
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(0,0,0,0.35)',
            border: `1px solid ${meta.accent}55`,
            boxShadow: `0 20px 60px -20px ${meta.accent}66, inset 0 1px 0 rgba(255,255,255,0.08)`,
          }}
        >
          <img
            src="/aivent/misc/c2.webp"
            alt="CvClimber robot"
            className="w-full h-auto object-contain block"
            style={{ aspectRatio: '1/1' }}
          />
          {/* Subtle inner gradient to blend the box with the page */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, transparent 0%, transparent 60%, rgba(16,20,53,0.45) 100%)',
            }}
          />
          {/* Success check overlay — sits on the bottom of the robot box */}
          <div
            className="absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-xl"
            style={{
              background: 'rgba(16,185,129,0.18)',
              border: '1px solid rgba(16,185,129,0.45)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              boxShadow: '0 0 24px rgba(16,185,129,0.35)',
            }}
          >
            <CheckCircle2 className="h-5 w-5" style={{ color: '#34d399' }} />
          </div>
        </div>
      </div>

      <span className="aivent-subtitle s2">Payment successful</span>

      <h1
        className="text-white tracking-tight mb-4"
        style={{ fontSize: 'clamp(32px, 4.2vw, 52px)', fontWeight: 800, lineHeight: 1.05 }}
      >
        Welcome to{' '}
        <span
          style={{
            background: `linear-gradient(90deg, ${meta.accent}, oklch(0.72 0.19 291))`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {meta.name}
        </span>
      </h1>

      <p
        className="text-white/55 text-base max-w-lg mx-auto mb-10"
        style={{ fontWeight: 400, lineHeight: 1.65 }}
      >
        {meta.subtitle} Your subscription is live — jump in below.
      </p>

      {/* Plan badge pill */}
      <div className="mb-12 flex justify-center">
        <span
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em]"
          style={{
            background: 'rgba(118,77,240,0.12)',
            color: meta.accent,
            border: `1px solid ${meta.accent}44`,
          }}
        >
          <Crown className="h-3 w-3" />
          {meta.name} Plan · Active
        </span>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        <QuickActionCard
          href="/cv"
          icon={FileText}
          title="Analyze a CV"
          description="Use your upgraded limits"
          accent={meta.accent}
        />
        <QuickActionCard
          href="/cover-letter"
          icon={PenLine}
          title="Write a Cover Letter"
          description="Unlimited access"
          accent={meta.accent}
        />
        <QuickActionCard
          href="/settings"
          icon={Settings}
          title="Manage Subscription"
          description="Plan & billing details"
          accent={meta.accent}
        />
      </div>

      {/* What's unlocked */}
      <div
        className="rounded-2xl p-6 mb-10 text-left"
        style={{
          background: 'rgba(0,0,0,0.28)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-4 w-4" style={{ color: meta.accent }} />
          <p className="text-xs uppercase tracking-[0.2em] font-black text-white/55">
            What's unlocked
          </p>
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            'Unlimited CV analyses',
            'Unlimited cover letters',
            'Interview prep library',
            'LinkedIn-ready CV export',
            'Priority support',
            meta.name === 'Pro Voice' ? '8 voice mock interviews / month' : 'Advanced ATS scoring',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm text-white/80">
              <Sparkles
                className="h-4 w-4 mt-0.5 shrink-0"
                style={{ color: meta.accent }}
              />
              <span style={{ fontWeight: 500 }}>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Primary CTA */}
      <Link
        href="/dashboard"
        className="btn-aivent btn-lg fx-slide"
        data-hover="OPEN DASHBOARD"
      >
        <span className="flex items-center gap-2">
          Go to Dashboard <ArrowRight className="h-4 w-4" />
        </span>
      </Link>

      <p className="mt-6 text-xs text-white/35" style={{ fontWeight: 400 }}>
        A receipt has been sent to your email. Need help?{' '}
        <Link
          href="/settings"
          className="transition-colors hover:text-white/70"
          style={{ color: meta.accent }}
        >
          Contact support
        </Link>
      </p>
    </div>
  );
}

function QuickActionCard({
  href,
  icon: Icon,
  title,
  description,
  accent,
}: {
  href: string;
  icon: any;
  title: string;
  description: string;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className="group relative rounded-2xl p-5 text-left transition-all"
      style={{
        background: 'rgba(0,0,0,0.28)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${accent}22 0%, transparent 60%)`,
        }}
      />
      <div className="relative">
        <div
          className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
          style={{
            background: `${accent}18`,
            border: `1px solid ${accent}33`,
          }}
        >
          <Icon className="h-4 w-4" style={{ color: accent }} />
        </div>
        <p className="text-sm font-bold text-white mb-0.5">{title}</p>
        <p className="text-[11px] text-white/45" style={{ fontWeight: 400 }}>
          {description}
        </p>
        <ArrowRight
          className="absolute right-0 top-0 h-3.5 w-3.5 text-white/30 transition-all group-hover:translate-x-1 group-hover:text-white/70"
        />
      </div>
    </Link>
  );
}
