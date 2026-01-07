import { supabaseAdmin } from "../core/supabase";
import { getItinerary, updateBookingStatus } from "../itinerary";
import { amadeusStaysProvider } from "./amadeus-provider";
import { notifyHotelBookingConfirmed } from "../notifications/hotels";

/**
 * Fulfill hotel booking after payment confirmation
 * This is called from webhook handlers after payment is confirmed
 */
export async function fulfillHotelBooking(bookingId: string): Promise<{
  success: boolean;
  bookingReference?: string;
  confirmationNumber?: string;
  error?: string;
}> {
  try {
    // Get booking with itinerary
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select(`
        *,
        itineraries (
          *,
          itinerary_items (*)
        )
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return { success: false, error: "Booking not found" };
    }

    const itinerary = (booking as any).itineraries;
    if (!itinerary) {
      return { success: false, error: "Itinerary not found" };
    }

    // Find hotel item in itinerary
    const hotelItem = itinerary.itinerary_items?.find(
      (item: any) => item.type === 'stay'
    );

    if (!hotelItem) {
      return { success: false, error: "No hotel item found in itinerary" };
    }

    const itemData = hotelItem.item_data || hotelItem.item || {};
    const stayOfferId = itemData.id || itemData.offerId;

    if (!stayOfferId) {
      return { success: false, error: "Hotel offer ID not found" };
    }

    // Get guest info from booking metadata or passenger fields
    const guestInfo = {
      firstName: booking.passenger_email?.split('@')[0] || "Guest",
      lastName: booking.passenger_last_name || "",
      email: booking.passenger_email || "",
      phone: booking.phone_number || "",
      specialRequests: undefined,
    };

    // Extract guest info from booking metadata if available
    const bookingMetadata = booking.metadata || {};
    if (bookingMetadata.guestInfo) {
      Object.assign(guestInfo, bookingMetadata.guestInfo);
    }

    // Get payment intent ID
    const paymentIntentId = booking.payment_id;

    if (!paymentIntentId) {
      return { success: false, error: "Payment ID not found" };
    }

    // Call hotel booking API
    console.log("[fulfillHotelBooking] Booking hotel", {
      bookingId,
      stayOfferId,
      paymentIntentId,
      guestInfo: { ...guestInfo, email: guestInfo.email ? "[REDACTED]" : undefined },
    });

    const { booking: hotelBooking, debug } = await amadeusStaysProvider.book(
      stayOfferId,
      paymentIntentId,
      guestInfo
    );

    if (!hotelBooking) {
      return { success: false, error: "Hotel booking failed" };
    }

    // Update booking with hotel confirmation details
    const confirmationNumber = hotelBooking.confirmationNumber || hotelBooking.id;
    const bookingReference = booking.booking_reference || `ECO-${Date.now().toString(36).toUpperCase()}`;

    await supabaseAdmin
      .from('bookings')
      .update({
        booking_reference: bookingReference,
        supplier_reference: confirmationNumber,
        metadata: {
          ...bookingMetadata,
          hotelBooking,
          confirmationNumber,
        },
      })
      .eq('id', bookingId);

    // Update booking status to FULFILLMENT_PENDING (hotel confirmed, awaiting voucher)
    await updateBookingStatus(bookingId, 'FULFILLMENT_PENDING');

    // Send confirmation email
    if (guestInfo.email) {
      await notifyHotelBookingConfirmed(
        bookingId,
        bookingReference,
        confirmationNumber,
        guestInfo.email,
        {
          hotelName: itemData.name || "Hotel",
          checkIn: itemData.checkIn || "",
          checkOut: itemData.checkOut || "",
          nights: itemData.nights || 1,
          city: itemData.city || "",
        },
        guestInfo.phone,
        false // SMS opt-in - can be extracted from booking if needed
      );
    }

    console.log("[fulfillHotelBooking] Hotel booking fulfilled", {
      bookingId,
      bookingReference,
      confirmationNumber,
    });

    return {
      success: true,
      bookingReference,
      confirmationNumber,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[fulfillHotelBooking] Error:", error);
    return { success: false, error: message };
  }
}

