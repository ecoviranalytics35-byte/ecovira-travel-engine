import { createNowPaymentsInvoice } from "@/lib/payments/nowpayments";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { priceAmount, priceCurrency, payCurrency, orderId, orderDescription } = body;

    const invoice = await createNowPaymentsInvoice({
      priceAmount,
      priceCurrency,
      payCurrency,
      orderId,
      orderDescription
    });

    return Response.json({ ok: true, invoice });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}