-- ============================================
-- DineEasy — Allow restaurant owners to manage tables
-- ============================================

-- RLS is already enabled on restaurant_tables in 20250101000004
-- This migration grants insert/update/delete to the restaurant owner.

DROP POLICY IF EXISTS "Restaurant owners can manage tables" ON restaurant_tables;

CREATE POLICY "Restaurant owners can manage tables"
  ON restaurant_tables
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM restaurants
      WHERE restaurants.id = restaurant_tables.restaurant_id
        AND restaurants.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM restaurants
      WHERE restaurants.id = restaurant_tables.restaurant_id
        AND restaurants.owner_id = auth.uid()
    )
  );

