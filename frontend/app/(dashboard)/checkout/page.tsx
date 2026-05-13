'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { createCheckoutSession, validatePromoCode, getNowpaymentsStatus, type CryptoPayment } from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Tag, Check, X, CreditCard, Smartphone, Lock, Loader2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

/* ── Plan data (mirrors pricing page) ── */
interface PlanEntry {
  name: string;
  bg: string;
  ticketClass: string;
  monthly: number;
  quarterly?: number;
  yearly: number;
  oneTime?: number;
  features: string[];
  oneTimeOnly?: boolean;
}

const PLANS: Record<string, PlanEntry> = {
  starter: {
    name: '7-Day Pass',
    bg: '/aivent/misc/l3.webp',
    ticketClass: 's1',
    monthly: 9,
    yearly: 9,
    oneTime: 9,
    oneTimeOnly: true,
    features: [
      'Unlimited CV analyses (7 days)',
      'Unlimited cover letters (7 days)',
      'Full ATS audit & optimization',
      'AI quick edits',
      'Unlimited job tracker',
      'No subscription — pay once',
    ],
  },
  pro: {
    name: 'Pro',
    bg: '/aivent/misc/l4.webp',
    ticketClass: 's2',
    monthly: 19,
    quarterly: 45,
    yearly: 149,
    features: [
      'Unlimited CV analyses',
      'Unlimited cover letters',
      'Full ATS audit & optimization',
      'AI quick edits',
      'Priority AI processing',
      'Full CV history & analytics',
      'Unlimited job tracker',
    ],
  },
  pro_voice: {
    name: 'Pro+',
    bg: '/aivent/misc/l5.webp',
    ticketClass: 's3',
    monthly: 39,
    quarterly: 99,
    yearly: 299,
    features: [
      'Everything in Pro',
      'Voice Mock Interview — 8 sessions / month',
      'Voice feedback report',
      'Interview prep library',
      'LinkedIn-ready CV export',
      'Priority AI processing',
    ],
  },
};

interface Discount {
  source: 'promo';
  type: 'percent' | 'fixed';
  amount: number;
  label: string;
  promoId?: string;
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutForm />
    </Suspense>
  );
}

function CheckoutForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { fetchSubscription } = useSubscriptionStore();

  const planKey = searchParams.get('plan') || 'pro';
  const intervalParam = (searchParams.get('interval') as 'month' | 'quarter' | 'year' | 'once') || 'month';

  const [interval, setInterval] = useState<'month' | 'quarter' | 'year' | 'once'>(intervalParam);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'crypto'>('card');

  // Discount state — promo is user-entered (not cached).
  const [promoInput, setPromoInput] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [discount, setDiscount] = useState<Discount | null>(null);

  const plan = PLANS[planKey];
  const isOneTime = plan?.oneTimeOnly === true;

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // Force one-time plans onto `interval=once`; force subscription plans onto month/year.
  useEffect(() => {
    if (isOneTime && interval !== 'once') setInterval('once');
    if (!isOneTime && interval === 'once') setInterval('month');
  }, [isOneTime, interval]);

  if (!plan) {
    router.push('/pricing');
    return null;
  }

  // Quarterly falls back to 3× monthly if a plan didn't define its own price,
  // matching the pricing page's behavior so the math stays consistent.
  const quarterlyPrice = plan.quarterly ?? plan.monthly * 3;
  const price = isOneTime
    ? plan.oneTime ?? plan.monthly
    : interval === 'month'
      ? plan.monthly
      : interval === 'quarter'
        ? quarterlyPrice
        : plan.yearly;
  const period = isOneTime
    ? 'One-time'
    : interval === 'month'
      ? 'Monthly'
      : interval === 'quarter'
        ? '3 Months'
        : 'Yearly';
  const perMonth = !isOneTime
    ? interval === 'year'
      ? (plan.yearly / 12).toFixed(2)
      : interval === 'quarter'
        ? (quarterlyPrice / 3).toFixed(2)
        : null
    : null;

  const activeDiscount = discount;

  const discountAmount = activeDiscount
    ? activeDiscount.type === 'percent'
      ? price * (activeDiscount.amount / 100)
      : Math.min(activeDiscount.amount, price)
    : 0;
  const finalPrice = Math.max(price - discountAmount, 0);

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    setPromoError('');
    try {
      const res = await validatePromoCode(promoInput.trim());
      const p = res.data.promo;
      setDiscount({
        source: 'promo',
        type: p.discount_type,
        amount: p.discount_amount,
        label: `${p.code}: ${p.discount_type === 'percent' ? p.discount_amount + '% off' : '$' + p.discount_amount + ' off'}`,
        promoId: p.id,
      });
      toast.success('Promo code applied!');
    } catch (err: any) {
      setPromoError(err.response?.data?.error || 'Invalid promo code');
      setDiscount(null);
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setDiscount(null);
    setPromoInput('');
    setPromoError('');
  };

  const [stripeNotReady] = useState(false); // legacy gate — kept false; real errors now surface as toasts

  // Crypto in-app payment state (USDT TRC-20 via NOWPayments). When the
  // user clicks Buy Now with USDT selected, we don't redirect — we render
  // the deposit address + QR + amount inline and poll status until the
  // on-chain payment confirms.
  const [cryptoPayment, setCryptoPayment] = useState<CryptoPayment | null>(null);
  const [cryptoStatus, setCryptoStatus] = useState<string>('waiting');
  const [cryptoCopied, setCryptoCopied] = useState(false);

  // Poll NOWPayments status every 5 seconds while a crypto payment is
  // pending. Stops when the payment finishes (and redirects to success)
  // or the component unmounts.
  useEffect(() => {
    if (!cryptoPayment) return;
    const TERMINAL = ['finished', 'confirmed', 'failed', 'expired', 'refunded'];
    let stopped = false;

    const tick = async () => {
      if (stopped) return;
      try {
        const r = await getNowpaymentsStatus(cryptoPayment.payment_id);
        if (stopped) return;
        const status = r.data.status;
        setCryptoStatus(status);
        if (status === 'finished' || status === 'confirmed') {
          stopped = true;
          // Subscription is now active — refetch and redirect.
          await fetchSubscription();
          router.push('/checkout/success?provider=nowpayments');
          return;
        }
        if (TERMINAL.includes(status)) {
          stopped = true;
        }
      } catch {
        // Transient — keep polling. Real config errors surface from
        // createCheckoutSession before we ever set cryptoPayment.
      }
    };

    tick();
    // window.setInterval to avoid collision with the `setInterval`
    // useState setter declared above (billing interval).
    const id = window.setInterval(tick, 5000);
    return () => { stopped = true; window.clearInterval(id); };
  }, [cryptoPayment, fetchSubscription, router]);

  const handleBuyNow = async () => {
    setLoading(true);
    try {
      const provider = paymentMethod === 'crypto' ? 'nowpayments' : 'lemonsqueezy';
      const res = await createCheckoutSession(planKey, interval, paymentMethod, provider);
      // Card path → redirect to LS hosted checkout.
      // Crypto path → render inline (no redirect).
      if (res.data.provider === 'nowpayments' && res.data.payment) {
        setCryptoPayment(res.data.payment);
        setCryptoStatus('waiting');
        setLoading(false);
        return;
      }
      if (res.data.url) {
        window.location.href = res.data.url;
        return;
      }
      throw new Error('Empty checkout response');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to start checkout';
      toast.error(msg);
      setLoading(false);
    }
  };

  const handleCopyAddress = () => {
    if (!cryptoPayment) return;
    navigator.clipboard.writeText(cryptoPayment.pay_address);
    setCryptoCopied(true);
    setTimeout(() => setCryptoCopied(false), 2000);
  };

  const handleCancelCrypto = () => {
    setCryptoPayment(null);
    setCryptoStatus('waiting');
  };

  return (
    <div className="max-w-6xl mx-auto">

      {/* Header */}
      <div className="mb-10">
        <span className="aivent-subtitle s2">Checkout</span>
        <h2 className="text-white tracking-tight" style={{ fontSize: 'clamp(32px,4vw,48px)', fontWeight: 800 }}>
          Complete Your Order
        </h2>
      </div>

      {/* ── Main layout: 2 + 1 grid like tickets.html ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">

        {/* ── LEFT: Ticket card ── */}
        <div className="lg:col-span-2">

          {/* d-ticket card — from tickets-2.html */}
          <div className={`d-ticket ${plan.ticketClass}`}>
            <img src="/aivent/logo.png" className="mb-4" style={{ width: '80px' }} alt="" />
            <h2 className="text-white">{plan.name}</h2>
            <h4 className="text-white/80 mb-4" style={{ fontWeight: 600 }}>
              <span className="text-white" style={{ fontSize: '2.25rem', fontWeight: 800 }}>
                ${price.toFixed(2)}
              </span>
              <span className="text-white/50 ml-2" style={{ fontSize: '1rem', fontWeight: 400 }}>
                {isOneTime ? 'one-time' : interval === 'month' ? '/mo' : interval === 'quarter' ? '/3mo' : '/yr'}
              </span>
            </h4>
            {perMonth && (
              <div className="text-sm" style={{ color: '#34d399', fontWeight: 500 }}>
                ${perMonth}/mo billed {interval === 'year' ? 'yearly' : 'every 3 months'}
              </div>
            )}
            {isOneTime && (
              <div className="text-sm" style={{ color: '#34d399', fontWeight: 500 }}>
                7-day access — no auto-renew
              </div>
            )}
          </div>

          {/* Features below the ticket */}
          <div className="relative overflow-hidden">
            <div className="pt-10 pb-6">
              <h4 className="text-white mb-4" style={{ fontWeight: 700 }}>Benefits:</h4>
              <div className="border-white-bottom-op-2 mb-4" />
              <ul className="ul-check mb-4">
                {plan.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Billing interval toggle — hidden for one-time plans */}
          {!isOneTime && (
            <div className="mt-2 mb-6">
              <h4 className="text-white mb-4" style={{ fontWeight: 700 }}>Billing Period:</h4>
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => setInterval('month')}
                  className={`btn-aivent fx-slide ${interval === 'month' ? '' : 'btn-line'}`}
                  data-hover="MONTHLY"
                  style={{ minWidth: '130px' }}
                >
                  <span>Monthly</span>
                </button>
                <button
                  onClick={() => setInterval('quarter')}
                  className={`btn-aivent fx-slide ${interval === 'quarter' ? '' : 'btn-line'}`}
                  data-hover="3 MONTHS"
                  style={{ minWidth: '130px' }}
                >
                  <span>3 Months</span>
                </button>
                <button
                  onClick={() => setInterval('year')}
                  className={`btn-aivent fx-slide ${interval === 'year' ? '' : 'btn-line'}`}
                  data-hover="YEARLY"
                  style={{ minWidth: '130px' }}
                >
                  <span>Yearly</span>
                </button>
              </div>
            </div>
          )}

          {/* Payment method selector */}
          <div className="mb-4">
            <h4 className="text-white mb-4" style={{ fontWeight: 700 }}>Payment Method:</h4>
            <div className="grid grid-cols-2 gap-3">
              {([
                { key: 'card' as const, label: 'Card', sub: 'Visa, Mastercard, Amex, PayPal', color: 'oklch(0.59 0.245 291)', colorLight: 'oklch(0.72 0.19 291)', bg: 'rgba(118,77,240,0.12)', icon: 'card' },
                { key: 'crypto' as const, label: 'USDT', sub: 'Tether stablecoin', color: '#26a17b', colorLight: '#50d9a3', bg: 'rgba(38,161,123,0.12)', icon: 'crypto' },
              ]).map((m) => (
                <button
                  key={m.key}
                  onClick={() => setPaymentMethod(m.key)}
                  className="relative rounded-xl p-4 text-center transition-all"
                  style={{
                    background: paymentMethod === m.key ? m.bg : 'rgba(255,255,255,0.02)',
                    border: paymentMethod === m.key ? `2px solid ${m.color}` : '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {paymentMethod === m.key && (
                    <div className="absolute top-2 right-2">
                      <Check className="h-4 w-4" style={{ color: m.colorLight }} />
                    </div>
                  )}
                  {m.icon === 'card' ? (
                    <CreditCard className="h-6 w-6 mx-auto mb-2" style={{ color: paymentMethod === m.key ? m.colorLight : 'rgba(255,255,255,0.4)' }} />
                  ) : (
                    <svg className="h-6 w-6 mx-auto mb-2" viewBox="0 0 32 32" fill="none">
                      <circle cx="16" cy="16" r="16" fill={paymentMethod === m.key ? m.colorLight : 'rgba(255,255,255,0.4)'}/>
                      <path d="M17.922 17.383v-.002c-.11.008-.677.042-1.942.042-1.01 0-1.721-.03-1.971-.042v.003c-3.888-.171-6.79-.848-6.79-1.658 0-.809 2.902-1.486 6.79-1.66v2.644c.254.018.982.061 1.988.061 1.207 0 1.812-.05 1.925-.06v-2.643c3.88.173 6.775.85 6.775 1.658 0 .81-2.895 1.485-6.775 1.657m0-3.59v-2.366h5.414V7.819H8.595v3.608h5.414v2.365c-4.4.202-7.709 1.074-7.709 2.118 0 1.044 3.309 1.915 7.709 2.118v7.582h3.913v-7.584c4.393-.202 7.694-1.073 7.694-2.116 0-1.043-3.301-1.914-7.694-2.117" fill="#fff"/>
                    </svg>
                  )}
                  <p className="text-sm font-semibold" style={{ color: paymentMethod === m.key ? '#fff' : 'rgba(255,255,255,0.5)' }}>{m.label}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{m.sub}</p>
                </button>
              ))}
            </div>

            {/* Apple Pay / Google Pay note */}
            <div className="flex items-center gap-3 mt-3 px-1">
              <Smartphone className="h-4 w-4 shrink-0" style={{ color: 'rgba(255,255,255,0.25)' }} />
              <p className="text-[11px] text-white/30" style={{ fontWeight: 400 }}>
                After you click Buy Now you’ll be redirected to the secure checkout page. Apple Pay, Google Pay, PayPal, and regional methods are offered there as available.
              </p>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Cart sidebar (from tickets.html) ── */}
        <div className="lg:col-span-1">
          <h3 className="text-white mb-4" style={{ fontSize: '26px', fontWeight: 800 }}>Order Summary</h3>

          {/* Cart line item */}
          <div className="flex items-center py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex-1">
              <h5 className="text-white mb-0" style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                {plan.name} <span className="id-color">(x1)</span>
              </h5>
              <span className="text-white op-8 mr-4" style={{ fontSize: '0.875rem' }}>
                ${price.toFixed(2)}
              </span>
              <span className="text-white op-5" style={{ fontSize: '0.875rem' }}>
                {period}
              </span>
            </div>
            <div className="text-right">
              <p className="text-white font-bold mb-0" style={{ fontSize: '1rem' }}>
                ${price.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Multi-month savings row */}
          {interval === 'year' && (
            <div className="flex items-center py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex-1">
                <span className="text-sm" style={{ color: '#34d399', fontWeight: 600 }}>
                  Annual savings
                </span>
              </div>
              <div className="text-right">
                <p className="mb-0 text-sm" style={{ color: '#34d399', fontWeight: 700 }}>
                  -${(plan.monthly * 12 - plan.yearly).toFixed(2)}
                </p>
              </div>
            </div>
          )}
          {interval === 'quarter' && plan.quarterly && (
            <div className="flex items-center py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex-1">
                <span className="text-sm" style={{ color: '#34d399', fontWeight: 600 }}>
                  3-month savings
                </span>
              </div>
              <div className="text-right">
                <p className="mb-0 text-sm" style={{ color: '#34d399', fontWeight: 700 }}>
                  -${(plan.monthly * 3 - plan.quarterly).toFixed(2)}
                </p>
              </div>
            </div>
          )}

          {/* Promo discount — if applied */}
          {discount && (
            <div className="flex items-center py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex-1">
                <span className="text-sm" style={{ color: '#34d399', fontWeight: 600 }}>
                  {discount.label}
                </span>
              </div>
              <div className="text-right flex items-center gap-2">
                <p className="mb-0 text-sm" style={{ color: '#34d399', fontWeight: 700 }}>
                  -${discountAmount.toFixed(2)}
                </p>
                <button onClick={handleRemovePromo} className="text-white op-5 hover:opacity-80">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Promo code input — styled to match AIvent form inputs */}
          <div className="py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Tag className="h-4 w-4 text-white op-5" />
              <span className="text-sm text-white" style={{ fontWeight: 600 }}>Promo Code</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={promoInput}
                onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyPromo()}
                placeholder="Enter code"
                disabled={!!discount}
                className="flex-1 h-10 rounded-lg px-3 text-sm text-white placeholder:text-white/25"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: promoError ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.1)',
                  outline: 'none',
                }}
              />
              {discount ? (
                <button
                  onClick={handleRemovePromo}
                  className="h-10 px-4 rounded-lg text-sm font-semibold transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  Remove
                </button>
              ) : (
                <button
                  onClick={handleApplyPromo}
                  disabled={promoLoading || !promoInput.trim()}
                  className="btn-aivent fx-slide"
                  data-hover="APPLY"
                  style={{ minWidth: '80px', height: '40px', fontSize: '0.8rem' }}
                >
                  <span>{promoLoading ? '...' : 'Apply'}</span>
                </button>
              )}
            </div>
            {promoError && (
              <p className="text-xs mt-1.5" style={{ color: '#f87171', fontWeight: 500 }}>{promoError}</p>
            )}
            {discount && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <Check className="h-3.5 w-3.5" style={{ color: '#34d399' }} />
                <p className="text-xs mb-0" style={{ color: '#34d399', fontWeight: 500 }}>{discount.label}</p>
              </div>
            )}
          </div>

          {/* Total row */}
          <div className="flex items-center py-4">
            <div className="flex-1">
              <h3 className="text-white mb-0" style={{ fontSize: '1.5rem', fontWeight: 800 }}>Total</h3>
            </div>
            <div className="text-right">
              {discountAmount > 0 && (
                <span className="text-white op-5 line-through mr-2" style={{ fontSize: '0.9rem' }}>
                  ${price.toFixed(2)}
                </span>
              )}
              <h3 className="text-white mb-0 inline" style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                ${finalPrice.toFixed(2)}
              </h3>
              <br />
              <span className="text-white op-5" style={{ fontSize: '0.75rem' }}>
                {isOneTime ? 'one-time' : interval === 'month' ? '/month' : interval === 'quarter' ? '/3 months' : '/year'}
              </span>
            </div>
          </div>

          {/* Buy Now — from tickets.html: a.btn-main.fx-slide.w-100 */}
          <button
            onClick={handleBuyNow}
            disabled={loading}
            className="btn-aivent fx-slide w-full text-center block"
            data-hover="PROCEED TO PAYMENT"
            style={{ marginTop: '8px' }}
          >
            <span>
              {loading ? 'Redirecting to checkout...' : 'Buy Now'}
            </span>
          </button>

          {/* ── Secure-checkout trust row: payment method badges ── */}
          <div className="mt-5">
            <div className="flex items-center justify-center gap-1.5 mb-3">
              <Lock className="h-3 w-3" style={{ color: 'rgba(255,255,255,0.4)' }} />
              <p
                className="mb-0"
                style={{
                  fontSize: '10px',
                  color: 'rgba(255,255,255,0.5)',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                }}
              >
                Secure Checkout
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {/* Visa */}
              <div
                className="flex items-center justify-center rounded-md"
                title="Visa"
                style={{
                  width: 42,
                  height: 26,
                  background: '#fff',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.25)',
                }}
              >
                <svg viewBox="0 0 64 24" width="32" height="14" aria-label="Visa">
                  <path
                    fill="#1A1F71"
                    d="M27.4 1.2 21.6 23h-5.4l5.8-21.8h5.4Zm22.7 14 2.9-7.9 1.7 7.9h-4.6Zm6.1 6.8h5L57 1.2h-4.6c-1 0-1.9.6-2.3 1.6L41.9 23h5.4l1.1-3h6.6l.6 3ZM43 15.7c0-5.2-7.2-5.5-7.2-7.8 0-.7.7-1.5 2.2-1.7.7-.1 2.7-.2 5 .9l.9-4.2c-1.2-.4-2.7-.8-4.7-.8-5 0-8.5 2.7-8.5 6.5 0 2.8 2.5 4.4 4.5 5.4 2 1 2.7 1.6 2.7 2.4 0 1.3-1.6 1.9-3 1.9-2.5 0-4-.7-5.2-1.2l-.9 4.3c1.2.5 3.4 1 5.7 1 5.3 0 8.7-2.6 8.7-6.7M19.9 1.2 11.6 23H6.2L2.1 7.3C1.8 6.4 1.6 6 .9 5.6-.3 5-2.2 4.4-4 4l.1-.5h8.7c1.1 0 2.1.7 2.4 2l2.2 11.6L14.4 1.2h5.5Z"
                    transform="translate(4 0)"
                  />
                </svg>
              </div>

              {/* Mastercard */}
              <div
                className="flex items-center justify-center rounded-md"
                title="Mastercard"
                style={{
                  width: 42,
                  height: 26,
                  background: '#fff',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.25)',
                }}
              >
                <svg viewBox="0 0 32 20" width="32" height="20" aria-label="Mastercard">
                  <circle cx="12" cy="10" r="6.5" fill="#EB001B" />
                  <circle cx="20" cy="10" r="6.5" fill="#F79E1B" />
                  <path
                    fill="#FF5F00"
                    d="M16 5.2a6.5 6.5 0 0 1 0 9.6 6.5 6.5 0 0 1 0-9.6Z"
                  />
                </svg>
              </div>

              {/* Amex */}
              <div
                className="flex items-center justify-center rounded-md"
                title="American Express"
                style={{
                  width: 42,
                  height: 26,
                  background: '#1F72CD',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.25)',
                }}
              >
                <span
                  style={{
                    color: '#fff',
                    fontSize: 8,
                    fontWeight: 800,
                    letterSpacing: '0.05em',
                    fontFamily: 'system-ui, sans-serif',
                    lineHeight: 1,
                    textAlign: 'center',
                  }}
                >
                  AMERICAN<br />EXPRESS
                </span>
              </div>

              {/* Apple Pay */}
              <div
                className="flex items-center justify-center rounded-md"
                title="Apple Pay"
                style={{
                  width: 42,
                  height: 26,
                  background: '#000',
                  border: '1px solid rgba(255,255,255,0.15)',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.25)',
                }}
              >
                <svg viewBox="0 0 38 16" width="32" height="14" aria-label="Apple Pay">
                  <path
                    fill="#fff"
                    d="M6.4 2.4c-.4.5-1.1.9-1.7.8-.1-.7.2-1.4.6-1.8.4-.5 1.1-.8 1.7-.9.1.7-.2 1.4-.6 1.9Zm.6.9c-.9-.1-1.7.5-2.2.5s-1.1-.5-1.9-.5C2 3.4 1 4 .5 5c-1 1.7-.3 4.3.7 5.7.5.7 1 1.5 1.8 1.4.7 0 1-.5 1.9-.5s1.1.5 1.9.5 1.3-.7 1.7-1.4c.5-.8.7-1.6.8-1.6 0 0-1.5-.6-1.5-2.3 0-1.4 1.2-2.1 1.2-2.1-.6-1-1.7-1.1-2-1.1Zm6.1-2.4v11.2h1.7V8.3h2.4c2.2 0 3.7-1.5 3.7-3.7s-1.5-3.7-3.7-3.7h-4.1Zm1.7 1.5h2c1.5 0 2.4.8 2.4 2.2s-.9 2.2-2.4 2.2h-2V2.4Zm9.1 9.8c1.1 0 2.1-.5 2.6-1.4h0v1.3h1.6v-5.5c0-1.6-1.3-2.7-3.3-2.7s-3.3 1.1-3.4 2.6h1.5c.1-.7.7-1.2 1.8-1.2s1.7.5 1.7 1.4v.6l-2.2.1c-2 .1-3.1 1-3.1 2.4 0 1.5 1.1 2.4 2.8 2.4Zm.5-1.3c-.9 0-1.6-.5-1.6-1.2s.6-1.1 1.7-1.2l2-.1v.6c0 1.1-.9 1.9-2.1 1.9Zm5.1 4c1.7 0 2.5-.6 3.2-2.6L36.5 5h-1.7L33 9.4 31.3 5h-1.7l2.5 7-.1.4c-.2.7-.6 1-1.3 1l-1.3-.1v1.3l1.1.1Z"
                  />
                </svg>
              </div>

              {/* Google Pay */}
              <div
                className="flex items-center justify-center rounded-md"
                title="Google Pay"
                style={{
                  width: 42,
                  height: 26,
                  background: '#fff',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.25)',
                }}
              >
                <svg viewBox="0 0 40 16" width="32" height="14" aria-label="Google Pay">
                  <path fill="#5F6368" d="M18.9 7.7v3.3h-1V2.9h2.8c.7 0 1.3.2 1.8.7s.7 1 .7 1.7-.2 1.2-.7 1.7-1.1.7-1.8.7h-1.8Zm0-3.8v2.8h1.8c.4 0 .8-.1 1.1-.4.3-.3.4-.6.4-1s-.1-.7-.4-1c-.3-.3-.6-.4-1.1-.4h-1.8Zm6.9 1.2c.7 0 1.3.2 1.8.6s.7.9.7 1.6V11h-1V10.2h0c-.4.6-1 1-1.7 1s-1.2-.2-1.6-.6c-.4-.4-.7-.8-.7-1.4 0-.6.2-1 .6-1.4s1-.5 1.7-.5c.6 0 1.1.1 1.5.3v-.2c0-.4-.1-.7-.4-1s-.7-.4-1.1-.4c-.6 0-1.1.3-1.5.8l-.9-.6c.6-.7 1.4-1.1 2.6-1.1Zm-1.4 4.2c0 .3.1.5.4.7s.5.3.9.3c.5 0 .9-.2 1.3-.5s.6-.8.6-1.3c-.3-.3-.8-.4-1.4-.4-.4 0-.8.1-1.2.3s-.6.5-.6.9Zm9.2-3.9-3.4 7.9h-1l1.3-2.8-2.3-5.1h1.1l1.6 4 1.6-4h1.1Z"/>
                  <path fill="#4285F4" d="M14.3 7.1c0-.3 0-.6-.1-.9H10v1.7h2.4c-.1.6-.4 1-.9 1.4v1.1h1.4c.9-.8 1.4-2 1.4-3.3Z"/>
                  <path fill="#34A853" d="M10 11.5c1.2 0 2.2-.4 2.9-1.1l-1.4-1.1c-.4.3-.9.4-1.5.4-1.2 0-2.1-.8-2.5-1.8H6v1.1c.7 1.5 2.3 2.5 4 2.5Z"/>
                  <path fill="#FBBC04" d="M7.5 7.9c-.1-.3-.2-.6-.2-.9s.1-.6.2-.9V5h-1.5C5.7 5.6 5.5 6.3 5.5 7s.2 1.4.5 2l1.5-1.1Z"/>
                  <path fill="#EA4335" d="M10 4.2c.7 0 1.3.2 1.8.7l1.3-1.3C12.2 2.9 11.2 2.5 10 2.5c-1.7 0-3.3 1-4 2.5l1.5 1.1c.4-1 1.3-1.9 2.5-1.9Z"/>
                </svg>
              </div>

              {/* PayPal */}
              <div
                className="flex items-center justify-center rounded-md"
                title="PayPal"
                style={{
                  width: 42,
                  height: 26,
                  background: '#fff',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.25)',
                }}
              >
                <svg viewBox="0 0 40 16" width="32" height="14" aria-label="PayPal">
                  <path fill="#003087" d="M9.6 3.1H6.2c-.2 0-.4.2-.5.4L4.4 12.2c0 .2.1.3.3.3h1.6c.2 0 .4-.2.5-.4l.4-2.4c0-.2.2-.4.5-.4h1.1c2.2 0 3.5-1.1 3.9-3.2.1-.9 0-1.7-.4-2.2-.5-.5-1.4-.8-2.7-.8Zm.4 3.2c-.2 1.3-1.1 1.3-2.1 1.3h-.5l.4-2.3c0-.1.1-.2.3-.2h.2c.6 0 1.2 0 1.5.4.2.1.2.4.2.8Zm9.7-.1H18.1c-.1 0-.3.1-.3.2l-.1.4-.1-.2c-.4-.5-1.1-.7-1.9-.7-1.8 0-3.3 1.4-3.6 3.3-.2 1 .1 1.9.6 2.5.5.6 1.3.8 2.2.8 1.4 0 2.2-.9 2.2-.9l-.1.4c0 .2.1.3.3.3h1.5c.2 0 .4-.2.5-.4l.9-5.4c0-.2-.1-.3-.3-.3Zm-2.2 3.2c-.2.9-.9 1.5-1.8 1.5-.5 0-.9-.1-1.1-.4-.2-.3-.3-.7-.2-1.1.1-.9.9-1.5 1.8-1.5.4 0 .8.1 1.1.4.2.3.3.7.2 1.1Z"/>
                  <path fill="#009CDE" d="M28.7 6.2H27.1c-.2 0-.3.1-.4.2l-2.2 3.2-.9-3.1c-.1-.2-.2-.3-.4-.3h-1.6c-.2 0-.3.2-.3.4l1.7 5-1.6 2.3c-.1.2 0 .4.2.4h1.6c.2 0 .3-.1.4-.2l5.3-7.6c.1-.1 0-.3-.2-.3Zm5.4-3.1h-3.4c-.2 0-.4.2-.5.4L28.8 12.2c0 .2.1.3.3.3h1.7c.2 0 .3-.1.3-.3l.4-2.5c0-.2.2-.4.5-.4h1.1c2.2 0 3.5-1.1 3.9-3.2.1-.9 0-1.7-.4-2.2-.6-.5-1.5-.8-2.7-.8Zm.4 3.2c-.2 1.3-1.1 1.3-2.1 1.3H32l.4-2.3c0-.1.1-.2.3-.2h.2c.6 0 1.2 0 1.5.4.2.1.2.4.2.8Z"/>
                </svg>
              </div>
            </div>

            <p
              className="text-center mt-3 mb-0"
              style={{
                fontSize: '10px',
                color: 'rgba(255,255,255,0.3)',
                fontWeight: 500,
              }}
            >
              256-bit SSL encrypted · Powered by Lemon Squeezy
            </p>
          </div>


          {/* Legacy "payment system being set up" gate removed — real backend
              errors are now surfaced as toasts in handleBuyNow above. */}

          {/* Back link */}
          <div className="text-center mt-4">
            <Link
              href="/pricing"
              className="text-white op-5 text-sm hover:opacity-80 transition-opacity"
            >
              &larr; Back to Pricing
            </Link>
          </div>

          {/* Security note */}
          <div className="mt-6 text-center">
            <p className="text-white op-5" style={{ fontSize: '0.75rem' }}>
              Secure payment. Cancel anytime.
            </p>
          </div>
        </div>
      </div>

      {/* ───── USDT payment modal ─────
          Centered overlay rendered after the user clicks Buy Now with
          USDT selected. The address + amount + QR come from NOWPayments
          (unique per order). We poll status every 5s so the page
          auto-closes and redirects to /checkout/success the moment the
          on-chain payment confirms. */}
      {cryptoPayment && (
        <CryptoPaymentModal
          payment={cryptoPayment}
          status={cryptoStatus}
          copied={cryptoCopied}
          onCopy={handleCopyAddress}
          onClose={handleCancelCrypto}
        />
      )}
    </div>
  );
}

