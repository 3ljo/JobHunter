-- PROFILES TABLE
-- Stores extra user info linked to Supabase auth users
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT NOT NULL,
  avatar_url TEXT,
  location TEXT,
  linkedin_url TEXT,
  website_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ONBOARDING TABLE
-- Stores career preferences collected after first login
CREATE TABLE IF NOT EXISTS onboarding (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  job_title TEXT,
  career_level TEXT,
  job_type TEXT[],
  preferred_locations TEXT[],
  preferred_industries TEXT[],
  skills TEXT[],
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- JOB TRACKER TABLE
-- Stores jobs the user has applied to
CREATE TABLE IF NOT EXISTS job_tracker (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  job_url TEXT,
  status TEXT DEFAULT 'applied' CHECK (status IN ('applied', 'interview', 'offer', 'rejected', 'saved')),
  notes TEXT,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CVS TABLE
-- Stores uploaded and generated CVs
CREATE TABLE IF NOT EXISTS cvs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT,
  file_url TEXT,
  raw_text TEXT,
  ats_score INTEGER,
  ats_feedback JSONB,
  is_generated BOOLEAN DEFAULT FALSE,
  generated_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS POLICIES
-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE cvs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Onboarding policies
CREATE POLICY "Users can view own onboarding" ON onboarding FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own onboarding" ON onboarding FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own onboarding" ON onboarding FOR UPDATE USING (auth.uid() = user_id);

-- Job tracker policies
CREATE POLICY "Users can view own jobs" ON job_tracker FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own jobs" ON job_tracker FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own jobs" ON job_tracker FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own jobs" ON job_tracker FOR DELETE USING (auth.uid() = user_id);

-- CVs policies
CREATE POLICY "Users can view own cvs" ON cvs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cvs" ON cvs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cvs" ON cvs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cvs" ON cvs FOR DELETE USING (auth.uid() = user_id);

-- AUTO UPDATE updated_at TRIGGER
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_onboarding_updated_at BEFORE UPDATE ON onboarding FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_job_tracker_updated_at BEFORE UPDATE ON job_tracker FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
