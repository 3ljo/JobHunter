-- MOCK INTERVIEWS TABLE
-- Stores voice-based AI interview sessions (Pro+ feature)
CREATE TABLE IF NOT EXISTS mock_interviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  cv_id UUID REFERENCES cvs(id) ON DELETE SET NULL,
  job_title TEXT,
  job_description TEXT,
  difficulty TEXT DEFAULT 'standard' CHECK (difficulty IN ('standard', 'challenging', 'stress')),
  questions JSONB,        -- [{ id, text, kind, expected_signals[] }]
  answers JSONB,          -- [{ question_id, transcript, score, feedback, missing_signals[] }]
  final_report JSONB,     -- { overall_score, strengths[], weaknesses[], top_improvements[] }
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE mock_interviews ENABLE ROW LEVEL SECURITY;

-- Users can only read their own interviews; all writes go through backend service role
DROP POLICY IF EXISTS "Users read own interviews" ON mock_interviews;
CREATE POLICY "Users read own interviews" ON mock_interviews
  FOR SELECT USING (auth.uid() = user_id);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_mock_interviews_user_id ON mock_interviews(user_id);
CREATE INDEX IF NOT EXISTS idx_mock_interviews_user_created ON mock_interviews(user_id, created_at DESC);

-- Auto-update updated_at
DROP TRIGGER IF EXISTS update_mock_interviews_updated_at ON mock_interviews;
CREATE TRIGGER update_mock_interviews_updated_at
  BEFORE UPDATE ON mock_interviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
