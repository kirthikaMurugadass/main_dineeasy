import { loadStripe, type Stripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripeJs() {
  if (!stripePromise) {
    const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!pk) {
      throw new Error("Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in environment");
    }
    stripePromise = loadStripe(pk);
  }
  return stripePromise;
}

