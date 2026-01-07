export async function createNowPaymentsInvoice(input: {
  priceAmount: number;
  priceCurrency: string;
  payCurrency?: string;
  orderId?: string;
  orderDescription?: string;
  ipnCallbackUrl?: string;
  successUrl?: string;
  cancelUrl?: string;
}): Promise<{ 
  id: string; 
  invoiceUrl: string; 
  provider: "nowpayments";
  payCurrency?: string;
  payAddress?: string;
  payAmount?: string;
}> {
  const hasKey = !!process.env.NOWPAYMENTS_API_KEY;
  const hasIpn = !!process.env.NOWPAYMENTS_IPN_SECRET;
  
  // HARD RULE: Only use mock mode if NOWPAYMENTS_USE_MOCK=true (explicit opt-in)
  // Otherwise always use live mode when API key exists
  const useMock = process.env.NOWPAYMENTS_USE_MOCK === "true";
  const mode = process.env.NOWPAYMENTS_MODE;
  // If API key exists and mock is not enabled, use live mode
  // Only use mock if explicitly enabled via NOWPAYMENTS_USE_MOCK=true
  const isLiveMode = hasKey && !useMock;
  
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
    
    // pay_currency is REQUIRED in all modes (live and mock)
    if (!input.payCurrency || typeof input.payCurrency !== 'string' || input.payCurrency.trim() === '') {
      throw new Error("pay_currency is required and must be a non-empty string");
    }
    
    // In mock mode, return mock invoice URL
    // HARD RULE: Only use mock if NOWPAYMENTS_USE_MOCK=true
    if (!isLiveMode && useMock) {
      const mockInvoiceId = `np_mock_${Date.now()}`;
      const mockInvoiceUrl = `https://nowpayments.io/payment/?iid=${mockInvoiceId}`;
      console.log("[NOWPayments Lib] WARNING: Returning mock invoice (NOWPAYMENTS_USE_MOCK=true):", {
        id: mockInvoiceId,
        url: mockInvoiceUrl,
        payCurrency: input.payCurrency,
      });
      return {
        id: mockInvoiceId,
        invoiceUrl: mockInvoiceUrl,
        provider: "nowpayments",
        payCurrency: normalizedPayCurrency,
        payAddress: "mock_address_" + Date.now(),
        payAmount: input.priceAmount.toString(),
      };
    }
    
    // If not in live mode and mock is not enabled, throw error
    if (!isLiveMode && !useMock) {
      throw new Error("NOWPayments API key is missing or invalid. Cannot create invoice without API key.");
    }

    // Normalize pay_currency: trim and lowercase (NOWPayments expects lowercase codes)
    const normalizedPayCurrency = input.payCurrency.trim().toLowerCase();
    
    console.log("[NOWPayments Lib] Normalized pay_currency:", {
      original: input.payCurrency,
      normalized: normalizedPayCurrency,
    });

    // Create payment/invoice via NOWPayments API
    const requestBody = {
      price_amount: input.priceAmount,
      price_currency: input.priceCurrency.toLowerCase(),
      pay_currency: normalizedPayCurrency,
      order_id: input.orderId || `order_${Date.now()}`,
      order_description: input.orderDescription || "Payment",
      ipn_callback_url: input.ipnCallbackUrl,
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
    };

    if (process.env.NODE_ENV === 'development') {
      console.log("[NOWPayments Lib] Creating payment via API:", {
        ...requestBody,
        apiKeyPrefix: apiKey.substring(0, 10),
      });
    }
    // CRITICAL: Use /v1/invoice endpoint (NOT /v1/payment) to guarantee locked currency selection
    // The /v1/invoice endpoint returns invoice_url with locked crypto, while /v1/payment may redirect to generic selector
    const response = await fetch("https://api.nowpayments.io/v1/invoice", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[NOWPayments Lib] API error:", errorData);
      throw new Error(`NOWPayments API error: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    
    // /v1/invoice endpoint returns invoice_id and invoice_url (with locked crypto)
    const invoiceId = data.invoice_id || data.payment_id || data.id;
    
    if (!invoiceId) {
      console.error("[NOWPayments Lib] Invalid response structure - missing invoice_id:", data);
      throw new Error("Invalid response from NOWPayments API: missing invoice_id");
    }
    
    // Check if this is a mock invoice (should not happen in live mode)
    if (invoiceId.startsWith("np_mock_")) {
      console.error("[NOWPayments Lib] WARNING: Received mock invoice ID in live mode!", {
        invoiceId,
        mode,
        isLiveMode,
        useMock,
      });
      throw new Error("Mock invoice detected in live mode. Check NOWPAYMENTS_USE_MOCK and NOWPAYMENTS_MODE environment variables.");
    }
    
    // CRITICAL: Use invoice_url from API response (DO NOT reconstruct)
    // The invoice_url contains the locked crypto/amount and is the ONLY URL that guarantees currency selection
    // If invoice_url is missing, this is an error (should not happen with /v1/invoice endpoint)
    const invoiceUrl = data.invoice_url || data.url;
    
    if (!invoiceUrl) {
      console.error("[NOWPayments Lib] CRITICAL: Missing invoice_url in response:", data);
      throw new Error("Invalid response from NOWPayments API: missing invoice_url. The /v1/invoice endpoint must return invoice_url.");
    }
    

    // Extract payment data from NOWPayments response
    // CRITICAL: These fields MUST be present for QR code generation and payment processing
    const payCurrency = data.pay_currency || normalizedPayCurrency;
    const payAddress = data.pay_address;
    const payAmount = data.pay_amount?.toString() || data.amount?.toString();

    console.log("[NOWPayments Lib] Invoice created:", {
      invoiceId,
      invoiceUrl: invoiceUrl,
      payCurrency,
      payAddress: payAddress ? payAddress.substring(0, 20) + "..." : null,
      payAmount,
      hasPayAddress: !!payAddress,
      hasPayAmount: !!payAmount,
      hasUrl: !!invoiceUrl,
      isMock: invoiceId.startsWith("np_mock_"),
      // Log full response keys for debugging
      responseKeys: Object.keys(data),
    });

    // NOWPayments invoice mode: Invoice is created first, payment data comes later
    // Payment address/amount may not be available immediately - this is normal for invoice mode
    // They will be available after user selects payment method on NOWPayments page or via IPN
    
    console.log("[NOWPayments Lib] Invoice created (async mode):", {
      invoiceId,
      invoiceUrl,
      payCurrency,
      hasPayAddress: !!payAddress,
      hasPayAmount: !!payAmount,
      note: "Payment data optional - available after payment method selection",
    });


    // Return invoice data - payment address/amount are optional (available later)
    return {
      id: invoiceId,
      invoiceUrl: invoiceUrl, // Use exact invoice_url from API (contains locked crypto)
      provider: "nowpayments",
      payCurrency: payCurrency, // Selected cryptocurrency (from NOWPayments or request)
      payAddress: payAddress || undefined, // Payment address (optional - available after payment method selection)
      payAmount: payAmount || undefined, // Payment amount (optional - available after payment method selection)
    };
  } catch (error: unknown) {
    console.error("[NOWPayments Lib] Error creating invoice:", error);
    
    // Log upstream error if available
    if (error instanceof Error && 'response' in error) {
      const upstreamError = error as any;
      console.error("[NOWPayments Lib] Upstream error body:", upstreamError.response?.data || upstreamError.body);
    }
    
    throw error;
  }
}