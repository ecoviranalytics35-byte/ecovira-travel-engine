import { getStripeClient } from "@/lib/payments/stripe";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    // Verification log for env loading (do NOT print full keys)
    const stripeKey = process.env.STRIPE_SECRET_KEY || "";
    console.log("[Stripe] key prefix:", stripeKey.slice(0, 7));
    console.log("[Stripe] key length:", stripeKey.length);

    const body = await request.json();
    const { amount, currency, bookingData, customerEmail, orderId } = body;

    // Validate Stripe key format
    if (!stripeKey) {
      console.error("[Stripe] STRIPE_SECRET_KEY is missing");
      return NextResponse.json(
        { ok: false, code: "STRIPE_NOT_CONFIGURED", message: "Card payments unavailable." },
        { status: 400 }
      );
    }
    
    // Validate key format - must start with sk_ and be at least 30 characters
    if (!stripeKey.startsWith("sk_") || stripeKey.length < 30) {
      console.error("[Stripe] STRIPE_SECRET_KEY has invalid format (prefix:", stripeKey.slice(0, 7), "length:", stripeKey.length, ")");
      return NextResponse.json(
        { ok: false, code: "STRIPE_INVALID_KEY_FORMAT", message: "Stripe key format invalid. Ensure STRIPE_SECRET_KEY starts with 'sk_' and is the full key from Stripe dashboard." },
        { status: 400 }
      );
    }

    // Validate input
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { ok: false, code: "INVALID_AMOUNT", message: "Invalid payment amount" },
        { status: 400 }
      );
    }
    if (!currency) {
      return NextResponse.json(
        { ok: false, code: "INVALID_CURRENCY", message: "Currency is required" },
        { status: 400 }
      );
    }

    // Construct URLs
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const normalizedCurrency = currency.toLowerCase();
    
    // Validate currency is supported by Stripe
    const supportedCurrencies = ['usd', 'eur', 'gbp', 'aud', 'cad', 'nzd', 'jpy', 'chf', 'hkd', 'sgd', 'sek', 'nok', 'dkk'];
    const finalCurrency = supportedCurrencies.includes(normalizedCurrency) ? normalizedCurrency : 'aud';

    const stripe = getStripeClient();

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: finalCurrency,
            product_data: {
              name: `Flight Booking ${bookingData?.offerId || orderId || ""}`,
              description: `Flight booking ${bookingData?.offerId ? `from ${bookingData.offerId}` : ""}`,
            },
            unit_amount: amount, // already in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${siteUrl}/book/success?provider=stripe&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/book/checkout?canceled=1`,
      customer_email: customerEmail,
      metadata: {
        orderId: orderId || bookingData?.offerId || "",
        bookingData: JSON.stringify(bookingData || {}),
      },
    });

    return NextResponse.json({
      ok: true,
      url: session.url,
      sessionId: session.id,
    });
  } catch (error: unknown) {
    console.error("[Stripe Checkout] Error:", error);
    
    // Handle Stripe API errors
    if (error && typeof error === 'object' && 'type' in error) {
      const stripeError = error as any;
      if (stripeError.type === 'StripeAuthenticationError' || stripeError.type === 'StripeInvalidRequestError') {
        // Invalid API key or authentication error
        console.error("[Stripe Checkout] Authentication error - invalid key");
        return NextResponse.json(
          { ok: false, code: "STRIPE_AUTH_ERROR", message: "Stripe key rejected (live/test mismatch or invalid key)." },
          { status: 401 }
        );
      }
    }
    
    // Handle error messages that indicate auth issues
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Invalid API Key") || message.includes("No API key provided")) {
      return NextResponse.json(
        { ok: false, code: "STRIPE_AUTH_ERROR", message: "Stripe key rejected (live/test mismatch or invalid key)." },
        { status: 401 }
      );
    }
    
    // Generic error
    return NextResponse.json(
      { ok: false, code: "STRIPE_ERROR", message: message },
      { status: 500 }
    );
  }
}

