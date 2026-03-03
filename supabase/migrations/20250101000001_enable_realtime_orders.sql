-- ============================================
-- Enable Realtime for Orders Table
-- ============================================
-- This migration enables Supabase Realtime for the orders table
-- Required for real-time order notifications
-- ============================================

-- Enable realtime publication for orders table
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- Set replica identity to FULL for realtime to work properly
-- This ensures all column values are included in change events
ALTER TABLE orders REPLICA IDENTITY FULL;
