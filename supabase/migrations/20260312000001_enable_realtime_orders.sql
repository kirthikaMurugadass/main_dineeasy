-- Enable Supabase Realtime for orders (and keep bookings idempotent)

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE orders;
  EXCEPTION
    WHEN duplicate_object THEN
      -- already added
      NULL;
    WHEN undefined_object THEN
      -- publication doesn't exist in some local setups
      NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
  END;
END $$;

