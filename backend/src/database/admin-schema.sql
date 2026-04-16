-- ADMIN TABLES — api_usage + app_settings
-- Run: node src/database/runAdminSchema.js

-- APP SETTINGS TABLE
-- Stores runtime config (AI provider, model, etc.) so admin can change without restarting server
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed default settings
INSERT INTO app_settings (key, value) VALUES
  ('ai_provider', 'gemini'),
  ('ai_model_anthropic', 'claude-sonnet-4-20250514'),
  ('ai_model_openai', 'gpt-4o-mini'),
  ('ai_model_gemini', 'gemini-2.0-flash'),
  ('max_tokens', '4000'),
  ('rate_limit_cv_per_day', '10'),
  ('rate_limit_cl_per_day', '20')
ON CONFLICT (key) DO NOTHING;

-- API USAGE TABLE
-- Logs every AI call for analytics and cost tracking
CREATE TABLE IF NOT EXISTS api_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  feature TEXT NOT NULL CHECK (feature IN ('cv_analysis', 'cover_letter', 'cv_refine', 'cl_refine')),
  provider TEXT NOT NULL CHECK (provider IN ('anthropic', 'openai', 'gemini')),
  model TEXT NOT NULL,
  stage TEXT,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  estimated_cost NUMERIC(10, 6) DEFAULT 0,
  duration_ms INTEGER DEFAULT 0,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON api_usage (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_user_id ON api_usage (user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_feature ON api_usage (feature);
CREATE INDEX IF NOT EXISTS idx_api_usage_provider ON api_usage (provider);
