import { createNowPaymentsInvoice } from "@/lib/payments/nowpayments";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
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

    // Check for NOWPayments API key (server-side only)
    if (!hasKey) {
      console.error("[NOWPayments API] Missing NOWPAYMENTS_API_KEY");
      return NextResponse.json(
        { ok: false, error: "NOWPayments is not configured" },
        { status: 503 }
      );
    }

    console.log("[NOWPayments API] Creating invoice:", {
      priceAmount,
      priceCurrency,
      orderId,
      orderDescription,
    });

    const invoice = await createNowPaymentsInvoice({
      priceAmount,
      priceCurrency,
      payCurrency,
      orderId,
      orderDescription,
    });

    console.log("[NOWPayments API] Invoice created:", {
      id: invoice.id,
      url: invoice.invoiceUrl,
      provider: invoice.provider,
    });

    // Store booking data in session or database for later retrieval
    // For now, we'll include it in the response metadata
    return NextResponse.json({
      ok: true,
      url: invoice.invoiceUrl,
      invoiceId: invoice.id,
      provider: invoice.provider,
      bookingData, // Include for webhook processing
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
    }
    
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}

