import { getStripeClient } from "@/lib/payments/stripe";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, currency, bookingData } = body;

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { ok: false, error: "Stripe is not configured" },
        { status: 503 }
      );
    }

    const stripe = getStripeClient();

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: `Flight Booking ${bookingData?.offerId || ""}`,
              description: `Flight booking from ${bookingData?.offerId || "selected flight"}`,
            },
            unit_amount: amount, // already in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/book/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/book/checkout`,
      metadata: {
        bookingData: JSON.stringify(bookingData),
      },
    });

    return NextResponse.json({
      ok: true,
      url: session.url,
      sessionId: session.id,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Stripe Checkout] Error:", error);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}

