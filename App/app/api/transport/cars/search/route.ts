import { searchCars, type CarSearchParams } from "@/lib/transport/cars/amadeus";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const pickupLat = parseFloat(searchParams.get("pickupLat") || "");
  const pickupLng = parseFloat(searchParams.get("pickupLng") || "");
  const pickupDate = searchParams.get("pickupDate");
  const pickupTime = searchParams.get("pickupTime");
  const dropoffDate = searchParams.get("dropoffDate");
  const dropoffTime = searchParams.get("dropoffTime");
  const driverAge = parseInt(searchParams.get("driverAge") || "30", 10);
  const currency = searchParams.get("currency");
  const debug = searchParams.get("debug") === "1";

  const hasEnv = process.env.AMADEUS_API_KEY && process.env.AMADEUS_API_SECRET;
  const hasParams = !isNaN(pickupLat) && !isNaN(pickupLng) && pickupDate && pickupTime && dropoffDate && dropoffTime;

  try {
    if (hasEnv && hasParams) {
      const params: CarSearchParams = {
        pickupLat,
        pickupLng,
        pickupDate,
        pickupTime,
        dropoffDate,
        dropoffTime,
        driverAge,
        currency: currency || undefined,
      };
      const results = await searchCars(params);

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
          id: "mock-car-1",
          vendor: "Mock Rentals",
          vehicle: "Sedan",
          transmission: "Automatic",
          fuel: "Petrol",
          seats: 5,
          doors: 4,
          pickup: `${pickupLat || -37.6733},${pickupLng || 144.8433}`,
          dropoff: `${pickupLat || -37.6733},${pickupLng || 144.8433}`,
          total: "75.00",
          currency: currency || "AUD",
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