-- Adds Lemon Squeezy columns to the existing `subscriptions` table.
-- Run this ONCE in the Supabase SQL Editor after switching from Stripe to LS.
-- Leaves the old stripe_* columns intact so historical data and easy rollback are preserved.

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS lemonsqueezy_customer_id TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS lemonsqueezy_subscription_id TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS lemonsqueezy_portal_url TEXT;

-- Make lookups by LS IDs fast (webhook handler queries by these).
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_ls_subscription_id
  ON subscriptions(lemonsqueezy_subscription_id)
  WHERE lemonsqueezy_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_subscriptions_ls_customer_id
  ON subscriptions(lemonsqueezy_customer_id)
  WHERE lemonsqueezy_customer_id IS NOT NULL;
