export async function createNowPaymentsInvoice(input: {
  priceAmount: number;
  priceCurrency: string;
  payCurrency?: string;
  orderId?: string;
  orderDescription?: string;
}): Promise<{ id: string; invoiceUrl: string; provider: "nowpayments" }> {
  const hasKey = !!process.env.NOWPAYMENTS_API_KEY;
  const hasIpn = !!process.env.NOWPAYMENTS_IPN_SECRET;
  
  console.log("[NOWPayments Lib] Environment check:", {
    hasKey,
    hasIpn,
    keyPrefix: process.env.NOWPAYMENTS_API_KEY?.substring(0, 10) || "none",
  });

  if (!hasKey) {
    console.error("[NOWPayments Lib] NOWPAYMENTS_API_KEY is missing");
    throw new Error("NOWPayments key missing");
  }

  console.log("[NOWPayments Lib] Creating invoice with input:", {
    priceAmount: input.priceAmount,
    priceCurrency: input.priceCurrency,
    orderId: input.orderId,
  });

  try {
    // TODO: Replace with actual NOWPayments API call
    // For now, using mock implementation
    const id = "np_mock_" + Date.now();
    const invoiceUrl = "https://nowpayments.io/payment/?iid=" + id;

    console.log("[NOWPayments Lib] Mock invoice created:", { id, invoiceUrl });

    return {
      id,
      invoiceUrl,
      provider: "nowpayments"
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