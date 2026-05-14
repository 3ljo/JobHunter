-- Adds PayPal columns to the existing `subscriptions` table.
-- Run ONCE in the Supabase SQL Editor.
-- Leaves the stripe_* and lemonsqueezy_* columns intact so all three
-- providers can coexist while we test PayPal alongside LS.

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS paypal_subscription_id TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS paypal_plan_id TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS paypal_payer_id TEXT;

-- `provider` distinguishes which payment rail owns this row. Defaults to
-- 'lemonsqueezy' so existing rows don't get reclassified. New rows from
-- the PayPal flow set 'paypal'. The webhook handlers ignore rows owned
-- by other providers when looking up subscriptions by their own IDs.
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'lemonsqueezy'
  CHECK (provider IN ('stripe', 'lemonsqueezy', 'paypal'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_paypal_subscription_id
  ON subscriptions(paypal_subscription_id)
  WHERE paypal_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_subscriptions_provider
  ON subscriptions(provider);
