'use client';

import { Clock } from 'lucide-react';
import { useSubscriptionStore } from '@/store/subscriptionStore';

type FeatureKey = 'cv' | 'cover_letter' | 'mock_interview';

const planLabel = (plan?: string | null) => {
  // `pro_plus` is a legacy alias for `pro_voice`.
  if (plan === 'pro_voice' || plan === 'pro_plus') return 'Pro Voice';
  if (plan === 'pro') return 'Pro';
  if (plan === 'starter') return '7-Day Pass';
  return 'Free';
};

const formatResetTime = (iso: string) => {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '--:--';
  }
};

const formatResetFull = (iso: string) => {
  try {
    const d = new Date(iso);
    return `Resets at ${d.toLocaleString([], {
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  } catch {
    return 'Resets at the start of tomorrow';
  }
};

// Compact daily usage meter — shows "Today N/M [bar] Plan · resets HH:MM".
// Hover shows the full reset timestamp. Renders nothing if usage is missing.
export default function UsageMeter({ feature }: { feature: FeatureKey }) {
  const { subscription, usage } = useSubscriptionStore();
  if (!usage) return null;

  const bucket = usage[feature];
  const used = bucket?.used ?? 0;
  const limit = bucket?.limit ?? 0;
  const label = planLabel(subscription?.plan);

  const limitText = limit >= 999999 ? '∞' : String(limit);
  const pct = limit >= 999999 ? 0 : Math.min(100, (used / Math.max(1, limit)) * 100);
  const warn = limit < 999999 && used / Math.max(1, limit) > 0.8;
  const resetTime = formatResetTime(usage.resetsAt);
  const resetTooltip = formatResetFull(usage.resetsAt);

  return (
    <div
      className="mb-3 flex items-center gap-2 text-[11px] font-bold"
      style={{ color: 'rgba(255,255,255,0.55)' }}
      title={resetTooltip}
    >
      <span className="uppercase tracking-widest text-white/35">Today</span>
      <span className="tabular-nums">
        {used}/{limitText}
      </span>
      <div
        className="flex-1 h-1 rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      >
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: warn ? '#fbbf24' : '#764DF0',
          }}
        />
      </div>
      <span className="uppercase tracking-widest text-white/35">{label}</span>
      <span
        className="hidden sm:inline-flex items-center gap-1 text-white/35 normal-case tracking-normal"
        aria-label={resetTooltip}
      >
        <Clock className="h-3 w-3" />
        <span className="tabular-nums">{resetTime}</span>
      </span>
    </div>
  );
}
