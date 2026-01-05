import { NextRequest, NextResponse } from "next/server";
import { issueTicket } from "@/lib/tickets/issuance";

export const runtime = "nodejs";

/**
 * POST /api/debug/issue-ticket
 * Admin/debug endpoint to issue tickets without payment
 * 
 * Requires:
 * - ADMIN_SECRET header (or runs in dev mode only)
 * 
 * Body: { bookingId: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Security check: require ADMIN_ISSUE_KEY or only allow in dev mode
    const adminKey = request.headers.get("x-admin-key") || request.headers.get("admin-secret") || request.headers.get("x-admin-secret");
    const isDev = process.env.NODE_ENV === "development";
    const expectedKey = process.env.ADMIN_ISSUE_KEY || process.env.ADMIN_SECRET;

    if (!isDev && !adminKey) {
      return NextResponse.json(
        { error: "X-ADMIN-KEY header required in production" },
        { status: 401 }
      );
    }

    if (adminKey && expectedKey && adminKey !== expectedKey) {
      return NextResponse.json(
        { error: "Invalid admin key" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { bookingId } = body;

    if (!bookingId || typeof bookingId !== "string") {
      return NextResponse.json(
        { error: "bookingId is required" },
        { status: 400 }
      );
    }

    console.log("[Debug] Issuing ticket for booking:", bookingId);

    // Call the same issueTicket function used by webhooks
    const result = await issueTicket(bookingId);

    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      bookingId,
      bookingReference: result.bookingReference,
      ticketUrl: result.ticketUrl,
      message: "Ticket issued successfully",
    });
  } catch (error: unknown) {
    console.error("[Debug] Error issuing ticket:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}

