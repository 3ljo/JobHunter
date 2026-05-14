import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Refund Policy · CvClimber',
  description: 'Refund and cancellation policy for CvClimber subscriptions and one-time passes.',
};

export default function RefundPage() {
  return (
    <div className="min-h-screen text-white" style={{ background: '#0a0d24' }}>
      <section className="relative overflow-hidden" style={{ paddingTop: '120px', paddingBottom: '40px' }}>
        <div className="absolute inset-0" style={{ backgroundImage: 'url(/aivent/background/3.webp)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="absolute inset-0" style={{ background: 'rgba(8,11,32,0.85)' }} />
        <div className="absolute bottom-0 left-0 right-0" style={{ height: '50%', background: 'linear-gradient(0deg,#0a0d24 0%,transparent 100%)' }} />
        <div className="relative mx-auto max-w-4xl px-6" style={{ zIndex: 2 }}>
          <Link href="/" className="inline-flex items-center gap-2 text-white/30 hover:text-white/60 text-xs font-semibold uppercase tracking-widest mb-6 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
          </Link>
          <h1 className="text-white leading-[1.05]" style={{ fontSize: 'clamp(36px,5vw,64px)', fontWeight: 800, letterSpacing: '-0.03em' }}>
            Refund Policy
          </h1>
          <p className="text-white/45 text-sm mt-4">Last updated: May 14, 2026</p>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto max-w-3xl space-y-8 text-white/70 text-base leading-relaxed">

          <div>
            <h2 className="text-white text-2xl font-bold mb-3">All sales are final</h2>
            <p>CvClimber is a digital AI service that grants immediate access on purchase. <strong>We do not offer refunds</strong> on any plan once payment is completed and access has been activated. Please try the <strong>Free plan</strong> first to evaluate the product before buying a paid plan.</p>
            <p className="mt-2">Payments are processed by our Merchant of Record, <strong>Lemon Squeezy</strong>. The exceptions below are the only circumstances in which a refund will be issued.</p>
          </div>

          <div>
            <h2 className="text-white text-2xl font-bold mb-3">1. Free Plan</h2>
            <p>The Free plan involves no payment, so no refund applies. Use it to try the core CV analysis and cover-letter tools before purchasing.</p>
          </div>

          <div>
            <h2 className="text-white text-2xl font-bold mb-3">2. 7-Day Pass ($9, one-time)</h2>
            <p>The 7-Day Pass is a single, one-time purchase with no auto-renewal. It is <strong>non-refundable</strong> once activated. Access ends automatically at the end of the 7-day window with no further charge.</p>
          </div>

          <div>
            <h2 className="text-white text-2xl font-bold mb-3">3. Pro & Pro+ Subscriptions</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Initial charge:</strong> Non-refundable once payment is completed. The Free plan is available to evaluate the product before subscribing.</li>
              <li><strong>Renewal charges:</strong> Non-refundable. You can cancel at any time from your account settings; cancellation stops future renewals and you keep access until the end of the period you already paid for.</li>
              <li><strong>Quarterly and yearly plans:</strong> If you cancel before the end of the paid period, no pro-rata refund is given for the unused time — you keep access until the period ends.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-white text-2xl font-bold mb-3">4. Duplicate or Accidental Charges</h2>
            <p>If you were charged twice for the same plan or believe a charge was made in error, email <a href="mailto:support@cvclimber.lol" className="text-purple-400 hover:text-purple-300 underline">support@cvclimber.lol</a> with the order ID(s). Verified duplicate charges are always refunded in full — this is the one situation where the "all sales are final" rule does not apply.</p>
          </div>

          <div>
            <h2 className="text-white text-2xl font-bold mb-3">5. EU / UK Statutory Rights</h2>
            <p>Where required by EU or UK consumer law, you have a 14-day right of withdrawal for digital services. By starting to use the Service immediately after purchase, you expressly request immediate performance and acknowledge that this right of withdrawal is lost once the service has been provided. If you have not used the Service at all and are within 14 days of the initial purchase, contact <a href="mailto:support@cvclimber.lol" className="text-purple-400 hover:text-purple-300 underline">support@cvclimber.lol</a> to exercise this right.</p>
          </div>

          <div>
            <h2 className="text-white text-2xl font-bold mb-3">6. Chargebacks</h2>
            <p>Filing a chargeback without first contacting support will result in immediate and permanent suspension of your account, and we will dispute the chargeback with Lemon Squeezy and your card issuer. If you have a billing concern, email <a href="mailto:support@cvclimber.lol" className="text-purple-400 hover:text-purple-300 underline">support@cvclimber.lol</a> first — most issues are resolved within one business day.</p>
          </div>

          <div>
            <h2 className="text-white text-2xl font-bold mb-3">7. Contact</h2>
            <p>Billing questions and statutory-rights requests: <a href="mailto:support@cvclimber.lol" className="text-purple-400 hover:text-purple-300 underline">support@cvclimber.lol</a> or via our <Link href="/contact" className="text-purple-400 hover:text-purple-300 underline">contact page</Link>.</p>
          </div>

        </div>
      </section>
    </div>
  );
}
