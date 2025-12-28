import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe key missing");
  }
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
}