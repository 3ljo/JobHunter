'use client';

import { useState, useEffect } from 'react';
import { getMyReferralCode, getMyReferrals } from '@/lib/api';
import toast from 'react-hot-toast';
import { Gift, Copy, Check, Users, Share2, Link2 } from 'lucide-react';

interface Referral {
  id: string;
  referred_email: string;
  referrer_reward_applied: boolean;
  referred_reward_applied: boolean;
  created_at: string;
}

export default function ReferralsPage() {
  const [code, setCode] = useState<string | null>(null);
  const [timesUsed, setTimesUsed] = useState(0);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);

  useEffect(() => {
    Promise.all([getMyReferralCode(), getMyReferrals()])
      .then(([codeRes, refRes]) => {
        setCode(codeRes.data.referral_code.code);
        setTimesUsed(codeRes.data.referral_code.times_used || 0);
        setReferrals(refRes.data.referrals || []);
      })
      .catch((err) => {
        console.error('Referral fetch error:', err?.response?.data || err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  const referralLink = code
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${code}`
    : '';

  const handleCopy = (text: string, type: 'code' | 'link') => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="lds-roller"><div /><div /><div /><div /><div /><div /><div /><div /></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">

      {/* Header — AIvent style */}
      <div className="text-center mb-10">
        <span className="aivent-subtitle s2">Referral Program</span>
        <h2 className="text-white tracking-tight" style={{ fontSize: 'clamp(32px,4vw,48px)', fontWeight: 800 }}>
          Invite Friends, Get Rewarded
        </h2>
        <p className="text-white/50 text-base mt-3 max-w-lg mx-auto" style={{ fontWeight: 400 }}>
          Share your link. They get <span className="text-emerald-400 font-semibold">30% off</span> their first paid month.
          You get a <span className="text-emerald-400 font-semibold">free month</span> when they subscribe.
        </p>
      </div>

      {/* How it works — 3 step cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {[
          { step: '1', title: 'Share Your Link', desc: 'Copy your unique referral link below and send it to friends.' },
          { step: '2', title: 'They Sign Up', desc: 'They register using your link and get 30% off their first paid month.' },
          { step: '3', title: 'You Get Rewarded', desc: 'When they subscribe to a paid plan, you get a free month.' },
        ].map((s) => (
          <div
            key={s.step}
            className="relative overflow-hidden rounded-xl text-center p-6"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}
          >
            <div
              className="inline-flex items-center justify-center h-10 w-10 rounded-full text-lg font-black mb-3"
              style={{ background: 'rgba(118,77,240,0.15)', color: '#a78bfa', border: '1px solid rgba(118,77,240,0.3)' }}
            >
              {s.step}
            </div>
            <h4 className="text-white text-sm font-bold mb-1">{s.title}</h4>
            <p className="text-white/40 text-xs" style={{ fontWeight: 400 }}>{s.desc}</p>
          </div>
        ))}
      </div>

      {/* Referral code + link card — d-ticket inspired */}
      <div
        className="d-ticket s2 mb-8"
        style={{ borderRadius: '16px' }}
      >
        {!code ? (
          <div className="text-center py-4">
            <p className="text-white/50 text-sm">Generating your referral code...</p>
          </div>
        ) : (
        <div>
          <div className="flex flex-col md:flex-row md:items-end gap-6">
            {/* Left — code */}
            <div className="flex-1">
              <img src="/aivent/logo.png" className="mb-4" style={{ width: '60px', opacity: 0.7 }} alt="" />
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/50 block mb-2">Your Referral Code</label>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-black text-white tracking-[0.12em] font-mono">{code}</span>
                <button
                  onClick={() => handleCopy(code, 'code')}
                  className="h-9 w-9 rounded-lg flex items-center justify-center transition-all"
                  style={{
                    background: copied === 'code' ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.1)',
                    border: '1px solid ' + (copied === 'code' ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.15)'),
                  }}
                >
                  {copied === 'code' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-white/60" />}
                </button>
              </div>
            </div>

            {/* Right — link + copy */}
            <div className="flex-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/50 block mb-2">Shareable Link</label>
              <div className="flex items-center gap-2">
                <div
                  className="flex-1 flex items-center h-11 rounded-lg px-3 text-xs text-white/50 truncate"
                  style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  {referralLink}
                </div>
                <button
                  onClick={() => handleCopy(referralLink, 'link')}
                  className="h-11 px-5 rounded-lg flex items-center gap-2 text-sm font-bold text-white transition-all shrink-0"
                  style={{
                    background: copied === 'link' ? 'rgba(16,185,129,0.2)' : 'linear-gradient(180deg, oklch(0.62 0.24 291), oklch(0.48 0.22 291))',
                    border: copied === 'link' ? '1px solid rgba(16,185,129,0.3)' : 'none',
                    boxShadow: copied === 'link' ? 'none' : '0 2px 12px rgba(118,77,240,0.3)',
                  }}
                >
                  {copied === 'link' ? <Check className="h-4 w-4 text-emerald-400" /> : <Share2 className="h-4 w-4" />}
                  {copied === 'link' ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Stats + referral list */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div
          className="rounded-xl p-5 text-center"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <Users className="h-5 w-5 mx-auto mb-2" style={{ color: '#764DF0', opacity: 0.7 }} />
          <div className="text-3xl font-black text-white tabular-nums">{timesUsed}</div>
          <p className="text-xs text-white/40 uppercase tracking-widest font-semibold mt-1">People Referred</p>
        </div>
        <div
          className="rounded-xl p-5 text-center"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <Gift className="h-5 w-5 mx-auto mb-2" style={{ color: '#34d399', opacity: 0.7 }} />
          <div className="text-3xl font-black text-white tabular-nums">
            {referrals.filter((r) => r.referrer_reward_applied).length}
          </div>
          <p className="text-xs text-white/40 uppercase tracking-widest font-semibold mt-1">Rewards Earned</p>
        </div>
      </div>

      {/* Referral history */}
      {referrals.length > 0 && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 className="text-white/60 text-xs font-bold uppercase tracking-widest">Referral History</h3>
          </div>
          {referrals.map((r, i) => (
            <div
              key={r.id}
              className="flex items-center justify-between px-5 py-3"
              style={{ borderBottom: i < referrals.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
            >
              <div>
                <p className="text-sm text-white/80 font-medium">{r.referred_email}</p>
                <p className="text-[11px] text-white/30">{new Date(r.created_at).toLocaleDateString()}</p>
              </div>
              <span
                className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                style={{
                  background: r.referrer_reward_applied ? 'rgba(16,185,129,0.12)' : 'rgba(251,191,36,0.12)',
                  color: r.referrer_reward_applied ? '#34d399' : '#fbbf24',
                }}
              >
                {r.referrer_reward_applied ? 'Rewarded' : 'Pending'}
              </span>
            </div>
          ))}
        </div>
      )}

      {referrals.length === 0 && (
        <div className="text-center py-6">
          <p className="text-white/30 text-sm" style={{ fontWeight: 400 }}>
            No referrals yet. Share your link to start earning rewards!
          </p>
        </div>
      )}
    </div>
  );
}
