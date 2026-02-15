import { getFlightProvider } from "@/lib/providers/flights";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const provider = getFlightProvider();
    const result = await provider.healthCheck();
    const body = {
      ok: result.ok,
      provider: provider.name,
      message: result.message ?? (result.ok ? "OK" : "Health check failed"),
      requestId: result.requestId,
      statusCode: result.statusCode,
      timestamp: new Date().toISOString(),
    };
    return Response.json(body, { status: result.ok ? 200 : 503 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json(
      { ok: false, provider: null, message, timestamp: new Date().toISOString() },
      { status: 503 }
    );
  }
}
