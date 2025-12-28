import { searchTransfers } from "@/lib/search/orchestrator";

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

  const params = {
    startLat,
    startLng,
    endLat,
    endLng,
    dateTime: dateTime!,
    adults,
  };

  const { results, meta, errors } = await searchTransfers(params);
  return Response.json({ results, meta, errors });
}