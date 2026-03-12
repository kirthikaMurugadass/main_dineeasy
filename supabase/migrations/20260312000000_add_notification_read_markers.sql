-- Persisted read markers for admin sidebar notification badges.
-- These timestamps are used to compute unread "new since last opened" counts.

ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS last_orders_seen_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_bookings_seen_at TIMESTAMPTZ;

