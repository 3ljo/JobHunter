'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Clock, FileText, MessageSquare, Mic2 } from 'lucide-react';
import { useSubscriptionStore } from '@/store/subscriptionStore';

type Row = {
  feature: 'cv' | 'cover_letter' | 'mock_interview';
  label: string;
  href: string;
  icon: typeof FileText;
  color: string;
};

const ROWS: Row[] = [
  { feature: 'cv',             label: 'CVs (Analyze + Create)', href: '/cv',           icon: FileText,        color: '#a78bfa' },
  { feature: 'cover_letter',   label: 'Cover Letters',           href: '/cover-letter', icon: MessageSquare,   color: '#60a5fa' },
  { feature: 'mock_interview', label: 'Mock Interviews',         href: '/interview',    icon: Mic2,            color: '#fbbf24' },
];

const planLabel = (plan?: string | null) =>
  plan === 'pro_plus' ? 'Pro+' : plan === 'pro' ? 'Pro' : 'Free';

const formatResetTime = (iso?: string | null) => {
  if (!iso) return '--:--';
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '--:--';
  }
};

// Dashboard widget: one card, three rows, one per AI quota.
// Pulls directly from the subscription store (fetched once on mount).
export default function UsageSummaryCard() {
  const { subscription, usage, fetchSubscription } = useSubscriptionStore();

  useEffect(() => {
    if (!subscription) fetchSubscription();
  }, [subscription, fetchSubscription]);

  if (!usage) return null;

  const resetTime = formatResetTime(usage.resetsAt);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(0,0,0,0.28)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div style={{ height: '1px', background: 'linear-gradient(90deg,transparent,rgba(118,77,240,0.7),transparent)' }} />
      <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2">
          <p className="text-white/80 text-sm font-bold uppercase tracking-widest">Today&apos;s Usage</p>
          <span
            className="text-[10px] font-black px-1.5 py-0.5 rounded uppercase"
            style={{
              background: 'rgba(118,77,240,0.15)',
              color: '#c4b5fd',
              border: '1px solid rgba(118,77,240,0.32)',
            }}
          >
            {planLabel(subscription?.plan)}
          </span>
        </div>
        <div
          className="flex items-center gap-1.5 text-[11px] font-bold text-white/45 tabular-nums"
          title={`Your daily quota resets at ${resetTime}`}
        >
          <Clock className="h-3 w-3" />
          resets {resetTime}
        </div>
      </div>

      <ul className="divide-y divide-white/[0.05]">
        {ROWS.map((r) => {
          const bucket = usage[r.feature];
          const used = bucket.used;
          const limit = bucket.limit;
          const limitText = limit >= 999999 ? '∞' : String(limit);
          const pct = limit >= 999999 ? 0 : Math.min(100, (used / Math.max(1, limit)) * 100);
          const warn = limit < 999999 && used / Math.max(1, limit) >= 1;
          const almost = !warn && limit < 999999 && used / Math.max(1, limit) > 0.8;
          const Icon = r.icon;
          const barColor = warn ? '#ef4444' : almost ? '#fbbf24' : '#764DF0';

          return (
            <li key={r.feature}>
              <Link
                href={r.href}
                className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-white/[0.03]"
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: `${r.color}1f`, border: `1px solid ${r.color}55` }}
                >
                  <Icon className="h-4 w-4" style={{ color: r.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <span className="text-[13px] font-bold text-white/85 truncate">{r.label}</span>
                    <span className="text-[12px] font-black tabular-nums text-white/70">
                      {used}/{limitText}
                    </span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div
                      className="h-full transition-all duration-500"
                      style={{ width: `${limit >= 999999 && used > 0 ? 100 : pct}%`, background: barColor }}
                    />
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
