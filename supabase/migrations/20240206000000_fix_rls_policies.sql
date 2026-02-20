-- ============================================
-- Fix RLS Policies for Production Deployment
-- ============================================
-- This migration ensures all RLS policies are correctly configured
-- for multi-tenant SaaS architecture in production (Vercel)

-- ─── Step 1: Verify RLS is enabled ───
-- (No action needed - already enabled in initial schema)

-- ─── Step 2: Drop all existing policies to recreate them correctly ───

-- Restaurants policies
DROP POLICY IF EXISTS "Owners can manage own restaurants" ON restaurants;
DROP POLICY IF EXISTS "Public can read restaurants" ON restaurants;

-- Menus policies
DROP POLICY IF EXISTS "Owners can manage menus" ON menus;
DROP POLICY IF EXISTS "Public can read active menus" ON menus;

-- Categories policies
DROP POLICY IF EXISTS "Owners can manage categories" ON categories;
DROP POLICY IF EXISTS "Public can read active categories" ON categories;

-- Menu items policies
DROP POLICY IF EXISTS "Owners can manage menu items" ON menu_items;
DROP POLICY IF EXISTS "Public can read active menu items" ON menu_items;

-- Translations policies
DROP POLICY IF EXISTS "Owners can manage translations" ON translations;
DROP POLICY IF EXISTS "Public can read translations" ON translations;

-- ─── Step 3: Create production-grade RLS policies ───

-- ─── RESTAURANTS ───

-- Policy 1: Authenticated users can INSERT their own restaurants
-- This is critical for restaurant creation to work
CREATE POLICY "Authenticated users can insert own restaurants"
  ON restaurants FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

-- Policy 2: Owners can SELECT their own restaurants
CREATE POLICY "Owners can select own restaurants"
  ON restaurants FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

-- Policy 3: Owners can UPDATE their own restaurants
CREATE POLICY "Owners can update own restaurants"
  ON restaurants FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Policy 4: Owners can DELETE their own restaurants
CREATE POLICY "Owners can delete own restaurants"
  ON restaurants FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Policy 5: Public (anon) can SELECT all restaurants (for public menu pages)
CREATE POLICY "Public can read restaurants"
  ON restaurants FOR SELECT
  TO anon, authenticated
  USING (true);

-- ─── MENUS ───

-- Policy 1: Authenticated users can INSERT menus for their restaurants
-- Uses EXISTS check to verify ownership through restaurant
CREATE POLICY "Owners can insert menus"
  ON menus FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = menus.restaurant_id
        AND restaurants.owner_id = auth.uid()
    )
  );

-- Policy 2: Owners can SELECT menus for their restaurants
CREATE POLICY "Owners can select menus"
  ON menus FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = menus.restaurant_id
        AND restaurants.owner_id = auth.uid()
    )
  );

-- Policy 3: Owners can UPDATE menus for their restaurants
CREATE POLICY "Owners can update menus"
  ON menus FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = menus.restaurant_id
        AND restaurants.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = menus.restaurant_id
        AND restaurants.owner_id = auth.uid()
    )
  );

-- Policy 4: Owners can DELETE menus for their restaurants
CREATE POLICY "Owners can delete menus"
  ON menus FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = menus.restaurant_id
        AND restaurants.owner_id = auth.uid()
    )
  );

-- Policy 5: Public can SELECT only active menus
CREATE POLICY "Public can read active menus"
  ON menus FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- ─── CATEGORIES ───

-- Policy 1: Owners can INSERT categories for their menus
CREATE POLICY "Owners can insert categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM menus
      JOIN restaurants ON restaurants.id = menus.restaurant_id
      WHERE menus.id = categories.menu_id
        AND restaurants.owner_id = auth.uid()
    )
  );

-- Policy 2: Owners can SELECT categories for their menus
CREATE POLICY "Owners can select categories"
  ON categories FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM menus
      JOIN restaurants ON restaurants.id = menus.restaurant_id
      WHERE menus.id = categories.menu_id
        AND restaurants.owner_id = auth.uid()
    )
  );

-- Policy 3: Owners can UPDATE categories for their menus
CREATE POLICY "Owners can update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM menus
      JOIN restaurants ON restaurants.id = menus.restaurant_id
      WHERE menus.id = categories.menu_id
        AND restaurants.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM menus
      JOIN restaurants ON restaurants.id = menus.restaurant_id
      WHERE menus.id = categories.menu_id
        AND restaurants.owner_id = auth.uid()
    )
  );

-- Policy 4: Owners can DELETE categories for their menus
CREATE POLICY "Owners can delete categories"
  ON categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM menus
      JOIN restaurants ON restaurants.id = menus.restaurant_id
      WHERE menus.id = categories.menu_id
        AND restaurants.owner_id = auth.uid()
    )
  );

-- Policy 5: Public can SELECT only active categories
CREATE POLICY "Public can read active categories"
  ON categories FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- ─── MENU ITEMS ───

