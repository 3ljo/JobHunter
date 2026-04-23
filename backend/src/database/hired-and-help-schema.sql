-- HIRED & HELP REFERRAL SCHEMA (2026-04)
-- New referral program replacing the legacy system dropped in
-- drop-referral-tables-migration.sql. Four tables:
--   referral_codes   — one code per user, tiered
--   referrals        — one row per (referrer, referee_email) attribution
--   referral_payouts — user-requested cash-out records
--   gifted_passes    — Gift-a-Pass ($9 one-time, 7 days of Pass access)
--
-- RLS: users see only their own rows. Admin (service role) bypasses.
-- Safe to re-run (IF NOT EXISTS everywhere, policies in DO blocks).

BEGIN;

-- ───────────────────────────────────────── referral_codes
CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  tier TEXT NOT NULL DEFAULT 'standard'
       CHECK (tier IN ('standard', 'ambassador', 'founding_100')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON referral_codes(user_id);

-- ───────────────────────────────────────── referrals
-- One row per unique (referrer_id, referee_email). Tracks the full
-- state machine from first click through paid-out reward.
CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referee_email TEXT,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'clicked'
         CHECK (status IN ('clicked','signed_up','paid','confirmed','paid_out','refunded','fraud')),
  reward_amount_cents INTEGER DEFAULT 0,
  paid_conversion_at TIMESTAMP WITH TIME ZONE,
  reward_vested_at TIMESTAMP WITH TIME ZONE,
  reward_paid_at TIMESTAMP WITH TIME ZONE,
  -- Hashed IP + fingerprint to block self-referral / single-device abuse
  -- without storing PII. Hash = SHA256(ip + REFERRAL_SALT).
  ip_address_hash TEXT,
  device_fingerprint TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee_id ON referrals(referee_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_vested_at ON referrals(reward_vested_at);
-- One referral per (referrer, email) — can't double-attribute the same
-- friend to the same referrer. Different referrers can still compete
-- for the same email (first-touch wins via application logic).
-- NOTE: no LOWER() in the expression — Supabase's upsert onConflict
-- matches on plain column names, not indexed expressions, so using
-- LOWER() here silently breaks every upsert. Callers lowercase the
-- email in JS before insert instead.
CREATE UNIQUE INDEX IF NOT EXISTS uq_referrals_referrer_email
  ON referrals(referrer_id, referee_email);

-- ───────────────────────────────────────── referral_payouts
CREATE TABLE IF NOT EXISTS referral_payouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  status TEXT NOT NULL DEFAULT 'pending'
         CHECK (status IN ('pending','approved','paid','failed')),
  payout_method TEXT NOT NULL DEFAULT 'paypal'
                CHECK (payout_method IN ('paypal','credit')),
  paypal_email TEXT,
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_referral_payouts_user_id ON referral_payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_payouts_status ON referral_payouts(status);

-- ───────────────────────────────────────── gifted_passes
-- Gift-a-Pass: buyer pays $9 for a 7-day Pass addressed to a specific
-- recipient email. Recipient creates an account with that email and the
-- Pass activates. Unique on recipient_email to prevent gaming.
CREATE TABLE IF NOT EXISTS gifted_passes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  pass_code TEXT NOT NULL UNIQUE,
  message TEXT,
  redeemed BOOLEAN DEFAULT FALSE,
  redeemed_at TIMESTAMP WITH TIME ZONE,
  redeemed_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  lemonsqueezy_order_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unique on recipient email — can't send two gifts to the same
-- person. Buyer is free to gift many different emails. Callers
-- lowercase the email in JS before insert (see giftController);
-- avoid LOWER() here so Supabase upsert onConflict works.
CREATE UNIQUE INDEX IF NOT EXISTS uq_gifted_passes_recipient_email
  ON gifted_passes(recipient_email);
CREATE INDEX IF NOT EXISTS idx_gifted_passes_buyer_user_id ON gifted_passes(buyer_user_id);
CREATE INDEX IF NOT EXISTS idx_gifted_passes_pass_code ON gifted_passes(pass_code);

-- ───────────────────────────────────────── RLS
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gifted_passes ENABLE ROW LEVEL SECURITY;

-- Users can read their own referral code
DO $$ BEGIN
  CREATE POLICY "Users read own referral_code" ON referral_codes
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Users can read referrals where they are the referrer. The referee
-- does NOT see the row (protects referrer identity until they opt-in).
DO $$ BEGIN
  CREATE POLICY "Users read own referrals as referrer" ON referrals
    FOR SELECT USING (auth.uid() = referrer_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Users read their own payout history
DO $$ BEGIN
  CREATE POLICY "Users read own payouts" ON referral_payouts
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Buyer sees gifts they sent; redeemer sees gifts addressed to them.
DO $$ BEGIN
  CREATE POLICY "Buyer reads own sent gifts" ON gifted_passes
    FOR SELECT USING (auth.uid() = buyer_user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Redeemer reads own received gift" ON gifted_passes
    FOR SELECT USING (auth.uid() = redeemed_by_user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- All mutations go through the backend (service-role); no user-facing
-- INSERT/UPDATE/DELETE policies on any of these tables.

-- Auto-update updated_at on referrals (only table with an updated_at here).
DO $$ BEGIN
  CREATE TRIGGER update_referrals_updated_at BEFORE UPDATE ON referrals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMIT;
