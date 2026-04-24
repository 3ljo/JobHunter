'use client';

// /redeem/[code] — public landing for a gifted pass. Flow:
//   1. Anonymous visitor lands here → we call GET /api/gift/:code (public)
//      to show the gift info.
//   2. If not signed in → prompt them to register/login with the specific
//      recipient email. We deep-link /register?ref=... and also stash the
//      pass_code in sessionStorage so we can auto-redeem after login.
//   3. If signed in AND email matches → "Redeem now" button calls
//      POST /api/gift/:code/redeem, flips to activated view.
//   4. If signed in with the wrong email → explain the mismatch.

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import axios from 'axios';
import { CheckCircle2, Gift, AlertCircle, ArrowRight } from 'lucide-react';
import { lookupGift, redeemGift, type GiftLookup } from '@/lib/api';
import { getReferralCookie } from '@/lib/referralCookie';

interface Props {
  params: Promise<{ code: string }>;
}

export default function RedeemGiftPage({ params }: Props) {
  const { code } = use(params);

  const [gift, setGift] = useState<GiftLookup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemed, setRedeemed] = useState(false);

  // Authed-user state — we read straight from the auth endpoint rather
  // than pulling in Zustand here, so this page works outside the
  // dashboard layout.
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Fetch gift + current user in parallel.
  useEffect(() => {
    lookupGift(code)
      .then((res) => setGift(res.data))
      .catch((err) => setError(err.response?.data?.error || 'Gift not found'))
      .finally(() => setLoading(false));

    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      setAuthChecked(true);
      return;
    }
    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setCurrentEmail(res.data?.user?.email || null))
      .catch(() => setCurrentEmail(null))
      .finally(() => setAuthChecked(true));
  }, [code]);

  const handleRedeem = async () => {
    setRedeeming(true);
    try {
      await redeemGift(code);
      setRedeemed(true);
      toast.success('Your 7-Day Pass is active!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Could not redeem');
    } finally {
      setRedeeming(false);
    }
  };

  if (loading) {
    return (
      <Shell>
        <p className="text-white/50 text-sm text-center">Looking up your gift…</p>
      </Shell>
    );
  }

  if (error || !gift) {
    return (
      <Shell>
        <ErrorBlock title="Gift not found" message={error || 'This link may have expired or been mistyped.'} />
      </Shell>
    );
  }

  if (gift.redeemed || redeemed) {
    return (
      <Shell>
        <Success />
      </Shell>
    );
  }

  const emailMatches = currentEmail && currentEmail.toLowerCase() === gift.recipient_email.toLowerCase();

  return (
    <Shell>
      <div
        className="rounded-3xl p-6 sm:p-10 text-center"
        style={{
          background: 'rgba(0,0,0,0.34)',
          border: '1px solid rgba(52,211,153,0.3)',
          boxShadow: '0 20px 60px rgba(52,211,153,0.15)',
        }}
      >
        <div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl mb-4"
          style={{
            background: 'linear-gradient(135deg, rgba(52,211,153,0.25), rgba(52,211,153,0.1))',
            border: '1px solid rgba(52,211,153,0.45)',
          }}
        >
          <Gift className="h-6 w-6" style={{ color: '#34d399' }} />
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">Someone gifted you a 7-Day Pass 🎁</h1>
        <p className="text-sm text-white/55 mb-5">
          Addressed to <span className="text-white font-semibold">{gift.recipient_email}</span>
        </p>

        {gift.message && (
          <div
            className="text-left rounded-xl p-4 mb-6 text-sm text-white/80 italic"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            &ldquo;{gift.message}&rdquo;
          </div>
        )}

        {!authChecked ? (
          <p className="text-white/40 text-xs">Checking your session…</p>
        ) : !currentEmail ? (
          <div className="space-y-3">
            <p className="text-xs text-white/55">
              Sign up (or sign in) with <span className="text-white/80 font-semibold">{gift.recipient_email}</span> to
              activate your pass.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
              <Link
                href={buildAuthHref('/register', gift.recipient_email, code)}
                className="btn-aivent fx-slide"
                data-hover="CREATE ACCOUNT"
                style={{ minWidth: '170px', height: '44px' }}
              >
                <span>Create account</span>
              </Link>
              <Link
                href={buildAuthHref('/login', gift.recipient_email, code)}
                className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}
              >
                I have an account
              </Link>
            </div>
          </div>
        ) : !emailMatches ? (
          <ErrorBlock
            title="Wrong account"
            message={`You are signed in as ${currentEmail}. This gift is addressed to ${gift.recipient_email}. Sign out and re-authenticate with that email to redeem.`}
          />
        ) : (
          <button
            onClick={handleRedeem}
            disabled={redeeming}
            className="btn-aivent fx-slide"
            data-hover="REDEEM MY PASS"
            style={{ minWidth: '200px', height: '48px' }}
          >
            <span>{redeeming ? 'Activating…' : 'Redeem my 7-Day Pass'}</span>
          </button>
        )}
      </div>

      <p className="text-center text-[11px] text-white/35 mt-5">
        Passes are valid for 7 days from activation. No auto-renew.
      </p>
    </Shell>
  );
}

// Preserve the referral cookie into the auth-page URL as a ?ref=... param.
// Middleware on the destination route re-sets the cookie; this belt-and-
// braces approach keeps attribution alive even if the cookie was somehow
// lost (privacy mode, third-party cookie block) between pages.
function buildAuthHref(base: '/login' | '/register', email: string, redeemCode: string): string {
  const refCode = getReferralCookie();
  const qs = new URLSearchParams({ email, redeem: redeemCode });
  if (refCode) qs.set('ref', refCode);
  return `${base}?${qs.toString()}`;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: '#0a0d24' }}>
      <div className="w-full max-w-xl">{children}</div>
    </div>
  );
}

function Success() {
  return (
    <div
      className="rounded-3xl p-6 sm:p-10 text-center"
      style={{
        background: 'rgba(0,0,0,0.34)',
        border: '1px solid rgba(52,211,153,0.35)',
      }}
    >
      <div
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl mb-4"
        style={{
          background: 'linear-gradient(135deg, rgba(52,211,153,0.25), rgba(52,211,153,0.1))',
          border: '1px solid rgba(52,211,153,0.45)',
        }}
      >
        <CheckCircle2 className="h-6 w-6" style={{ color: '#34d399' }} />
      </div>
      <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">Your 7-Day Pass is active</h1>
      <p className="text-sm text-white/55 mb-6">
        Unlimited CV analyses, cover letters, and job tracker for the next 7 days. Make it count.
      </p>
      <Link
        href="/dashboard"
        className="btn-aivent fx-slide"
        data-hover="GO TO DASHBOARD"
        style={{ minWidth: '200px', height: '44px' }}
      >
        <span>Go to dashboard <ArrowRight className="h-3.5 w-3.5 inline ml-1" /></span>
      </Link>
    </div>
  );
}

function ErrorBlock({ title, message }: { title: string; message: string }) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: '#f87171' }} />
        <div className="text-left">
          <p className="text-white font-bold text-sm mb-1">{title}</p>
          <p className="text-white/60 text-xs">{message}</p>
        </div>
      </div>
    </div>
  );
}
