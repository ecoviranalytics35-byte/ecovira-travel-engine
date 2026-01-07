import { getStripeClient } from "@/lib/payments/stripe";
import { NextRequest, NextResponse } from "next/server";
import { STRIPE_SUPPORTED_CURRENCIES, toStripeUnitAmount } from "@/lib/payments/stripe-currencies";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    // Verification log for env loading (do NOT print full keys)
    const stripeKey = process.env.STRIPE_SECRET_KEY || "";
    if (process.env.NODE_ENV === 'development') {
      console.log("[Stripe] key prefix:", stripeKey.slice(0, 7));
      console.log("[Stripe] key length:", stripeKey.length);
    }

    // Validate Stripe key format BEFORE processing request
    if (!stripeKey) {
      console.error("[Stripe] STRIPE_SECRET_KEY is missing");
      return NextResponse.json(
        { error: "Invalid STRIPE_SECRET_KEY" },
        { status: 500 }
      );
    }
    
    // Validate key format - must start with sk_ and be at least 30 characters
    if (!stripeKey.startsWith("sk_") || stripeKey.length < 30) {
      console.error("[Stripe] STRIPE_SECRET_KEY has invalid format (prefix:", stripeKey.slice(0, 7), "length:", stripeKey.length, ")");
      return NextResponse.json(
        { error: "Invalid STRIPE_SECRET_KEY" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { amount, currency, chargeCurrency, unitAmount, bookingData, customerEmail, orderId, baseAmount, baseCurrency, fxRate, fxTimestamp } = body;

    // Determine charge currency - prefer chargeCurrency, fallback to currency
    const chargeCurrencyCode = (chargeCurrency || currency || "AUD").toUpperCase();
    const normalizedChargeCurrency = chargeCurrencyCode.toLowerCase();
    
    // Validate currency is supported by Stripe
    if (!STRIPE_SUPPORTED_CURRENCIES.includes(chargeCurrencyCode)) {
      return NextResponse.json(
        { error: `Currency ${chargeCurrencyCode} is not supported by Stripe` },
        { status: 400 }
      );
    }

    // Determine unit amount
    // If unitAmount is provided (already converted), use it
    // Otherwise, convert amount using minor units
    let finalUnitAmount: number;
    if (unitAmount && typeof unitAmount === 'number' && unitAmount > 0) {
      finalUnitAmount = Math.round(unitAmount);
    } else if (amount && typeof amount === 'number' && amount > 0) {
      // Convert amount to Stripe unit_amount using minor units
      finalUnitAmount = toStripeUnitAmount(amount, normalizedChargeCurrency);
    } else {
      return NextResponse.json(
        { error: "amount or unitAmount is required" },
        { status: 400 }
      );
    }

    if (!bookingData && !orderId) {
      return NextResponse.json(
        { error: "Booking data or order ID is required" },
        { status: 400 }
      );
    }

    // Construct URLs
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    const stripe = getStripeClient();

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: normalizedChargeCurrency,
            product_data: {
              name: bookingData?.stayOfferId 
                ? `Hotel Booking ${bookingData?.stay?.name || bookingData?.stayOfferId || ""}`
                : bookingData?.carOfferId
                ? `Car Rental ${bookingData?.car?.name || bookingData?.car?.vehicle || bookingData?.carOfferId || ""}`
                : bookingData?.transferOfferId
                ? `Transfer ${bookingData?.transfer?.name || bookingData?.transfer?.transferType || bookingData?.transferOfferId || ""}`
                : `Flight Booking ${bookingData?.offerId || orderId || ""}`,
              description: bookingData?.stayOfferId
                ? `Hotel booking ${bookingData?.stay?.name || ""}`
                : bookingData?.carOfferId
                ? `Car rental ${bookingData?.car?.name || bookingData?.car?.vehicle || ""}`
                : bookingData?.transferOfferId
                ? `Transfer ${bookingData?.transfer?.from || ""} → ${bookingData?.transfer?.to || ""}`
                : `Flight booking ${bookingData?.offerId ? `from ${bookingData.offerId}` : ""}`,
            },
            unit_amount: finalUnitAmount,
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
        chargeCurrency: chargeCurrencyCode,
        ...(baseAmount && { baseAmount: baseAmount.toString(), baseCurrency: baseCurrency || "AUD" }),
        ...(fxRate && { fxRate: fxRate.toString() }),
        ...(fxTimestamp && { fxTimestamp }),
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

