# Lemon Squeezy KYB/KYC Verification — Reply Pack

This file contains:
1. A ready-to-send email reply to Ankith at Lemon Squeezy.
2. The four answers Ankith asked for.
3. A small checklist of what YOU still need to fill in (social URLs +
   demo video link) before sending.

---

## ✉️ EMAIL REPLY (copy & paste, fill the [BRACKETS])

> **To:** hello@lemonsqueezy.com
> **Subject:** Re: CvClimber — Verification Information
>
> Hi Ankith,
>
> Thank you for the quick reply and for the detailed checklist. Please
> find all the requested information below.
>
> ---
>
> **1. Demo Video**
> A walk-through of CvClimber showing CV upload, ATS analysis, the
> keyword gap report, the AI cover-letter generator, the application
> tracker, and the pricing/checkout flow:
> 👉 **[YOUR DEMO VIDEO LINK — Loom / YouTube unlisted / Vimeo]**
>
> ---
>
> **2. Personal Social Media Accounts (KYB/KYC)**
> - LinkedIn: **[YOUR LINKEDIN URL]**
> - X / Twitter: **[YOUR X URL]**
> - Instagram: **[YOUR INSTAGRAM URL]**
> - GitHub (founder profile): **[YOUR GITHUB URL]**
>
> ---
>
> **3. Products We Plan to Sell on Lemon Squeezy**
>
> CvClimber is a SaaS web application for job seekers. It uses AI to
> analyze CVs against any job description, produce ATS scores and
> keyword reports, generate tailored cover letters, run mock voice
> interviews, and track job applications.
>
> We will sell **four products** through Lemon Squeezy:
>
> | Product | Type | Price | Renewal |
> |---|---|---|---|
> | **Free Plan** | Free tier (no Lemon Squeezy charge) | $0 | — |
> | **7-Day Pass** | One-time purchase | $9 | No auto-renewal — single charge, 7 days of unlimited access |
> | **Pro** | Recurring subscription | $19 / month or $149 / year | Auto-renews until cancelled |
> | **Pro Voice** | Recurring subscription | $39 / month or $299 / year | Auto-renews until cancelled |
>
> All products grant access to the same web application; higher tiers
> unlock more usage and features (priority AI processing, voice mock
> interviews, full CV history, etc.). Buyers are individual end-users
> (job seekers) — there are no resale licenses, physical goods, or
> third-party content involved.
>
> ---
>
> **4. Updated Terms, Privacy Policy & Refund Policy**
>
> All three documents are now published and clearly linked from the
> footer of our landing page:
>
> - Terms of Service — https://cvclimber.com/terms
> - Privacy Policy — https://cvclimber.com/privacy
> - Refund Policy — https://cvclimber.com/refund
> - Landing page (footer links visible on every page) — https://cvclimber.com
>
> ---
>
> Please let me know if you need anything else to complete the
> verification. Happy to jump on a quick call if it speeds things up.
>
> Best,
> **[YOUR FULL NAME]**
> Founder, CvClimber
> [your email] · [your phone, optional]

---

## ✅ YOUR CHECKLIST BEFORE SENDING

- [ ] **Record / generate the demo video** (60–120 s is ideal). Cover
  in this order:
  1. Landing page tour (3 s).
  2. Sign up / log in (3 s).
  3. Upload a CV + paste a job description (10 s).
  4. Show the ATS score, keyword gaps, and AI suggestions (15 s).
  5. Click "Generate Cover Letter" and show the output (10 s).
  6. Open the application tracker (5 s).
  7. Open the pricing page and click checkout (10 s — you can stop
     before paying).
  8. End on the URL + logo (3 s).
  Tools: Loom (free, easiest), OBS, or ScreenStudio. Upload as
  unlisted on YouTube or share a Loom link.

- [ ] **Replace the four social-media placeholders** with your real
  profile URLs. Lemon Squeezy uses these for KYC, so they need to be
  real and tied to your name.

- [ ] **Deploy the new legal pages** (already created on this branch:
  `/terms`, `/privacy`, `/refund`) and confirm they load on the live
  domain BEFORE sending the reply.

- [ ] **Confirm the footer** on every page now shows the three legal
  links (already wired in `frontend/app/page.tsx`).

- [ ] **Update your support and privacy email aliases**
  (`support@cvclimber.com`, `privacy@cvclimber.com`) — they appear in
  all three legal docs.

---

## 🎬 BONUS — DEMO VIDEO SCRIPT (90 seconds, voice-over)

Use this if you record the demo yourself with Loom:

> "Hi, I'm [Name], founder of CvClimber. CvClimber is an AI-powered
> platform that helps job seekers tailor their CV to any job
> description and beat ATS filters.
>
> [Show landing page] This is our landing page at cvclimber.com.
>
> [Sign in / dashboard] After signing in, the dashboard shows your CV
> history and recent analyses.
>
> [Upload CV] I'll upload my CV here, paste a real job description
> from LinkedIn into the second box, and click Analyze.
>
> [Score appears] Within a few seconds we get back an ATS score —
> here it's 72 out of 100 — plus a list of missing keywords and
> concrete suggestions to improve the CV.
>
> [Cover letter] One click generates a tailored cover letter for the
> same job, in the tone I choose.
>
> [Tracker] Every analysis is automatically saved to the job tracker,
> a kanban board where I can move applications from Saved to Applied
> to Interview to Offer.
>
> [Pricing] We offer four products: a free plan, a one-time $9
> seven-day pass with no auto-renewal, and two recurring
> subscriptions, Pro at $19 a month and Pro Voice at $39 a month.
>
> [Checkout] Checkout is handled entirely by Lemon Squeezy as our
> Merchant of Record.
>
> [Footer] Our Terms of Service, Privacy Policy, and Refund Policy
> are linked from the footer on every page.
>
> Thanks for reviewing — happy to answer any questions!"

---

## 📁 FILES CREATED / CHANGED IN THIS PR

- `frontend/app/terms/page.tsx` — new Terms of Service page
- `frontend/app/privacy/page.tsx` — new Privacy Policy page
- `frontend/app/refund/page.tsx` — new Refund Policy page
- `frontend/app/page.tsx` — footer now links to /terms, /privacy,
  /refund (was `href="#"`)
- `LEMON_SQUEEZY_REPLY.md` — this file
