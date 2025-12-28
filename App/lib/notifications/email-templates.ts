// Premium email templates for Ecovira trip notifications

export interface EmailTemplateData {
  bookingReference: string;
  tripUrl: string;
  route?: {
    from: string;
    to: string;
    departDate: string;
    returnDate?: string;
  };
  flight?: {
    airline: string;
    flightNumber: string;
    departureTime: string;
    arrivalTime?: string;
    airport?: string;
    gate?: string;
    terminal?: string;
  };
  checkInOpensAt?: string;
  checkInUrl?: string;
}

// Booking Confirmed Email
export function getBookingConfirmedEmail(data: EmailTemplateData): { subject: string; html: string; text: string } {
  const subject = 'Your Ecovira booking is confirmed ✅';
  
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
    .flight-info { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 24px 0; }
    .flight-info-row { display: flex; justify-content: space-between; margin: 12px 0; }
    .button { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #1C8C82 0%, #C8A24D 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 16px 8px 16px 0; }
    .button-secondary { background: #6c757d; }
    .footer { padding: 24px; text-align: center; color: #6c757d; font-size: 14px; border-top: 1px solid #e9ecef; }
    .note { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 24px 0; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Booking Confirmed</h1>
    </div>
    <div class="content">
      <p>Your booking has been confirmed! We're excited to help you on your journey.</p>
      
      <div class="booking-ref">
        <strong>Booking Reference: ${data.bookingReference}</strong>
      </div>

      ${data.route ? `
      <div class="flight-info">
        <h3 style="margin-top: 0; color: #1C8C82;">Trip Details</h3>
        <div class="flight-info-row">
          <span><strong>Route:</strong></span>
          <span>${data.route.from} → ${data.route.to}</span>
        </div>
        <div class="flight-info-row">
          <span><strong>Departure:</strong></span>
          <span>${new Date(data.route.departDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
        ${data.route.returnDate ? `
        <div class="flight-info-row">
          <span><strong>Return:</strong></span>
          <span>${new Date(data.route.returnDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
        ` : ''}
      </div>
      ` : ''}

      ${data.flight ? `
      <div class="flight-info">
        <h3 style="margin-top: 0; color: #1C8C82;">Flight Information</h3>
        <div class="flight-info-row">
          <span><strong>Flight:</strong></span>
          <span>${data.flight.airline} ${data.flight.flightNumber}</span>
        </div>
        <div class="flight-info-row">
          <span><strong>Departure:</strong></span>
          <span>${new Date(data.flight.departureTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        ${data.flight.airport ? `
        <div class="flight-info-row">
          <span><strong>Airport:</strong></span>
          <span>${data.flight.airport}</span>
        </div>
        ` : ''}
      </div>
      ` : ''}

      <div style="text-align: center; margin: 32px 0;">
        <a href="${data.tripUrl}" class="button">Track Your Trip</a>
      </div>

      <div class="note">
        <strong>Note:</strong> E-ticket delivery coming soon. You'll receive your e-ticket via email once it's issued by the airline.
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
Booking Confirmed ✅

Your booking has been confirmed!

Booking Reference: ${data.bookingReference}

${data.route ? `Route: ${data.route.from} → ${data.route.to}
Departure: ${new Date(data.route.departDate).toLocaleDateString('en-US')}
${data.route.returnDate ? `Return: ${new Date(data.route.returnDate).toLocaleDateString('en-US')}` : ''}
` : ''}

${data.flight ? `Flight: ${data.flight.airline} ${data.flight.flightNumber}
Departure: ${new Date(data.flight.departureTime).toLocaleString('en-US')}
` : ''}

Track your trip: ${data.tripUrl}

Note: E-ticket delivery coming soon.

© ${new Date().getFullYear()} Ecovira. All rights reserved.
  `;

  return { subject, html, text };
}

// Check-in Opens Soon Email
export function getCheckInOpensSoonEmail(data: EmailTemplateData): { subject: string; html: string; text: string } {
  const subject = 'Check-in opens soon for your flight ✈️';
  
  const checkInTime = data.checkInOpensAt ? new Date(data.checkInOpensAt) : null;
  const hoursUntil = checkInTime ? Math.ceil((checkInTime.getTime() - Date.now()) / (1000 * 60 * 60)) : null;

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
    .countdown { background-color: #e7f3ff; padding: 20px; border-radius: 8px; margin: 24px 0; text-align: center; border-left: 4px solid #1C8C82; }
    .countdown strong { color: #1C8C82; font-size: 24px; }
    .button { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #1C8C82 0%, #C8A24D 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 16px 8px 16px 0; }
    .button-secondary { background: #6c757d; }
    .footer { padding: 24px; text-align: center; color: #6c757d; font-size: 14px; border-top: 1px solid #e9ecef; }
    .info-box { background-color: #f8f9fa; padding: 16px; border-radius: 8px; margin: 24px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✈️ Check-in Opens Soon</h1>
    </div>
    <div class="content">
      <p>Check-in for your flight will open soon. Here's what you need to know:</p>
      
      ${checkInTime ? `
      <div class="countdown">
        <strong>Check-in opens in ${hoursUntil} hour${hoursUntil !== 1 ? 's' : ''}</strong>
        <div style="margin-top: 8px; color: #6c757d; font-size: 14px;">
          ${checkInTime.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
      ` : ''}

      ${data.flight ? `
      <div class="info-box">
        <strong>Flight:</strong> ${data.flight.airline} ${data.flight.flightNumber}<br>
        <strong>Departure:</strong> ${new Date(data.flight.departureTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        ${data.flight.airport ? `<br><strong>From:</strong> ${data.flight.airport}` : ''}
      </div>
      ` : ''}

      <div style="text-align: center; margin: 32px 0;">
        ${data.checkInUrl ? `<a href="${data.checkInUrl}" class="button">Check in via Airline</a>` : ''}
        <a href="${data.tripUrl}" class="button button-secondary">Track Your Trip</a>
      </div>

      <div class="info-box">
        <strong>What you'll need:</strong>
        <ul style="margin: 8px 0; padding-left: 20px;">
          <li>Booking reference (PNR) or ticket number</li>
          <li>Last name (as on booking)</li>
          <li>Passport details (for international travel)</li>
        </ul>
      </div>

      <p style="color: #6c757d; font-size: 14px; margin-top: 24px;">
        <strong>Note:</strong> Check-in is completed through the airline's official system. We'll guide you to their check-in page.
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Ecovira. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Check-in Opens Soon ✈️

Check-in for your flight will open soon.

${checkInTime ? `Check-in opens in ${hoursUntil} hour${hoursUntil !== 1 ? 's' : ''} (${checkInTime.toLocaleString('en-US')})` : 'Check-in opens soon'}

${data.flight ? `Flight: ${data.flight.airline} ${data.flight.flightNumber}
Departure: ${new Date(data.flight.departureTime).toLocaleString('en-US')}
` : ''}

${data.checkInUrl ? `Check in: ${data.checkInUrl}` : ''}
Track trip: ${data.tripUrl}

What you'll need:
- Booking reference (PNR) or ticket number
- Last name (as on booking)
- Passport details (for international travel)

Note: Check-in is completed through the airline's official system.

© ${new Date().getFullYear()} Ecovira. All rights reserved.
  `;

  return { subject, html, text };
}

// Departure Reminder Email
export function getDepartureReminderEmail(data: EmailTemplateData): { subject: string; html: string; text: string } {
  const subject = 'Flight reminder: leaving soon';
  
  const departureTime = data.flight?.departureTime ? new Date(data.flight.departureTime) : null;
  const hoursUntil = departureTime ? Math.ceil((departureTime.getTime() - Date.now()) / (1000 * 60 * 60)) : null;

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
    .reminder-box { background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #ffc107; }
    .reminder-box strong { color: #856404; font-size: 20px; }
    .flight-details { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 24px 0; }
    .flight-details-row { display: flex; justify-content: space-between; margin: 12px 0; }
    .button { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #1C8C82 0%, #C8A24D 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 16px 8px 16px 0; }
    .footer { padding: 24px; text-align: center; color: #6c757d; font-size: 14px; border-top: 1px solid #e9ecef; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✈️ Flight Reminder</h1>
    </div>
    <div class="content">
      <div class="reminder-box">
        <strong>Your flight departs in ${hoursUntil} hour${hoursUntil !== 1 ? 's' : ''}!</strong>
      </div>

      ${data.flight ? `
      <div class="flight-details">
        <h3 style="margin-top: 0; color: #1C8C82;">Flight Details</h3>
        <div class="flight-details-row">
          <span><strong>Flight:</strong></span>
          <span>${data.flight.airline} ${data.flight.flightNumber}</span>
        </div>
        <div class="flight-details-row">
          <span><strong>Departure:</strong></span>
          <span>${departureTime?.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        ${data.flight.airport ? `
        <div class="flight-details-row">
          <span><strong>Airport:</strong></span>
          <span>${data.flight.airport}</span>
        </div>
        ` : ''}
        ${data.flight.gate ? `
        <div class="flight-details-row">
          <span><strong>Gate:</strong></span>
          <span>${data.flight.gate}${data.flight.terminal ? ` (Terminal ${data.flight.terminal})` : ''}</span>
        </div>
        ` : ''}
      </div>
      ` : ''}

      <div style="text-align: center; margin: 32px 0;">
        <a href="${data.tripUrl}" class="button">Track Your Trip</a>
      </div>

      <p style="color: #6c757d; font-size: 14px; margin-top: 24px;">
        Safe travels! We're here if you need anything.
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Ecovira. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Flight Reminder: Leaving Soon

Your flight departs in ${hoursUntil} hour${hoursUntil !== 1 ? 's' : ''}!

${data.flight ? `Flight: ${data.flight.airline} ${data.flight.flightNumber}
Departure: ${departureTime?.toLocaleString('en-US')}
${data.flight.airport ? `Airport: ${data.flight.airport}` : ''}
${data.flight.gate ? `Gate: ${data.flight.gate}${data.flight.terminal ? ` (Terminal ${data.flight.terminal})` : ''}` : ''}
` : ''}

Track your trip: ${data.tripUrl}

Safe travels!

© ${new Date().getFullYear()} Ecovira. All rights reserved.
  `;

  return { subject, html, text };
}

