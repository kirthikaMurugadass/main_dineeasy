-- Add image_url column to categories table for category banner images
ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url TEXT;
