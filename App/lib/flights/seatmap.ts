import { fetchJson } from "@/lib/core/http";
import { getAmadeusToken } from "@/lib/stays/amadeus";

/**
 * Amadeus Seat Map API integration
 * POST /v1/shopping/seatmaps
 * 
 * Input: Flight offer ID from Amadeus
 * Output: Normalized seat map data
 */

export interface AmadeusSeatMapRequest {
  flightOfferId: string;
  // Optional: segment-specific seat map
  segmentIndex?: number;
}

export interface SeatMapSeat {
  cabin: string;
  number: string; // e.g., "12A"
  characteristicsCodes?: string[]; // e.g., ["EXIT_ROW", "LEGROOM", "BULKHEAD", "PAID"]
  coordinates?: {
    x?: number;
    y?: number;
  };
  travelerPricing?: Array<{
    travelerId: string;
    seatAvailabilityStatus?: "AVAILABLE" | "BLOCKED" | "OCCUPIED";
    price?: {
      total: string;
      currency: string;
    };
  }>;
}

export interface SeatMapDeck {
  deckType: "LOWER" | "UPPER";
  deckConfiguration?: {
    width?: number;
    length?: number;
  };
  seats?: SeatMapSeat[];
}

export interface SeatMapSegment {
  segmentId: string;
  cabin: string;
  class: string;
  aircraft?: {
    code?: string;
    width?: string;
  };
  classOfService?: string;
  decks?: SeatMapDeck[];
}

export interface AmadeusSeatMapResponse {
  data?: Array<{
    type: string;
    flightOfferId: string;
    segmentId?: string;
    carrierCode?: string;
    number?: string;
    aircraft?: {
      code?: string;
    };
    class?: string;
    departure?: {
      iataCode?: string;
      at?: string;
    };
    arrival?: {
      iataCode?: string;
      at?: string;
    };
    decks?: SeatMapDeck[];
  }>;
  meta?: any;
  errors?: Array<{
    status?: number;
    code?: number;
    title?: string;
    detail?: string;
    source?: any;
  }>;
}

export interface NormalizedSeat {
  row: number;
  column: string; // A, B, C, D, E, F, etc.
  seatNumber: string; // e.g., "12A"
  availability: "available" | "occupied" | "blocked";
  characteristics: string[]; // EXIT_ROW, LEGROOM, BULKHEAD, PAID, etc.
  price?: {
    amount: number;
    currency: string;
  };
  cabin: string;
  deck?: "LOWER" | "UPPER";
}

export interface NormalizedSeatMap {
  flightOfferId: string;
  segmentId?: string;
  carrierCode?: string;
  flightNumber?: string;
  aircraft?: {
    code?: string;
  };
  departure?: {
    iataCode?: string;
    at?: string;
  };
  arrival?: {
    iataCode?: string;
    at?: string;
  };
  cabins: Array<{
    name: string;
    class: string;
    seats: NormalizedSeat[];
  }>;
  available: boolean;
  error?: string;
}

/**
 * Fetch seat map from Amadeus API
 * 
 * @param flightOffer - The full flight offer object from Amadeus (required for seat map API)
 * @param segmentIndex - Optional segment index for multi-segment flights
 */
