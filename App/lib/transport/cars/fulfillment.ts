import { supabaseAdmin } from "../../core/supabase";
import { getBookingById, updateBookingStatus, updateItinerary } from "../../itinerary";
import { amadeusCarsProvider } from "./amadeus-provider";
import { notifyCarBookingConfirmed } from "../../notifications/cars";
import type { ItineraryItem, CarResult } from "../../core/types";
import type { CarDriverInfo } from "@/stores/bookingStore";

export async function fulfillCarBooking(bookingId: string): Promise<{ success: boolean; message?: string; bookingReference?: string }> {
  console.log(`[Fulfillment] Starting car booking fulfillment for bookingId: ${bookingId}`);

  const booking = await getBookingById(bookingId);
  if (!booking) {
    console.error(`[Fulfillment] Booking not found for ID: ${bookingId}`);
    return { success: false, message: "Booking not found" };
  }

  // Fetch itinerary and its items
  const { data: itineraryData, error: itineraryError } = await supabaseAdmin
    .from('itineraries')
    .select(`*, itinerary_items (*)`)
    .eq('id', booking.itineraryId)
    .single();

  if (itineraryError || !itineraryData) {
    console.error(`[Fulfillment] Itinerary not found for booking ${bookingId}:`, itineraryError);
    await updateBookingStatus(bookingId, 'FAILED');
    return { success: false, message: "Itinerary not found" };
  }

  const carItem = itineraryData.itinerary_items.find((item: any) => item.type === 'car') as ItineraryItem | undefined;
  if (!carItem) {
    console.error(`[Fulfillment] No car item found in itinerary for booking ${bookingId}`);
    await updateBookingStatus(bookingId, 'FAILED');
    return { success: false, message: "No car item found" };
  }

  const carOffer = carItem.item as CarResult;
  const bookingMetadata = booking.metadata || {};
  const driverInfo = bookingMetadata.carDriverInfo as CarDriverInfo;

  if (!driverInfo) {
    console.error(`[Fulfillment] Missing driver information for car booking ${bookingId}`);
    await updateBookingStatus(bookingId, 'FAILED');
    return { success: false, message: "Missing driver information" };
  }

  try {
    // Call Amadeus to book the car
    const { booking: providerBooking, debug } = await amadeusCarsProvider.book(
      carOffer.raw, // Pass the raw Amadeus offer
      driverInfo,
      booking.paymentId,
      booking.bookingReference || booking.id // Use existing or generate
    );

    // Update booking status to FULFILLMENT_PENDING (or CONFIRMED if Amadeus confirms immediately)
    await updateBookingStatus(booking.id, 'FULFILLMENT_PENDING');
    await updateItinerary(booking.itineraryId, { status: 'confirmed' });

    // Store provider reference
    await supabaseAdmin
      .from('bookings')
      .update({
        supplier_reference: providerBooking.providerBookingId,
        status: 'FULFILLMENT_PENDING', // Ensure status is updated in DB
        metadata: { ...booking.metadata, providerBookingDetails: providerBooking.details },
      })
      .eq('id', booking.id);

    // Send confirmation email
    const { emailSent } = await notifyCarBookingConfirmed(
      booking.id,
      booking.bookingReference || booking.id,
      providerBooking.providerBookingId,
      driverInfo.email,
      {
        vehicleName: carOffer.name || carOffer.vehicle,
        vendor: carOffer.vendor,
        pickupLocation: carOffer.pickupLocation || carOffer.pickup,
        returnLocation: carOffer.returnLocation || carOffer.dropoff,
        pickupDate: carOffer.pickupDate || '',
        returnDate: carOffer.returnDate || '',
        duration: carOffer.duration || 1,
      },
      driverInfo.phone,
      booking.smsOptIn // Assuming smsOptIn is stored on booking
    );

    if (emailSent) {
      await supabaseAdmin
        .from('bookings')
        .update({ booking_confirmed_email_sent_at: new Date().toISOString() })
        .eq('id', booking.id);
    }

    console.log(`[Fulfillment] Car booking ${booking.id} fulfilled successfully. Provider Booking ID: ${providerBooking.providerBookingId}`);
    return { success: true, message: "Car booking fulfilled", bookingReference: providerBooking.providerBookingId };
  } catch (error) {
    console.error(`[Fulfillment] Error fulfilling car booking ${bookingId}:`, error);
    await updateBookingStatus(booking.id, 'FAILED');
    return { success: false, message: `Failed to fulfill car booking: ${error instanceof Error ? error.message : String(error)}` };
  }
}

