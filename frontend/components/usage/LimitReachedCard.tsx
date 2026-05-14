'use client';

import { useRouter } from 'next/navigation';
import { Lock, Sparkles, Clock } from 'lucide-react';
import { useSubscriptionStore } from '@/store/subscriptionStore';

type FeatureKey = 'cv' | 'cover_letter' | 'mock_interview';

const FEATURE_COPY: Record<FeatureKey, { noun: string; verb: string }> = {
  cv: { noun: 'CV analyses', verb: 'analyzed' },
  cover_letter: { noun: 'cover letters', verb: 'generated' },
  mock_interview: { noun: 'mock interviews', verb: 'started' },
};

const planLabel = (plan?: string | null) => {
  // `pro_plus` is a legacy alias for `pro_voice`.
  if (plan === 'pro_voice' || plan === 'pro_plus') return 'Pro+';
  if (plan === 'pro') return 'Pro';
  if (plan === 'starter') return '7-Day Pass';
  return 'Free';
};

// Upgrade CTA changes per feature + current plan.
const upgradeCopy = (feature: FeatureKey, plan?: string | null) => {
  const isProVoice = plan === 'pro_voice' || plan === 'pro_plus';
  if (feature === 'cv') {
    if (plan === 'free') return { label: 'Upgrade to Pro for unlimited', target: 'pro' };
    return { label: '', target: '' }; // Pro / Pro Voice already get unlimited CV
  }
  if (feature === 'cover_letter') {
    if (plan === 'free') return { label: 'Upgrade to Pro for unlimited', target: 'pro' };
    return { label: '', target: '' }; // Pro / Pro Voice already get unlimited cover letters
  }
  // mock_interview: free/Pro → upsell to Pro Voice; Pro Voice is top tier.
  if (feature === 'mock_interview') {
    if (isProVoice) return { label: '', target: '' };
    return { label: 'Upgrade to Pro+ for voice interviews', target: 'pro_voice' };
  }
  return { label: '', target: '' };
};

const formatResetTime = (iso?: string | null) => {
  if (!iso) return '--:--';
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '--:--';
  }
};

const hoursUntil = (iso?: string | null) => {
  if (!iso) return 24;
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(1, Math.ceil(ms / (60 * 60 * 1000)));
};

export default function LimitReachedCard({ feature }: { feature: FeatureKey }) {
  const router = useRouter();
  const { subscription, usage } = useSubscriptionStore();
  const bucket = usage?.[feature];
  const used = bucket?.used ?? 0;
  const limit = bucket?.limit ?? 0;
  const plan = subscription?.plan ?? 'free';
  const label = planLabel(plan);
  const copy = FEATURE_COPY[feature];
  const hrs = hoursUntil(usage?.resetsAt);
  const resetTime = formatResetTime(usage?.resetsAt);
  const isProVoice = plan === 'pro_voice' || plan === 'pro_plus';
  // Top of the ladder — no upgrade CTA to show.
  const isHighestPlan = isProVoice;
  const upgrade = upgradeCopy(feature, plan);

  return (
    <div
      className="rounded-2xl overflow-hidden p-6 sm:p-8"
      style={{
        background: 'linear-gradient(180deg,rgba(239,68,68,0.08),rgba(118,77,240,0.04))',
        border: '1px solid rgba(239,68,68,0.28)',
        boxShadow: '0 20px 50px rgba(239,68,68,0.12)',
      }}
    >
      <div
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl mb-4"
        style={{
          background: 'linear-gradient(135deg,rgba(239,68,68,0.25),rgba(239,68,68,0.1))',
          border: '1px solid rgba(239,68,68,0.45)',
        }}
      >
        <Lock className="h-6 w-6" style={{ color: '#fca5a5' }} />
      </div>
      <h3 className="text-xl sm:text-2xl font-black text-white text-center mb-2">
        Daily limit reached
      </h3>
      <p className="text-center text-sm text-white/60 mb-2">
        You&apos;ve {copy.verb} <span className="font-bold text-white">{used}/{limit}</span> {copy.noun} today on the{' '}
        <span
          className="font-bold"
          style={{
            color:
              isProVoice
                ? '#c084fc'
                : plan === 'pro'
                ? '#a78bfa'
                : plan === 'starter'
                ? '#34d399'
                : 'rgba(255,255,255,0.8)',
          }}
        >
          {label}
        </span>{' '}
        plan.
      </p>
      <p className="flex items-center justify-center gap-1.5 text-center text-[12px] text-white/45 mb-4">
        <Clock className="h-3 w-3" />
        Resets in {hrs} {hrs === 1 ? 'hour' : 'hours'} · <span className="tabular-nums">{resetTime}</span>
      </p>

      <div className="h-2 rounded-full overflow-hidden mb-5" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div
          className="h-full"
          style={{ width: '100%', background: 'linear-gradient(90deg,#ef4444,#b91c1c)' }}
        />
      </div>

      {isHighestPlan ? (
        <p className="text-center text-[12px] text-white/45">
          You&apos;re on our highest plan. Come back tomorrow for more.
        </p>
      ) : (
        <>
          <button
            type="button"
            onClick={() => {
              // Skip the pricing page when we already know the right
              // plan to upsell — drop the user straight into checkout.
              if (upgrade.target === 'pro' || upgrade.target === 'pro_voice') {
                router.push(`/checkout?plan=${upgrade.target}&interval=month`);
              } else {
                router.push('/pricing');
              }
            }}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-black transition-all"
            style={{
              background: 'linear-gradient(135deg,#764DF0,#5b21b6)',
              color: 'white',
              boxShadow: '0 10px 30px rgba(118,77,240,0.4)',
              letterSpacing: '0.02em',
            }}
          >
            <Sparkles className="h-4 w-4" />
            {upgrade.label}
          </button>
          <p className="text-center text-[11px] text-white/45 mt-3">
            Upgrades take effect immediately
          </p>
        </>
      )}
    </div>
  );
}
