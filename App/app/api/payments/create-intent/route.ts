import { getStripeClient } from "../../../../../lib/payments/stripe";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, currency } = body;

    if (!Number.isInteger(amount) || amount <= 0) {
      return Response.json({ ok: false, error: "Invalid amount" }, { status: 400 });
    }
    if (!currency || currency.length !== 3) {
      return Response.json({ ok: false, error: "Invalid currency" }, { status: 400 });
    }

    const stripe = getStripeClient();
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: currency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
    });

    return Response.json({ ok: true, clientSecret: paymentIntent.client_secret });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}