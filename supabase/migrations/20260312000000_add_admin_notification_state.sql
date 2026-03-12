-- Admin sidebar notification state (orders/bookings)
-- Stores last-seen timestamps per restaurant + user so badges persist across refresh.

CREATE TABLE IF NOT EXISTS admin_notification_state (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  last_seen_orders_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_bookings_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, restaurant_id)
);

CREATE INDEX IF NOT EXISTS idx_admin_notification_state_restaurant
  ON admin_notification_state(restaurant_id);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc
    WHERE proname = 'update_updated_at'
  ) THEN
    DROP TRIGGER IF EXISTS trigger_admin_notification_state_updated_at ON admin_notification_state;
    CREATE TRIGGER trigger_admin_notification_state_updated_at
      BEFORE UPDATE ON admin_notification_state
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

ALTER TABLE admin_notification_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can read their admin notification state" ON admin_notification_state;
CREATE POLICY "Owners can read their admin notification state"
  ON admin_notification_state
  FOR SELECT
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM restaurants
      WHERE restaurants.id = admin_notification_state.restaurant_id
        AND restaurants.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners can insert their admin notification state" ON admin_notification_state;
CREATE POLICY "Owners can insert their admin notification state"
  ON admin_notification_state
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM restaurants
      WHERE restaurants.id = admin_notification_state.restaurant_id
        AND restaurants.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners can update their admin notification state" ON admin_notification_state;
CREATE POLICY "Owners can update their admin notification state"
  ON admin_notification_state
  FOR UPDATE
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM restaurants
      WHERE restaurants.id = admin_notification_state.restaurant_id
        AND restaurants.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM restaurants
      WHERE restaurants.id = admin_notification_state.restaurant_id
        AND restaurants.owner_id = auth.uid()
    )
  );

