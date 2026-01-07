// Hotel-specific email templates

export interface HotelEmailTemplateData {
  bookingReference: string;
  confirmationNumber: string;
  tripUrl: string;
  hotel: {
    name: string;
    city: string;
    checkIn: string;
    checkOut: string;
    nights: number;
  };
}

export function getHotelBookingConfirmedEmail(data: HotelEmailTemplateData): { subject: string; html: string; text: string } {
  const subject = 'Your hotel booking is confirmed ✅';
  
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
    .hotel-info { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 24px 0; }
    .hotel-info-row { display: flex; justify-content: space-between; margin: 12px 0; }
    .button { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #1C8C82 0%, #C8A24D 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 16px 8px 16px 0; }
    .footer { padding: 24px; text-align: center; color: #6c757d; font-size: 14px; border-top: 1px solid #e9ecef; }
    .note { background-color: #e7f3ff; border-left: 4px solid #1C8C82; padding: 12px; margin: 24px 0; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Hotel Booking Confirmed</h1>
    </div>
    <div class="content">
      <p>Your hotel booking has been confirmed! We're excited to host you.</p>
      
      <div class="booking-ref">
        <strong>Booking Reference: ${data.bookingReference}</strong><br>
        <span style="font-size: 14px; color: #6c757d;">Confirmation: ${data.confirmationNumber}</span>
      </div>

      <div class="hotel-info">
        <h3 style="margin-top: 0; color: #1C8C82;">Hotel Details</h3>
        <div class="hotel-info-row">
          <span><strong>Hotel:</strong></span>
          <span>${data.hotel.name}</span>
        </div>
        <div class="hotel-info-row">
          <span><strong>Location:</strong></span>
          <span>${data.hotel.city}</span>
        </div>
        <div class="hotel-info-row">
          <span><strong>Check-in:</strong></span>
          <span>${data.hotel.checkIn}</span>
        </div>
        <div class="hotel-info-row">
          <span><strong>Check-out:</strong></span>
          <span>${data.hotel.checkOut}</span>
        </div>
        <div class="hotel-info-row">
          <span><strong>Nights:</strong></span>
          <span>${data.hotel.nights} night${data.hotel.nights > 1 ? 's' : ''}</span>
        </div>
      </div>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${data.tripUrl}" class="button">View Booking Details</a>
      </div>

      <div class="note">
        <strong>Important:</strong> Please bring a valid ID and the confirmation number (${data.confirmationNumber}) when checking in. Check-in times vary by hotel, typically from 3:00 PM.
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
Hotel Booking Confirmed ✅

Your hotel booking has been confirmed!

Booking Reference: ${data.bookingReference}
Confirmation Number: ${data.confirmationNumber}

Hotel: ${data.hotel.name}
Location: ${data.hotel.city}
Check-in: ${data.hotel.checkIn}
Check-out: ${data.hotel.checkOut}
Nights: ${data.hotel.nights} night${data.hotel.nights > 1 ? 's' : ''}

View booking: ${data.tripUrl}

Important: Please bring a valid ID and the confirmation number when checking in.

© ${new Date().getFullYear()} Ecovira. All rights reserved.
  `;

  return { subject, html, text };
}

