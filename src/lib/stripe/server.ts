import Stripe from "stripe";

let cached: Stripe | null = null;

export function getStripeServer() {
  if (cached) return cached;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY in environment");
  }
  cached = new Stripe(secretKey, {
    apiVersion: "2026-02-25.clover",
    typescript: true,
  });
  return cached;
}

