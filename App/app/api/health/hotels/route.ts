import { liteApiHealthCheck } from "@/lib/providers/hotels";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await liteApiHealthCheck();
    return Response.json(
      {
        ok: result.ok,
        provider: "liteapi",
        message: result.message ?? (result.ok ? "OK" : "Health check failed"),
        statusCode: result.statusCode,
        timestamp: new Date().toISOString(),
      },
      { status: result.ok ? 200 : 503 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json(
      { ok: false, provider: "liteapi", message, timestamp: new Date().toISOString() },
      { status: 503 }
    );
  }
}
