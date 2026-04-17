// JobHunter Backend API
// Main entry point — configures Express server with CORS, routes, and error handling

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const onboardingRoutes = require('./routes/onboarding');
const cvRoutes = require('./routes/cv');
const jobTrackerRoutes = require('./routes/jobTracker');
const coverLetterRoutes = require('./routes/coverLetter');
const interviewRoutes = require('./routes/interview');
const adminRoutes = require('./routes/admin');

const subscriptionRoutes = require('./routes/subscription');
const promoRoutes = require('./routes/promo');
const referralRoutes = require('./routes/referral');
const { handleWebhook } = require('./controllers/subscriptionController');

const app = express();
const PORT = process.env.PORT || 5000;

// Configure CORS to allow requests from the frontend
app.use(cors({
  origin: process.env.FRONTEND_URL?.split(',').map(u => u.trim()),
  credentials: true,
}));

// Stripe webhook needs raw body — must be before express.json()
app.post('/api/subscription/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Parse JSON request bodies (2MB limit to accommodate base64 profile photos for CV templates)
app.use(express.json({ limit: '2mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'JobHunter API is running' });
});

// Mount auth routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/cv', cvRoutes);
app.use('/api/tracker', jobTrackerRoutes);
app.use('/api/cover-letter', coverLetterRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/promo', promoRoutes);
app.use('/api/referral', referralRoutes);

// Global error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({ error: err.message || 'Internal Server Error' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
