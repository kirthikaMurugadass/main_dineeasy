import { getStripeJs } from "@/lib/stripe/client";

export async function redirectToCheckoutSession(opts: {
  sessionId?: string | null;
  url?: string | null;
}) {
  const sessionId = opts.sessionId ?? null;
  const url = opts.url ?? null;

  // Newer Stripe.js builds have removed redirectToCheckout (your toast shows this),
  // but Checkout sessions still provide a hosted URL we can redirect to safely.
  if (url) {
    try {
      const stripe = await getStripeJs();
      if (stripe && typeof (stripe as any).redirectToCheckout === "function" && sessionId) {
        const res = await (stripe as any).redirectToCheckout({ sessionId });
        if (!res?.error) return;
        // Fall through to URL redirect if Stripe.js reports unsupported.
      }
    } catch {
      // Fall through to URL redirect
    }

    window.location.href = url;
    return;
  }

  // If no URL is provided, we can only attempt sessionId redirect (may be unsupported).
  if (!sessionId) throw new Error("Missing Stripe sessionId");
  const stripe = await getStripeJs();
  if (!stripe) throw new Error("Stripe failed to initialize");
  const { error } = await (stripe as any).redirectToCheckout({ sessionId });
  if (error) throw error;
}

