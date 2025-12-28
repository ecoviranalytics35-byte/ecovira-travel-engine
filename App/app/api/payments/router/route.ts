import { choosePaymentProvider } from "../../../../../lib/payments/router";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const method = searchParams.get("method") || undefined;
  const currency = searchParams.get("currency") || undefined;

  const result = choosePaymentProvider({ method, currency });
  return Response.json({ ok: true, provider: result.provider, reason: result.reason });
}