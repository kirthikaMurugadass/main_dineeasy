-- ============================================
-- Menu Items image storage bucket + policies
-- ============================================

-- Create a dedicated bucket for menu item images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'menu-items',
  'menu-items',
  true,
  5242880,  -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Public can read all images
CREATE POLICY "Public can read menu item images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'menu-items');

-- Authenticated users can upload images
CREATE POLICY "Authenticated users can upload menu item images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'menu-items');

-- Authenticated users can update their uploads
CREATE POLICY "Authenticated users can update menu item images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'menu-items');

-- Authenticated users can delete their uploads
CREATE POLICY "Authenticated users can delete menu item images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'menu-items');
