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

const app = express();
const PORT = process.env.PORT || 5000;

// Configure CORS to allow requests from the frontend
app.use(cors({
  origin: process.env.FRONTEND_URL?.split(',').map(u => u.trim()),
  credentials: true,
}));

// Parse JSON request bodies
app.use(express.json());

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

// Global error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({ error: err.message || 'Internal Server Error' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
