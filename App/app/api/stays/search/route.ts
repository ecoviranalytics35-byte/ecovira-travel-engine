import { searchStays } from "@/lib/search/orchestrator";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const city = searchParams.get("city") || "Melbourne";
  const cityCode = searchParams.get("cityCode");
  const checkIn = searchParams.get("checkIn") || "2025-12-28";
  const checkInDate = searchParams.get("checkInDate");
  const nights = parseInt(searchParams.get("nights") || "1", 10);
  const adults = parseInt(searchParams.get("adults") || "1", 10);
  const children = parseInt(searchParams.get("children") || "0", 10);
  const rooms = parseInt(searchParams.get("rooms") || "1", 10);
  const currency = searchParams.get("currency") || "AUD";
  const budgetPerNight = searchParams.get("budgetPerNight");
  const roomType = searchParams.get("roomType") || "double";
  const classType = searchParams.get("classType") || "standard";
  const debug = searchParams.get("debug") === "1";

  const params = {
    city,
    checkIn,
    nights: Number.isFinite(nights) ? nights : 1,
    adults: Number.isFinite(adults) ? adults : 1,
    children: Number.isFinite(children) ? children : 0,
    rooms: Number.isFinite(rooms) ? rooms : 1,
    currency,
    budgetPerNight: budgetPerNight || undefined,
    roomType,
    classType,
  };

  const { results, meta, errors } = await searchStays(params);
  return Response.json({ results, meta, errors });
}