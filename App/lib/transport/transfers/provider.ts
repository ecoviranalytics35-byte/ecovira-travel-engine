import type { TransferResult, TransferPassengerInfo } from "@/lib/core/types";
import type { TransferPassengerInfo as BookingStoreTransferPassengerInfo } from "@/stores/bookingStore";

export type TransferSearchParams = {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  dateTime: string;
  adults: number;
};

export type NormalizedTransfer = {
  id: string;
  from: string;
  to: string;
  dateTime: string;
  total: number;
  currency: string;
  provider: string;
  raw: any;
  // Additional fields
  name?: string;
  transferType?: string;
  passengers?: number;
};

export interface TransfersProvider {
  search(params: TransferSearchParams): Promise<{ results: NormalizedTransfer[]; debug: any }>;
  quote(transferId: string, params: TransferSearchParams): Promise<{ quote: any; debug: any }>;
  book(
    offer: any, // Raw offer object
    passengerInfo: BookingStoreTransferPassengerInfo,
    paymentId: string,
    bookingReference: string,
  ): Promise<{ booking: any; debug: any }>;
}

export class MockTransfersProvider implements TransfersProvider {
  async search(params: TransferSearchParams): Promise<{ results: NormalizedTransfer[]; debug: any }> {
    const results: NormalizedTransfer[] = [
      {
        id: "mock-transfer-1",
        from: `Location at ${params.startLat},${params.startLng}`,
        to: `Location at ${params.endLat},${params.endLng}`,
        dateTime: params.dateTime,
        total: 75.00,
        currency: "AUD",
        provider: "mock",
        raw: null,
        name: "Premium Private Transfer",
        transferType: "PRIVATE",
        passengers: params.adults,
      },
    ];

    return {
      results,
      debug: { mode: "mock", input: params },
    };
  }

  async quote(transferId: string, params: TransferSearchParams): Promise<{ quote: any; debug: any }> {
    const quote = {
      id: `quote-${transferId}`,
      transferId,
      total: 75.00,
      currency: "AUD",
      details: "Mock quote for transfer booking",
    };
    return { quote, debug: { mode: "mock", transferId, params } };
  }

  async book(
    offer: any,
    passengerInfo: BookingStoreTransferPassengerInfo,
    paymentId: string,
    bookingReference: string,
  ): Promise<{ booking: any; debug: any }> {
    const booking = {
      id: `booking-${offer.id || Date.now()}`,
      providerBookingId: `MOCK-${Date.now()}`,
      status: "CONFIRMED",
      details: "Mock transfer booking completed",
    };
    return { booking, debug: { mode: "mock", offer, passengerInfo, paymentId, bookingReference } };
  }
}

export const mockTransfersProvider = new MockTransfersProvider();

