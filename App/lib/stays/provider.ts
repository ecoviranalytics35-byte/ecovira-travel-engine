export type StaySearchParams = {
  city: string;
  checkIn: string;
  nights: number;
  adults: number;
  children?: number;
  rooms?: number;
  currency?: string;
  budgetPerNight?: string;
  roomType?: string;
  classType?: string;
  /** From global place autocomplete */
  countryCode?: string;
  latitude?: number;
  longitude?: number;
};

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
  raw: any;
};

export interface StaysProvider {
  search(params: StaySearchParams): Promise<{ results: NormalizedStay[]; debug: any }>;
  quote(stayId: string, params: StaySearchParams): Promise<{ quote: any; debug: any }>;
  book(
    offerId: string, 
    paymentIntentId: string,
    guestInfo: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      specialRequests?: string;
    }
  ): Promise<{ booking: any; debug: any }>;
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
        raw: null,
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
        raw: null,
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
    // Mock booking
    const booking = {
      id: `booking-${offerId}`,
      offerId,
      paymentIntentId,
      status: "confirmed",
      confirmationNumber: `MOCK-${Date.now()}`,
      details: "Mock booking completed",
    };
    return { booking, debug: { mode: "mock", offerId, paymentIntentId, guestInfo } };
  }
}

export const mockStaysProvider = new MockStaysProvider();

// Legacy function for backward compatibility
export async function searchStays(params: StaySearchParams): Promise<{ results: NormalizedStay[]; debug: any }> {
  return mockStaysProvider.search(params);
}