import { sendTripNotification } from "./trips"; // Reusing generic sender

export interface TransferEmailTemplateData {
  bookingReference: string;
  confirmationNumber: string;
  tripUrl: string;
  transfer: {
    transferType: string;
    from: string;
    to: string;
    dateTime: string;
    passengers: number;
  };
  passengerName: string;
}

export function getTransferBookingConfirmedEmail(data: TransferEmailTemplateData): { subject: string; html: string; text: string } {
  const subject = `Your Ecovira Transfer is Confirmed! ✅ - ${data.transfer.transferType}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1a1a1a; background-color: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #1C8C82 0%, #C8A24D 100%); padding: 32px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
    .content { padding: 32px; }
    .booking-ref { background-color: #f8f9fa; padding: 16px; border-radius: 8px; margin: 24px 0; text-align: center; }
    .booking-ref strong { color: #1C8C82; font-size: 18px; }
    .transfer-info { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 24px 0; }
    .transfer-info-row { display: flex; justify-content: space-between; margin: 12px 0; }
    .button { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #1C8C82 0%, #C8A24D 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 16px 8px 16px 0; }
    .footer { padding: 24px; text-align: center; color: #6c757d; font-size: 14px; border-top: 1px solid #e9ecef; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Transfer Confirmed</h1>
    </div>
    <div class="content">
      <p>Dear ${data.passengerName},</p>
      <p>Your <strong>${data.transfer.transferType}</strong> transfer has been confirmed!</p>
      
      <div class="booking-ref">
        <strong>Ecovira Booking Reference: ${data.bookingReference}</strong><br>
        <strong>Transfer Confirmation Number: ${data.confirmationNumber}</strong>
      </div>

      <div class="transfer-info">
        <h3 style="margin-top: 0; color: #1C8C82;">Transfer Details</h3>
        <div class="transfer-info-row">
          <span><strong>Transfer Type:</strong></span>
          <span>${data.transfer.transferType}</span>
        </div>
        <div class="transfer-info-row">
          <span><strong>From:</strong></span>
          <span>${data.transfer.from}</span>
        </div>
        <div class="transfer-info-row">
          <span><strong>To:</strong></span>
          <span>${data.transfer.to}</span>
        </div>
        <div class="transfer-info-row">
          <span><strong>Date & Time:</strong></span>
          <span>${new Date(data.transfer.dateTime).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div class="transfer-info-row">
          <span><strong>Passengers:</strong></span>
          <span>${data.transfer.passengers}</span>
        </div>
      </div>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${data.tripUrl}" class="button">View Your Booking</a>
      </div>

      <p style="margin-top: 32px; color: #6c757d; font-size: 14px;">
        Questions? Reply to this email or contact our 24/7 support team.
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Ecovira. All rights reserved.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://ecovira.com'}/privacy-policy" style="color: #1C8C82;">Privacy Policy</a> | <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://ecovira.com'}/terms" style="color: #1C8C82;">Terms</a></p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Transfer Confirmed ✅

Dear ${data.passengerName},

Your ${data.transfer.transferType} transfer has been confirmed!

Ecovira Booking Reference: ${data.bookingReference}
Transfer Confirmation Number: ${data.confirmationNumber}

Transfer Details:
Transfer Type: ${data.transfer.transferType}
From: ${data.transfer.from}
To: ${data.transfer.to}
Date & Time: ${new Date(data.transfer.dateTime).toLocaleString('en-US')}
Passengers: ${data.transfer.passengers}

View your booking: ${data.tripUrl}

© ${new Date().getFullYear()} Ecovira. All rights reserved.
  `;

  return { subject, html, text };
}

export async function notifyTransferBookingConfirmed(
  bookingId: string,
  bookingReference: string,
  confirmationNumber: string,
  recipientEmail: string,
  transferDetails: {
    transferType: string;
    from: string;
    to: string;
    dateTime: string;
    passengers: number;
  },
  recipientPhone?: string,
  smsOptIn: boolean = false
): Promise<{ emailSent: boolean; smsSent: boolean }> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ecovira.com';
  const passengerName = "Guest"; // Placeholder, ideally from booking.passenger_first_name

  return await sendTripNotification({
    bookingId,
    type: 'booking_confirmed', // Reusing generic type, but content is transfer-specific
    recipientEmail,
    recipientPhone,
    data: {
      tripReference: bookingReference,
      tripUrl: `${appUrl}/my-trips/${bookingId}`,
      confirmationNumber,
      transfer: transferDetails,
      passengerName,
    },
  }, smsOptIn);
}

