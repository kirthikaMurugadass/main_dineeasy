-- Stores pending Stripe Checkout orders by session_id so we can confirm the order after redirect.
CREATE TABLE IF NOT EXISTS public.order_payment_sessions (
  session_id TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  order_id UUID NULL REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_payment_sessions_created_at
  ON public.order_payment_sessions(created_at DESC);

