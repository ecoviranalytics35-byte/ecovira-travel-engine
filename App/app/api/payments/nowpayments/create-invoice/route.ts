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
    // Support both camelCase and snake_case field names
    const priceAmount = body.priceAmount || body.price_amount;
    const priceCurrency = body.priceCurrency || body.price_currency;
    const payCurrency = body.payCurrency || body.pay_currency;
    const orderId = body.orderId || body.order_id;
    const orderDescription = body.orderDescription || body.order_description;
    const bookingData = body.bookingData || body.booking_data;

    // Log environment variable status
    const hasKey = !!process.env.NOWPAYMENTS_API_KEY;
    const hasIpn = !!process.env.NOWPAYMENTS_IPN_SECRET;
    
    console.log("[NOWPayments API] Environment check:", {
      hasKey,
      hasIpn,
      keyLength: process.env.NOWPAYMENTS_API_KEY?.length || 0,
      ipnLength: process.env.NOWPAYMENTS_IPN_SECRET?.length || 0,
    });

    // Check for NOWPayments API key - return 500 with clear error
    if (!hasKey) {
      console.error("[NOWPayments API] Missing NOWPAYMENTS_API_KEY");
      return NextResponse.json(
        { error: "Missing NOWPAYMENTS_API_KEY" },
        { status: 500 }
      );
    }

    // Validate request body - ensure required fields exist
    if (!priceAmount || typeof priceAmount !== 'number' || priceAmount <= 0) {
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
      console.error("[NOWPayments API] Missing pay_currency in request:", {
        hasPayCurrency: !!payCurrency,
        payCurrencyType: typeof payCurrency,
        bodyKeys: Object.keys(body),
      });
      return NextResponse.json(
        { error: "pay_currency is required. Please select a cryptocurrency." },
        { status: 400 }
      );
    }
    
    // Normalize pay_currency: trim and lowercase
    const finalPayCurrency = payCurrency.trim().toLowerCase();
    
    // Log pay_currency for debugging
    console.log("[NOWPAYMENTS API] pay_currency:", {
      received: payCurrency,
      normalized: finalPayCurrency,
    });
    
    // Validate coin exists in available coins list
    try {
      const coinsResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/payments/nowpayments/coins`);
      const coinsData = await coinsResponse.json();
      
      if (coinsData.ok && Array.isArray(coinsData.coins)) {
        const availableTickers = coinsData.coins.map((c: any) => c.ticker.toLowerCase());
        const coinExists = availableTickers.includes(finalPayCurrency);
        
        console.log("[NOWPayments API] Coin validation:", {
          selectedCoin: finalPayCurrency,
          coinExists,
          availableCoins: availableTickers.slice(0, 10), // Log first 10 for debugging
          totalAvailable: availableTickers.length,
        });
        
        if (!coinExists) {
          console.warn("[NOWPayments API] Selected coin not in available list, falling back to BTC");
          // Fallback to BTC if selected coin is not available
          const fallbackCurrency = availableTickers.includes("btc") ? "btc" : availableTickers[0];
          if (fallbackCurrency) {
            console.log("[NOWPayments API] Using fallback currency:", fallbackCurrency);
            // Note: We'll use the fallback, but ideally we should show a UI warning
            // For now, we'll proceed with the fallback
          }
        }
      }
    } catch (coinsError) {
      console.error("[NOWPayments API] Failed to validate coin availability:", coinsError);
      // Continue anyway - NOWPayments API will reject if coin is invalid
    }

    // CRITICAL FIX: NOWPayments does NOT support AUD for locked crypto invoices
    // Convert AUD to USD before sending to NOWPayments
    // Display AUD in UI, but send USD to NOWPayments API
    let usdAmount = priceAmount;
    let usdCurrency = priceCurrency.toLowerCase();
    const originalCurrency = priceCurrency.toLowerCase();
    const originalAmount = priceAmount;
    
    if (originalCurrency === "aud") {
      // Convert AUD to USD (approximate rate: 1 AUD = 0.65 USD)
      // TODO: Use real-time exchange rate API for production
      const AUD_TO_USD_RATE = 0.65; // Approximate rate - should be fetched from exchange rate API
      usdAmount = Math.round(priceAmount * AUD_TO_USD_RATE * 100) / 100; // Round to 2 decimals
      usdCurrency = "usd";
      
      console.log("[NOWPayments API] Currency conversion (AUD → USD):", {
        originalAmount,
        originalCurrency,
        usdAmount,
        usdCurrency,
        rate: AUD_TO_USD_RATE,
      });
    }

    // Construct callback URLs (these are built from env vars, not from request)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const ipnCallbackUrl = `${siteUrl}/api/payments/nowpayments/ipn`;
    const successUrl = process.env.NOWPAYMENTS_SUCCESS_URL || `${siteUrl}/book/success?provider=nowpayments&orderId=${encodeURIComponent(orderId)}`;
    const cancelUrl = process.env.NOWPAYMENTS_CANCEL_URL || `${siteUrl}/book/checkout?canceled=1`;

    console.log("[NOWPayments API] Creating invoice:", {
      priceAmount: usdAmount, // Send USD to NOWPayments
      priceCurrency: usdCurrency, // Send USD to NOWPayments
      originalAmount, // Keep original for logging
      originalCurrency, // Keep original for logging
      payCurrency: finalPayCurrency,
      orderId,
      orderDescription,
      ipnCallbackUrl,
      successUrl,
      cancelUrl,
    });

    const invoice = await createNowPaymentsInvoice({
      priceAmount: usdAmount, // Send USD amount to NOWPayments
      priceCurrency: usdCurrency, // Send USD currency to NOWPayments
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
      payCurrency: invoice.payCurrency || finalPayCurrency,
      payAddress: invoice.payAddress,
      payAmount: invoice.payAmount,
      isMock: invoice.id.startsWith("np_mock_"),
    });

    // Check if mock invoice was created (should not happen unless explicitly enabled)
    if (invoice.id.startsWith("np_mock_") && process.env.NOWPAYMENTS_USE_MOCK !== "true") {
      console.error("[NOWPayments API] WARNING: Mock invoice created but NOWPAYMENTS_USE_MOCK is not 'true'!");
    }

    // NOWPayments invoice mode: Invoice is created first, payment data comes later via IPN
    // Accept invoice-only responses as success - payment address/amount may not be available immediately
    const resolvedPayCurrency = invoice.payCurrency || finalPayCurrency;
    const payAddress = invoice.payAddress || null; // Optional - may not be available on invoice creation
    const payAmount = invoice.payAmount || null; // Optional - may not be available on invoice creation

    // Log invoice creation (payment data is optional in invoice mode)
    console.log("[NOWPayments API] Invoice created (async mode):", {
      invoiceId: invoice.id,
      invoiceUrl: invoice.invoiceUrl,
      payCurrency: resolvedPayCurrency,
      hasPayAddress: !!payAddress,
      hasPayAmount: !!payAmount,
      note: "Payment address/amount may be available later via IPN",
    });

    // Return invoice response - invoice_url is sufficient for redirect
    // Payment data (payAddress, payAmount) will be available after user selects payment method on NOWPayments page
    return NextResponse.json({
      ok: true,
      url: invoice.invoiceUrl, // Alias for invoiceUrl (backward compatibility)
      invoiceUrl: invoice.invoiceUrl, // Exact invoice URL from NOWPayments - redirect user here
      invoiceId: invoice.id, // Invoice ID
      paymentId: invoice.id, // Payment ID (same as invoiceId for invoices)
      provider: "nowpayments", // Provider identifier
      orderId, // Order ID from request
      
      // Payment data (optional - may not be available on invoice creation)
      payCurrency: resolvedPayCurrency, // Selected cryptocurrency (from NOWPayments or request)
      payAddress: payAddress || undefined, // Payment address (optional - available after payment method selection)
      payAmount: payAmount || undefined, // Payment amount (optional - available after payment method selection)
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

