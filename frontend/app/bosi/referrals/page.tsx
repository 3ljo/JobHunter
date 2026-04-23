'use client';

// /bosi/referrals — admin fraud-review queue.
// Double-gated: the parent /bosi layout is requireAdmin (email allowlist),
// AND this page prompts for ADMIN_PASSWORD on load and sends it as
// X-Admin-Password on every call. Password is held in sessionStorage so
// a page refresh doesn't re-prompt mid-session.

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  adminListFlaggedReferrals, adminApproveReferral, adminRejectReferral,
  adminGetFunnel,
  type FlaggedReferral,
} from '@/lib/api';
import { Shield, AlertTriangle, Check, X, Users, BarChart3 } from 'lucide-react';

const PW_KEY = 'bosi_referrals_pw';
const dollars = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export default function AdminReferralsPage() {
  const [password, setPassword] = useState<string | null>(null);
  const [entry, setEntry] = useState('');
  const [rows, setRows] = useState<FlaggedReferral[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [funnel, setFunnel] = useState<Array<{ event_name: string; count: number }> | null>(null);
  const [funnelSince, setFunnelSince] = useState<string | null>(null);

  // Read cached password on mount.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const pw = sessionStorage.getItem(PW_KEY);
    if (pw) setPassword(pw);
  }, []);

  // Load flagged referrals + funnel whenever we have a password.
  useEffect(() => {
    if (!password) return;
    setLoading(true);
    Promise.all([
      adminListFlaggedReferrals(password),
      adminGetFunnel(password).catch(() => null),
    ])
      .then(([flaggedRes, funnelRes]) => {
        setRows(flaggedRes.data.flagged);
        if (funnelRes) {
          setFunnel(funnelRes.data.funnel);
          setFunnelSince(funnelRes.data.since);
        }
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          // Bad password — drop it and reprompt.
          sessionStorage.removeItem(PW_KEY);
          setPassword(null);
          toast.error('Wrong admin password');
        } else {
          toast.error(err.response?.data?.error || 'Failed to load admin data');
        }
      })
      .finally(() => setLoading(false));
  }, [password]);

  const handleUnlock = () => {
    const v = entry.trim();
    if (!v) return;
    sessionStorage.setItem(PW_KEY, v);
    setPassword(v);
    setEntry('');
  };

  const handleApprove = async (id: string) => {
    if (!password) return;
    try {
      await adminApproveReferral(id, password);
      setRows((prev) => (prev || []).filter((r) => r.id !== id));
      toast.success('Approved — referral returned to the normal flow.');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Approve failed');
    }
  };

  const handleReject = async (id: string) => {
    if (!password) return;
    if (!confirm('Reject this referral permanently? Reward will stay at $0.')) return;
    try {
      await adminRejectReferral(id, password);
      setRows((prev) => (prev || []).filter((r) => r.id !== id));
      toast.success('Rejected — row is permanent fraud.');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Reject failed');
    }
  };

  // ── Unlock screen ──────────────────────────────────────────
  if (!password) {
    return (
      <div className="max-w-md mx-auto py-12 space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500/20 to-red-700/10 ring-1 ring-red-500/25">
            <Shield className="h-4 w-4 text-red-400" />
          </div>
          <div>
            <h1 className="text-lg font-black text-foreground">Referral fraud queue</h1>
            <p className="text-muted-foreground/60 text-xs">Enter the admin password to review.</p>
          </div>
        </div>
        <div className="space-y-2">
          <input
            type="password"
            autoFocus
            placeholder="ADMIN_PASSWORD"
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
            className="w-full h-11 rounded-xl px-4 text-sm text-white placeholder:text-white/25"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', outline: 'none' }}
          />
          <button
            onClick={handleUnlock}
            className="btn-aivent fx-slide w-full"
            data-hover="UNLOCK"
            style={{ height: '44px' }}
          >
            <span>Unlock</span>
          </button>
        </div>
      </div>
    );
  }

  // ── Main UI ────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500/20 to-red-700/10 ring-1 ring-red-500/25">
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-foreground tracking-tight">Flagged referrals</h1>
            <p className="text-muted-foreground/60 text-xs">
              Auto-flagged by the fraud heuristic (&gt;5 signups from one referrer in 24h) or by self-referral IP match.
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            sessionStorage.removeItem(PW_KEY);
            setPassword(null);
          }}
          className="text-xs text-white/50 hover:text-white underline"
        >
          Lock
        </button>
      </header>

      {loading && <p className="text-white/50 text-sm">Loading admin data…</p>}

      {/* Funnel panel — counts over the last 30 days */}
      {funnel && funnel.length > 0 && (() => {
        const byName: Record<string, number> = {};
        funnel.forEach((f) => { byName[f.event_name] = f.count; });
        const click = byName['referral_clicked'] || 0;
        const signup = byName['referral_signup'] || 0;
        const paid = byName['referral_paid'] || 0;
        const vested = byName['reward_vested'] || 0;
        const pct = (num: number, den: number) => den === 0 ? '—' : `${((num / den) * 100).toFixed(1)}%`;
        return (
          <section
            className="rounded-2xl p-5"
            style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-3.5 w-3.5 text-white/50" />
              <span className="text-[11px] font-black uppercase tracking-widest text-white/70">
                Funnel · last 30 days
              </span>
              {funnelSince && (
                <span className="text-[10px] text-white/35 ml-auto">
                  since {new Date(funnelSince).toLocaleDateString()}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
              <FunnelCell label="Clicked"  value={click}  next={signup}  pctLabel={pct(signup, click)}  color="#60a5fa" />
              <FunnelCell label="Signed up" value={signup} next={paid}    pctLabel={pct(paid, signup)}   color="#a78bfa" />
              <FunnelCell label="Paid"      value={paid}   next={vested}  pctLabel={pct(vested, paid)}  color="#fbbf24" />
              <FunnelCell label="Vested"    value={vested} color="#34d399" />
              <FunnelCell
                label="Gift · purchase → redeem"
                value={byName['gift_pass_purchased'] || 0}
                next={byName['gift_pass_redeemed'] || 0}
                pctLabel={pct(byName['gift_pass_redeemed'] || 0, byName['gift_pass_purchased'] || 0)}
                color="#c084fc"
              />
            </div>
            {/* Secondary counts */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
              <RowCount label="payout_requested"  value={byName['payout_requested']  || 0} />
              <RowCount label="payout_sent"       value={byName['payout_sent']       || 0} />
              <RowCount label="ats_share"         value={byName['ats_share']         || 0} />
              <RowCount label="hire_share"        value={byName['hire_share']        || 0} />
            </div>
          </section>
        );
      })()}

      {!loading && rows && rows.length === 0 && (
        <div
          className="rounded-2xl p-8 text-center"
          style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)' }}
        >
          <Check className="h-6 w-6 mx-auto mb-2" style={{ color: '#34d399' }} />
          <p className="text-white font-bold text-sm">Nothing flagged.</p>
          <p className="text-white/50 text-xs">Cron runs daily at 00:00 UTC.</p>
        </div>
      )}

      {!loading && rows && rows.length > 0 && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <Users className="h-3.5 w-3.5 text-white/50" />
            <span className="text-[11px] font-black uppercase tracking-widest text-white/70">
              {rows.length} flagged
            </span>
          </div>
          <ul className="divide-y divide-white/[0.05]">
            {rows.map((r) => (
              <li key={r.id} className="px-5 py-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] uppercase tracking-widest text-white/40 font-bold">Referrer</span>
                      <span className="text-sm font-semibold text-white/85 truncate">{r.referrer_email}</span>
                      <span className="text-[10px] text-white/35 font-mono">[{r.referral_code}]</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] uppercase tracking-widest text-white/40 font-bold">Referee</span>
                      <span className="text-xs text-white/70">{r.referee_email || '—'}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-white/40">
                      <span>Signed up {new Date(r.created_at).toLocaleDateString()}</span>
                      {r.ip_address_hash && <span>IP hash: <span className="font-mono">{r.ip_address_hash.slice(0, 10)}…</span></span>}
                      {r.device_fingerprint && <span>Device: <span className="font-mono">{r.device_fingerprint}</span></span>}
                      <span className="text-white/60">Reward: {dollars(r.reward_amount_cents)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleApprove(r.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all"
                      style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)' }}
                    >
                      <Check className="h-3 w-3" /> Approve
                    </button>
                    <button
                      onClick={() => handleReject(r.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all"
                      style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}
                    >
                      <X className="h-3 w-3" /> Reject
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function FunnelCell({
  label, value, next, pctLabel, color,
}: {
  label: string; value: number; next?: number; pctLabel?: string; color: string;
}) {
  return (
    <div
      className="rounded-xl p-3"
      style={{ background: 'rgba(0,0,0,0.22)', border: `1px solid ${color}33` }}
    >
      <p className="text-[10px] font-black uppercase tracking-widest" style={{ color }}>
        {label}
      </p>
      <p className="text-xl font-black text-white tabular-nums mt-0.5">{value.toLocaleString()}</p>
      {pctLabel !== undefined && next !== undefined && (
        <p className="text-[10px] text-white/45 mt-0.5">
          → {next.toLocaleString()} <span className="text-white/60">({pctLabel})</span>
        </p>
      )}
    </div>
  );
}

function RowCount({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="rounded-lg px-3 py-2 flex items-center justify-between"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <span className="text-white/55 font-mono">{label}</span>
      <span className="text-white font-bold tabular-nums">{value.toLocaleString()}</span>
    </div>
  );
}
