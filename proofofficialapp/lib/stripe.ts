import Stripe from "stripe";

export function getStripe(): Stripe | null {
  const secret = process.env.STRIPE_SECRET_KEY;
  return secret ? new Stripe(secret) : null;
}
