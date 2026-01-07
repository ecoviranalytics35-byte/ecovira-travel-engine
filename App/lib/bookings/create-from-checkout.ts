import { createItinerary, createBooking } from "../itinerary";
import { supabaseAdmin } from "../core/supabase";
import type { StayResult, FlightResult } from "../core/types";

/**
 * Create itinerary and booking from checkout session metadata
 * This is called when a checkout session is completed but no booking exists yet
 */
export async function createBookingFromCheckoutSession(
  sessionId: string,
  bookingData: {
    offerId?: string;
    stayOfferId?: string;
    stay?: StayResult;
    passengers?: any[];
    baggage?: any;
    seats?: any[];
    insurance?: any;
    guestInfo?: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      specialRequests?: string;
    };
  },
  customerEmail: string,
  amount: number,
  currency: string
): Promise<{ bookingId: string; itineraryId: string }> {
  // Build itinerary items from booking data
  const items: Array<{ type: 'flight' | 'stay' | 'car' | 'transfer'; item: any }> = [];

  // Add hotel if present
  if (bookingData.stayOfferId || bookingData.stay) {
    const stay = bookingData.stay || {
      id: bookingData.stayOfferId || 'unknown',
      type: 'stay' as const,
      city: '',
      name: 'Hotel',
      checkIn: '',
      nights: 1,
      roomType: 'double',
      classType: 'standard',
      total: amount,
      currency,
      provider: 'amadeus',
      raw: {},
    };
    items.push({ type: 'stay', item: stay });
  }

  // Add flight if present
  if (bookingData.offerId) {
    // Flight data would need to be reconstructed from offerId
    // For now, we'll need to fetch it or store it in metadata
    // This is a placeholder - in production, you'd fetch the flight offer
    console.warn('[createBookingFromCheckoutSession] Flight offerId provided but flight data not available');
  }

  if (items.length === 0) {
    throw new Error("No booking items found in checkout session");
  }

  // Create itinerary
  const itinerary = await createItinerary(items);

  // Determine customer info
  const passengerEmail = customerEmail || bookingData.guestInfo?.email || '';
  const passengerLastName = bookingData.guestInfo?.lastName || bookingData.passengers?.[0]?.lastName || '';
  const phoneNumber = bookingData.guestInfo?.phone || bookingData.passengers?.[0]?.phone || '';

  // Create booking
  const booking = await createBooking(
    itinerary.id,
    sessionId,
    {
      passengerEmail,
      passengerLastName,
      phoneNumber,
      smsOptIn: false,
      initialStatus: 'QUOTE_HELD', // Will be updated to PAID by webhook
    }
  );

  // Store guest info in booking metadata if hotel booking
  if (bookingData.guestInfo && bookingData.stayOfferId) {
    await supabaseAdmin
      .from('bookings')
      .update({
        metadata: {
          guestInfo: bookingData.guestInfo,
          stayOfferId: bookingData.stayOfferId,
          stay: bookingData.stay,
        },
      })
      .eq('id', booking.id);
  }

  return {
    bookingId: booking.id,
    itineraryId: itinerary.id,
  };
}

