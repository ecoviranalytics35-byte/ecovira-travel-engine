export type StaySearchParams = { city: string; checkIn: string; nights: number; adults: number; children?: number; rooms?: number; currency?: string; budgetPerNight?: string; roomType?: string; classType?: string };

export type NormalizedStay = {
  id: string;
  city: string;
  name: string;
  checkIn: string;
  nights: number;
  roomType: string;
  classType: string;
  total: number;
  currency: string;
  provider: string;
};

export interface StaysProvider {
  search(params: StaySearchParams): Promise<{ results: NormalizedStay[]; debug: any }>;
  quote(stayId: string, params: StaySearchParams): Promise<{ quote: any; debug: any }>;
  book(quoteId: string, paymentIntentId: string): Promise<{ booking: any; debug: any }>;
}

export class MockStaysProvider implements StaysProvider {
  async search(params: StaySearchParams): Promise<{ results: NormalizedStay[]; debug: any }> {
    const results: NormalizedStay[] = [
      {
        id: "mock-stay-1",
        city: params.city,
        name: "Ecovira Mock Suites",
        checkIn: params.checkIn,
        nights: params.nights,
        roomType: params.roomType || "double",
        classType: params.classType || "standard",
        total: params.nights * 150,
        currency: params.currency || "AUD",
        provider: "mock",
      },
      {
        id: "mock-stay-2",
        city: params.city,
        name: "Harbour View Hotel (Mock)",
        checkIn: params.checkIn,
        nights: params.nights,
        roomType: params.roomType || "double",
        classType: params.classType || "standard",
        total: params.nights * 150,
        currency: params.currency || "AUD",
        provider: "mock",
      },
    ];

    return {
      results,
      debug: { mode: "mock", input: params },
    };
  }

  async quote(stayId: string, params: StaySearchParams): Promise<{ quote: any; debug: any }> {
    // Mock quote
    const quote = {
      id: `quote-${stayId}`,
      stayId,
      total: params.nights * 150,
      currency: params.currency || "AUD",
      details: "Mock quote for booking",
    };
    return { quote, debug: { mode: "mock", stayId, params } };
  }

  async book(quoteId: string, paymentIntentId: string): Promise<{ booking: any; debug: any }> {
    // Mock booking
    const booking = {
      id: `booking-${quoteId}`,
      quoteId,
      paymentIntentId,
      status: "confirmed",
      details: "Mock booking completed",
    };
    return { booking, debug: { mode: "mock", quoteId, paymentIntentId } };
  }
}

export const mockStaysProvider = new MockStaysProvider();

// Legacy function for backward compatibility
export async function searchStays(params: StaySearchParams): Promise<{ results: NormalizedStay[]; debug: any }> {
  return mockStaysProvider.search(params);
}