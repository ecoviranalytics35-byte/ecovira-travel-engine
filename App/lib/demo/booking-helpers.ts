// Helper functions for demo booking management
import { supabaseAdmin } from '@/lib/core/supabase';
import type { TripBooking } from '@/lib/core/trip-types';
import { generateMockTrip } from '@/lib/trips/mock-trip';

/**
 * Check if a booking ID is a demo booking
 */
export function isDemoBookingId(bookingId: string): boolean {
  return bookingId.startsWith('demo-') || 
         bookingId.startsWith('test-') || 
         bookingId === 'test-trip-123';
}

/**
 * Get demo trip by booking ID (for demo bookings stored in DB)
 */
export async function getDemoBookingFromDB(bookingId: string): Promise<TripBooking | null> {
  try {
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select(`
        *,
        itineraries (
          *,
          itinerary_items (*)
        )
      `)
      .eq('id', bookingId)
      .eq('is_demo', true)
      .single();

    if (error || !booking) {
      return null;
    }

    // Transform to TripBooking format
    const itinerary = (booking as any).itineraries;
    const flightItem = itinerary?.itinerary_items?.find((item: any) => item.type === 'flight');

    return {
      id: booking.id,
      bookingReference: (booking as any).booking_reference || booking.id,
      itineraryId: booking.itinerary_id,
      status: booking.status as any,
      supplierReference: (booking as any).supplier_reference,
      createdAt: booking.created_at,
      updatedAt: booking.updated_at,
      flightData: flightItem ? {
        airlineIata: flightItem.item_data?.airlineIata || flightItem.item_data?.raw?.airline_iata || 'QF',
        flightNumber: flightItem.item_data?.flightNumber || flightItem.item_data?.raw?.flight_number || 'QF101',
        departureAirport: flightItem.item_data?.departureAirport || flightItem.item_data?.from || 'MEL',
        arrivalAirport: flightItem.item_data?.arrivalAirport || flightItem.item_data?.to || 'SYD',
        scheduledDeparture: flightItem.item_data?.scheduledDeparture || flightItem.item_data?.departDate || new Date().toISOString(),
        scheduledArrival: flightItem.item_data?.scheduledArrival || flightItem.item_data?.arrivalDate || new Date().toISOString(),
        pnr: (booking as any).supplier_reference,
      } : undefined,
      passengerLastName: (booking as any).passenger_last_name,
      passengerCount: (booking as any).passenger_count || 1,
      route: flightItem ? {
        from: flightItem.item_data?.departureAirport || flightItem.item_data?.from || 'MEL',
        to: flightItem.item_data?.arrivalAirport || flightItem.item_data?.to || 'SYD',
        departDate: flightItem.item_data?.scheduledDeparture || flightItem.item_data?.departDate || new Date().toISOString(),
      } : undefined,
    };
  } catch (error) {
    console.error('[getDemoBookingFromDB] Error:', error);
    return null;
  }
}

/**
 * Generate demo trip from booking ID (fallback for test IDs)
 */
export function getDemoTripById(bookingId: string, departureOffsetHours?: number): TripBooking | null {
  if (bookingId === 'test-trip-123' || bookingId.startsWith('test-')) {
    return generateMockTrip(departureOffsetHours || 72);
  }
  
  // For demo- prefixed IDs, try to extract departure offset from ID
  if (bookingId.startsWith('demo-')) {
    const match = bookingId.match(/demo-(\d+)h/);
    const hours = match ? parseInt(match[1]) : 72;
    return generateMockTrip(hours);
  }
  
  return null;
}

