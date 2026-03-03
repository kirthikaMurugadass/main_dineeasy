-- ============================================
-- DineEasy — Enable Realtime for bookings & table_locks
-- ============================================

-- Ensure publication exists (created by Supabase)
-- Enable Realtime for bookings and table_locks
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE table_locks;

-- Ensure detailed change events for table_locks
ALTER TABLE table_locks REPLICA IDENTITY FULL;

