import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

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
    if (payment_status === "finished" || payment_status === "confirmed") {
      // Payment successful - update booking status
      if (order_id) {
        // Extract booking ID from order_id (format: booking-<id>)
        const bookingId = order_id.replace(/^booking-/, "");
        
        // TODO: Update booking status in database
        // await updateBookingStatus(bookingId, "paid");
        // await markItineraryPaid(bookingId);
        
        console.log("[NOWPayments IPN] Payment confirmed for order:", order_id);
        
        // Idempotency: Check if already processed
        // TODO: Check database to ensure we don't process twice
      }
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

