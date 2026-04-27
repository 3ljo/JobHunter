-- JOB MATCHES TABLE — caches Job Hunter results per user.
-- One row per fetch run. The /api/job-hunter/latest endpoint reads it so
-- the tab loads instantly on revisit; the row is replaced when the user
-- clicks "Refresh" or after a new CV is analyzed.
--
-- Run this in the Supabase SQL Editor (paste, click Run).

CREATE TABLE IF NOT EXISTS job_matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cv_id UUID REFERENCES cvs(id) ON DELETE SET NULL,
  query JSONB NOT NULL,           -- {title, skills, location, country}
  results JSONB NOT NULL,         -- ranked array of normalized jobs
  source_counts JSONB,            -- {remotive: 12, adzuna: 25, ...}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_matches_user_created
  ON job_matches (user_id, created_at DESC);
