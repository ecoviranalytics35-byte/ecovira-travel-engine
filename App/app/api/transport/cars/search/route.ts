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

  // #region agent log
  console.log('[API] cars/search called', { hasEnv, hasParams, pickupLat, pickupLng, pickupDate, dropoffDate, driverAge });
  // #endregion

  if (!hasParams) {
    // #region agent log
    console.log('[API] cars/search missing params');
    // #endregion
    return Response.json({ results: [], meta: {}, errors: ['Missing required parameters: pickupLat, pickupLng, pickupDate, pickupTime, dropoffDate, dropoffTime'] }, { status: 400 });
  }

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

  try {
    const { results, meta, errors } = await searchCars(params);
    // #region agent log
    console.log('[API] cars/search result', { resultsCount: results?.length || 0, errorsCount: errors?.length || 0, hasErrors: !!errors });
    // #endregion
    return Response.json({ results, meta, errors });
  } catch (error) {
    // #region agent log
    console.error('[API] cars/search error', error);
    // #endregion
    return Response.json({ results: [], meta: {}, errors: [error instanceof Error ? error.message : 'Unknown error'] }, { status: 500 });
  }
}