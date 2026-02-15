import { getHotelProvider } from "@/lib/providers/hotels";
import type { StaySearchParams } from "@/lib/stays/provider";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { stayId, params }: { stayId: string; params: StaySearchParams } = body;

    const provider = getHotelProvider();
    const { quote, debug } = await provider.quote(stayId, params);

    if (!quote) {
      const error = (debug as { error?: string })?.error ?? "Quote unavailable or rate expired";
      return Response.json({ ok: false, error }, { status: 422 });
    }
    return Response.json({ ok: true, quote, debug });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}