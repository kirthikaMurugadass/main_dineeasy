-- ============================================
-- Add QR code columns to restaurants table
-- ============================================
-- Each restaurant gets one permanent QR code
-- pointing to /r/[slug] for the public menu.

ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS qr_url  TEXT,
  ADD COLUMN IF NOT EXISTS qr_svg  TEXT,
  ADD COLUMN IF NOT EXISTS qr_png  TEXT;

-- Back-fill existing restaurants with their QR URL
UPDATE restaurants
SET qr_url = '/r/' || slug
WHERE qr_url IS NULL;
