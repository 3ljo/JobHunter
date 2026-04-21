'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useCheckoutConfigStore } from '@/store/checkoutConfigStore';
import { createCheckoutSession, validatePromoCode } from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Tag, Check, X, CreditCard, Smartphone } from 'lucide-react';

/* ── Plan data (mirrors pricing page) ── */
const PLANS: Record<string, {
  name: string;
  bg: string;
  ticketClass: string;
  monthly: number;
  yearly: number;
  features: string[];
}> = {
  pro: {
    name: 'Pro',
    bg: '/aivent/misc/l4.webp',
    ticketClass: 's2',
    monthly: 9.99,
    yearly: 99.99,
    features: [
      '25 CV analyses per day',
      'Unlimited cover letters',
      'Full ATS audit & optimization',
      'AI quick edits',
      'Priority AI processing',
      'Full CV history & analytics',
    ],
  },
  pro_plus: {
    name: 'Pro+',
    bg: '/aivent/misc/l5.webp',
    ticketClass: 's3',
    monthly: 14.99,
    yearly: 149.99,
    features: [
      'Unlimited CV analyses',
      'Unlimited cover letters',
      'Full ATS audit & optimization',
      'AI quick edits',
      'Job application tracker',
      'Priority AI processing',
      'Full CV history & analytics',
      'Advanced voice matching',
    ],
  },
};

interface Discount {
  source: 'promo' | 'referral';
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
  const {
    usdtConfig,
    referralDiscount: storedReferralDiscount,
    load: loadCheckoutConfig,
  } = useCheckoutConfigStore();

  const planKey = searchParams.get('plan') || 'pro';
  const intervalParam = searchParams.get('interval') as 'month' | 'year' || 'month';

  const [interval, setInterval] = useState<'month' | 'year'>(intervalParam);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'crypto'>('card');
  const [usdtCopied, setUsdtCopied] = useState(false);

  // Discount state — promo is user-entered (not cached); referral comes from the store.
  const [promoInput, setPromoInput] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [discount, setDiscount] = useState<Discount | null>(null);

  const referralDiscount: Discount | null = storedReferralDiscount
    ? { source: 'referral', ...storedReferralDiscount }
    : null;
  const usdtWallet = usdtConfig?.wallet ?? '';
  const usdtNetwork = usdtConfig?.network ?? 'TRC-20';

  const plan = PLANS[planKey];

  useEffect(() => {
    fetchSubscription();
    loadCheckoutConfig();
  }, [fetchSubscription, loadCheckoutConfig]);

  if (!plan) {
    router.push('/pricing');
    return null;
  }

  const price = interval === 'month' ? plan.monthly : plan.yearly;
  const period = interval === 'month' ? 'Monthly' : 'Yearly';
  const perMonth = interval === 'year' ? (plan.yearly / 12).toFixed(2) : null;

  // Determine active discount — pick whichever is higher (no stacking)
  const activeDiscount = (() => {
    if (!discount && !referralDiscount) return null;
    if (discount && !referralDiscount) return discount;
    if (!discount && referralDiscount) return referralDiscount;
    // Both exist — pick higher
    const promoSaving = discount!.type === 'percent' ? price * (discount!.amount / 100) : discount!.amount;
    const refSaving = referralDiscount!.type === 'percent' ? price * (referralDiscount!.amount / 100) : referralDiscount!.amount;
    return promoSaving >= refSaving ? discount : referralDiscount;
  })();

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

  const [showUsdtPayment, setShowUsdtPayment] = useState(false);

