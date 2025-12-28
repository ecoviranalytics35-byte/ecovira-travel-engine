import { buildQuote } from "../../../../../lib/calc/quote";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const quote = buildQuote(body);
    return Response.json({ ok: true, quote });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}