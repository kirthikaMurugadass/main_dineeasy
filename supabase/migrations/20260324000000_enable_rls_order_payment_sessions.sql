-- Enable RLS + secure policies for Stripe order payment session staging.
-- This table may contain sensitive JSON payloads, so it must never be publicly readable.

ALTER TABLE public.order_payment_sessions ENABLE ROW LEVEL SECURITY;

-- Lock down privileges (RLS policies still require grants).
REVOKE ALL ON TABLE public.order_payment_sessions FROM anon;
REVOKE ALL ON TABLE public.order_payment_sessions FROM authenticated;

GRANT SELECT, INSERT ON TABLE public.order_payment_sessions TO authenticated;
-- Service role is used by backend/server (e.g., Stripe verify/webhook) and must have full access.
GRANT ALL ON TABLE public.order_payment_sessions TO service_role;

-- Drop any previous policies (idempotent).
DROP POLICY IF EXISTS "Service role full access to order payment sessions" ON public.order_payment_sessions;
DROP POLICY IF EXISTS "Authenticated can insert payment sessions" ON public.order_payment_sessions;
DROP POLICY IF EXISTS "Restaurant owners can view payment sessions for their orders" ON public.order_payment_sessions;

-- 1) Backend/service role: full access (webhooks / server-side confirmation).
CREATE POLICY "Service role full access to order payment sessions"
  ON public.order_payment_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2) Authenticated users can insert pending sessions only.
-- We only allow inserts for sessions that are not yet linked to an order,
-- and we require a valid restaurantId in the payload to prevent garbage rows.
CREATE POLICY "Authenticated can insert payment sessions"
  ON public.order_payment_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    order_id IS NULL
    AND jsonb_typeof(payload) = 'object'
    AND (payload ? 'restaurantId')
    AND EXISTS (
      SELECT 1
      FROM public.restaurants r
      WHERE r.id = (payload->>'restaurantId')::uuid
    )
  );

-- 3) Authenticated SELECT is restricted.
-- Since orders in this schema are owned/visible to restaurant owners (via restaurants.owner_id),
-- only the restaurant owner can view payment sessions once they are linked to an order.
-- (Customers do not get access to this table.)
CREATE POLICY "Restaurant owners can view payment sessions for their orders"
  ON public.order_payment_sessions
  FOR SELECT
  TO authenticated
  USING (
    order_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.orders o
      JOIN public.restaurants r ON r.id = o.restaurant_id
      WHERE o.id = order_payment_sessions.order_id
        AND r.owner_id = auth.uid()
    )
  );

