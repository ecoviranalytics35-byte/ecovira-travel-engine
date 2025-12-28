import { searchTransfers, type TransferSearchParams } from "@/lib/transport/transfers/amadeus";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const startLat = parseFloat(searchParams.get("startLat") || "");
  const startLng = parseFloat(searchParams.get("startLng") || "");
  const endLat = parseFloat(searchParams.get("endLat") || "");
  const endLng = parseFloat(searchParams.get("endLng") || "");
  const dateTime = searchParams.get("dateTime");
  const adults = parseInt(searchParams.get("adults") || "1", 10);
  const debug = searchParams.get("debug") === "1";

  const hasEnv = process.env.AMADEUS_API_KEY && process.env.AMADEUS_API_SECRET;
  const hasParams = !isNaN(startLat) && !isNaN(startLng) && !isNaN(endLat) && !isNaN(endLng) && dateTime;

  try {
    if (hasEnv && hasParams) {
      const params: TransferSearchParams = {
        startLat,
        startLng,
        endLat,
        endLng,
        dateTime,
        adults,
      };
      const results = await searchTransfers(params);

      if (debug) {
        return Response.json({
          ok: true,
          results,
          debug: {
            mode: "amadeus",
            resultsCount: results.length,
          },
        });
      } else {
        return Response.json({ ok: true, results });
      }
    } else {
      // Mock fallback
      const results = [
        {
          id: "mock-transfer-1",
          from: `${startLat || -37.6733},${startLng || 144.8433}`,
          to: `${endLat || -37.8136},${endLng || 144.9631}`,
          dateTime: dateTime || "2026-01-15T10:00:00Z",
          total: "50.00",
          currency: "AUD",
          provider: "mock",
        },
      ];

      if (debug) {
        return Response.json({
          ok: true,
          results,
          debug: {
            mode: "mock",
            resultsCount: results.length,
          },
        });
      } else {
        return Response.json({ ok: true, results });
      }
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}