-- Policy 1: Owners can INSERT menu items for their categories
CREATE POLICY "Owners can insert menu items"
  ON menu_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM categories
      JOIN menus ON menus.id = categories.menu_id
      JOIN restaurants ON restaurants.id = menus.restaurant_id
      WHERE categories.id = menu_items.category_id
        AND restaurants.owner_id = auth.uid()
    )
  );

-- Policy 2: Owners can SELECT menu items for their categories
CREATE POLICY "Owners can select menu items"
  ON menu_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM categories
      JOIN menus ON menus.id = categories.menu_id
      JOIN restaurants ON restaurants.id = menus.restaurant_id
      WHERE categories.id = menu_items.category_id
        AND restaurants.owner_id = auth.uid()
    )
  );

-- Policy 3: Owners can UPDATE menu items for their categories
CREATE POLICY "Owners can update menu items"
  ON menu_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM categories
      JOIN menus ON menus.id = categories.menu_id
      JOIN restaurants ON restaurants.id = menus.restaurant_id
      WHERE categories.id = menu_items.category_id
        AND restaurants.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM categories
      JOIN menus ON menus.id = categories.menu_id
      JOIN restaurants ON restaurants.id = menus.restaurant_id
      WHERE categories.id = menu_items.category_id
        AND restaurants.owner_id = auth.uid()
    )
  );

-- Policy 4: Owners can DELETE menu items for their categories
CREATE POLICY "Owners can delete menu items"
  ON menu_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM categories
      JOIN menus ON menus.id = categories.menu_id
      JOIN restaurants ON restaurants.id = menus.restaurant_id
      WHERE categories.id = menu_items.category_id
        AND restaurants.owner_id = auth.uid()
    )
  );

-- Policy 5: Public can SELECT only active menu items
CREATE POLICY "Public can read active menu items"
  ON menu_items FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- ─── TRANSLATIONS ───

-- Policy 1: Owners can INSERT translations for their entities
CREATE POLICY "Owners can insert translations"
  ON translations FOR INSERT
  TO authenticated
  WITH CHECK (
    -- For restaurants
    (entity_type = 'restaurant' AND EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = translations.entity_id
        AND restaurants.owner_id = auth.uid()
    ))
    OR
    -- For menus
    (entity_type = 'menu' AND EXISTS (
      SELECT 1 FROM menus
      JOIN restaurants ON restaurants.id = menus.restaurant_id
      WHERE menus.id = translations.entity_id
        AND restaurants.owner_id = auth.uid()
    ))
    OR
    -- For categories
    (entity_type = 'category' AND EXISTS (
      SELECT 1 FROM categories
      JOIN menus ON menus.id = categories.menu_id
      JOIN restaurants ON restaurants.id = menus.restaurant_id
      WHERE categories.id = translations.entity_id
        AND restaurants.owner_id = auth.uid()
    ))
    OR
    -- For menu items
    (entity_type = 'menu_item' AND EXISTS (
      SELECT 1 FROM menu_items
      JOIN categories ON categories.id = menu_items.category_id
      JOIN menus ON menus.id = categories.menu_id
      JOIN restaurants ON restaurants.id = menus.restaurant_id
      WHERE menu_items.id = translations.entity_id
        AND restaurants.owner_id = auth.uid()
    ))
  );

-- Policy 2: Owners can SELECT translations for their entities
CREATE POLICY "Owners can select translations"
  ON translations FOR SELECT
  TO authenticated
  USING (
    -- For restaurants
    (entity_type = 'restaurant' AND EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = translations.entity_id
        AND restaurants.owner_id = auth.uid()
    ))
    OR
    -- For menus
    (entity_type = 'menu' AND EXISTS (
      SELECT 1 FROM menus
      JOIN restaurants ON restaurants.id = menus.restaurant_id
      WHERE menus.id = translations.entity_id
        AND restaurants.owner_id = auth.uid()
    ))
    OR
    -- For categories
    (entity_type = 'category' AND EXISTS (
      SELECT 1 FROM categories
      JOIN menus ON menus.id = categories.menu_id
      JOIN restaurants ON restaurants.id = menus.restaurant_id
      WHERE categories.id = translations.entity_id
        AND restaurants.owner_id = auth.uid()
    ))
    OR
    -- For menu items
    (entity_type = 'menu_item' AND EXISTS (
      SELECT 1 FROM menu_items
      JOIN categories ON categories.id = menu_items.category_id
      JOIN menus ON menus.id = categories.menu_id
      JOIN restaurants ON restaurants.id = menus.restaurant_id
      WHERE menu_items.id = translations.entity_id
        AND restaurants.owner_id = auth.uid()
    ))
  );

