// Create demo bookings for testing
import { supabaseAdmin } from '@/lib/core/supabase';
import type { FlightResult, StayResult, CarResult, TransferResult } from '@/lib/core/types';
import type { BookingExtras } from '@/lib/core/booking-extras';

/**
 * Create a demo flight booking
 */
export async function createDemoFlightBooking(params: {
  flight: FlightResult;
  passengerEmail: string;
  passengerLastName: string;
  phoneNumber?: string;
  departureOffsetHours?: number;
  extras?: BookingExtras;
}): Promise<{ bookingId: string; bookingReference: string }> {
  const { flight, passengerEmail, passengerLastName, phoneNumber, departureOffsetHours = 72, extras } = params;
  
  const now = new Date();
  const departure = new Date(now.getTime() + departureOffsetHours * 60 * 60 * 1000);
  
  // Create itinerary
  const { data: itinerary, error: itineraryError } = await supabaseAdmin
    .from('itineraries')
    .insert({
      status: 'confirmed',
      total: parseFloat(String(flight.price ?? '0')),
      currency: flight.currency || 'AUD',
    })
    .select()
    .single();

  if (itineraryError || !itinerary) {
    throw new Error('Failed to create demo itinerary');
  }

  // Create itinerary item with extras (FlightResult has from/to/price/currency; airline/flightNumber may be in raw)
  const raw = (flight.raw ?? {}) as { airline?: string; flightNumber?: string };
  const flightItemData = {
    airlineIata: raw.airline ?? 'QF',
    flightNumber: raw.flightNumber ?? 'QF101',
    departureAirport: flight.from || 'MEL',
    arrivalAirport: flight.to || 'SYD',
    scheduledDeparture: departure.toISOString(),
    scheduledArrival: new Date(departure.getTime() + 90 * 60 * 1000).toISOString(),
    price: parseFloat(String(flight.price ?? '0')),
    currency: flight.currency || 'AUD',
    raw: flight.raw || {},
    extras: extras || null,
  };

  const { error: itemError } = await supabaseAdmin
    .from('itinerary_items')
    .insert({
      itinerary_id: itinerary.id,
      type: 'flight',
      item_data: flightItemData,
    });

  if (itemError) {
    throw new Error('Failed to create demo itinerary item');
  }

  // Create booking
  const bookingReference = 'TEST123';
  const { data: booking, error: bookingError } = await supabaseAdmin
    .from('bookings')
    .insert({
      itinerary_id: itinerary.id,
      payment_id: `demo-payment-${Date.now()}`,
      status: 'ticketed',
      booking_reference: bookingReference,
      supplier_reference: `DEMOPNR${Date.now()}`,
      passenger_email: passengerEmail,
      passenger_last_name: passengerLastName,
      phone_number: phoneNumber,
      is_demo: true,
      passenger_count: 1,
    })
    .select()
    .single();

  if (bookingError || !booking) {
    throw new Error('Failed to create demo booking');
  }

  return {
    bookingId: booking.id,
    bookingReference,
  };
}

