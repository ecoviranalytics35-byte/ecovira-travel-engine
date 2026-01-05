import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Check payment status from NOWPayments API
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get("paymentId");

    if (!paymentId) {
      return NextResponse.json(
        { ok: false, error: "paymentId is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.NOWPAYMENTS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: "NOWPayments API key not configured" },
        { status: 500 }
      );
    }

    // Check payment status via NOWPayments API
    const response = await fetch(`https://api.nowpayments.io/v1/payment/${paymentId}`, {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[NOWPayments Status] API error:", errorData);
      return NextResponse.json(
        { ok: false, error: "Failed to check payment status", details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();

    // NOWPayments payment statuses: waiting, confirming, confirmed, sending, partially_paid, finished, failed, refunded, expired
    const status = data.payment_status || data.status || "pending";
    
    // Map to our status
    let mappedStatus: "pending" | "confirmed" | "failed" = "pending";
    if (status === "confirmed" || status === "finished" || status === "sending") {
      mappedStatus = "confirmed";
    } else if (status === "failed" || status === "expired" || status === "refunded") {
      mappedStatus = "failed";
    }

    return NextResponse.json({
      ok: true,
      status: mappedStatus,
      paymentStatus: status,
      paymentId: data.payment_id || paymentId,
      payCurrency: data.pay_currency,
      payAmount: data.pay_amount,
      payAddress: data.pay_address,
      orderId: data.order_id,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[NOWPayments Status] Error:", error);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}

