import { supabaseAdmin } from "../core/supabase";
import { updateBookingStatus } from "../itinerary";
import { generateBookingReference } from "./issuance";

/**
 * STUB TICKETING ADAPTER
 * 
 * This is a stub implementation that does NOT issue actual tickets.
 * It sets the booking status to FULFILLMENT_PENDING to indicate that
 * ticketing is pending until live ticketing APIs are approved.
 * 
 * Requirements:
 * - Returns PENDING status (not TICKETED)
 * - No PDF generation
 * - No email sending
 * - No misleading "instant ticket issued" messaging
 * - Compatible with booking state machine
 */

/**
 * Get booking by ID with full details
 */
async function getBookingById(bookingId: string): Promise<any | null> {
  const { data, error } = await supabaseAdmin
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

  if (error) return null;
  return data;
}

/**
 * Stub function: Issue ticket for a booking (STUB - returns PENDING)
 * 
 * This function simulates ticket issuance but does NOT actually issue tickets.
 * It sets the booking to FULFILLMENT_PENDING status, indicating that ticketing
 * is pending until live ticketing APIs are approved.
 */
export async function issueTicketStub(bookingId: string): Promise<{
  success: boolean;
  bookingReference?: string;
  status?: string;
  message?: string;
  error?: string;
}> {
  try {
    console.log("[Ticket Stub] Processing flight booking (STUB MODE - no actual ticket issuance)", { bookingId });

    const booking = await getBookingById(bookingId);
    if (!booking) {
      return { success: false, error: "Booking not found" };
    }

    // Check if already processed
    const currentStatus = typeof booking.status === 'string' ? booking.status.toUpperCase() : booking.status;
    if (currentStatus === 'FULFILLMENT_PENDING' || currentStatus === 'TICKETED' || 
        booking.status === 'issued' || booking.status === 'confirmed') {
      console.log("[Ticket Stub] Booking already processed:", bookingId);
      return {
        success: true,
        bookingReference: booking.booking_reference,
        status: currentStatus,
        message: "Booking already processed",
      };
    }

    // Generate booking reference if not exists
    let bookingReference = booking.booking_reference;
    if (!bookingReference) {
      bookingReference = generateBookingReference();
      await supabaseAdmin
        .from('bookings')
        .update({ booking_reference: bookingReference })
        .eq('id', bookingId);
    }

    // STUB: Set status to FULFILLMENT_PENDING (not TICKETED)
    // This indicates that payment is confirmed but ticketing is pending
    await updateBookingStatus(bookingId, 'FULFILLMENT_PENDING');

    // Update booking metadata to indicate stub mode
    const bookingMetadata = booking.metadata || {};
    await supabaseAdmin
      .from('bookings')
      .update({
        metadata: {
          ...bookingMetadata,
          ticketingStatus: 'PENDING',
          ticketingMode: 'STUB',
          ticketingNote: 'Ticketing pending until live ticketing APIs are approved',
        },
        ticket_status: 'PENDING',
      })
      .eq('id', bookingId);

    console.log("[Ticket Stub] Flight booking set to FULFILLMENT_PENDING (stub mode)", {
      bookingId,
      bookingReference,
      status: 'FULFILLMENT_PENDING',
      note: 'No actual ticket issued - stub mode',
    });

    return {
      success: true,
      bookingReference,
      status: 'FULFILLMENT_PENDING',
      message: 'Booking confirmed. Ticket issuance pending.',
    };
  } catch (error) {
    console.error("[Ticket Stub] Error processing booking:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

