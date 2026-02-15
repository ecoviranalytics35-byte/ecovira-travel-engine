import { liteApiHealthCheck } from "@/lib/providers/hotels";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await liteApiHealthCheck();
    const body = {
      ok: result.ok,
      provider: "liteapi",
      message: result.message ?? (result.ok ? "OK" : "Health check failed"),
      statusCode: result.statusCode,
      requestId: result.requestId,
      ...(result.errorBody != null && !result.ok ? { errorBody: result.errorBody } : {}),
      timestamp: new Date().toISOString(),
    };
    return Response.json(body, { status: result.ok ? 200 : 503 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json(
      { ok: false, provider: "liteapi", message, timestamp: new Date().toISOString() },
      { status: 503 }
    );
  }
}
