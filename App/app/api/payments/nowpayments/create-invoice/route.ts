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

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'nowpayments/create-invoice/route.ts:6',message:'[POST] ENTER',data:{ts:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'payment-debug',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    const body = await request.json();
    const { priceAmount, priceCurrency, payCurrency, orderId, orderDescription, bookingData } = body;

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'nowpayments/create-invoice/route.ts:21',message:'[POST] Request body parsed',data:{hasPriceAmount:!!priceAmount,priceAmount:priceAmount,hasPriceCurrency:!!priceCurrency,priceCurrency:priceCurrency,hasPayCurrency:!!payCurrency,payCurrency:payCurrency,hasOrderId:!!orderId,hasOrderDescription:!!orderDescription},timestamp:Date.now(),sessionId:'debug-session',runId:'payment-debug',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    // Log environment variable status
    const hasKey = !!process.env.NOWPAYMENTS_API_KEY;
    const hasIpn = !!process.env.NOWPAYMENTS_IPN_SECRET;
    
    console.log("[NOWPayments API] Environment check:", {
      hasKey,
      hasIpn,
      keyLength: process.env.NOWPAYMENTS_API_KEY?.length || 0,
      ipnLength: process.env.NOWPAYMENTS_IPN_SECRET?.length || 0,
    });

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'nowpayments/create-invoice/route.ts:26',message:'[POST] Env check',data:{hasKey,hasIpn,keyLength:process.env.NOWPAYMENTS_API_KEY?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'payment-debug',hypothesisId:'D'})}).catch(()=>{});
    // #endregion

    // Check for NOWPayments API key - return 500 with clear error
    if (!hasKey) {
      console.error("[NOWPayments API] Missing NOWPAYMENTS_API_KEY");
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'nowpayments/create-invoice/route.ts:36',message:'[POST] Key missing error',data:{error:'Missing NOWPAYMENTS_API_KEY'},timestamp:Date.now(),sessionId:'debug-session',runId:'payment-debug',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      return NextResponse.json(
        { error: "Missing NOWPAYMENTS_API_KEY" },
        { status: 500 }
      );
    }

    // Validate request body - ensure required fields exist
    if (!priceAmount || typeof priceAmount !== 'number' || priceAmount <= 0) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'nowpayments/create-invoice/route.ts:45',message:'[POST] priceAmount validation failed',data:{error:'Invalid price_amount',priceAmount:priceAmount},timestamp:Date.now(),sessionId:'debug-session',runId:'payment-debug',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      return NextResponse.json(
        { error: "Invalid price_amount" },
        { status: 400 }
      );
    }
    if (!priceCurrency || typeof priceCurrency !== 'string') {
      return NextResponse.json(
        { error: "price_currency is required" },
        { status: 400 }
      );
    }
    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json(
        { error: "order_id is required" },
        { status: 400 }
      );
    }
    if (!orderDescription || typeof orderDescription !== 'string') {
      return NextResponse.json(
        { error: "order_description is required" },
        { status: 400 }
      );
    }
    
    // payCurrency is REQUIRED - validate it exists
    if (!payCurrency || typeof payCurrency !== 'string') {
      return NextResponse.json(
        { error: "pay_currency is required. Please select a cryptocurrency." },
        { status: 400 }
      );
    }
    const finalPayCurrency = payCurrency.toLowerCase();

    // Construct callback URLs (these are built from env vars, not from request)
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
      payCurrency: finalPayCurrency,
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

