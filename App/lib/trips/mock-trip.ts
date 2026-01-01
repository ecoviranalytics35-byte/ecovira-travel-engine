// Mock trip generator for testing/demo mode
import type { TripBooking } from '@/lib/core/trip-types';

/**
 * Generate a mock trip for testing/demo purposes
 * @param departureOffsetHours - Hours from now until departure (default: 72 for 3 days)
 */
export function generateMockTrip(departureOffsetHours: number = 72): TripBooking {
  const now = new Date();
  const departure = new Date(now.getTime() + departureOffsetHours * 60 * 60 * 1000);
  
  // Default to a flight 3 days from now (good for testing check-in countdown)
  const mockTrip: TripBooking = {
    id: 'test-trip-123',
    bookingReference: 'TEST123',
    itineraryId: 'test-itinerary-123',
    status: 'ticketed',
    supplierReference: 'TESTPNR123',
    createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    updatedAt: now.toISOString(),
    flightData: {
      airlineIata: 'QF',
      flightNumber: 'QF101',
      departureAirport: 'MEL',
      arrivalAirport: 'SYD',
      scheduledDeparture: departure.toISOString(),
      scheduledArrival: new Date(departure.getTime() + 90 * 60 * 1000).toISOString(), // 90 min flight
      pnr: 'TESTPNR123',
      ticketNumber: 'TEST123456789',
    },
    passengerLastName: 'TEST',
    passengerCount: 1,
    route: {
      from: 'MEL',
      to: 'SYD',
      departDate: departure.toISOString(),
    },
  };
  
  return mockTrip;
}

/**
 * Check if test credentials are provided
 */
export function isTestMode(reference: string, lastName: string, demoParam?: string | null): boolean {
  // Check for demo query param
  if (demoParam === 'true' || demoParam === '1') {
    return true;
  }
  
  // Check for test credentials
  const normalizedRef = reference.toUpperCase().trim();
  const normalizedLastName = lastName.toUpperCase().trim();
  
  return (
    (normalizedRef === 'TEST123' || normalizedRef === 'TEST') &&
    (normalizedLastName === 'TEST' || normalizedLastName === 'DEMO')
  );
}

