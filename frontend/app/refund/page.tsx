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
          <p className="text-white/45 text-sm mt-4">Last updated: April 29, 2026</p>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto max-w-3xl space-y-8 text-white/70 text-base leading-relaxed">

          <div>
            <h2 className="text-white text-2xl font-bold mb-3">Our Promise</h2>
            <p>We want you to be happy with CvClimber. If something didn't work for you, we will do our best to make it right. Payments are processed by our Merchant of Record, <strong>Lemon Squeezy</strong>, and refunds are issued to the original payment method.</p>
          </div>

          <div>
            <h2 className="text-white text-2xl font-bold mb-3">1. Free Plan</h2>
            <p>The Free plan involves no payment, so no refund applies. Anyone can try the core CV analysis and cover-letter tools for free before purchasing.</p>
          </div>

          <div>
            <h2 className="text-white text-2xl font-bold mb-3">2. 7-Day Pass ($9, one-time)</h2>
            <p>The 7-Day Pass is a single, one-time purchase with no auto-renewal. Because it grants immediate access to digital AI services and is consumed during the 7-day window, it is generally <strong>non-refundable</strong> once activated.</p>
            <p className="mt-2">If you experienced a technical issue that prevented you from using the Service, contact us within 7 days of purchase and we will investigate and, where appropriate, issue a full or partial refund.</p>
          </div>

          <div>
            <h2 className="text-white text-2xl font-bold mb-3">3. Pro & Pro Voice Subscriptions</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>14-day satisfaction window:</strong> If you are not satisfied with your first paid month or first year, contact us within 14 days of the initial charge for a full refund.</li>
              <li><strong>Renewal charges:</strong> Renewal charges are not refunded automatically. You can cancel at any time from your account settings; cancellation stops future renewals but does not refund the current period (you keep access until the end of it).</li>
              <li><strong>Annual plans:</strong> If you cancel an annual plan after the 14-day window, no pro-rata refund is given for the unused months, but you keep access until the end of the paid year.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-white text-2xl font-bold mb-3">4. Duplicate or Accidental Charges</h2>
            <p>If you were charged twice or believe a charge was made in error, email <a href="mailto:support@cvclimber.lol" className="text-purple-400 hover:text-purple-300 underline">support@cvclimber.lol</a> with the order ID. We will refund verified duplicate charges in full.</p>
          </div>

          <div>
            <h2 className="text-white text-2xl font-bold mb-3">5. EU / UK Statutory Rights</h2>
            <p>Where required by EU or UK consumer law, you have a 14-day right of withdrawal for digital services. By starting to use the Service immediately after purchase you expressly request immediate performance and acknowledge that the right of withdrawal may be lost once the service has been fully provided.</p>
          </div>

          <div>
            <h2 className="text-white text-2xl font-bold mb-3">6. How to Request a Refund</h2>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Email <a href="mailto:support@cvclimber.lol" className="text-purple-400 hover:text-purple-300 underline">support@cvclimber.lol</a> from the address on your account.</li>
              <li>Include your Lemon Squeezy order ID (from your receipt) and a brief reason.</li>
              <li>We respond within 2 business days. Approved refunds are processed by Lemon Squeezy and typically appear within 5–10 business days, depending on your bank.</li>
            </ol>
          </div>

          <div>
            <h2 className="text-white text-2xl font-bold mb-3">7. Chargebacks</h2>
            <p>Please contact us first — most issues can be resolved quickly. Filing a chargeback without contacting support may result in immediate suspension of your account.</p>
          </div>

          <div>
            <h2 className="text-white text-2xl font-bold mb-3">8. Contact</h2>
            <p>Refund requests and questions: <a href="mailto:support@cvclimber.lol" className="text-purple-400 hover:text-purple-300 underline">support@cvclimber.lol</a> or via our <Link href="/contact" className="text-purple-400 hover:text-purple-300 underline">contact page</Link>.</p>
          </div>

        </div>
      </section>
    </div>
  );
}
