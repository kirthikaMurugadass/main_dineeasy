-- ============================================
-- DineEasy — Add Delivery Fields to Orders
-- ============================================
-- Adds delivery_address and phone_number columns
-- to support takeaway orders with delivery information
-- ============================================

-- Add delivery_address column (nullable for dine-in orders)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS delivery_address TEXT;

-- Add phone_number column (nullable, optional for takeaway orders)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Add index for delivery_address queries (optional, for future filtering)
CREATE INDEX IF NOT EXISTS idx_orders_delivery_address 
ON orders(delivery_address) 
WHERE delivery_address IS NOT NULL;
