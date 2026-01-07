import { searchTransfers } from "./amadeus";
import { bookAmadeusTransfer } from "./amadeus-booking";
import type { TransfersProvider, TransferSearchParams, NormalizedTransfer } from "./provider";
import type { TransferPassengerInfo } from "@/stores/bookingStore";

/**
 * Production Amadeus Transfer Provider
 * Implements real Amadeus API integration for transfer search and booking
 */
export class AmadeusTransfersProvider implements TransfersProvider {
  async search(params: TransferSearchParams): Promise<{ results: NormalizedTransfer[]; debug: any }> {
    try {
      const rawResults = await searchTransfers(params);

      const results: NormalizedTransfer[] = rawResults.map((r: any) => ({
        id: r.id || `transfer-${Date.now()}-${Math.random()}`,
        from: r.from || `Location at ${params.startLat},${params.startLng}`,
        to: r.to || `Location at ${params.endLat},${params.endLng}`,
        dateTime: r.dateTime || params.dateTime,
        total: typeof r.total === "string" ? parseFloat(r.total) : r.total || 0,
        currency: r.currency || "AUD",
        provider: r.provider || "amadeus",
        raw: r.raw || r,
        name: r.name || r.transferType || "Private Transfer",
        transferType: r.transferType || "PRIVATE",
        passengers: r.passengers || params.adults,
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
      console.error("[AmadeusTransfersProvider] Search error:", error);
      return {
        results: [],
        debug: { error: message, provider: "amadeus" },
      };
    }
  }

  async quote(transferId: string, params: TransferSearchParams): Promise<{ quote: any; debug: any }> {
    // Amadeus transfer offers are typically already "quoted" with a price.
    console.warn("[AmadeusTransfersProvider] Quote method is a placeholder. Amadeus offers are usually final.");
    const quote = {
      id: `quote-${transferId}`,
      transferId,
      total: 75.00, // Placeholder
      currency: "AUD",
      details: "Amadeus mock quote for booking",
    };
    return { quote, debug: { mode: "amadeus-mock-quote", transferId, params } };
  }

  async book(
    offer: any,
    passengerInfo: TransferPassengerInfo,
    paymentId: string,
    bookingReference: string,
  ): Promise<{ booking: any; debug: any }> {
    console.log("[AmadeusTransfersProvider] Attempting to book transfer with Amadeus", { offerId: offer.id, paymentId, bookingReference });
    const amadeusBooking = await bookAmadeusTransfer(offer, passengerInfo, paymentId, bookingReference);
    
    const booking = {
      id: amadeusBooking.id,
      providerBookingId: amadeusBooking.id, // Amadeus's booking ID
      status: "CONFIRMED", // Amadeus confirms immediately
      details: amadeusBooking,
    };
    return { booking, debug: { mode: "amadeus-booking", input: { offer, passengerInfo, paymentId, bookingReference } } };
  }
}

export const amadeusTransfersProvider = new AmadeusTransfersProvider();

