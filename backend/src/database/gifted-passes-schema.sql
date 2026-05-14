-- GIFTED PASSES SCHEMA
-- Gift-a-Pass: buyer pays $9 for a 7-day Pass addressed to a specific
-- recipient email. Recipient creates an account with that email and the
-- Pass activates. Unique on recipient_email to prevent gaming.
--
-- RLS: buyers see their sent gifts; redeemers see gifts addressed to them.
-- Mutations all run through the backend (service role).
-- Safe to re-run (IF NOT EXISTS everywhere, policies in DO blocks).

BEGIN;

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

ALTER TABLE gifted_passes ENABLE ROW LEVEL SECURITY;

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

COMMIT;
