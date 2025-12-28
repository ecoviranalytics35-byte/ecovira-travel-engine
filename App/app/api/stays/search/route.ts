import { mockStaysProvider } from "@/lib/stays/provider";
import { getAmadeusToken, hotelsByCity, hotelOffers } from "@/lib/stays/amadeus";

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

  try {
    // Check if Amadeus is available and required params provided
    if (process.env.AMADEUS_API_KEY && process.env.AMADEUS_API_SECRET && cityCode && checkInDate) {
      const token = await getAmadeusToken();
      const hotelIds = await hotelsByCity(cityCode, token);
      const results = await hotelOffers(hotelIds, token, adults, checkInDate, nights, rooms);

      if (debug) {
        return Response.json({
          ok: true,
          results,
          debug: {
            cityCode,
            hotelsFoundCount: hotelIds.length,
            offersFoundCount: results.length,
          },
        });
      } else {
        return Response.json({ ok: true, results });
      }
    } else {
      // Fallback to mock
      const { results, debug: staysDebug } = await mockStaysProvider.search({
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
      });

      if (debug) {
        return Response.json({ ok: true, results, debug: staysDebug });
      } else {
        return Response.json({ ok: true, results });
      }
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}