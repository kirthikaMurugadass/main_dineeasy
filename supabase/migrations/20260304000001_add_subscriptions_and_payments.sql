-- Add subscriptions + payments tables if missing (safe for existing DBs)
-- Fixes: PGRST205 Could not find the table 'public.payments' in the schema cache

-- Restaurants plan fields (safe if already present)
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS plan_type TEXT NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS billing_cycle TEXT,
  ADD COLUMN IF NOT EXISTS plan_status TEXT NOT NULL DEFAULT 'active';

-- Subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL,
  billing_cycle TEXT,
  status TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_restaurant
  ON public.subscriptions(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status
  ON public.subscriptions(status);

-- Payments
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_restaurant
  ON public.payments(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_payments_status
  ON public.payments(status);

CREATE INDEX IF NOT EXISTS idx_payments_created_at
  ON public.payments(created_at DESC);

-- RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can view their subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Owners can manage their subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Owners can view their payments" ON public.payments;

CREATE POLICY "Owners can view their subscriptions"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurants
      WHERE public.restaurants.id = public.subscriptions.restaurant_id
        AND public.restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can manage their subscriptions"
  ON public.subscriptions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurants
      WHERE public.restaurants.id = public.subscriptions.restaurant_id
        AND public.restaurants.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.restaurants
      WHERE public.restaurants.id = public.subscriptions.restaurant_id
        AND public.restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can view their payments"
  ON public.payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurants
      WHERE public.restaurants.id = public.payments.restaurant_id
        AND public.restaurants.owner_id = auth.uid()
    )
  );

-- Realtime plan updates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurants';
    EXCEPTION WHEN duplicate_object THEN
      -- already added
      NULL;
    END;
  END IF;
END $$;

ALTER TABLE public.restaurants REPLICA IDENTITY FULL;

-- Refresh PostgREST schema cache (so new tables appear immediately)
NOTIFY pgrst, 'reload schema';

