-- ============================================
-- DineEasy — Complete Database Schema
-- ============================================
-- This file contains the complete database schema for DineEasy,
-- including all tables, constraints, indexes, triggers, RLS policies,
-- and storage configuration.
--
-- Execution Order:
-- 1. Extensions
-- 2. Tables
-- 3. Indexes
-- 4. Constraints
-- 5. Triggers
-- 6. Row Level Security (RLS)
-- 7. Storage Buckets
-- 8. Storage Policies
--
-- Generated: 2024-02-06
-- ============================================

-- ──────────────────────────────────────────────────────────────────
-- 1. EXTENSIONS
-- ──────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ──────────────────────────────────────────────────────────────────
-- 2. TABLES
-- ──────────────────────────────────────────────────────────────────

-- ─── Restaurants ───
CREATE TABLE restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  qr_url TEXT,
  qr_svg TEXT,
  qr_png TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Menus ───
CREATE TABLE menus (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Categories ───
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_id UUID NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Menu Items ───
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  price_chf DECIMAL(10, 2) NOT NULL DEFAULT 0,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Translations ───
CREATE TABLE translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('restaurant', 'menu', 'category', 'menu_item')),
  entity_id UUID NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('de', 'en', 'fr', 'it')),
  title TEXT NOT NULL DEFAULT '',
  description TEXT,
  UNIQUE(entity_type, entity_id, language)
);

-- ──────────────────────────────────────────────────────────────────
-- 3. INDEXES
-- ──────────────────────────────────────────────────────────────────

CREATE INDEX idx_restaurants_slug ON restaurants(slug);
CREATE INDEX idx_restaurants_owner ON restaurants(owner_id);
CREATE INDEX idx_menus_restaurant ON menus(restaurant_id);
CREATE INDEX idx_categories_menu ON categories(menu_id);
CREATE INDEX idx_menu_items_category ON menu_items(category_id);
CREATE INDEX idx_translations_entity ON translations(entity_type, entity_id);
CREATE INDEX idx_translations_language ON translations(language);

-- ──────────────────────────────────────────────────────────────────
-- 4. CONSTRAINTS & DATA MIGRATIONS
-- ──────────────────────────────────────────────────────────────────

-- One menu per restaurant (1:1 relationship)
-- Step 1: Clean up duplicate menus (keep only the first by created_at)
-- This is a one-time data migration for existing databases
DELETE FROM menus m1
WHERE EXISTS (
  SELECT 1 FROM menus m2
  WHERE m2.restaurant_id = m1.restaurant_id
    AND m2.created_at < m1.created_at
);

-- Step 2: Drop old unique constraint if it exists
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

-- Back-fill existing restaurants with their QR URL
UPDATE restaurants
SET qr_url = '/r/' || slug
WHERE qr_url IS NULL;

-- ──────────────────────────────────────────────────────────────────
-- 5. TRIGGERS
-- ──────────────────────────────────────────────────────────────────

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER trigger_restaurants_updated_at
  BEFORE UPDATE ON restaurants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_menus_updated_at
  BEFORE UPDATE ON menus
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ──────────────────────────────────────────────────────────────────
-- 6. ROW LEVEL SECURITY (RLS)
-- ──────────────────────────────────────────────────────────────────

-- Enable RLS on all tables
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;

-- Drop old policies (if they exist from previous migrations)
DROP POLICY IF EXISTS "Owners can manage own restaurants" ON restaurants;
DROP POLICY IF EXISTS "Public can read restaurants" ON restaurants;
DROP POLICY IF EXISTS "Owners can manage menus" ON menus;
DROP POLICY IF EXISTS "Public can read active menus" ON menus;
DROP POLICY IF EXISTS "Owners can manage categories" ON categories;
DROP POLICY IF EXISTS "Public can read active categories" ON categories;
DROP POLICY IF EXISTS "Owners can manage menu items" ON menu_items;
DROP POLICY IF EXISTS "Public can read active menu items" ON menu_items;
DROP POLICY IF EXISTS "Owners can manage translations" ON translations;
DROP POLICY IF EXISTS "Public can read translations" ON translations;

-- ─── RESTAURANTS POLICIES ───

-- Policy 1: Authenticated users can INSERT their own restaurants
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

-- ─── MENUS POLICIES ───

-- Policy 1: Authenticated users can INSERT menus for their restaurants
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

-- ─── CATEGORIES POLICIES ───

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

-- ─── MENU ITEMS POLICIES ───

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

-- ─── TRANSLATIONS POLICIES ───

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

-- ──────────────────────────────────────────────────────────────────
-- 7. STORAGE BUCKETS
-- ──────────────────────────────────────────────────────────────────

-- Public bucket for general uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('public', 'public', true)
ON CONFLICT (id) DO NOTHING;

-- Menu items bucket for menu item images (no size limit)
INSERT INTO storage.buckets (id, name, public, allowed_mime_types)
VALUES (
  'menu-items',
  'menu-items',
  true,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ──────────────────────────────────────────────────────────────────
-- 8. STORAGE POLICIES
-- ──────────────────────────────────────────────────────────────────

-- Drop existing storage policies to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Public can read storage" ON storage.objects;
DROP POLICY IF EXISTS "Owners can update/delete own uploads" ON storage.objects;
DROP POLICY IF EXISTS "Owners can delete own uploads" ON storage.objects;
DROP POLICY IF EXISTS "Public can read menu item images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload menu item images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update menu item images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete menu item images" ON storage.objects;

-- ─── Public Bucket Policies ───

-- Authenticated users can upload to public bucket
CREATE POLICY "Authenticated users can upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'public');

-- Public can read from public bucket
CREATE POLICY "Public can read storage"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'public');

-- Authenticated users can update their uploads in public bucket
CREATE POLICY "Owners can update/delete own uploads"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'public')
  WITH CHECK (bucket_id = 'public');

-- Authenticated users can delete their uploads in public bucket
CREATE POLICY "Owners can delete own uploads"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'public');

-- ─── Menu Items Bucket Policies ───

-- Public can read menu item images
CREATE POLICY "Public can read menu item images"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'menu-items');

-- Authenticated users can upload menu item images
CREATE POLICY "Authenticated users can upload menu item images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'menu-items');

-- Authenticated users can update menu item images
CREATE POLICY "Authenticated users can update menu item images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'menu-items')
  WITH CHECK (bucket_id = 'menu-items');

-- Authenticated users can delete menu item images
CREATE POLICY "Authenticated users can delete menu item images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'menu-items');

-- ============================================
-- END OF SCHEMA
-- ============================================
--
-- Optional: Run seed.sql for development/test data
-- This file is kept separate and should be run manually if needed.
-- See: supabase/seed.sql
