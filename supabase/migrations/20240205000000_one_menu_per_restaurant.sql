-- ============================================
-- One menu per restaurant (1:1 relationship)
-- ============================================
-- Enforces: restaurant_id UNIQUE in menus table

-- Step 1: For restaurants with multiple menus, keep only the first (by created_at)
-- and delete the rest. Categories/items cascade delete.
DELETE FROM menus m1
WHERE EXISTS (
  SELECT 1 FROM menus m2
  WHERE m2.restaurant_id = m1.restaurant_id
    AND m2.created_at < m1.created_at
);

-- Step 2: Drop old unique constraint (restaurant_id, slug)
-- PostgreSQL auto-names it menus_restaurant_id_slug_key; try common variants
ALTER TABLE menus DROP CONSTRAINT IF EXISTS menus_restaurant_id_slug_key;
ALTER TABLE menus DROP CONSTRAINT IF EXISTS menus_restaurant_id_slug_1_key;

-- Step 3: Add new unique constraint (one menu per restaurant)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'menus'::regclass AND conname = 'menus_restaurant_id_key'
  ) THEN
    ALTER TABLE menus ADD CONSTRAINT menus_restaurant_id_key UNIQUE (restaurant_id);
  END IF;
END $$;