  const handleBuyNow = async () => {
    if (paymentMethod === 'crypto') {
      setShowUsdtPayment(true);
      return;
    }
    setShowUsdtPayment(false);
    setLoading(true);
    try {
      const res = await createCheckoutSession(planKey, interval, paymentMethod);
      window.location.href = res.data.url;
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to start checkout';
      toast.error(msg);
      setLoading(false);
    }
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
                /{interval === 'month' ? 'mo' : 'yr'}
              </span>
            </h4>
            {perMonth && (
              <div className="text-sm" style={{ color: '#34d399', fontWeight: 500 }}>
                ${perMonth}/mo billed yearly
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

          {/* Billing interval toggle */}
          <div className="mt-2 mb-6">
            <h4 className="text-white mb-4" style={{ fontWeight: 700 }}>Billing Period:</h4>
            <div className="flex gap-3">
              <button
                onClick={() => setInterval('month')}
                className={`btn-aivent fx-slide ${interval === 'month' ? '' : 'btn-line'}`}
                data-hover="MONTHLY"
                style={{ minWidth: '130px' }}
              >
                <span>Monthly</span>
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

          {/* Payment method selector */}
          <div className="mb-4">
            <h4 className="text-white mb-4" style={{ fontWeight: 700 }}>Payment Method:</h4>
            <div className="grid grid-cols-3 gap-3">
              {([
                { key: 'card' as const, label: 'Card', sub: 'Visa, Mastercard, Amex', color: 'oklch(0.59 0.245 291)', colorLight: 'oklch(0.72 0.19 291)', bg: 'rgba(118,77,240,0.12)', icon: 'card' },
                { key: 'paypal' as const, label: 'PayPal', sub: 'Pay with PayPal', color: '#0070f3', colorLight: '#3b9aff', bg: 'rgba(0,112,243,0.12)', icon: 'paypal' },
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
                  ) : m.icon === 'paypal' ? (
                    <svg className="h-6 w-6 mx-auto mb-2" viewBox="0 0 24 24" fill="none">
                      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.773.773 0 0 1 .763-.648h6.457c2.139 0 3.701.55 4.637 1.633.438.507.716 1.073.85 1.684.14.636.138 1.397-.008 2.319l-.01.055v.484l.378.214a3.09 3.09 0 0 1 .765.578c.41.462.674 1.054.784 1.757.114.722.076 1.583-.11 2.559-.215 1.12-.563 2.096-1.035 2.895a5.71 5.71 0 0 1-1.636 1.81c-.621.454-1.362.793-2.2 1.004-.813.207-1.74.312-2.754.312H11.08a.955.955 0 0 0-.944.808l-.032.174-.532 3.37-.024.127a.955.955 0 0 1-.944.808H7.076Z" fill={paymentMethod === m.key ? m.colorLight : 'rgba(255,255,255,0.4)'}/>
                    </svg>
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
                Apple Pay, Google Pay, PayPal, and other regional methods appear on the secure Lemon Squeezy checkout page after you click Buy Now.
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

          {/* Yearly savings row */}
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

          {/* Referral discount — auto-applied */}
          {referralDiscount && activeDiscount?.source === 'referral' && (
            <div className="flex items-center py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex-1">
                <span className="text-sm" style={{ color: '#34d399', fontWeight: 600 }}>
                  {referralDiscount.label}
                </span>
              </div>
              <div className="text-right">
                <p className="mb-0 text-sm" style={{ color: '#34d399', fontWeight: 700 }}>
                  -${discountAmount.toFixed(2)}
                </p>
              </div>
            </div>
          )}

          {/* Promo discount — if applied and is the active one */}
          {discount && activeDiscount?.source === 'promo' && (
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

          {/* Note when referral beats promo */}
          {discount && referralDiscount && activeDiscount?.source === 'referral' && (
            <p className="text-xs text-white op-5 mt-1 mb-0" style={{ fontWeight: 400 }}>
              Your referral discount is higher — it was applied instead.
            </p>
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
                /{interval === 'month' ? 'month' : 'year'}
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
              {loading ? 'Redirecting to Stripe...' : 'Buy Now'}
            </span>
          </button>

          {/* USDT payment details */}
          {showUsdtPayment && (
            <div
              className="mt-4 rounded-xl p-5"
              style={{ background: 'rgba(38,161,123,0.08)', border: '1px solid rgba(38,161,123,0.25)' }}
            >
              <p className="text-sm font-semibold mb-3" style={{ color: '#26a17b' }}>
                Send USDT to complete your order
              </p>

              <div className="mb-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-1">Amount to send</label>
                <p className="text-xl font-black text-white">{finalPrice.toFixed(2)} <span className="text-sm font-normal text-white/40">USDT</span></p>
              </div>

              <div className="mb-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-1">Network</label>
                <p className="text-sm text-white/70 font-semibold">{usdtNetwork}</p>
              </div>

              <div className="mb-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-1">Wallet Address</label>
                {usdtWallet ? (
                  <div className="flex items-center gap-2">
                    <div
                      className="flex-1 h-10 flex items-center rounded-lg px-3 text-xs text-white/70 font-mono truncate"
                      style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      {usdtWallet}
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(usdtWallet);
                        setUsdtCopied(true);
                        setTimeout(() => setUsdtCopied(false), 2000);
                      }}
                      className="h-10 px-3 rounded-lg text-xs font-semibold transition-all shrink-0"
                      style={{
                        background: usdtCopied ? 'rgba(38,161,123,0.2)' : 'rgba(255,255,255,0.06)',
                        color: usdtCopied ? '#26a17b' : 'rgba(255,255,255,0.5)',
                        border: '1px solid ' + (usdtCopied ? 'rgba(38,161,123,0.3)' : 'rgba(255,255,255,0.1)'),
                      }}
                    >
                      {usdtCopied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-white/30">USDT payments are not configured yet. Please use Card or PayPal.</p>
                )}
              </div>

              <div className="border-white-bottom-op-2 my-3" />

              <p className="text-[11px] text-white/35 leading-relaxed" style={{ fontWeight: 400 }}>
                Send exactly <span className="text-white/60 font-semibold">{finalPrice.toFixed(2)} USDT</span> on the <span className="text-white/60 font-semibold">{usdtNetwork}</span> network.
                Your subscription will be activated within 24 hours once the transaction is verified.
              </p>
            </div>
          )}

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
              Secure payment powered by Lemon Squeezy. Cancel anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
