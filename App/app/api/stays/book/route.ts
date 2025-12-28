import { mockStaysProvider } from "@/lib/stays/provider";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { quoteId, paymentIntentId }: { quoteId: string; paymentIntentId: string } = body;

    const { booking, debug } = await mockStaysProvider.book(quoteId, paymentIntentId);

    return Response.json({ ok: true, booking, debug });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}