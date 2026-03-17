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
  image_url TEXT,
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
-- 7. ADDITIONAL TABLES, COLUMNS, AND POLICIES (Post-2024 Migrations)
--    Merged from individual migration files in (approximate)
--    chronological order, while avoiding duplicate definitions.
-- ──────────────────────────────────────────────────────────────────

-- 7.1 Bookings table and policies
-- Source: 20250101000002_create_bookings_table.sql
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

CREATE INDEX IF NOT EXISTS idx_bookings_restaurant ON bookings(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);

CREATE TRIGGER trigger_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Restaurant owners can view their bookings" ON bookings;
DROP POLICY IF EXISTS "Restaurant owners can update their bookings" ON bookings;
DROP POLICY IF EXISTS "Public can insert bookings" ON bookings;

CREATE POLICY "Restaurant owners can view their bookings"
  ON bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = bookings.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "Public can insert bookings"
  ON bookings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Restaurant owners can update their bookings"
  ON bookings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = bookings.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

-- 7.2 Email column for bookings
-- Source: 20250101000003_add_email_to_bookings.sql
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS email TEXT;

CREATE INDEX IF NOT EXISTS idx_bookings_email ON bookings(email);

-- 7.3 Restaurant tables and table locks
-- Source: 20250101000004_create_restaurant_tables_and_table_locks.sql
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

CREATE TRIGGER trigger_restaurant_tables_updated_at
  BEFORE UPDATE ON restaurant_tables
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_locks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read restaurant tables" ON restaurant_tables;
CREATE POLICY "Public can read restaurant tables"
  ON restaurant_tables FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "Public can read table locks" ON table_locks;
DROP POLICY IF EXISTS "Public can write table locks" ON table_locks;

CREATE POLICY "Public can read table locks"
  ON table_locks FOR SELECT
  USING (TRUE);

CREATE POLICY "Public can write table locks"
  ON table_locks FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);

-- 7.4 table_id on bookings
-- Source: 20250101000005_add_table_id_to_bookings.sql
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS table_id UUID REFERENCES restaurant_tables(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_table_date_time
  ON bookings(table_id, booking_date, booking_time);

-- 7.5 Section column and ownership policy for restaurant tables
-- Sources: 20250101000007_add_section_to_restaurant_tables.sql
--          20250101000008_allow_owners_manage_restaurant_tables.sql
ALTER TABLE restaurant_tables
ADD COLUMN IF NOT EXISTS section TEXT;

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

-- 7.6 Realtime support for bookings and table_locks
-- Source: 20250101000006_enable_realtime_bookings_and_table_locks.sql
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE table_locks;

ALTER TABLE table_locks REPLICA IDENTITY FULL;

-- 7.7 Orders and order_items tables with policies
-- Source: 20260302000000_add_orders_tables.sql
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  order_type TEXT NOT NULL CHECK (order_type IN ('dine_in', 'takeaway')),
  table_number INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_item ON order_items(item_id);

CREATE TRIGGER trigger_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Restaurant owners can view their orders" ON orders;
DROP POLICY IF EXISTS "Restaurant owners can insert orders" ON orders;
DROP POLICY IF EXISTS "Restaurant owners can update their orders" ON orders;
DROP POLICY IF EXISTS "Public can insert orders" ON orders;
DROP POLICY IF EXISTS "Restaurant owners can view order items" ON order_items;
DROP POLICY IF EXISTS "Public can insert order items" ON order_items;

CREATE POLICY "Restaurant owners can view their orders"
  ON orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = orders.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "Public can insert orders"
  ON orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Restaurant owners can update their orders"
  ON orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = orders.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "Restaurant owners can view order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      JOIN restaurants ON restaurants.id = orders.restaurant_id
      WHERE orders.id = order_items.order_id
      AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "Public can insert order items"
  ON order_items FOR INSERT
  WITH CHECK (true);

-- 7.8 Additional delivery fields for orders
-- Source: 20250101000000_add_delivery_fields_to_orders.sql
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS delivery_address TEXT;

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS phone_number TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_delivery_address 
ON orders(delivery_address) 
WHERE delivery_address IS NOT NULL;

-- 7.9 Realtime support for orders
-- Source: 20250101000001_enable_realtime_orders.sql
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

ALTER TABLE orders REPLICA IDENTITY FULL;

-- 7.10 Password reset tokens table
-- Source: 20260227000100_add_password_reset_tokens.sql
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id
  ON password_reset_tokens(user_id);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token_hash
  ON password_reset_tokens(token_hash);

-- 7.11 Subscriptions, payments, and restaurant plan fields
-- Source: 20260303000000_add_subscriptions_and_payments.sql
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS plan_type TEXT NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS billing_cycle TEXT,
  ADD COLUMN IF NOT EXISTS plan_status TEXT NOT NULL DEFAULT 'active';

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL,
  billing_cycle TEXT,
  status TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_restaurant
  ON subscriptions(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status
  ON subscriptions(status);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_restaurant
  ON payments(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_payments_status
  ON payments(status);

CREATE INDEX IF NOT EXISTS idx_payments_created_at
  ON payments(created_at DESC);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can view their subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Owners can manage their subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Owners can view their payments" ON payments;

CREATE POLICY "Owners can view their subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = subscriptions.restaurant_id
        AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can manage their subscriptions"
  ON subscriptions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = subscriptions.restaurant_id
        AND restaurants.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = subscriptions.restaurant_id
        AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can view their payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = payments.restaurant_id
        AND restaurants.owner_id = auth.uid()
    )
  );

ALTER PUBLICATION supabase_realtime ADD TABLE restaurants;

ALTER TABLE restaurants REPLICA IDENTITY FULL;

-- ──────────────────────────────────────────────────────────────────
-- 8. STORAGE BUCKETS
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
-- 9. STORAGE POLICIES
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

-- Optional: Run seed.sql for development/test data
-- This file is kept separate and should be run manually if needed.
-- See: supabase/seed.sql
