-- ============================================
-- DineEasy Phase 1 — Supabase Database Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

CREATE INDEX idx_restaurants_slug ON restaurants(slug);
CREATE INDEX idx_restaurants_owner ON restaurants(owner_id);

-- ─── Menus ───
CREATE TABLE menus (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(restaurant_id, slug)
);

CREATE INDEX idx_menus_restaurant ON menus(restaurant_id);

-- ─── Categories ───
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_id UUID NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_categories_menu ON categories(menu_id);

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

CREATE INDEX idx_menu_items_category ON menu_items(category_id);

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

CREATE INDEX idx_translations_entity ON translations(entity_type, entity_id);
CREATE INDEX idx_translations_language ON translations(language);

-- ─── Row Level Security ───

ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;

-- Restaurants: owners can manage their own, public can read
CREATE POLICY "Owners can manage own restaurants"
  ON restaurants FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Public can read restaurants"
  ON restaurants FOR SELECT
  USING (true);

-- Menus: restaurant owners can manage, public can read active
CREATE POLICY "Owners can manage menus"
  ON menus FOR ALL
  USING (
    restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid())
  );

CREATE POLICY "Public can read active menus"
  ON menus FOR SELECT
  USING (is_active = true);

-- Categories: menu owners can manage, public can read active
CREATE POLICY "Owners can manage categories"
  ON categories FOR ALL
  USING (
    menu_id IN (
      SELECT m.id FROM menus m
      JOIN restaurants r ON r.id = m.restaurant_id
      WHERE r.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    menu_id IN (
      SELECT m.id FROM menus m
      JOIN restaurants r ON r.id = m.restaurant_id
      WHERE r.owner_id = auth.uid()
    )
  );

CREATE POLICY "Public can read active categories"
  ON categories FOR SELECT
  USING (is_active = true);

-- Menu Items: category owners can manage, public can read active
CREATE POLICY "Owners can manage menu items"
  ON menu_items FOR ALL
  USING (
    category_id IN (
      SELECT c.id FROM categories c
      JOIN menus m ON m.id = c.menu_id
      JOIN restaurants r ON r.id = m.restaurant_id
      WHERE r.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    category_id IN (
      SELECT c.id FROM categories c
      JOIN menus m ON m.id = c.menu_id
      JOIN restaurants r ON r.id = m.restaurant_id
      WHERE r.owner_id = auth.uid()
    )
  );

CREATE POLICY "Public can read active menu items"
  ON menu_items FOR SELECT
  USING (is_active = true);

-- Translations: entity owners can manage, public can read
CREATE POLICY "Owners can manage translations"
  ON translations FOR ALL
  USING (
    entity_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid())
    OR entity_id IN (
      SELECT m.id FROM menus m
      JOIN restaurants r ON r.id = m.restaurant_id
      WHERE r.owner_id = auth.uid()
    )
    OR entity_id IN (
      SELECT c.id FROM categories c
      JOIN menus m ON m.id = c.menu_id
      JOIN restaurants r ON r.id = m.restaurant_id
      WHERE r.owner_id = auth.uid()
    )
    OR entity_id IN (
      SELECT mi.id FROM menu_items mi
      JOIN categories c ON c.id = mi.category_id
      JOIN menus m ON m.id = c.menu_id
      JOIN restaurants r ON r.id = m.restaurant_id
      WHERE r.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    entity_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid())
    OR entity_id IN (
      SELECT m.id FROM menus m
      JOIN restaurants r ON r.id = m.restaurant_id
      WHERE r.owner_id = auth.uid()
    )
    OR entity_id IN (
      SELECT c.id FROM categories c
      JOIN menus m ON m.id = c.menu_id
      JOIN restaurants r ON r.id = m.restaurant_id
      WHERE r.owner_id = auth.uid()
    )
    OR entity_id IN (
      SELECT mi.id FROM menu_items mi
      JOIN categories c ON c.id = mi.category_id
      JOIN menus m ON m.id = c.menu_id
      JOIN restaurants r ON r.id = m.restaurant_id
      WHERE r.owner_id = auth.uid()
    )
  );

CREATE POLICY "Public can read translations"
  ON translations FOR SELECT
  USING (true);

-- ─── Updated at trigger ───
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_restaurants_updated_at
  BEFORE UPDATE ON restaurants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_menus_updated_at
  BEFORE UPDATE ON menus
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ─── Storage bucket for uploads ───
INSERT INTO storage.buckets (id, name, public)
VALUES ('public', 'public', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: authenticated users can upload
CREATE POLICY "Authenticated users can upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'public');

CREATE POLICY "Public can read storage"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'public');

CREATE POLICY "Owners can update/delete own uploads"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'public');

CREATE POLICY "Owners can delete own uploads"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'public');
