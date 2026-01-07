import type { StaySearchParams, NormalizedStay, StaysProvider } from "./provider";
import { getAmadeusToken, hotelsByCity, hotelOffers } from "./amadeus";
import { bookAmadeusHotel } from "./amadeus-booking";
import { getCityCode } from "@/lib/utils/cityCodes";

/**
 * Production Amadeus Hotels Provider
 * Implements real Amadeus API integration for hotel search and booking
 */
export class AmadeusStaysProvider implements StaysProvider {
  async search(params: StaySearchParams): Promise<{ results: NormalizedStay[]; debug: any }> {
    try {
      // Validate check-in date before proceeding
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const checkIn = new Date(params.checkIn);
      checkIn.setHours(0, 0, 0, 0);
      
      if (isNaN(checkIn.getTime())) {
        return { 
          results: [], 
          debug: { error: "Invalid check-in date format" },
        };
      }
      
      if (checkIn < today) {
        return { 
          results: [], 
          debug: { error: "Check-in date cannot be in the past" },
        };
      }
      
      const maxDays = 359;
      const daysDiff = Math.ceil((checkIn.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff > maxDays) {
        return { 
          results: [], 
          debug: { error: `Check-in date cannot be more than ${maxDays} days in advance` },
        };
      }

      // Convert city name to city code
      const cityCode = getCityCode(params.city);
      if (!cityCode) {
        throw new Error(`City "${params.city}" not found. Please use a city name (e.g., Melbourne) or IATA code (e.g., MEL).`);
      }

      const token = await getAmadeusToken();
      const hotelIds = await hotelsByCity(cityCode, token);

      if (hotelIds.length === 0) {
        return { results: [], debug: { cityCode, hotelIdsCount: 0, error: "No hotels found" } };
      }

      const rawResults = await hotelOffers(
        hotelIds,
        token,
        params.adults,
        params.checkIn,
        params.nights,
        params.rooms || 1
      );

      const results: NormalizedStay[] = rawResults.map((r) => ({
        id: r.id || `stay-${Date.now()}-${Math.random()}`,
        city: r.cityCode || cityCode,
        name: r.name || "Hotel",
        checkIn: params.checkIn,
        nights: params.nights,
        roomType: params.roomType || "double",
        classType: params.classType || "standard",
        total: typeof r.total === "string" ? parseFloat(r.total) : r.total || 0,
        currency: r.currency || params.currency || "AUD",
        provider: r.provider || "amadeus",
        raw: r.raw || r,
      }));

      return {
        results,
        debug: {
          cityCode,
          hotelIdsCount: hotelIds.length,
          resultsCount: results.length,
          provider: "amadeus",
        },
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("[AmadeusStaysProvider] Search error:", error);
      return {
        results: [],
        debug: { error: message, provider: "amadeus" },
      };
    }
  }

  async quote(stayId: string, params: StaySearchParams): Promise<{ quote: any; debug: any }> {
    // For Amadeus, the offer ID from search is already the quote
    // In a real implementation, we might need to re-fetch the offer to ensure it's still valid
    return {
      quote: {
        id: stayId,
        offerId: stayId,
        total: params.nights * 150, // Placeholder - should come from offer
        currency: params.currency || "AUD",
        validUntil: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
      },
      debug: { mode: "amadeus", stayId, params },
    };
  }

  async book(
    offerId: string,
    paymentIntentId: string,
    guestInfo: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      specialRequests?: string;
    }
  ): Promise<{ booking: any; debug: any }> {
    try {
      const bookingResult = await bookAmadeusHotel(offerId, guestInfo, paymentIntentId);

      return {
        booking: {
          id: bookingResult.bookingId,
          confirmationNumber: bookingResult.confirmationNumber,
          status: bookingResult.status,
          hotelName: bookingResult.hotelName,
          checkIn: bookingResult.checkIn,
          checkOut: bookingResult.checkOut,
          paymentIntentId,
          provider: "amadeus",
        },
        debug: {
          mode: "amadeus",
          offerId,
          paymentIntentId,
          bookingId: bookingResult.bookingId,
        },
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("[AmadeusStaysProvider] Booking error:", error);
      throw new Error(`Failed to book hotel: ${message}`);
    }
  }
}

export const amadeusStaysProvider = new AmadeusStaysProvider();

