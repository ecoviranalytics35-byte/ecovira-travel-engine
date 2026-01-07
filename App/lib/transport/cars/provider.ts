import type { CarResult, CarDriverInfo } from "@/lib/core/types";
import type { CarDriverInfo as BookingStoreCarDriverInfo } from "@/stores/bookingStore";

export type CarSearchParams = {
  pickupLat: number;
  pickupLng: number;
  pickupDate: string;
  pickupTime: string;
  dropoffDate: string;
  dropoffTime: string;
  driverAge: number;
  currency?: string;
};

export type NormalizedCar = {
  id: string;
  vendor: string;
  vehicle: string;
  transmission: string;
  fuel: string;
  seats: number;
  doors: number;
  pickup: string;
  dropoff: string;
  total: number;
  currency: string;
  provider: string;
  raw: any;
  // Additional fields
  name?: string;
  category?: string;
  pickupLocation?: string;
  returnLocation?: string;
  duration?: number;
};

export interface CarsProvider {
  search(params: CarSearchParams): Promise<{ results: NormalizedCar[]; debug: any }>;
  quote(carId: string, params: CarSearchParams): Promise<{ quote: any; debug: any }>;
  book(
    offer: any, // Raw offer object
    driverInfo: BookingStoreCarDriverInfo,
    paymentId: string,
    bookingReference: string,
  ): Promise<{ booking: any; debug: any }>;
}

export class MockCarsProvider implements CarsProvider {
  async search(params: CarSearchParams): Promise<{ results: NormalizedCar[]; debug: any }> {
    const pickupDate = new Date(params.pickupDate);
    const dropoffDate = new Date(params.dropoffDate);
    const daysDiff = Math.ceil((dropoffDate.getTime() - pickupDate.getTime()) / (1000 * 60 * 60 * 24));

    const results: NormalizedCar[] = [
      {
        id: "mock-car-1",
        vendor: "Premium Rentals",
        vehicle: "SUV",
        transmission: "Automatic",
        fuel: "Petrol",
        seats: 5,
        doors: 5,
        pickup: `${params.pickupLat},${params.pickupLng}`,
        dropoff: `${params.pickupLat},${params.pickupLng}`,
        total: 125.00 * daysDiff,
        currency: params.currency || "AUD",
        provider: "mock",
        raw: null,
        name: "Premium SUV",
        category: "SUV",
        pickupLocation: `Location at ${params.pickupLat},${params.pickupLng}`,
        returnLocation: `Location at ${params.pickupLat},${params.pickupLng}`,
        duration: daysDiff,
      },
    ];

    return {
      results,
      debug: { mode: "mock", input: params },
    };
  }

  async quote(carId: string, params: CarSearchParams): Promise<{ quote: any; debug: any }> {
    const pickupDate = new Date(params.pickupDate);
    const dropoffDate = new Date(params.dropoffDate);
    const daysDiff = Math.ceil((dropoffDate.getTime() - pickupDate.getTime()) / (1000 * 60 * 60 * 24));

    const quote = {
      id: `quote-${carId}`,
      carId,
      total: 125.00 * daysDiff,
      currency: params.currency || "AUD",
      details: "Mock quote for car booking",
    };
    return { quote, debug: { mode: "mock", carId, params } };
  }

  async book(
    offer: any,
    driverInfo: BookingStoreCarDriverInfo,
    paymentId: string,
    bookingReference: string,
  ): Promise<{ booking: any; debug: any }> {
    const booking = {
      id: `booking-${offer.id || Date.now()}`,
      providerBookingId: `MOCK-${Date.now()}`,
      status: "CONFIRMED",
      details: "Mock car booking completed",
    };
    return { booking, debug: { mode: "mock", offer, driverInfo, paymentId, bookingReference } };
  }
}

export const mockCarsProvider = new MockCarsProvider();

