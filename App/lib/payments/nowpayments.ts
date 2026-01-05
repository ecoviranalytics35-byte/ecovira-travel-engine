export async function createNowPaymentsInvoice(input: {
  priceAmount: number;
  priceCurrency: string;
  payCurrency?: string;
  orderId?: string;
  orderDescription?: string;
  ipnCallbackUrl?: string;
  successUrl?: string;
  cancelUrl?: string;
}): Promise<{ id: string; invoiceUrl: string; provider: "nowpayments" }> {
  const hasKey = !!process.env.NOWPAYMENTS_API_KEY;
  const hasIpn = !!process.env.NOWPAYMENTS_IPN_SECRET;
  
  // NOWPAYMENTS_MODE: "live" (default when API key exists) or "mock" (explicit)
  const mode = process.env.NOWPAYMENTS_MODE || (hasKey ? "live" : "mock");
  const isLiveMode = mode === "live";
  
  console.log("[NOWPayments Lib] Environment check:", {
    hasKey,
    hasIpn,
    mode,
    isLiveMode,
    keyPrefix: process.env.NOWPAYMENTS_API_KEY?.substring(0, 10) || "none",
  });

  if (!hasKey) {
    console.error("[NOWPayments Lib] NOWPAYMENTS_API_KEY is missing");
    throw new Error("NOWPayments key missing");
  }

  console.log("[NOWPayments Lib] Creating invoice with input:", {
    priceAmount: input.priceAmount,
    priceCurrency: input.priceCurrency,
    payCurrency: input.payCurrency,
    orderId: input.orderId,
    mode,
    isLiveMode,
  });

  try {
    const apiKey = process.env.NOWPAYMENTS_API_KEY!;
    
    // In mock mode, return mock invoice URL
    if (!isLiveMode) {
      const mockInvoiceId = `np_mock_${Date.now()}`;
      const mockInvoiceUrl = `https://nowpayments.io/payment/?iid=${mockInvoiceId}`;
      console.log("[NOWPayments Lib] Returning mock invoice (NOWPAYMENTS_MODE=mock):", {
        id: mockInvoiceId,
        url: mockInvoiceUrl,
      });
      return {
        id: mockInvoiceId,
        invoiceUrl: mockInvoiceUrl,
        provider: "nowpayments",
      };
    }
    
    // In live mode, pay_currency is required
    if (!input.payCurrency) {
      throw new Error("pay_currency is required for NOWPayments invoice creation in live mode");
    }

    // Create payment/invoice via NOWPayments API
    const requestBody = {
      price_amount: input.priceAmount,
      price_currency: input.priceCurrency.toLowerCase(),
      pay_currency: input.payCurrency.toLowerCase(),
      order_id: input.orderId || `order_${Date.now()}`,
      order_description: input.orderDescription || "Payment",
      ipn_callback_url: input.ipnCallbackUrl,
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
    };

    console.log("[NOWPayments Lib] Creating payment via API:", {
      ...requestBody,
      apiKeyPrefix: apiKey.substring(0, 10),
    });

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/payments/nowpayments.ts:57',message:'[createNowPaymentsInvoice] Calling API',data:{url:'https://api.nowpayments.io/v1/payment',hasApiKey:!!apiKey,requestBody:requestBody},timestamp:Date.now(),sessionId:'debug-session',runId:'nowpayments-real-api',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    const response = await fetch("https://api.nowpayments.io/v1/payment", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/payments/nowpayments.ts:66',message:'[createNowPaymentsInvoice] API response status',data:{status:response.status,ok:response.ok,statusText:response.statusText},timestamp:Date.now(),sessionId:'debug-session',runId:'nowpayments-real-api',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[NOWPayments Lib] API error:", errorData);
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/payments/nowpayments.ts:69',message:'[createNowPaymentsInvoice] API error response',data:{errorData:errorData,status:response.status},timestamp:Date.now(),sessionId:'debug-session',runId:'nowpayments-real-api',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      throw new Error(`NOWPayments API error: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/payments/nowpayments.ts:82',message:'[createNowPaymentsInvoice] API success response',data:{hasPaymentId:!!data.payment_id,hasId:!!data.id,hasPaymentUrl:!!data.payment_url,hasInvoiceUrl:!!data.invoice_url,hasUrl:!!data.url,responseKeys:Object.keys(data)},timestamp:Date.now(),sessionId:'debug-session',runId:'nowpayments-real-api',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // NOWPayments /v1/payment endpoint returns payment_id and pay_address, but NOT a URL
    // We need to construct the payment URL from the payment_id
    const paymentId = data.payment_id || data.id;
    
    if (!paymentId) {
      console.error("[NOWPayments Lib] Invalid response structure - missing payment_id:", data);
      throw new Error("Invalid response from NOWPayments API: missing payment_id");
    }
    
    // Construct payment URL - NOWPayments payment page URL format
    // The /v1/payment endpoint doesn't return a URL, so we construct it from payment_id
    // Common format: https://nowpayments.io/payment/?iid={payment_id}
    // Alternative: https://nowpayments.io/payment/?payment_id={payment_id}
    const paymentUrl = data.payment_url || data.invoice_url || data.url || `https://nowpayments.io/payment/?iid=${paymentId}`;
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/payments/nowpayments.ts:95',message:'[createNowPaymentsInvoice] Constructed payment URL',data:{paymentId:paymentId,constructedUrl:paymentUrl,hasOriginalUrl:!!(data.payment_url||data.invoice_url||data.url)},timestamp:Date.now(),sessionId:'debug-session',runId:'nowpayments-real-api',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    console.log("[NOWPayments Lib] Payment created:", {
      paymentId,
      hasUrl: !!paymentUrl,
    });

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/payments/nowpayments.ts:112',message:'[createNowPaymentsInvoice] Returning result',data:{paymentId:paymentId,paymentUrl:paymentUrl,urlPrefix:paymentUrl?.substring(0,50)},timestamp:Date.now(),sessionId:'debug-session',runId:'nowpayments-real-api',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    return {
      id: paymentId,
      invoiceUrl: paymentUrl,
      provider: "nowpayments"
    };
  } catch (error: unknown) {
    console.error("[NOWPayments Lib] Error creating invoice:", error);
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/payments/nowpayments.ts:93',message:'[createNowPaymentsInvoice] Error caught',data:{errorMessage:error instanceof Error?error.message:'unknown',errorType:error instanceof Error?error.constructor.name:'unknown'},timestamp:Date.now(),sessionId:'debug-session',runId:'nowpayments-real-api',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // Log upstream error if available
    if (error instanceof Error && 'response' in error) {
      const upstreamError = error as any;
      console.error("[NOWPayments Lib] Upstream error body:", upstreamError.response?.data || upstreamError.body);
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/payments/nowpayments.ts:99',message:'[createNowPaymentsInvoice] Upstream error details',data:{upstreamErrorBody:upstreamError.response?.data||upstreamError.body},timestamp:Date.now(),sessionId:'debug-session',runId:'nowpayments-real-api',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
    }
    
    throw error;
  }
}