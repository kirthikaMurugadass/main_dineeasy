-- ============================================
-- DineEasy — Add Email to Bookings
-- ============================================
-- Adds customer email column to bookings table
-- ============================================

-- Add email column (nullable first for existing records)
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS email TEXT;

-- Update existing records to have a placeholder email if null (optional - you may want to handle this differently)
-- UPDATE bookings SET email = 'unknown@example.com' WHERE email IS NULL;

-- Make email NOT NULL for new records (after updating existing ones)
-- Note: If you have existing bookings without emails, you'll need to handle them first
-- For now, we'll keep it nullable but the API will enforce it

-- Optional index for faster lookups by email
CREATE INDEX IF NOT EXISTS idx_bookings_email ON bookings(email);

