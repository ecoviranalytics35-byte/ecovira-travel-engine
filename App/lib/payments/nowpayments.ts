export async function createNowPaymentsInvoice(input: {
  priceAmount: number;
  priceCurrency: string;
  payCurrency?: string;
  orderId?: string;
  orderDescription?: string;
}): Promise<{ id: string; invoiceUrl: string; provider: "nowpayments" }> {
  if (!process.env.NOWPAYMENTS_API_KEY) {
    throw new Error("NOWPayments key missing");
  }

  const id = "np_mock_" + Date.now();
  const invoiceUrl = "https://nowpayments.io/payment/?iid=" + id;

  return {
    id,
    invoiceUrl,
    provider: "nowpayments"
  };
}