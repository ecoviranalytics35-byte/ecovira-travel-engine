import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, email } = body;

    if (!bookingId || !email) {
      return NextResponse.json(
        { ok: false, error: "Booking ID and email required" },
        { status: 400 }
      );
    }

    // In production, send email with e-ticket attachment
    // For now, return success
    console.log(`[Email Ticket] Sending e-ticket to ${email} for booking ${bookingId}`);

    // TODO: Integrate with email service (SendGrid, Resend, etc.)
    // await sendEmail({
    //   to: email,
    //   subject: "Your Ecovira Air E-Ticket",
    //   html: generateTicketHTML(bookingId),
    //   attachments: [ticketPDF]
    // });

    return NextResponse.json({ ok: true, message: "E-ticket sent successfully" });
  } catch (error) {
    console.error("Email ticket error:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to send email" },
      { status: 500 }
    );
  }
}

