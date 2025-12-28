import { searchCars } from "@/lib/search/orchestrator";

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

  const params = {
    pickupLat,
    pickupLng,
    pickupDate: pickupDate!,
    pickupTime: pickupTime!,
    dropoffDate: dropoffDate!,
    dropoffTime: dropoffTime!,
    driverAge,
    currency: currency || undefined,
  };

  const { results, meta, errors } = await searchCars(params);
  return Response.json({ results, meta, errors });
}