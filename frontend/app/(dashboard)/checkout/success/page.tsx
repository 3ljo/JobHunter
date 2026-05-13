'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { resyncSubscription } from '@/lib/api';
import {
  CheckCircle2, ArrowRight, Sparkles, FileText, PenLine, Settings,
  Crown, Zap, Loader2, AlertCircle, RefreshCw, Mail,
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
    name: 'Pro+',
    accent: 'oklch(0.72 0.19 291)',
    glow: 'rgba(192,132,252,0.22)',
    subtitle: 'Everything in Pro + Job Hunter + 8 voice mock interviews a month.',
  },
  pro_plus: {
    name: 'Pro+',
    accent: 'oklch(0.72 0.19 291)',
    glow: 'rgba(192,132,252,0.22)',
    subtitle: 'Everything in Pro + Job Hunter + 8 voice mock interviews a month.',
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

type Phase = 'polling' | 'ready' | 'delayed';

export default function CheckoutSuccessPage() {
  const { subscription, refresh } = useSubscriptionStore();
  // Explicit three-state machine rather than a single "ready" boolean:
  //   polling  → still waiting for the webhook to upgrade our plan row
  //   ready    → plan row flipped off 'free', show the welcome
  //   delayed  → polled long enough, webhook still hasn't landed —
  //              show an honest "payment received, activation delayed"
  //              card instead of faking a welcome to a plan we don't
  //              actually have (which the Network tab & navbar exposed).
  const [phase, setPhase] = useState<Phase>('polling');
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      // Max ~30s wall clock: 10 attempts at 1s → 3s backoff. Beats the
      // old 500ms-hammer loop that was firing ~12 requests in 10s, and
      // gives LS webhooks a realistic delivery window.
      for (let attempt = 0; attempt < 10; attempt++) {
        if (cancelled) return;
        setAttempts(attempt + 1);
        await refresh();
        const current = useSubscriptionStore.getState().subscription;
        const planKey = current?.plan;
        if (planKey && planKey !== 'free') {
          if (!cancelled) setPhase('ready');
          return;
        }
        await new Promise((r) => setTimeout(r, Math.min(1000 + attempt * 250, 3000)));
      }
      // Webhook still hadn't landed after 30s — one last attempt: pull
      // the subscription straight from Lemon Squeezy and upsert. Handles
      // the case where the webhook was dropped entirely (test-mode
      // misconfig, 401 signature, etc) without requiring the user to
      // click anything.
      if (cancelled) return;
      try {
        const res = await resyncSubscription();
        if (res.data.changed && res.data.subscription?.plan && res.data.subscription.plan !== 'free') {
          await refresh();
          if (!cancelled) setPhase('ready');
          return;
        }
      } catch {
        /* fall through to delayed state */
      }
      if (!cancelled) setPhase('delayed');
    };

    poll();
    try {
      confetti({ particleCount: 120, spread: 75, origin: { y: 0.55 } });
    } catch {}

    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const manualRefresh = async () => {
    setPhase('polling');
    setAttempts(0);
    // Go straight to LS this time — the normal webhook retry window
    // has already elapsed, so just resolve authoritatively.
    try {
      await resyncSubscription();
    } catch {
      /* fall through — refresh will still show whatever the DB has */
    }
    for (let attempt = 0; attempt < 3; attempt++) {
      setAttempts(attempt + 1);
      await refresh();
      const current = useSubscriptionStore.getState().subscription;
      if (current?.plan && current.plan !== 'free') {
        setPhase('ready');
        return;
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
    setPhase('delayed');
  };

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
        {phase === 'polling' && <LoadingState attempts={attempts} />}
        {phase === 'ready' && <SuccessContent meta={meta} />}
        {phase === 'delayed' && <DelayedState onRetry={manualRefresh} />}
      </div>
    </div>
  );
}

function LoadingState({ attempts }: { attempts: number }) {
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
      <span className="aivent-subtitle s2">
        Activating your plan{attempts > 0 ? ` · ${attempts}/10` : ''}
      </span>
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

// Shown when we've polled for ~30s and the plan is still 'free'. Almost
// always means the Lemon Squeezy webhook hasn't been delivered (test-mode
// webhook not configured, signature mismatch, or LS is still queuing the
// retry). Give the user an honest status and a way to retry — do NOT show
// "Welcome to Pro" when we don't actually know which plan they bought.
function DelayedState({ onRetry }: { onRetry: () => void }) {
  const [retrying, setRetrying] = useState(false);
  const handleRetry = async () => {
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="text-center">
      <div className="mb-6 flex justify-center">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{
            background: 'rgba(251,191,36,0.10)',
            border: '1px solid rgba(251,191,36,0.28)',
            boxShadow: '0 0 28px rgba(251,191,36,0.18)',
          }}
        >
          <AlertCircle className="h-8 w-8" style={{ color: '#fbbf24' }} />
        </div>
      </div>

      <span className="aivent-subtitle s2">Payment received</span>

      <h1
        className="text-white tracking-tight mb-4"
        style={{ fontSize: 'clamp(28px, 3.6vw, 40px)', fontWeight: 800, lineHeight: 1.1 }}
      >
        We got your payment —{' '}
        <span style={{ color: '#fbbf24' }}>activation is pending</span>
      </h1>

      <p
        className="text-white/55 text-base max-w-lg mx-auto mb-8"
        style={{ fontWeight: 400, lineHeight: 1.65 }}
      >
        Your card was charged and a receipt is on its way. Our payment provider
        sometimes takes a minute to finalise the upgrade — this usually clears
        in under 2 minutes.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
        <button
          onClick={handleRetry}
          disabled={retrying}
          className="btn-aivent fx-slide"
          data-hover={retrying ? 'CHECKING...' : 'CHECK AGAIN'}
          style={{ height: '44px', borderRadius: '10px', minWidth: '180px' }}
        >
          <span className="flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${retrying ? 'animate-spin' : ''}`} />
            {retrying ? 'Checking...' : 'Check again'}
          </span>
        </button>
        <Link
          href="/settings"
          className="btn-aivent btn-line fx-slide"
          data-hover="BILLING"
          style={{ height: '44px', borderRadius: '10px', minWidth: '140px' }}
        >
          <span>View billing</span>
        </Link>
      </div>

      <div
        className="rounded-2xl p-5 text-left max-w-xl mx-auto"
        style={{
          background: 'rgba(0,0,0,0.28)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div className="flex items-start gap-3">
          <Mail className="h-4 w-4 mt-0.5 shrink-0" style={{ color: 'oklch(0.72 0.19 291)' }} />
          <div>
            <p className="text-sm text-white font-bold mb-1">Still not active after 5 minutes?</p>
            <p className="text-xs text-white/55 leading-relaxed" style={{ fontWeight: 400 }}>
              Email support with your payment receipt. Your money is safe — we just
              need to manually reconcile the subscription on our side.
            </p>
          </div>
        </div>
      </div>
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
            meta.name === 'Pro+' ? '8 voice mock interviews / month' : 'Advanced ATS scoring',
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
