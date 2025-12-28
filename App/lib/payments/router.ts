export type PaymentProvider = "stripe" | "nowpayments";

export function choosePaymentProvider(input: {
  method?: string;
  currency?: string;
}): { provider: PaymentProvider; reason: string } {
  if (input.method === "crypto") {
    return { provider: "nowpayments", reason: "Crypto payment selected" };
  }
  return { provider: "stripe", reason: "Default to card payment" };
}