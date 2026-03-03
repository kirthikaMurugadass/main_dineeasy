-- ============================================
-- DineEasy — Restaurant Tables & Table Locks
-- ============================================

-- ─── Restaurant Tables ───
CREATE TABLE IF NOT EXISTS restaurant_tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  table_name TEXT NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_restaurant_tables_restaurant
  ON restaurant_tables(restaurant_id);

-- ─── Table Locks ───
CREATE TABLE IF NOT EXISTS table_locks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_id UUID NOT NULL REFERENCES restaurant_tables(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  booking_time TEXT NOT NULL,
  locked_until TIMESTAMPTZ NOT NULL,
  session_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_table_locks_table_date_time
  ON table_locks(table_id, booking_date, booking_time);

CREATE INDEX IF NOT EXISTS idx_table_locks_locked_until
  ON table_locks(locked_until);

-- ─── Updated At Trigger for restaurant_tables ───
CREATE TRIGGER trigger_restaurant_tables_updated_at
  BEFORE UPDATE ON restaurant_tables
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ─── RLS ───
ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_locks ENABLE ROW LEVEL SECURITY;

-- Restaurant tables: anyone can read, only restaurant owners can modify via dashboard (handled via service role)
DROP POLICY IF EXISTS "Public can read restaurant tables" ON restaurant_tables;
CREATE POLICY "Public can read restaurant tables"
  ON restaurant_tables FOR SELECT
  USING (TRUE);

-- Table locks: allow public select, insert, and delete (locks are ephemeral client-side coordination)
DROP POLICY IF EXISTS "Public can read table locks" ON table_locks;
DROP POLICY IF EXISTS "Public can write table locks" ON table_locks;

CREATE POLICY "Public can read table locks"
  ON table_locks FOR SELECT
  USING (TRUE);

CREATE POLICY "Public can write table locks"
  ON table_locks FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);

