import { mockStaysProvider } from "@/lib/stays/provider";
import type { StaySearchParams } from "@/lib/stays/provider";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { stayId, params }: { stayId: string; params: StaySearchParams } = body;

    const { quote, debug } = await mockStaysProvider.quote(stayId, params);

    return Response.json({ ok: true, quote, debug });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}