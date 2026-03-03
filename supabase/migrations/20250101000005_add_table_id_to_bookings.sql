-- ============================================
-- DineEasy — Add table_id to bookings
-- ============================================

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS table_id UUID REFERENCES restaurant_tables(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_table_date_time
  ON bookings(table_id, booking_date, booking_time);

