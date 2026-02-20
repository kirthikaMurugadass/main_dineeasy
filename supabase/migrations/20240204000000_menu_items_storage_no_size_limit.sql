-- Remove file size limit from menu-items bucket (set to 500 MB)
UPDATE storage.buckets
SET file_size_limit = 524288000
WHERE id = 'menu-items';
