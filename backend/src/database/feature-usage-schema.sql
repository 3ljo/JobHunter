-- FEATURE USAGE TABLE — daily quota counter
-- One row per (user, feature, day). Incremented atomically via RPC once
-- per successful analysis. Replaces the old "count rows in api_usage"
-- logic, which double/triple-counted multi-stage AI pipelines.
--
-- Run this in the Supabase SQL Editor, or via:
--   node src/database/runFeatureUsageSchema.js

CREATE TABLE IF NOT EXISTS feature_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature TEXT NOT NULL CHECK (feature IN ('cv_analysis', 'cover_letter', 'mock_interview')),
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, feature, usage_date)
);

CREATE INDEX IF NOT EXISTS idx_feature_usage_user_date
  ON feature_usage (user_id, usage_date);

CREATE INDEX IF NOT EXISTS idx_feature_usage_lookup
  ON feature_usage (user_id, feature, usage_date);

-- Atomic increment: inserts a new daily row or bumps the existing count.
-- Called by the backend after a successful analysis completes.
CREATE OR REPLACE FUNCTION increment_feature_usage(p_user_id UUID, p_feature TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  INSERT INTO feature_usage (user_id, feature, usage_date, count, updated_at)
  VALUES (p_user_id, p_feature, CURRENT_DATE, 1, NOW())
  ON CONFLICT (user_id, feature, usage_date)
  DO UPDATE SET count = feature_usage.count + 1, updated_at = NOW()
  RETURNING count INTO new_count;

  RETURN new_count;
END;
$$;
