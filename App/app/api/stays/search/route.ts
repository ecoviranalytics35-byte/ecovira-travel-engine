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

  if (process.env.NODE_ENV === 'development') {
    console.log('[API] stays/search called', { params, hasCity: !!city, hasCheckIn: !!checkIn });
  }
  
  try {
    const { results, meta, errors } = await searchStays(params);
    if (process.env.NODE_ENV === 'development') {
      console.log('[API] stays/search result', { resultsCount: results?.length || 0, errorsCount: errors?.length || 0, hasErrors: !!errors });
    }
    
    // If there are errors, return them properly (don't silently succeed)
    if (errors && errors.length > 0) {
      // Return 200 with errors array (client can handle this)
      // But ensure errors are clearly indicated
      return Response.json({ 
        results: results || [], 
        meta: meta || {}, 
        errors: errors,
        hasErrors: true,
      });
    }
    
    return Response.json({ results, meta, errors: [] });
  } catch (error) {
    console.error('[API] stays/search error', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Check if it's a date validation error (should return 400)
    if (errorMessage.includes('Invalid date') || errorMessage.includes('cannot be') || errorMessage.includes('code 425')) {
      return Response.json({ 
        results: [], 
        meta: {}, 
        errors: [errorMessage],
        hasErrors: true,
      }, { status: 400 });
    }
    
    return Response.json({ 
      results: [], 
      meta: {}, 
      errors: [errorMessage],
      hasErrors: true,
    }, { status: 500 });
  }
}