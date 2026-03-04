-- Add plan columns to restaurants if missing (safe for existing DBs)
-- Fixes: column restaurants.plan_type does not exist

ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS plan_type TEXT NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS billing_cycle TEXT,
  ADD COLUMN IF NOT EXISTS plan_status TEXT NOT NULL DEFAULT 'active';
