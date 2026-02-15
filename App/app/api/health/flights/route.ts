import { getFlightProvider } from "@/lib/providers/flights";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const provider = getFlightProvider();
    const result = await provider.healthCheck();
    return Response.json({
      ok: result.ok,
      provider: provider.name,
      message: result.message ?? (result.ok ? "OK" : "Health check failed"),
      requestId: result.requestId,
      statusCode: result.statusCode,
      timestamp: new Date().toISOString(),
    }, { status: result.ok ? 200 : 503 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json(
      { ok: false, provider: null, message, timestamp: new Date().toISOString() },
      { status: 503 }
    );
  }
}
