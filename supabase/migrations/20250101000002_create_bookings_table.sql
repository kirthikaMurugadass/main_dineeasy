-- ============================================
-- DineEasy — Bookings Table Migration
-- ============================================
-- Creates bookings table for table reservation system
-- ============================================

-- ─── Bookings Table ───
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  guest_count INTEGER NOT NULL CHECK (guest_count >= 1 AND guest_count <= 10),
  special_note TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Indexes ───
CREATE INDEX IF NOT EXISTS idx_bookings_restaurant ON bookings(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);

-- ─── Updated At Trigger ───
CREATE TRIGGER trigger_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ─── Row Level Security ───
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Restaurant owners can view their bookings" ON bookings;
DROP POLICY IF EXISTS "Restaurant owners can update their bookings" ON bookings;
DROP POLICY IF EXISTS "Public can insert bookings" ON bookings;

-- Bookings Policies
-- Restaurant owners can view all bookings for their restaurants
CREATE POLICY "Restaurant owners can view their bookings"
  ON bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = bookings.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

-- Public can insert bookings (for customer booking)
CREATE POLICY "Public can insert bookings"
  ON bookings FOR INSERT
  WITH CHECK (true);

-- Restaurant owners can update bookings for their restaurants
CREATE POLICY "Restaurant owners can update their bookings"
  ON bookings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = bookings.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );
