import { createNowPaymentsInvoice } from "@/lib/payments/nowpayments";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    // Debug logs for env loading
    console.log("[NOWPayments] CWD:", process.cwd());
    const nowpaymentsKey = process.env.NOWPAYMENTS_API_KEY || "";
    const nowpaymentsIpn = process.env.NOWPAYMENTS_IPN_SECRET || "";
    console.log("[NOWPayments] key length:", nowpaymentsKey.length);
    console.log("[NOWPayments] ipn length:", nowpaymentsIpn.length);
    
    // Debug: Check if env vars exist in process.env at all
    console.log("[ENV] has NOWPAYMENTS_API_KEY:", "NOWPAYMENTS_API_KEY" in process.env);
    console.log("[ENV] has NOWPAYMENTS_IPN_SECRET:", "NOWPAYMENTS_IPN_SECRET" in process.env);
    const nowpaymentsEnvKeys = Object.keys(process.env).filter(k => k.includes("NOW") || k.includes("now"));
    console.log("[ENV] keys sample (NOW*):", nowpaymentsEnvKeys.slice(0, 10));

    const body = await request.json();
    const { priceAmount, priceCurrency, payCurrency, orderId, orderDescription, bookingData } = body;

    // Log environment variable status
    const hasKey = !!process.env.NOWPAYMENTS_API_KEY;
    const hasIpn = !!process.env.NOWPAYMENTS_IPN_SECRET;
    
    console.log("[NOWPayments API] Environment check:", {
      hasKey,
      hasIpn,
      keyLength: process.env.NOWPAYMENTS_API_KEY?.length || 0,
      ipnLength: process.env.NOWPAYMENTS_IPN_SECRET?.length || 0,
    });

    // Check for NOWPayments API key - return 400 with clear error code
    if (!hasKey) {
      console.error("[NOWPayments API] Missing NOWPAYMENTS_API_KEY");
      return NextResponse.json(
        { ok: false, code: "NOWPAYMENTS_NOT_CONFIGURED", message: "Crypto payments temporarily unavailable." },
        { status: 400 }
      );
    }

    // Validate input
    if (!priceAmount || priceAmount <= 0) {
      return NextResponse.json(
        { ok: false, code: "INVALID_AMOUNT", message: "Invalid payment amount" },
        { status: 400 }
      );
    }
    if (!priceCurrency) {
      return NextResponse.json(
        { ok: false, code: "INVALID_CURRENCY", message: "Currency is required" },
        { status: 400 }
      );
    }
    if (!orderId) {
      return NextResponse.json(
        { ok: false, code: "INVALID_ORDER_ID", message: "Order ID is required" },
        { status: 400 }
      );
    }

    // Construct callback URLs
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const ipnCallbackUrl = `${siteUrl}/api/payments/nowpayments/ipn`;
    const successUrl = process.env.NOWPAYMENTS_SUCCESS_URL || `${siteUrl}/book/success?provider=nowpayments&orderId=${encodeURIComponent(orderId)}`;
    const cancelUrl = process.env.NOWPAYMENTS_CANCEL_URL || `${siteUrl}/book/checkout?canceled=1`;

    console.log("[NOWPayments API] Creating invoice:", {
      priceAmount,
      priceCurrency,
      orderId,
      orderDescription,
      ipnCallbackUrl,
      successUrl,
      cancelUrl,
    });

    const invoice = await createNowPaymentsInvoice({
      priceAmount,
      priceCurrency,
      payCurrency,
      orderId,
      orderDescription,
      ipnCallbackUrl,
      successUrl,
      cancelUrl,
    });

    console.log("[NOWPayments API] Invoice created:", {
      id: invoice.id,
      url: invoice.invoiceUrl,
      provider: invoice.provider,
    });

    return NextResponse.json({
      ok: true,
      url: invoice.invoiceUrl,
      invoiceId: invoice.id,
      invoiceUrl: invoice.invoiceUrl,
      provider: invoice.provider,
      orderId,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[NOWPayments API] Error:", {
      message,
      error,
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    // Log upstream error if available
    if (error instanceof Error && 'response' in error) {
      const upstreamError = error as any;
      console.error("[NOWPayments API] Upstream error body:", upstreamError.response?.data || upstreamError.body);
      // Upstream API failure
      return NextResponse.json(
        { ok: false, code: "NOWPAYMENTS_UPSTREAM", message: "Crypto payment service temporarily unavailable." },
        { status: 502 }
      );
    }
    
    // Generic error
    return NextResponse.json(
      { ok: false, code: "NOWPAYMENTS_ERROR", message: message },
      { status: 500 }
    );
  }
}