-- Policy 3: Owners can UPDATE translations for their entities
CREATE POLICY "Owners can update translations"
  ON translations FOR UPDATE
  TO authenticated
  USING (
    -- For restaurants
    (entity_type = 'restaurant' AND EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = translations.entity_id
        AND restaurants.owner_id = auth.uid()
    ))
    OR
    -- For menus
    (entity_type = 'menu' AND EXISTS (
      SELECT 1 FROM menus
      JOIN restaurants ON restaurants.id = menus.restaurant_id
      WHERE menus.id = translations.entity_id
        AND restaurants.owner_id = auth.uid()
    ))
    OR
    -- For categories
    (entity_type = 'category' AND EXISTS (
      SELECT 1 FROM categories
      JOIN menus ON menus.id = categories.menu_id
      JOIN restaurants ON restaurants.id = menus.restaurant_id
      WHERE categories.id = translations.entity_id
        AND restaurants.owner_id = auth.uid()
    ))
    OR
    -- For menu items
    (entity_type = 'menu_item' AND EXISTS (
      SELECT 1 FROM menu_items
      JOIN categories ON categories.id = menu_items.category_id
      JOIN menus ON menus.id = categories.menu_id
      JOIN restaurants ON restaurants.id = menus.restaurant_id
      WHERE menu_items.id = translations.entity_id
        AND restaurants.owner_id = auth.uid()
    ))
  )
  WITH CHECK (
    -- For restaurants
    (entity_type = 'restaurant' AND EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = translations.entity_id
        AND restaurants.owner_id = auth.uid()
    ))
    OR
    -- For menus
    (entity_type = 'menu' AND EXISTS (
      SELECT 1 FROM menus
      JOIN restaurants ON restaurants.id = menus.restaurant_id
      WHERE menus.id = translations.entity_id
        AND restaurants.owner_id = auth.uid()
    ))
    OR
    -- For categories
    (entity_type = 'category' AND EXISTS (
      SELECT 1 FROM categories
      JOIN menus ON menus.id = categories.menu_id
      JOIN restaurants ON restaurants.id = menus.restaurant_id
      WHERE categories.id = translations.entity_id
        AND restaurants.owner_id = auth.uid()
    ))
    OR
    -- For menu items
    (entity_type = 'menu_item' AND EXISTS (
      SELECT 1 FROM menu_items
      JOIN categories ON categories.id = menu_items.category_id
      JOIN menus ON menus.id = categories.menu_id
      JOIN restaurants ON restaurants.id = menus.restaurant_id
      WHERE menu_items.id = translations.entity_id
        AND restaurants.owner_id = auth.uid()
    ))
  );

-- Policy 4: Owners can DELETE translations for their entities
CREATE POLICY "Owners can delete translations"
  ON translations FOR DELETE
  TO authenticated
  USING (
    -- For restaurants
    (entity_type = 'restaurant' AND EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = translations.entity_id
        AND restaurants.owner_id = auth.uid()
    ))
    OR
    -- For menus
    (entity_type = 'menu' AND EXISTS (
      SELECT 1 FROM menus
      JOIN restaurants ON restaurants.id = menus.restaurant_id
      WHERE menus.id = translations.entity_id
        AND restaurants.owner_id = auth.uid()
    ))
    OR
    -- For categories
    (entity_type = 'category' AND EXISTS (
      SELECT 1 FROM categories
      JOIN menus ON menus.id = categories.menu_id
      JOIN restaurants ON restaurants.id = menus.restaurant_id
      WHERE categories.id = translations.entity_id
        AND restaurants.owner_id = auth.uid()
    ))
    OR
    -- For menu items
    (entity_type = 'menu_item' AND EXISTS (
      SELECT 1 FROM menu_items
      JOIN categories ON categories.id = menu_items.category_id
      JOIN menus ON menus.id = categories.menu_id
      JOIN restaurants ON restaurants.id = menus.restaurant_id
      WHERE menu_items.id = translations.entity_id
        AND restaurants.owner_id = auth.uid()
    ))
  );

-- Policy 5: Public can SELECT all translations (needed for public menu display)
CREATE POLICY "Public can read translations"
  ON translations FOR SELECT
  TO anon, authenticated
  USING (true);

-- ─── Step 4: Verify RLS is enabled on all tables ───
-- (These should already be enabled, but we ensure it)

ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;

-- ─── Step 5: Storage policies (ensure menu-items bucket has correct policies) ───

-- Drop existing storage policies for menu-items bucket
DROP POLICY IF EXISTS "Public can read menu item images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload menu item images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update menu item images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete menu item images" ON storage.objects;

-- Recreate storage policies for menu-items bucket
CREATE POLICY "Public can read menu item images"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'menu-items');

CREATE POLICY "Authenticated users can upload menu item images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'menu-items');

CREATE POLICY "Authenticated users can update menu item images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'menu-items')
  WITH CHECK (bucket_id = 'menu-items');

CREATE POLICY "Authenticated users can delete menu item images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'menu-items');

-- ─── Verification queries (run these manually to verify) ───
-- 
-- Check RLS status:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('restaurants', 'menus', 'categories', 'menu_items', 'translations');
--
-- List all policies:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename IN ('restaurants', 'menus', 'categories', 'menu_items', 'translations')
-- ORDER BY tablename, policyname;