export async function getAmadeusSeatMap(
  flightOffer: any,
  segmentIndex?: number
): Promise<NormalizedSeatMap> {
  // Extract flightOfferId early to ensure it's always defined
  const flightOfferId = flightOffer?.id || flightOffer?.flightOfferId || "unknown";

  try {
    if (!flightOffer) {
      throw new Error("flightOffer is required");
    }

    // Validate flight offer has required Amadeus structure
    // The flight offer from /v2/shopping/flight-offers should have:
    // - type: "flight-offer"
    // - id: string
    // - source: "GDS"
    // - itineraries: array
    // - price: object with total, currency
    const requiredFields = ['itineraries', 'price'];
    const missingFields = requiredFields.filter(field => !flightOffer[field]);
    
    if (missingFields.length > 0) {
      console.error("[getAmadeusSeatMap] Flight offer missing required fields", {
        missingFields,
        availableFields: Object.keys(flightOffer),
        flightOfferId,
      });
      throw new Error(`Flight offer missing required fields: ${missingFields.join(', ')}`);
    }

    const token = await getAmadeusToken();

    // Base URL: test.api.amadeus.com/v1
    const url = "https://test.api.amadeus.com/v1/shopping/seatmaps";
    
    // Amadeus Seat Map API request format:
    // According to Amadeus API documentation, the correct format is:
    // { data: [{ type: "seatmap", flightOffer: {...} }] }
    // 
    // The flightOffer must be the COMPLETE object returned from /v2/shopping/flight-offers
    // It must include: type, id, source, instantTicketingRequired, nonHomogeneous, oneWay, 
    // lastTicketingDate, numberOfBookableSeats, itineraries, price, pricingOptions, validatingAirlineCodes
    
    // Ensure flight offer has required type field
    const cleanFlightOffer = {
      ...flightOffer,
      type: flightOffer.type || "flight-offer", // Ensure type is set
    };

    // Amadeus Seat Map API format (v1/shopping/seatmaps)
    // According to Amadeus API documentation, the correct format is:
    // { data: [{ type: "seatmap", flightOffer: {...} }] }
    // 
    // The flightOffer MUST be the complete object from /v2/shopping/flight-offers
    // Required fields: type, id, source, itineraries, price
    // Optional but recommended: instantTicketingRequired, nonHomogeneous, oneWay, 
    // lastTicketingDate, numberOfBookableSeats, pricingOptions, validatingAirlineCodes
    
    // Ensure all required Amadeus fields are present
    const completeFlightOffer = {
      type: cleanFlightOffer.type || "flight-offer",
      id: cleanFlightOffer.id,
      source: cleanFlightOffer.source || "GDS",
      instantTicketingRequired: cleanFlightOffer.instantTicketingRequired ?? false,
      nonHomogeneous: cleanFlightOffer.nonHomogeneous ?? false,
      oneWay: cleanFlightOffer.oneWay ?? false,
      lastTicketingDate: cleanFlightOffer.lastTicketingDate,
      numberOfBookableSeats: cleanFlightOffer.numberOfBookableSeats,
      itineraries: cleanFlightOffer.itineraries,
      price: cleanFlightOffer.price,
      pricingOptions: cleanFlightOffer.pricingOptions,
      validatingAirlineCodes: cleanFlightOffer.validatingAirlineCodes,
      // Include any other fields from the original offer
      ...Object.fromEntries(
        Object.entries(cleanFlightOffer).filter(([key]) => 
          !['type', 'id', 'source', 'instantTicketingRequired', 'nonHomogeneous', 
            'oneWay', 'lastTicketingDate', 'numberOfBookableSeats', 'itineraries', 
            'price', 'pricingOptions', 'validatingAirlineCodes'].includes(key)
        )
      ),
    };

    // Amadeus Seat Map API request format
    const seatMapRequest: any = {
      type: "seatmap",
      flightOffer: completeFlightOffer, // Complete Amadeus flight offer object
    };

    // Add segment index if specified (optional)
    if (segmentIndex !== undefined && segmentIndex !== null) {
      seatMapRequest.segmentIndex = segmentIndex;
    }

    // Wrap in data array (required by Amadeus API)
    const requestBody = {
      data: [seatMapRequest],
    };

    // Validate flight offer has all required Amadeus fields before sending
    const requiredAmadeusFields = ['type', 'id', 'itineraries', 'price'];
    const offer = completeFlightOffer as Record<string, unknown>;
    const missingRequiredFields = requiredAmadeusFields.filter(field => {
      if (field === 'itineraries') return !completeFlightOffer.itineraries || !Array.isArray(completeFlightOffer.itineraries);
      if (field === 'price') return !completeFlightOffer.price || typeof completeFlightOffer.price !== 'object';
      return !offer[field];
    });

    if (missingRequiredFields.length > 0) {
      console.error("[getAmadeusSeatMap] Flight offer missing required Amadeus fields", {
        missingFields: missingRequiredFields,
        flightOfferKeys: Object.keys(completeFlightOffer),
        flightOfferId,
      });
      return {
        flightOfferId,
        cabins: [],
        available: false,
        error: `Flight offer missing required fields: ${missingRequiredFields.join(', ')}. Please reselect your flight.`,
      };
    }

    // Log the actual request body structure for debugging
    console.log("[getAmadeusSeatMap] Request details", {
      url,
      flightOfferId,
      requestBodyKeys: Object.keys(requestBody),
      dataArrayLength: requestBody.data?.length,
      seatMapRequestKeys: Object.keys(seatMapRequest),
      flightOfferKeys: flightOffer ? Object.keys(flightOffer).slice(0, 15) : [],
      flightOfferType: completeFlightOffer?.type,
      flightOfferIdInOffer: completeFlightOffer?.id,
      hasItineraries: !!completeFlightOffer?.itineraries,
      hasPrice: !!completeFlightOffer?.price,
      hasSource: !!completeFlightOffer?.source,
      hasPricingOptions: !!completeFlightOffer?.pricingOptions,
      hasValidatingAirlineCodes: !!completeFlightOffer?.validatingAirlineCodes,
    });

    // Log the complete request body structure (for debugging format issues)
    const requestBodyStr = JSON.stringify(requestBody, null, 2);
    console.log("[getAmadeusSeatMap] Complete request body:", requestBodyStr);

    let response: AmadeusSeatMapResponse;
    let retries = 0;
    const maxRetries = 2;
    const retryDelay = 2000; // 2 seconds

    while (retries <= maxRetries) {
      try {
        // Use fetch directly to handle non-200 responses properly
        const fetchResponse = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        // Parse response body (even for error responses)
        const responseData: AmadeusSeatMapResponse = await fetchResponse.json().catch(() => ({
          errors: [{ status: fetchResponse.status, detail: "Failed to parse response" }],
        } as AmadeusSeatMapResponse));

        // Handle HTTP errors
        if (!fetchResponse.ok) {
          const error = responseData.errors?.[0] || {};
          const errorCode = error.code;
          const errorStatus = error.status || fetchResponse.status;

          // Check for rate limit (429 or code 38194)
          if (fetchResponse.status === 429 || errorCode === 38194) {
            if (retries < maxRetries) {
              const delay = retryDelay * (retries + 1);
              console.warn(`[getAmadeusSeatMap] Rate limit hit (status: ${errorStatus}, code: ${errorCode}), retrying in ${delay}ms (attempt ${retries + 1}/${maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, delay));
              retries++;
              continue;
            } else {
              console.error("[getAmadeusSeatMap] Rate limit exceeded after retries");
              return {
                flightOfferId,
                cabins: [],
                available: false,
                error: "Amadeus API rate limit exceeded. Please wait a moment and try again.",
              };
            }
          }

          // Handle other errors (400, 500, etc.)
          const errorMessage = error.detail || error.title || `HTTP ${fetchResponse.status}`;
          console.error("[getAmadeusSeatMap] API error", {
            status: fetchResponse.status,
            code: errorCode,
            title: error.title,
            detail: error.detail,
            fullError: error,
          });

          // Return error response
          return {
            flightOfferId,
            cabins: [],
            available: false,
            error: errorMessage,
          };
        }

        // Success - use the parsed response
        response = responseData;

        // Check for errors in successful response body
        if (response.errors && response.errors.length > 0) {
          const error = response.errors[0];
          if (error.code === 38194 || error.status === 429) {
            // Rate limit in response body
            if (retries < maxRetries) {
              const delay = retryDelay * (retries + 1);
              console.warn(`[getAmadeusSeatMap] Rate limit in response (code ${error.code}), retrying in ${delay}ms (attempt ${retries + 1}/${maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, delay));
              retries++;
              continue;
            } else {
              return {
                flightOfferId,
                cabins: [],
                available: false,
                error: "Amadeus API rate limit exceeded. Please wait a moment and try again.",
              };
            }
          }
        }

        // Success or non-rate-limit error - break out of retry loop
        break;
      } catch (error: unknown) {
        // Handle network errors or JSON parsing errors
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("[getAmadeusSeatMap] Request failed", { error: errorMessage, retries });
        
        if (retries < maxRetries) {
          const delay = retryDelay * (retries + 1);
          console.warn(`[getAmadeusSeatMap] Retrying after error in ${delay}ms (attempt ${retries + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          retries++;
          continue;
        } else {
          throw error;
        }
      }
    }

    // response is now defined after the retry loop
    if (!response!) {
      return {
        flightOfferId,
        cabins: [],
        available: false,
        error: "Failed to fetch seat map after retries",
      };
    }

    // Handle errors from Amadeus
    if (response.errors && response.errors.length > 0) {
      const error = response.errors[0];
      console.error("[getAmadeusSeatMap] Amadeus API error:", error);
      return {
        flightOfferId,
        cabins: [],
        available: false,
        error: error.detail || error.title || "Seat map not available",
      };
    }

    // Handle empty response
    if (!response.data || response.data.length === 0) {
      console.warn("[getAmadeusSeatMap] No seat map data returned");
      return {
        flightOfferId,
        cabins: [],
        available: false,
        error: "Seat map not available for this flight",
      };
    }

    // Normalize the first segment's seat map (or specified segment)
    const seatMapData = response.data[segmentIndex !== undefined ? segmentIndex : 0];
    
    if (!seatMapData || !seatMapData.decks || seatMapData.decks.length === 0) {
      return {
        flightOfferId,
        segmentId: seatMapData?.segmentId,
        carrierCode: seatMapData?.carrierCode,
        flightNumber: seatMapData?.number,
        aircraft: seatMapData?.aircraft,
        departure: seatMapData?.departure,
        arrival: seatMapData?.arrival,
        cabins: [],
        available: false,
        error: "No seat map data in response",
      };
    }

    // Normalize seat data from all decks
    const normalizedSeats: NormalizedSeat[] = [];
    
    for (const deck of seatMapData.decks) {
      if (!deck.seats || deck.seats.length === 0) continue;

      for (const seat of deck.seats) {
        // Parse seat number (e.g., "12A" -> row: 12, column: "A")
        const seatMatch = seat.number?.match(/^(\d+)([A-Z]+)$/);
        if (!seatMatch) {
          console.warn("[getAmadeusSeatMap] Invalid seat number format:", seat.number);
          continue;
        }

        const row = parseInt(seatMatch[1], 10);
        const column = seatMatch[2];

        // Determine availability
        let availability: "available" | "occupied" | "blocked" = "available";
        if (seat.travelerPricing && seat.travelerPricing.length > 0) {
          const status = seat.travelerPricing[0].seatAvailabilityStatus;
          if (status === "OCCUPIED") availability = "occupied";
          else if (status === "BLOCKED") availability = "blocked";
        }

        // Extract price if available
        let price: { amount: number; currency: string } | undefined;
        if (seat.travelerPricing && seat.travelerPricing.length > 0) {
          const pricing = seat.travelerPricing[0].price;
          if (pricing && pricing.total) {
            price = {
              amount: parseFloat(pricing.total),
              currency: pricing.currency || "USD",
            };
          }
        }

        normalizedSeats.push({
          row,
          column,
          seatNumber: seat.number,
          availability,
          characteristics: seat.characteristicsCodes || [],
          price,
          cabin: seat.cabin || seatMapData.class || "ECONOMY",
          deck: deck.deckType,
        });
      }
    }

    // Group seats by cabin
    const cabinsMap = new Map<string, NormalizedSeat[]>();
    for (const seat of normalizedSeats) {
      const cabinKey = seat.cabin;
      if (!cabinsMap.has(cabinKey)) {
        cabinsMap.set(cabinKey, []);
      }
      cabinsMap.get(cabinKey)!.push(seat);
    }

    const cabins = Array.from(cabinsMap.entries()).map(([name, seats]) => ({
      name,
      class: name, // Use cabin name as class
      seats: seats.sort((a, b) => {
        // Sort by row, then by column
        if (a.row !== b.row) return a.row - b.row;
        return a.column.localeCompare(b.column);
      }),
    }));

    return {
      flightOfferId,
      segmentId: seatMapData.segmentId,
      carrierCode: seatMapData.carrierCode,
      flightNumber: seatMapData.number,
      aircraft: seatMapData.aircraft,
      departure: seatMapData.departure,
      arrival: seatMapData.arrival,
      cabins,
      available: true,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[getAmadeusSeatMap] Error:", message);
    return {
      flightOfferId,
      cabins: [],
      available: false,
      error: message,
    };
  }
}

