import { getStripeClient } from "@/lib/payments/stripe";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'stripe/create-checkout-session/route.ts:6',message:'[POST] ENTER',data:{ts:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'payment-debug',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    // Verification log for env loading (do NOT print full keys)
    const stripeKey = process.env.STRIPE_SECRET_KEY || "";
    console.log("[Stripe] key prefix:", stripeKey.slice(0, 7));
    console.log("[Stripe] key length:", stripeKey.length);

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'stripe/create-checkout-session/route.ts:10',message:'[POST] Key validation',data:{keyPrefix:stripeKey.slice(0,7),keyLength:stripeKey.length,startsWithSk:stripeKey.startsWith('sk_'),startsWithPk:stripeKey.startsWith('pk_')},timestamp:Date.now(),sessionId:'debug-session',runId:'payment-debug',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    // Validate Stripe key format BEFORE processing request
    if (!stripeKey) {
      console.error("[Stripe] STRIPE_SECRET_KEY is missing");
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'stripe/create-checkout-session/route.ts:15',message:'[POST] Key missing error',data:{error:'STRIPE_SECRET_KEY is missing'},timestamp:Date.now(),sessionId:'debug-session',runId:'payment-debug',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return NextResponse.json(
        { error: "Invalid STRIPE_SECRET_KEY" },
        { status: 500 }
      );
    }
    
    // Validate key format - must start with sk_ and be at least 30 characters
    if (!stripeKey.startsWith("sk_") || stripeKey.length < 30) {
      console.error("[Stripe] STRIPE_SECRET_KEY has invalid format (prefix:", stripeKey.slice(0, 7), "length:", stripeKey.length, ")");
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'stripe/create-checkout-session/route.ts:23',message:'[POST] Key format invalid',data:{error:'Key format invalid',prefix:stripeKey.slice(0,7),length:stripeKey.length},timestamp:Date.now(),sessionId:'debug-session',runId:'payment-debug',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return NextResponse.json(
        { error: "Invalid STRIPE_SECRET_KEY" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { amount, currency, bookingData, customerEmail, orderId } = body;

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'stripe/create-checkout-session/route.ts:31',message:'[POST] Request body parsed',data:{hasAmount:!!amount,amount:amount,hasCurrency:!!currency,currency:currency,hasBookingData:!!bookingData,hasOrderId:!!orderId},timestamp:Date.now(),sessionId:'debug-session',runId:'payment-debug',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    // Validate request body - ensure required fields exist
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'stripe/create-checkout-session/route.ts:35',message:'[POST] Amount validation failed',data:{error:'Invalid amount',amount:amount},timestamp:Date.now(),sessionId:'debug-session',runId:'payment-debug',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }
    if (!currency || typeof currency !== 'string') {
      return NextResponse.json(
        { error: "Currency is required" },
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

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'stripe/create-checkout-session/route.ts:91',message:'[POST] Success response',data:{hasUrl:!!session.url,sessionId:session.id},timestamp:Date.now(),sessionId:'debug-session',runId:'payment-debug',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return NextResponse.json({
      ok: true,
      url: session.url,
      sessionId: session.id,
    });
  } catch (error: unknown) {
    console.error("[Stripe Checkout] Error:", error);
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'stripe/create-checkout-session/route.ts:96',message:'[POST] Error caught',data:{errorType:error instanceof Error ? error.constructor.name:'unknown',errorMessage:error instanceof Error ? error.message:'unknown',hasType:error && typeof error === 'object' && 'type' in error},timestamp:Date.now(),sessionId:'debug-session',runId:'payment-debug',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
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

