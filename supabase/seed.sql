-- ============================================
-- DineEasy — Local Development Seed Data
-- ============================================
-- This file runs after migrations during `supabase db reset`.
-- It creates a test user and a sample restaurant with menu data.
--
-- Test user credentials:
--   Email:    dev@dineeasy.local
--   Password: password123

-- Create test user via Supabase auth schema
INSERT INTO auth.users (
  instance_id, id, aud, role, email,
  encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'authenticated', 'authenticated', 'dev@dineeasy.local',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Dev User"}',
  now(), now(), ''
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (
  id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  jsonb_build_object('sub', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'email', 'dev@dineeasy.local'),
  'email', now(), now(), now()
)
ON CONFLICT DO NOTHING;

-- Sample restaurant
INSERT INTO restaurants (id, name, slug, owner_id, theme_config, qr_url)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Café Helvetia',
  'cafe-helvetia',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  '{"primaryColor":"#3E2723","accentColor":"#C5A572","fontFamily":"serif","borderRadius":"lg"}',
  '/r/cafe-helvetia'
);

-- Sample menu
INSERT INTO menus (id, restaurant_id, slug, is_active)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'hauptmenu',
  true
);

-- Categories
INSERT INTO categories (id, menu_id, sort_order, is_active) VALUES
  ('33333333-3333-3333-3333-333333333001', '22222222-2222-2222-2222-222222222222', 0, true),
  ('33333333-3333-3333-3333-333333333002', '22222222-2222-2222-2222-222222222222', 1, true),
  ('33333333-3333-3333-3333-333333333003', '22222222-2222-2222-2222-222222222222', 2, true);

-- Menu items
INSERT INTO menu_items (id, category_id, price_chf, sort_order, is_active) VALUES
  ('44444444-4444-4444-4444-444444444001', '33333333-3333-3333-3333-333333333001', 4.50, 0, true),
  ('44444444-4444-4444-4444-444444444002', '33333333-3333-3333-3333-333333333001', 5.80, 1, true),
  ('44444444-4444-4444-4444-444444444003', '33333333-3333-3333-3333-333333333001', 5.50, 2, true),
  ('44444444-4444-4444-4444-444444444004', '33333333-3333-3333-3333-333333333002', 3.90, 0, true),
  ('44444444-4444-4444-4444-444444444005', '33333333-3333-3333-3333-333333333002', 4.20, 1, true),
  ('44444444-4444-4444-4444-444444444006', '33333333-3333-3333-3333-333333333003', 16.50, 0, true),
  ('44444444-4444-4444-4444-444444444007', '33333333-3333-3333-3333-333333333003', 14.80, 1, true);

-- Translations: Restaurant
INSERT INTO translations (entity_type, entity_id, language, title, description) VALUES
  ('restaurant', '11111111-1111-1111-1111-111111111111', 'de', 'Café Helvetia', 'Gemütliches Café im Herzen von Zürich'),
  ('restaurant', '11111111-1111-1111-1111-111111111111', 'en', 'Café Helvetia', 'Cozy café in the heart of Zurich'),
  ('restaurant', '11111111-1111-1111-1111-111111111111', 'fr', 'Café Helvetia', 'Café cosy au cœur de Zurich'),
  ('restaurant', '11111111-1111-1111-1111-111111111111', 'it', 'Café Helvetia', 'Caffè accogliente nel cuore di Zurigo');

-- Translations: Menu
INSERT INTO translations (entity_type, entity_id, language, title, description) VALUES
  ('menu', '22222222-2222-2222-2222-222222222222', 'de', 'Hauptmenü', NULL),
  ('menu', '22222222-2222-2222-2222-222222222222', 'en', 'Main Menu', NULL),
  ('menu', '22222222-2222-2222-2222-222222222222', 'fr', 'Menu Principal', NULL),
  ('menu', '22222222-2222-2222-2222-222222222222', 'it', 'Menu Principale', NULL);

-- Translations: Categories
INSERT INTO translations (entity_type, entity_id, language, title, description) VALUES
  ('category', '33333333-3333-3333-3333-333333333001', 'de', 'Kaffee', NULL),
  ('category', '33333333-3333-3333-3333-333333333001', 'en', 'Coffee', NULL),
  ('category', '33333333-3333-3333-3333-333333333001', 'fr', 'Café', NULL),
  ('category', '33333333-3333-3333-3333-333333333001', 'it', 'Caffè', NULL),
  ('category', '33333333-3333-3333-3333-333333333002', 'de', 'Gebäck', NULL),
  ('category', '33333333-3333-3333-3333-333333333002', 'en', 'Pastries', NULL),
  ('category', '33333333-3333-3333-3333-333333333002', 'fr', 'Viennoiseries', NULL),
  ('category', '33333333-3333-3333-3333-333333333002', 'it', 'Pasticceria', NULL),
  ('category', '33333333-3333-3333-3333-333333333003', 'de', 'Mittagessen', NULL),
  ('category', '33333333-3333-3333-3333-333333333003', 'en', 'Lunch', NULL),
  ('category', '33333333-3333-3333-3333-333333333003', 'fr', 'Déjeuner', NULL),
  ('category', '33333333-3333-3333-3333-333333333003', 'it', 'Pranzo', NULL);

-- Translations: Menu Items
INSERT INTO translations (entity_type, entity_id, language, title, description) VALUES
  ('menu_item', '44444444-4444-4444-4444-444444444001', 'de', 'Espresso', 'Kräftiger einzelner Shot'),
  ('menu_item', '44444444-4444-4444-4444-444444444001', 'en', 'Espresso', 'Rich & bold single shot'),
  ('menu_item', '44444444-4444-4444-4444-444444444002', 'de', 'Flat White', 'Samtiger Mikroschaum'),
  ('menu_item', '44444444-4444-4444-4444-444444444002', 'en', 'Flat White', 'Velvety microfoam'),
  ('menu_item', '44444444-4444-4444-4444-444444444003', 'de', 'Cappuccino', 'Klassische italienische Perfektion'),
  ('menu_item', '44444444-4444-4444-4444-444444444003', 'en', 'Cappuccino', 'Classic Italian perfection'),
  ('menu_item', '44444444-4444-4444-4444-444444444004', 'de', 'Croissant', 'Buttrig & blättrig'),
  ('menu_item', '44444444-4444-4444-4444-444444444004', 'en', 'Croissant', 'Buttery & flaky'),
  ('menu_item', '44444444-4444-4444-4444-444444444005', 'de', 'Schokoladencroissant', 'Mit Zartbitterschokolade gefüllt'),
  ('menu_item', '44444444-4444-4444-4444-444444444005', 'en', 'Pain au Chocolat', 'Dark chocolate filled'),
  ('menu_item', '44444444-4444-4444-4444-444444444006', 'de', 'Avocado Toast', 'Sauerteig, pochiertes Ei'),
  ('menu_item', '44444444-4444-4444-4444-444444444006', 'en', 'Avocado Toast', 'Sourdough, poached egg'),
  ('menu_item', '44444444-4444-4444-4444-444444444007', 'de', 'Caesar Salat', 'Romanasalat, Parmesan, Croutons'),
  ('menu_item', '44444444-4444-4444-4444-444444444007', 'en', 'Caesar Salad', 'Romaine, parmesan, croutons');
