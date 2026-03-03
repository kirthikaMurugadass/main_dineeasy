-- ============================================
-- DineEasy — Add section to restaurant_tables
-- ============================================

ALTER TABLE restaurant_tables
ADD COLUMN IF NOT EXISTS section TEXT;

