-- Allows `provider = 'admin'` on subscriptions so the Bosi panel's
-- "Grant comp plan" action can upsert a row without tripping the
-- existing check constraint. Run ONCE in the Supabase SQL Editor.

ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_provider_check;

ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_provider_check
  CHECK (provider IN ('stripe', 'lemonsqueezy', 'paypal', 'admin'));
