'use client';

// /referrals — Hired & Help dashboard.
// Shows the user's referral code + shareable link, earnings breakdown
// (pending / vested / paid-out), recent referrals table, and the
// request-payout form. Vested-reward cash-out requires ≥$20.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Gift, Copy, Check, Users, Trophy, Clock, DollarSign, ArrowRight, Crown,
  CheckCircle2, XCircle, Hourglass, Mail,
} from 'lucide-react';
import {
  getMyReferralInfo, requestReferralPayout, listMyReferralPayouts,
  type ReferralInfo, type ReferralRecent, type MyPayout,
} from '@/lib/api';
import { friendlyError } from '@/lib/errorMessages';

const MIN_PAYOUT_CENTS = 2000;

const dollars = (cents: number) => `$${(cents / 100).toFixed(2)}`;

const STATUS_COPY: Record<ReferralRecent['status'], { label: string; color: string; bg: string }> = {
  clicked:   { label: 'Clicked',   color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
  signed_up: { label: 'Signed up', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  paid:      { label: 'Paid · vesting', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
  confirmed: { label: 'Confirmed', color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  paid_out:  { label: 'Paid out',  color: '#c084fc', bg: 'rgba(192,132,252,0.12)' },
  refunded:  { label: 'Refunded',  color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
  fraud:     { label: 'Flagged',   color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
};

export default function ReferralsPage() {
  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [payouts, setPayouts] = useState<MyPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);
  const [paypalEmail, setPaypalEmail] = useState('');
  const [submittingPayout, setSubmittingPayout] = useState(false);

  const refreshAll = async () => {
    // Fire both in parallel — /me is the source of truth for code +
    // stats + recent referrals; /payouts is the separate payout
    // history. Either failing is non-fatal for the other.
    const [infoRes, payoutsRes] = await Promise.allSettled([
      getMyReferralInfo(),
      listMyReferralPayouts(),
    ]);
    if (infoRes.status === 'fulfilled') setInfo(infoRes.value.data);
    else toast.error(friendlyError(infoRes.reason, 'generic'));
    if (payoutsRes.status === 'fulfilled') setPayouts(payoutsRes.value.data.payouts);
    // Payouts failure is silent — the "Payouts" section just won't render.
  };

  useEffect(() => {
    refreshAll().finally(() => setLoading(false));
  }, []);

  const copy = (text: string, kind: 'code' | 'link') => {
    navigator.clipboard.writeText(text);
    setCopied(kind);
    toast.success('Copied!');
    setTimeout(() => setCopied(null), 2000);
  };

  const handlePayout = async () => {
    const email = paypalEmail.trim();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      toast.error('Enter a valid PayPal email');
      return;
    }
    setSubmittingPayout(true);
    try {
      await requestReferralPayout(email);
      toast.success('Payout requested — typical turnaround 1–3 business days.');
      setPaypalEmail('');
      await refreshAll();
    } catch (err: any) {
      toast.error(friendlyError(err, 'payment'));
    } finally {
      setSubmittingPayout(false);
    }
  };

  // A user with any open payout can't request a new one — the backend
  // enforces this too (409 payout_in_progress), but it's nicer to grey
  // out the button than bounce the request.
  const openPayout = payouts.find((p) => p.status === 'pending' || p.status === 'approved');

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <p className="text-white/50 text-sm">Loading your referrals…</p>
      </div>
    );
  }

  if (!info) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <p className="text-white/60 text-sm">Could not load referral info. Try refreshing.</p>
      </div>
    );
  }

  const canPayout = info.stats.vested_reward_cents >= MIN_PAYOUT_CENTS;

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-700/10 ring-1 ring-violet-500/25 shadow-[0_0_16px_rgba(118,77,240,0.15)]">
            <Gift className="h-4 w-4 text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-foreground tracking-tight">Hired &amp; Help Referrals</h1>
            <p className="text-muted-foreground/60 text-xs">Earn cash when friends subscribe. 14-day vesting on every reward.</p>
          </div>
        </div>
        {info.tier !== 'standard' && (
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black uppercase tracking-widest"
            style={{
              background: 'rgba(251,191,36,0.15)',
              color: '#fbbf24',
              border: '1px solid rgba(251,191,36,0.35)',
            }}
          >
            <Crown className="h-3 w-3" />
            {info.tier === 'ambassador' ? 'Ambassador · 2× rewards' : 'Founding 100 · 2× rewards'}
          </span>
        )}
      </header>

      {/* Share block */}
      <section
        className="rounded-2xl p-6"
        style={{
          background: 'rgba(0,0,0,0.28)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          border: '1px solid rgba(118,77,240,0.25)',
        }}
      >
        <p className="text-xs uppercase tracking-widest text-white/40 mb-3 font-bold">Your referral code</p>

        <div className="flex items-center gap-2 mb-4">
          <div
            className="flex-1 flex items-center h-11 rounded-xl px-4 text-lg font-mono font-black text-white tracking-wider"
            style={{ background: 'rgba(118,77,240,0.1)', border: '1px solid rgba(118,77,240,0.22)' }}
          >
            {info.code}
          </div>
          <button
            onClick={() => copy(info.code, 'code')}
            className="h-11 w-11 rounded-xl flex items-center justify-center transition-all"
            style={{ background: 'rgba(118,77,240,0.12)', border: '1px solid rgba(118,77,240,0.22)' }}
            title="Copy code"
          >
            {copied === 'code' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-violet-400" />}
          </button>
        </div>

        <p className="text-xs uppercase tracking-widest text-white/40 mb-2 font-bold">Share link</p>
        <div className="flex items-center gap-2">
          <div
            className="flex-1 flex items-center h-11 rounded-xl px-4 text-xs text-white/65 font-mono truncate"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            {info.share_url}
          </div>
          <button
            onClick={() => copy(info.share_url, 'link')}
            className="h-11 w-11 rounded-xl flex items-center justify-center transition-all shrink-0"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            title="Copy link"
          >
            {copied === 'link' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-white/60" />}
          </button>
        </div>
      </section>

      {/* Stats grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Users}    label="Signed up"       value={info.stats.signup_count.toString()} color="#60a5fa" />
        <StatCard icon={Trophy}   label="Paid conversions" value={info.stats.paid_count.toString()}   color="#fbbf24" />
        <StatCard icon={Clock}    label="Pending"          value={dollars(info.stats.pending_reward_cents)} color="#94a3b8" sub="vesting" />
        <StatCard icon={DollarSign} label="Vested"         value={dollars(info.stats.vested_reward_cents)}  color="#34d399" sub="ready to cash out" highlight />
      </section>

      {/* Payout */}
      <PayoutSection
        info={info}
        openPayout={openPayout}
        payouts={payouts}
        paypalEmail={paypalEmail}
        setPaypalEmail={setPaypalEmail}
        submittingPayout={submittingPayout}
        canPayout={canPayout}
        onPayout={handlePayout}
      />

      {/* Gift-a-Pass CTA */}
      <section
        className="rounded-2xl p-5 flex items-center justify-between gap-3 flex-wrap"
        style={{ background: 'rgba(192,132,252,0.06)', border: '1px solid rgba(192,132,252,0.2)' }}
      >
        <div className="flex items-center gap-3">
          <Gift className="h-5 w-5" style={{ color: '#c084fc' }} />
          <div>
            <p className="text-white font-bold text-sm">Send a friend a 7-Day Pass</p>
            <p className="text-white/55 text-xs">$9 one-time. If they convert to paid within 30 days, you get referral credit.</p>
          </div>
        </div>
        <Link
          href="/gift"
          className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold transition-all"
          style={{ background: 'rgba(192,132,252,0.15)', color: '#e9d5ff', border: '1px solid rgba(192,132,252,0.35)' }}
        >
          Gift a Pass <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </section>

      {/* Recent referrals */}
      <section
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(0,0,0,0.25)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div className="px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="text-sm font-black uppercase tracking-widest text-white/80">Recent referrals</h2>
        </div>
        {info.recent_referrals.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-white/45 text-sm">No referrals yet. Share your code to start earning.</p>
          </div>
        ) : (
          <ul className="divide-y divide-white/[0.05]">
            {info.recent_referrals.map((r) => {
              const status = STATUS_COPY[r.status];
              return (
                <li key={r.id} className="px-5 py-3 flex items-center gap-3 text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="text-white/85 font-semibold truncate">{r.referee_email}</p>
                    <p className="text-white/40 text-[11px] mt-0.5">
                      {new Date(r.created_at).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-white/90 font-black tabular-nums text-sm">
                      {r.reward_cents > 0 ? dollars(r.reward_cents) : '—'}
                    </p>
                    <span
                      className="inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mt-0.5"
                      style={{ background: status.bg, color: status.color }}
                    >
                      {status.label}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// PayoutSection — rolls up three states into one card:
//   A. open payout in flight → show the pending request with status pill
//   B. canPayout true, no open → active request form
//   C. not yet → progress bar to the $20 minimum with an encouraging msg
// Includes a collapsible "History" block showing prior paid/rejected
// rows so users don't think their money vanished after a cash-out.
// ─────────────────────────────────────────────────────────────────────
function PayoutSection({
  info, openPayout, payouts, paypalEmail, setPaypalEmail,
  submittingPayout, canPayout, onPayout,
}: {
  info: ReferralInfo;
  openPayout: MyPayout | undefined;
  payouts: MyPayout[];
  paypalEmail: string;
  setPaypalEmail: (v: string) => void;
  submittingPayout: boolean;
  canPayout: boolean;
  onPayout: () => void;
}) {
  const vested = info.stats.vested_reward_cents;
  const progressPct = Math.min(100, Math.round((vested / MIN_PAYOUT_CENTS) * 100));
  const completed = payouts.filter((p) => p.status === 'paid' || p.status === 'rejected');

  // State A — open payout in flight.
  if (openPayout) {
    return (
      <section
        className="rounded-2xl p-6"
        style={{
          background: 'linear-gradient(135deg, rgba(251,191,36,0.08), rgba(118,77,240,0.04))',
          border: '1px solid rgba(251,191,36,0.3)',
        }}
      >
        <div className="flex items-start gap-4 flex-wrap">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl shrink-0"
            style={{
              background: 'rgba(251,191,36,0.15)',
              border: '1px solid rgba(251,191,36,0.3)',
            }}
          >
            <Hourglass className="h-5 w-5" style={{ color: '#fbbf24' }} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-black text-white mb-1">Payout in progress</h2>
            <p className="text-sm text-white/60 mb-3">
              <span className="text-white font-bold">{dollars(openPayout.amount_cents)}</span>
              {' '}to{' '}
              <span className="text-white/80">{openPayout.paypal_email}</span>.
              We process payouts manually in 1–3 business days — you'll see the status
              flip to <span className="text-emerald-400 font-semibold">Paid</span> here
              when the PayPal transfer completes.
            </p>
            <p className="text-[11px] text-white/40">
              Requested {timeAgo(openPayout.created_at)} · Payout #{openPayout.id.slice(0, 8)}
            </p>
          </div>
        </div>
        {completed.length > 0 && <PayoutHistory items={completed} />}
      </section>
    );
  }

  // State B — eligible and ready to request.
  if (canPayout) {
    return (
      <section
        className="rounded-2xl p-6"
        style={{
          background: 'linear-gradient(135deg, rgba(52,211,153,0.08), rgba(118,77,240,0.04))',
          border: '1px solid rgba(52,211,153,0.3)',
        }}
      >
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <div>
            <h2 className="text-lg font-black text-white mb-0.5">Request payout</h2>
            <p className="text-xs text-white/55">
              Paid via PayPal within 1–3 business days.
            </p>
          </div>
          <span
            className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399' }}
          >
            <DollarSign className="h-3 w-3" />
            {dollars(vested)} ready
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex-1 min-w-[240px] relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input
              type="email"
              placeholder="your-paypal@email.com"
              value={paypalEmail}
              onChange={(e) => setPaypalEmail(e.target.value)}
              disabled={submittingPayout}
              className="w-full h-11 rounded-xl pl-10 pr-4 text-sm text-white placeholder:text-white/30 disabled:opacity-50 transition-colors focus:border-emerald-400/40 focus:outline-none"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            />
          </div>
          <button
            onClick={onPayout}
            disabled={submittingPayout || !paypalEmail.trim()}
            className="btn-aivent fx-slide disabled:opacity-50 disabled:cursor-not-allowed"
            data-hover="REQUEST PAYOUT"
            style={{ minWidth: '180px', height: '44px' }}
          >
            <span>{submittingPayout ? 'Submitting…' : `Cash out ${dollars(vested)}`}</span>
          </button>
        </div>
        {completed.length > 0 && <PayoutHistory items={completed} />}
      </section>
    );
  }

  // State C — not yet. Progress bar to $20.
  const needed = MIN_PAYOUT_CENTS - vested;
  return (
    <section
      className="rounded-2xl p-6"
      style={{
        background: 'rgba(0,0,0,0.25)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div>
          <h2 className="text-lg font-black text-white mb-0.5">Cash out</h2>
          <p className="text-xs text-white/55">
            {vested > 0
              ? <>You're <span className="text-white font-semibold">{dollars(needed)}</span> away from the $20 minimum.</>
              : <>Earn <span className="text-white font-semibold">$20</span> in vested rewards to request a PayPal payout.</>
            }
          </p>
        </div>
        <span className="text-xs text-white/50 font-mono tabular-nums">
          {dollars(vested)} / ${MIN_PAYOUT_CENTS / 100}
        </span>
      </div>
      <div
        className="h-2 rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${progressPct}%`,
            background: 'linear-gradient(90deg, oklch(0.59 0.245 291), #34d399)',
          }}
        />
      </div>
      {info.stats.pending_reward_cents > 0 && (
        <p className="text-[11px] text-white/40 mt-3">
          <Clock className="inline h-3 w-3 mr-1 -mt-0.5" style={{ color: '#94a3b8' }} />
          {dollars(info.stats.pending_reward_cents)} currently vesting — these move to Vested after 14 days.
        </p>
      )}
      {completed.length > 0 && <PayoutHistory items={completed} />}
    </section>
  );
}

const PAYOUT_STATUS_COPY: Record<MyPayout['status'], { label: string; color: string; bg: string; icon: any }> = {
  pending:  { label: 'Processing', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', icon: Hourglass },
  approved: { label: 'Approved',   color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', icon: Hourglass },
  paid:     { label: 'Paid',       color: '#34d399', bg: 'rgba(52,211,153,0.12)', icon: CheckCircle2 },
  rejected: { label: 'Rejected',   color: '#f87171', bg: 'rgba(248,113,113,0.12)', icon: XCircle },
  failed:   { label: 'Failed',     color: '#f87171', bg: 'rgba(248,113,113,0.12)', icon: XCircle },
};

function PayoutHistory({ items }: { items: MyPayout[] }) {
  return (
    <div className="mt-5 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
      <p className="text-[10px] font-black uppercase tracking-widest text-white/45 mb-3">Payout history</p>
      <ul className="space-y-2">
        {items.slice(0, 5).map((p) => {
          const meta = PAYOUT_STATUS_COPY[p.status];
          const Icon = meta.icon;
          return (
            <li key={p.id} className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: meta.color }} />
                <span className="text-white/75 font-semibold tabular-nums">{dollars(p.amount_cents)}</span>
                <span className="text-white/35">·</span>
                <span className="text-white/45 truncate">
                  {p.status === 'paid' && p.paid_at
                    ? `Paid ${new Date(p.paid_at).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}`
                    : `Requested ${timeAgo(p.created_at)}`}
                </span>
              </div>
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shrink-0"
                style={{ background: meta.bg, color: meta.color }}
              >
                {meta.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// Rough "2 hours ago" formatter. Not quite Intl.RelativeTimeFormat —
// that returns things like "3 hours ago" with the locale's ordering
// but chokes on edge cases. Keep it simple.
function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return new Date(iso).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
}

function StatCard({
  icon: Icon, label, value, color, sub, highlight,
}: {
  icon: any; label: string; value: string; color: string; sub?: string; highlight?: boolean;
}) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: highlight ? 'rgba(52,211,153,0.08)' : 'rgba(0,0,0,0.22)',
        border: `1px solid ${highlight ? 'rgba(52,211,153,0.25)' : 'rgba(255,255,255,0.07)'}`,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-3.5 w-3.5" style={{ color }} />
        <p className="text-[10px] font-black uppercase tracking-widest text-white/55">{label}</p>
      </div>
      <p className="text-xl font-black text-white tabular-nums">{value}</p>
      {sub && <p className="text-[10px] text-white/35 mt-0.5">{sub}</p>}
    </div>
  );
}
