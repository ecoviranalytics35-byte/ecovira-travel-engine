import { NextRequest, NextResponse } from "next/server";
import { getAmadeusSeatMap } from "@/lib/flights/seatmap";

export const runtime = "nodejs";

/**
 * POST /api/flights/seat-map
 * 
 * Fetches seat map from Amadeus Seat Map API
 * 
 * Query params:
 * - flightOfferId: Required. The Amadeus flight offer ID (for validation)
 * 
 * Request body:
 * - flightOffer: Required. The full flight offer object from Amadeus
 * - segmentIndex: Optional. Segment index for multi-segment flights
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const flightOfferIdFromUrl = searchParams.get("flightOfferId");
    const body = await request.json();
    const { flightOffer, segmentIndex } = body;

    // Validate flightOfferId from URL (source of truth)
    if (!flightOfferIdFromUrl) {
      return NextResponse.json(
        { ok: false, error: "flightOfferId is required in URL" },
        { status: 400 }
      );
    }

    // Validate flightOffer in request body
    if (!flightOffer) {
      return NextResponse.json(
        { ok: false, error: "flightOffer is required in request body" },
        { status: 400 }
      );
    }

    // Validate that URL ID matches offer ID
    const offerId = flightOffer.id || flightOffer.flightOfferId;
    if (offerId !== flightOfferIdFromUrl) {
      console.warn("[seat-map] flightOfferId mismatch", {
        urlId: flightOfferIdFromUrl,
        offerId,
      });
    }

    // Validate Amadeus credentials
    if (!process.env.AMADEUS_API_KEY || !process.env.AMADEUS_API_SECRET) {
      console.error("[seat-map] Amadeus credentials not configured");
      return NextResponse.json(
        { ok: false, error: "Amadeus API not configured" },
        { status: 500 }
      );
    }

    console.log("[seat-map] Fetching seat map", {
      flightOfferId: flightOfferIdFromUrl,
      segmentIndex,
      flightOfferKeys: Object.keys(flightOffer || {}),
      flightOfferType: flightOffer?.type,
      hasItineraries: !!flightOffer?.itineraries,
      hasPrice: !!flightOffer?.price,
      flightOfferIdInOffer: flightOffer?.id,
    });

    // Log the actual flight offer structure (truncated for size)
    console.log("[seat-map] Flight offer structure", {
      type: flightOffer?.type,
      id: flightOffer?.id,
      source: flightOffer?.source,
      itinerariesCount: flightOffer?.itineraries?.length,
      price: flightOffer?.price,
      hasValidatingAirlineCodes: !!flightOffer?.validatingAirlineCodes,
    });

    const seatMap = await getAmadeusSeatMap(flightOffer, segmentIndex);

    if (!seatMap.available) {
      // Return 200 with available: false (not an error, just no seat map)
      return NextResponse.json({
        ok: true,
        available: false,
        error: seatMap.error || "Seat map not available",
        seatMap,
      });
    }

    return NextResponse.json({
      ok: true,
      available: true,
      seatMap,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[seat-map] Error:", message);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}

