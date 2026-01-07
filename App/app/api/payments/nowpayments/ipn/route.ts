import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getBookingByOrderId, updateBookingStatus, updateItinerary } from "@/lib/itinerary";
import { fulfillHotelBooking } from "@/lib/stays/fulfillment";
import { issueTicket } from "@/lib/tickets/issuance";
import { supabaseAdmin } from "@/lib/core/supabase";
import { issueTicket } from "@/lib/tickets/issuance";

export const runtime = "nodejs";

/**
 * NOWPayments IPN (Instant Payment Notification) handler
 * Verifies signature and updates booking status
 */
export async function POST(request: NextRequest) {
  try {
    const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET;
    
    if (!ipnSecret) {
      console.error("[NOWPayments IPN] NOWPAYMENTS_IPN_SECRET not configured");
      // Still return 200 to avoid retries
      return NextResponse.json({ ok: true, received: true, error: "IPN secret not configured" });
    }

    const body = await request.text();
    const signature = request.headers.get("x-nowpayments-sig") || request.headers.get("x-nowpayments-signature");
    
    if (!signature) {
      console.warn("[NOWPayments IPN] Missing signature header");
      return NextResponse.json({ ok: false, error: "Missing signature" }, { status: 400 });
    }

    // Verify signature (HMAC SHA512)
    // NOWPayments sends signature as: HMAC-SHA512(JSON.stringify(payload), IPN_SECRET)
    const expectedSignature = crypto
      .createHmac("sha512", ipnSecret)
      .update(body)
      .digest("hex");

    // Compare signatures (constant-time comparison)
    // Ensure both buffers are the same length
    const signatureBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    if (signatureBuffer.length !== expectedBuffer.length) {
      console.error("[NOWPayments IPN] Signature length mismatch");
      return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 400 });
    }
    if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
      console.error("[NOWPayments IPN] Signature verification failed");
      return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 400 });
    }

    // Parse payload
    let payload: any;
    try {
      payload = JSON.parse(body);
    } catch (error) {
      console.error("[NOWPayments IPN] Invalid JSON payload");
      return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
    }

    const {
      payment_id,
      invoice_id,
      order_id,
      payment_status,
      pay_amount,
      pay_currency,
      price_amount,
      price_currency,
    } = payload;

    console.log("[NOWPayments IPN] Received payment notification:", {
      payment_id,
      invoice_id,
      order_id,
      payment_status,
      pay_amount,
      pay_currency,
    });

    // Handle different payment statuses
    // Statuses: waiting, confirming, confirmed, finished, failed, expired, refunded
    // CRITICAL SECURITY: Booking is unlocked ONLY after payment_status = "finished"
    // "confirmed" means payment is confirmed but may still be processing
    // "finished" means payment is complete and funds are settled
    // This prevents premature booking unlock before funds are actually received
    if (payment_status === "finished") {
      // Payment finished - funds are settled, safe to unlock booking
      if (order_id) {
        const booking = await getBookingByOrderId(order_id);
        
        if (booking) {
          // Idempotency: Check if already processed (support both new and legacy statuses)
          const currentStatus = typeof booking.status === 'string' ? booking.status.toUpperCase() : booking.status;
          if (currentStatus === 'PAID' || currentStatus === 'TICKETED' || currentStatus === 'FULFILLMENT_PENDING' || 
              booking.status === 'paid' || booking.status === 'issued' || booking.status === 'confirmed') {
            console.log("[NOWPayments IPN] Booking already processed:", booking.id);
            return NextResponse.json({ ok: true, received: true });
          }

          console.log("[NOWPayments IPN] Payment finished for order:", order_id, "booking:", booking.id, {
            payment_id,
            invoice_id,
            pay_amount,
            pay_currency,
            price_amount,
            price_currency,
          });
          
          // Update booking status to PAID (new status enum)
          await updateBookingStatus(booking.id, "PAID");
          
          // Update itinerary status
          await updateItinerary(booking.itinerary_id, { status: 'paid' });
          
          // Determine booking type and fulfill accordingly
          const itinerary = await supabaseAdmin
            .from('itineraries')
            .select(`
              *,
              itinerary_items (*)
            `)
            .eq('id', booking.itinerary_id)
            .single();

          if (itinerary.data) {
            const items = itinerary.data.itinerary_items || [];
            const hasFlights = items.some((item: any) => item.type === 'flight');
            const hasHotels = items.some((item: any) => item.type === 'stay');
            const hasCars = items.some((item: any) => item.type === 'car');
            const hasTransfers = items.some((item: any) => item.type === 'transfer');

            if (hasHotels) {
              // Fulfill hotel booking
              await fulfillHotelBooking(booking.id);
            } else if (hasCars) {
              // Fulfill car booking
              const { fulfillCarBooking } = await import("@/lib/transport/cars/fulfillment");
              await fulfillCarBooking(booking.id);
            } else if (hasTransfers) {
              // Fulfill transfer booking
              const { fulfillTransferBooking } = await import("@/lib/transport/transfers/fulfillment");
              await fulfillTransferBooking(booking.id);
            } else if (hasFlights) {
              // Issue flight ticket
              await issueTicket(booking.id);
            } else {
              // Unknown type - mark as fulfilled
              await updateBookingStatus(booking.id, 'FULFILLMENT_PENDING');
            }
          }
        } else {
          console.warn("[NOWPayments IPN] Booking not found for order_id:", order_id);
        }
      }
    } else if (payment_status === "confirmed") {
      // Payment confirmed but not finished - log but don't unlock booking yet
      // This is normal - payment is confirmed but funds may still be settling
      console.log("[NOWPayments IPN] Payment confirmed (not finished) for order:", order_id, {
        note: "Booking will be unlocked when payment_status = finished",
      });
    } else if (payment_status === "failed" || payment_status === "expired") {
      // Payment failed - log but don't update booking
      console.log("[NOWPayments IPN] Payment failed/expired for order:", order_id);
    }

    // Always return 200 quickly to acknowledge receipt
    return NextResponse.json({ ok: true, received: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[NOWPayments IPN] Error:", message);
    
    // Still return 200 to avoid retries
    return NextResponse.json({ ok: true, received: true, error: message });
  }
}

