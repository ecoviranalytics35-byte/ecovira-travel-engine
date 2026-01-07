import { supabaseAdmin } from "../../core/supabase";
import { getBookingById, updateBookingStatus, updateItinerary } from "../../itinerary";
import { amadeusTransfersProvider } from "./amadeus-provider";
import { notifyTransferBookingConfirmed } from "../../notifications/transfers";
import type { ItineraryItem, TransferResult } from "../../core/types";
import type { TransferPassengerInfo } from "@/stores/bookingStore";

export async function fulfillTransferBooking(bookingId: string): Promise<{ success: boolean; message?: string; bookingReference?: string }> {
  console.log(`[Fulfillment] Starting transfer booking fulfillment for bookingId: ${bookingId}`);

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

  const transferItem = itineraryData.itinerary_items.find((item: any) => item.type === 'transfer') as ItineraryItem | undefined;
  if (!transferItem) {
    console.error(`[Fulfillment] No transfer item found in itinerary for booking ${bookingId}`);
    await updateBookingStatus(bookingId, 'FAILED');
    return { success: false, message: "No transfer item found" };
  }

  const transferOffer = transferItem.item as TransferResult;
  const bookingMetadata = booking.metadata || {};
  const passengerInfo = bookingMetadata.transferPassengerInfo as TransferPassengerInfo;

  if (!passengerInfo) {
    console.error(`[Fulfillment] Missing passenger information for transfer booking ${bookingId}`);
    await updateBookingStatus(bookingId, 'FAILED');
    return { success: false, message: "Missing passenger information" };
  }

  try {
    // Call Amadeus to book the transfer
    const { booking: providerBooking, debug } = await amadeusTransfersProvider.book(
      transferOffer.raw, // Pass the raw Amadeus offer
      passengerInfo,
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

    // Send confirmation email (if email is available from booking)
    const passengerEmail = booking.passenger_email || "";
    if (passengerEmail) {
      const { emailSent } = await notifyTransferBookingConfirmed(
        booking.id,
        booking.bookingReference || booking.id,
        providerBooking.providerBookingId,
        passengerEmail,
        {
          transferType: transferOffer.name || transferOffer.transferType || "Private Transfer",
          from: transferOffer.from,
          to: transferOffer.to,
          dateTime: transferOffer.dateTime,
          passengers: passengerInfo.passengers,
        },
        booking.phone_number,
        booking.smsOptIn // Assuming smsOptIn is stored on booking
      );

      if (emailSent) {
        await supabaseAdmin
          .from('bookings')
          .update({ booking_confirmed_email_sent_at: new Date().toISOString() })
          .eq('id', booking.id);
      }
    }

    console.log(`[Fulfillment] Transfer booking ${booking.id} fulfilled successfully. Provider Booking ID: ${providerBooking.providerBookingId}`);
    return { success: true, message: "Transfer booking fulfilled", bookingReference: providerBooking.providerBookingId };
  } catch (error) {
    console.error(`[Fulfillment] Error fulfilling transfer booking ${bookingId}:`, error);
    await updateBookingStatus(booking.id, 'FAILED');
    return { success: false, message: `Failed to fulfill transfer booking: ${error instanceof Error ? error.message : String(error)}` };
  }
}

