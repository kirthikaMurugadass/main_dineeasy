-- Add Stripe Connect account id per restaurant (TEST MODE ONLY)
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;

