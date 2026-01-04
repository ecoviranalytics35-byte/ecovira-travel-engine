import { NextRequest, NextResponse } from "next/server";
import { useBookingStore } from "@/stores/bookingStore";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("bookingId");

    if (!bookingId) {
      return NextResponse.json({ ok: false, error: "Booking ID required" }, { status: 400 });
    }

    // In production, fetch booking from database
    // For now, return HTML template that can be converted to PDF
    const html = generateTicketHTML(bookingId);

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `inline; filename="ecovira-ticket-${bookingId}.html"`,
      },
    });
  } catch (error) {
    console.error("Ticket generation error:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to generate ticket" },
      { status: 500 }
    );
  }
}

function generateTicketHTML(bookingId: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ecovira Air - E-Ticket</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0B0D10;
      color: #E8E8E8;
      padding: 40px;
      line-height: 1.6;
    }
    .ticket {
      max-width: 800px;
      margin: 0 auto;
      background: #1A1C20;
      border: 2px solid rgba(28, 140, 130, 0.3);
      border-radius: 16px;
      padding: 40px;
      position: relative;
      overflow: hidden;
    }
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 120px;
      font-weight: bold;
      color: rgba(28, 140, 130, 0.08);
      z-index: 0;
      pointer-events: none;
      white-space: nowrap;
    }
    .content {
      position: relative;
      z-index: 1;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid rgba(28, 140, 130, 0.2);
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #1C8C82;
    }
    .booking-ref {
      text-align: right;
    }
    .booking-ref-label {
      font-size: 12px;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .booking-ref-value {
      font-size: 20px;
      font-weight: bold;
      color: #1C8C82;
      font-family: monospace;
      margin-top: 4px;
    }
    h1 {
      font-size: 28px;
      color: #E8E8E8;
      margin-bottom: 8px;
    }
    .subtitle {
      color: #888;
      font-size: 14px;
    }
    .section {
      margin: 30px 0;
    }
    .section-title {
      font-size: 18px;
      color: #1C8C82;
      margin-bottom: 16px;
      font-weight: 600;
    }
    .passenger-list {
      background: rgba(28, 140, 130, 0.1);
      border: 1px solid rgba(28, 140, 130, 0.2);
      border-radius: 8px;
      padding: 16px;
    }
    .passenger-item {
      padding: 8px 0;
      border-bottom: 1px solid rgba(28, 140, 130, 0.1);
    }
    .passenger-item:last-child {
      border-bottom: none;
    }
    .flight-details {
      background: rgba(28, 140, 130, 0.1);
      border: 1px solid rgba(28, 140, 130, 0.2);
      border-radius: 8px;
      padding: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .flight-route {
      font-size: 20px;
      font-weight: 600;
      color: #E8E8E8;
    }
    .flight-meta {
      font-size: 14px;
      color: #888;
      margin-top: 8px;
    }
    .flight-price {
      font-size: 24px;
      font-weight: bold;
      color: #1C8C82;
    }
    .payment-summary {
      background: rgba(28, 140, 130, 0.05);
      border: 1px solid rgba(28, 140, 130, 0.2);
      border-radius: 8px;
      padding: 20px;
    }
    .payment-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid rgba(28, 140, 130, 0.1);
    }
    .payment-row:last-child {
      border-bottom: none;
      border-top: 2px solid rgba(28, 140, 130, 0.2);
      margin-top: 8px;
      padding-top: 16px;
      font-size: 18px;
      font-weight: 600;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid rgba(28, 140, 130, 0.2);
      text-align: center;
      font-size: 12px;
      color: #666;
    }
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .ticket {
        border: none;
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="ticket">
    <div class="watermark">ECOVIRA AIR</div>
    <div class="content">
      <div class="header">
        <div>
          <div class="logo">ECOVIRA AIR</div>
          <div class="subtitle">E-Ticket / Itinerary Receipt</div>
        </div>
        <div class="booking-ref">
          <div class="booking-ref-label">Booking Reference</div>
          <div class="booking-ref-value">${bookingId}</div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Passenger(s)</h2>
        <div class="passenger-list">
          <div class="passenger-item">
            Passenger details will be loaded from booking
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Flight Details</h2>
        <div class="flight-details">
          <div>
            <div class="flight-route">Flight details from booking</div>
            <div class="flight-meta">Date • Provider</div>
          </div>
          <div class="flight-price">Price</div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Payment Summary</h2>
        <div class="payment-summary">
          <div class="payment-row">
            <span>Total Paid</span>
            <span>Amount</span>
          </div>
          <div class="payment-row">
            <span>Payment Method</span>
            <span>Method</span>
          </div>
          <div class="payment-row">
            <span>Status</span>
            <span style="color: #1C8C82;">Confirmed</span>
          </div>
        </div>
      </div>

      <div class="footer">
        <p><strong>Ecovira Air Support</strong></p>
        <p>support@ecovira.com | www.ecovira.com</p>
        <p style="margin-top: 12px; font-size: 10px; color: #555;">
          This is an automated e-ticket. Please present this document at check-in.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

