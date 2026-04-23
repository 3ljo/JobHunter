-- PROMO CODES TABLE
-- Admin-created discount codes for campaigns (New Year, Black Friday, etc.)
-- The legacy referral tables (referral_codes, referrals) that used to live in
-- this file were dropped on 2026-04-23; see drop-referral-tables-migration.sql
-- and the new "Hired & Help" referral schema (added in a separate migration).
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_amount NUMERIC(10,2) NOT NULL,
  max_uses INTEGER,
  times_used INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PROMO CODE USAGE TABLE
-- Tracks which users used which promo codes
CREATE TABLE IF NOT EXISTS promo_code_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  promo_code_id UUID REFERENCES promo_codes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(promo_code_id, user_id)
);

-- Enable RLS
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_code_usage ENABLE ROW LEVEL SECURITY;

-- Users can view active promo codes (to validate at checkout)
CREATE POLICY "Anyone can view active promo codes" ON promo_codes FOR SELECT USING (is_active = true);

-- Indexes
CREATE INDEX idx_promo_codes_code ON promo_codes(code);

-- Auto-update updated_at on promo_codes
CREATE TRIGGER update_promo_codes_updated_at BEFORE UPDATE ON promo_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
