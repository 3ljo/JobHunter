import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy · CvClimber',
  description: 'How CvClimber collects, uses, and protects your personal data.',
};

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p className="text-white/45 text-sm mt-4">Last updated: April 29, 2026</p>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto max-w-3xl space-y-8 text-white/70 text-base leading-relaxed">

          <div>
            <h2 className="text-white text-2xl font-bold mb-3">1. Who We Are</h2>
            <p>CvClimber ("we", "us", "our") operates the AI-powered job-search platform at cvclimber.com. This Privacy Policy explains how we collect, use, share, and protect your personal data when you use our Service.</p>
          </div>

          <div>
            <h2 className="text-white text-2xl font-bold mb-3">2. Data We Collect</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account data:</strong> name, email address, hashed password.</li>
              <li><strong>CV content:</strong> the CV/resume text you upload or paste, plus the job descriptions you analyze against.</li>
              <li><strong>Generated content:</strong> ATS scores, keyword reports, cover letters, voice-interview transcripts.</li>
              <li><strong>Usage data:</strong> pages visited, features used, device and browser information, IP address.</li>
              <li><strong>Billing data:</strong> handled entirely by Lemon Squeezy (our Merchant of Record). We never see or store full payment-card details.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-white text-2xl font-bold mb-3">3. How We Use Your Data</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To provide CV analysis, cover letters, the job tracker, and other features you request.</li>
              <li>To process payments via Lemon Squeezy.</li>
              <li>To improve the Service, fix bugs, and prevent abuse.</li>
              <li>To send transactional emails (receipts, security alerts) and — with your consent — product updates.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-white text-2xl font-bold mb-3">4. Legal Basis (GDPR)</h2>
            <p>We process personal data on the basis of (a) performance of our contract with you, (b) your consent (e.g. marketing emails), (c) our legitimate interests in operating and securing the Service, and (d) compliance with legal obligations.</p>
          </div>

          <div>
            <h2 className="text-white text-2xl font-bold mb-3">5. Sub-Processors We Use</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Supabase</strong> — database and authentication hosting.</li>
              <li><strong>Lemon Squeezy</strong> — payments and tax (Merchant of Record).</li>
              <li><strong>OpenAI / Anthropic</strong> — AI model providers used to generate analyses and cover letters. Inputs are sent over TLS and not used to train their models.</li>
              <li><strong>Vercel</strong> — application hosting.</li>
              <li><strong>Resend / SMTP</strong> — transactional email delivery.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-white text-2xl font-bold mb-3">6. Data Sharing</h2>
            <p>We do not sell your personal data. We share it only with the sub-processors listed above to operate the Service, or when required by law.</p>
          </div>

          <div>
            <h2 className="text-white text-2xl font-bold mb-3">7. Data Retention</h2>
            <p>We keep your account and CV data for as long as your account is active. You can delete your account and all associated CV data at any time from your settings. Billing records may be retained for up to 7 years to comply with tax and accounting laws.</p>
          </div>

          <div>
            <h2 className="text-white text-2xl font-bold mb-3">8. Your Rights</h2>
            <p>Depending on your jurisdiction (GDPR, UK GDPR, CCPA, etc.) you have the right to access, correct, delete, port, or restrict processing of your personal data, and to object to processing or withdraw consent. Email <a href="mailto:privacy@cvclimber.com" className="text-purple-400 hover:text-purple-300 underline">privacy@cvclimber.com</a> to exercise these rights.</p>
          </div>

          <div>
            <h2 className="text-white text-2xl font-bold mb-3">9. Security</h2>
            <p>Data is encrypted in transit (TLS 1.2+) and at rest. Passwords are hashed using industry-standard algorithms. Access to production systems is restricted and logged.</p>
          </div>

          <div>
            <h2 className="text-white text-2xl font-bold mb-3">10. Cookies</h2>
            <p>We use strictly-necessary cookies for authentication and session management, and (with your consent) analytics cookies to understand usage. You can control cookies through your browser settings.</p>
          </div>

          <div>
            <h2 className="text-white text-2xl font-bold mb-3">11. International Transfers</h2>
            <p>Our sub-processors may process data outside your country. Where required, we rely on Standard Contractual Clauses or equivalent safeguards.</p>
          </div>

          <div>
            <h2 className="text-white text-2xl font-bold mb-3">12. Children</h2>
            <p>The Service is not intended for users under 16. We do not knowingly collect personal data from children.</p>
          </div>

          <div>
            <h2 className="text-white text-2xl font-bold mb-3">13. Changes to This Policy</h2>
            <p>We will post any changes here and update the "Last updated" date. Material changes will be notified by email.</p>
          </div>

          <div>
            <h2 className="text-white text-2xl font-bold mb-3">14. Contact</h2>
            <p>For privacy questions, reach us at <a href="mailto:privacy@cvclimber.com" className="text-purple-400 hover:text-purple-300 underline">privacy@cvclimber.com</a> or via our <Link href="/contact" className="text-purple-400 hover:text-purple-300 underline">contact page</Link>.</p>
          </div>

        </div>
      </section>
    </div>
  );
}