// ── Crypto payment modal ────────────────────────────────────────────────
// Centered, backdrop-blurred dialog with QR + address + live status.
// Closes on Escape or backdrop click. Status pill colour mirrors the
// state machine: green for waiting/finished, amber for partial, red for
// failed/expired.

function CryptoPaymentModal({
  payment,
  status,
  copied,
  onCopy,
  onClose,
}: {
  payment: CryptoPayment;
  status: string;
  copied: boolean;
  onCopy: () => void;
  onClose: () => void;
}) {
  // Esc-to-close.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const isWaiting = status === 'waiting' || status === 'confirming';
  const isDone = status === 'finished' || status === 'confirmed';
  const isError = status === 'failed' || status === 'expired' || status === 'refunded';
  const isPartial = status === 'partially_paid';

  const statusColor = isError ? '#f87171' : isPartial ? '#fbbf24' : '#26a17b';
  const statusBg = isError ? 'rgba(248,113,113,0.12)' : isPartial ? 'rgba(251,191,36,0.12)' : 'rgba(38,161,123,0.12)';

  const statusText =
    status === 'waiting' ? 'Waiting for your payment' :
    status === 'confirming' ? 'Payment detected — confirming on-chain' :
    status === 'partially_paid' ? 'Partial payment received — please send the remainder' :
    status === 'finished' ? 'Payment received! Activating your plan…' :
    status === 'confirmed' ? 'Payment confirmed! Activating your plan…' :
    status === 'failed' ? 'Payment failed. Please try again' :
    status === 'expired' ? 'Payment window expired. Please retry' :
    status === 'refunded' ? 'Payment was refunded' :
    'Processing…';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      style={{
        background: 'rgba(8,11,32,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[460px] rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        style={{
          background: 'linear-gradient(180deg, #131634 0%, #0f1230 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 24px 80px -20px rgba(0,0,0,0.7), 0 0 0 1px rgba(38,161,123,0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 h-8 w-8 rounded-full flex items-center justify-center transition-all"
          style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="inline-flex items-center justify-center h-7 w-7 rounded-full text-[11px] font-black"
              style={{ background: '#26a17b', color: '#fff' }}
            >
              ₮
            </span>
            <h3 className="text-white text-lg font-bold">Pay with USDT</h3>
          </div>
          <p className="text-white/45 text-xs">
            Send exactly the amount below on the TRC-20 network.
          </p>
        </div>

        {/* QR */}
        <div className="px-6">
          <div className="flex justify-center">
            <div
              className="rounded-xl p-4"
              style={{ background: '#fff', boxShadow: '0 8px 24px -8px rgba(0,0,0,0.5)' }}
            >
              <QRCodeSVG value={payment.pay_address} size={200} level="M" />
            </div>
          </div>
        </div>

        {/* Amount */}
        <div className="px-6 pt-5">
          <div
            className="rounded-xl p-4 flex items-center justify-between"
            style={{ background: 'rgba(38,161,123,0.06)', border: '1px solid rgba(38,161,123,0.18)' }}
          >
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-1">Amount</label>
              <p className="text-2xl font-black text-white leading-none">
                {payment.pay_amount}
                <span className="text-sm font-semibold ml-1.5" style={{ color: '#26a17b' }}>USDT</span>
              </p>
              <p className="text-[11px] text-white/35 mt-1">
                ≈ ${payment.price_amount} {payment.price_currency.toUpperCase()}
              </p>
            </div>
            <div className="text-right">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-1">Network</label>
              <p className="text-sm text-white font-semibold">TRC-20</p>
              <p className="text-[11px] text-white/35 mt-0.5">Tron</p>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="px-6 pt-3">
          <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-1.5">Wallet Address</label>
          <div className="flex items-center gap-2">
            <div
              className="flex-1 h-11 flex items-center rounded-lg px-3 text-xs text-white/75 font-mono truncate"
              style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {payment.pay_address}
            </div>
            <button
              onClick={onCopy}
              className="h-11 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shrink-0"
              style={{
                background: copied ? 'rgba(38,161,123,0.2)' : '#26a17b',
                color: copied ? '#26a17b' : '#fff',
                border: copied ? '1px solid rgba(38,161,123,0.4)' : '1px solid #26a17b',
              }}
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Status pill */}
        <div className="px-6 pt-5 pb-6">
          <div
            className="rounded-xl px-4 py-3 flex items-center gap-3"
            style={{ background: statusBg, border: `1px solid ${statusColor}33` }}
          >
            {isWaiting && (
              <Loader2 className="h-4 w-4 animate-spin shrink-0" style={{ color: statusColor }} />
            )}
            {isDone && (
              <Check className="h-4 w-4 shrink-0" style={{ color: statusColor }} />
            )}
            {(isError || isPartial) && (
              <X className="h-4 w-4 shrink-0" style={{ color: statusColor }} />
            )}
            <p className="text-sm font-semibold" style={{ color: statusColor }}>
              {statusText}
            </p>
          </div>
        </div>

        {/* Footer instructions */}
        <div
          className="px-6 py-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.15)' }}
        >
          <p className="text-[11px] text-white/40 leading-relaxed">
            Open your wallet (Binance, Trust Wallet, MetaMask…), pick <span className="text-white/65 font-semibold">USDT TRC-20</span>, scan the QR or paste the address, and send <span className="text-white/65 font-semibold">{payment.pay_amount} USDT</span>. Your plan activates automatically the moment the payment confirms.
          </p>
        </div>
      </div>
    </div>
  );
}
