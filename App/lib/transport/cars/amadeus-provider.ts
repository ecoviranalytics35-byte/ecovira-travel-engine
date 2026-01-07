import { searchCars } from "./amadeus";
import { bookAmadeusCar } from "./amadeus-booking";
import type { CarsProvider, CarSearchParams, NormalizedCar } from "./provider";
import type { CarDriverInfo } from "@/stores/bookingStore";

/**
 * Production Amadeus Car Rental Provider
 * Implements real Amadeus API integration for car rental search and booking
 */
export class AmadeusCarsProvider implements CarsProvider {
  async search(params: CarSearchParams): Promise<{ results: NormalizedCar[]; debug: any }> {
    try {
      const rawResults = await searchCars(params);

      const results: NormalizedCar[] = rawResults.map((r: any) => ({
        id: r.id || `car-${Date.now()}-${Math.random()}`,
        vendor: r.vendor || "Unknown",
        vehicle: r.vehicle || "Car",
        transmission: r.transmission || "Automatic",
        fuel: r.fuel || "Petrol",
        seats: r.seats || 5,
        doors: r.doors || 4,
        pickup: r.pickup || `${params.pickupLat},${params.pickupLng}`,
        dropoff: r.dropoff || `${params.pickupLat},${params.pickupLng}`,
        total: typeof r.total === "string" ? parseFloat(r.total) : r.total || 0,
        currency: r.currency || params.currency || "AUD",
        provider: r.provider || "amadeus",
        raw: r.raw || r,
        name: r.name || r.vehicle || "Car",
        category: r.category || r.vehicle || "Standard",
        pickupLocation: r.pickupLocation || `Location at ${params.pickupLat},${params.pickupLng}`,
        returnLocation: r.returnLocation || `Location at ${params.pickupLat},${params.pickupLng}`,
        duration: r.duration || 1,
      }));

      return {
        results,
        debug: {
          resultsCount: results.length,
          provider: "amadeus",
        },
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("[AmadeusCarsProvider] Search error:", error);
      return {
        results: [],
        debug: { error: message, provider: "amadeus" },
      };
    }
  }

  async quote(carId: string, params: CarSearchParams): Promise<{ quote: any; debug: any }> {
    // Amadeus car offers are typically already "quoted" with a price.
    // We might re-fetch the offer to ensure it's still valid and get the latest price.
    console.warn("[AmadeusCarsProvider] Quote method is a placeholder. Amadeus offers are usually final.");
    const pickupDate = new Date(params.pickupDate);
    const dropoffDate = new Date(params.dropoffDate);
    const daysDiff = Math.ceil((dropoffDate.getTime() - pickupDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const quote = {
      id: `quote-${carId}`,
      carId,
      total: 125.00 * daysDiff, // Placeholder
      currency: params.currency || "AUD",
      details: "Amadeus mock quote for booking",
    };
    return { quote, debug: { mode: "amadeus-mock-quote", carId, params } };
  }

  async book(
    offer: any,
    driverInfo: CarDriverInfo,
    paymentId: string,
    bookingReference: string,
  ): Promise<{ booking: any; debug: any }> {
    console.log("[AmadeusCarsProvider] Attempting to book car with Amadeus", { offerId: offer.id, paymentId, bookingReference });
    const amadeusBooking = await bookAmadeusCar(offer, driverInfo, paymentId, bookingReference);
    
    const booking = {
      id: amadeusBooking.id,
      providerBookingId: amadeusBooking.id, // Amadeus's booking ID
      status: "CONFIRMED", // Amadeus confirms immediately
      details: amadeusBooking,
    };
    return { booking, debug: { mode: "amadeus-booking", input: { offer, driverInfo, paymentId, bookingReference } } };
  }
}

export const amadeusCarsProvider = new AmadeusCarsProvider();

