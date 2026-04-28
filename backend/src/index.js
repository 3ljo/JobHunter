// CvClimber Backend API
// Main entry point — configures Express server with CORS, routes, and error handling

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// ── Startup env-var validation ────────────────────────────────────────
// Fail fast at boot if a required secret is missing. Previously the
// server started fine and then erupted in 500s the first time a user
// hit an affected endpoint (e.g. LS checkout → 401 Unauthenticated,
// or a Supabase query with an empty key). Crashing here means Render
// marks the deploy as failed and keeps serving the old container
// instead of silently rolling forward a broken build.
(() => {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'FRONTEND_URL',
  ];
  // Not strictly required for the server to boot, but if the payments
  // or admin subsystems are expected to work, these must be present.
  // Warned rather than fatal so local dev without LS still runs.
  const warnIfMissing = [
    'LEMONSQUEEZY_API_KEY',
    'LEMONSQUEEZY_STORE_ID',
    'LEMONSQUEEZY_WEBHOOK_SECRET',
    'ADMIN_PASSWORD',
  ];
  const missing = required.filter((k) => !process.env[k] || !String(process.env[k]).trim());
  if (missing.length > 0) {
    console.error(`[startup] FATAL: required env vars missing: ${missing.join(', ')}`);
    process.exit(1);
  }
  const warn = warnIfMissing.filter((k) => !process.env[k] || !String(process.env[k]).trim());
  if (warn.length > 0) {
    console.warn(`[startup] WARNING: optional env vars missing: ${warn.join(', ')} — matching features will fail until set`);
  }
})();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const onboardingRoutes = require('./routes/onboarding');
const cvRoutes = require('./routes/cv');
const jobTrackerRoutes = require('./routes/jobTracker');
const jobHunterRoutes = require('./routes/jobHunter');
const coverLetterRoutes = require('./routes/coverLetter');
const interviewRoutes = require('./routes/interview');
const adminRoutes = require('./routes/admin');

const subscriptionRoutes = require('./routes/subscription');
const promoRoutes = require('./routes/promo');
const giftRoutes = require('./routes/gift');
const { handleWebhook, handlePaypalWebhook } = require('./controllers/subscriptionController');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust the platform proxy (Render, etc.) so req.ip + X-Forwarded-For
// resolve to the real client IP. Required by the rate limiter.
app.set('trust proxy', 1);

// Helmet sets a baseline of security headers (HSTS, X-Frame-Options,
// no-sniff, etc.). We don't ship HTML from this origin so a strict
// CSP isn't critical here, but the other defaults are pure win.
app.use(
  helmet({
    contentSecurityPolicy: false, // API-only origin; CSP belongs on the frontend
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: false,
  })
);

// Configure CORS — strict allowlist from FRONTEND_URL (comma-separated).
// `credentials: true` is required for the SPA to send the auth cookie
// cross-origin. Browsers refuse `Access-Control-Allow-Origin: *` once
// credentials are in play, so we mirror the request origin only when
// it's in the allowlist.
const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((u) => u.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // Same-origin and tools (curl/Postman) send no Origin header.
      if (!origin) return cb(null, true);
      const normalized = origin.replace(/\/$/, '');
      if (allowedOrigins.includes(normalized)) return cb(null, true);
      return cb(new Error(`Origin not allowed: ${origin}`));
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    exposedHeaders: ['Retry-After'],
  })
);

// Parse cookies into req.cookies — needed by requireAuth (for the
// httpOnly session cookie) and the CSRF middleware.
app.use(cookieParser());

// Payment webhook (Lemon Squeezy) — needs raw body for HMAC signature
// verification, so it MUST be mounted before express.json(). If you switch
// back to Stripe, keep this same route path and raw-body middleware — only
// the handler logic inside subscriptionController changes.
app.post('/api/subscription/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// PayPal webhook — also needs raw body. PayPal verifies the signature
// asynchronously via /v1/notifications/verify-webhook-signature using
// the unmodified payload bytes, so the same raw-body rule applies.
app.post('/api/subscription/paypal/webhook', express.raw({ type: 'application/json' }), handlePaypalWebhook);

// Parse JSON request bodies (2MB limit to accommodate base64 profile photos for CV templates)
app.use(express.json({ limit: '2mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CvClimber API is running' });
});

// Mount auth routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/cv', cvRoutes);
app.use('/api/tracker', jobTrackerRoutes);
app.use('/api/job-hunter', jobHunterRoutes);
app.use('/api/cover-letter', coverLetterRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/promo', promoRoutes);
app.use('/api/gift', giftRoutes);

// Global error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({ error: err.message || 'Internal Server Error' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
