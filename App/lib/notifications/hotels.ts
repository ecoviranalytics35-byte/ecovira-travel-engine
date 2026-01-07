// Hotel-specific notification functions
import { sendTripNotification } from "./trips";
import { getHotelBookingConfirmedEmail } from "./email-templates-hotel";

/**
 * Notify customer that hotel booking is confirmed
 */
export async function notifyHotelBookingConfirmed(
  bookingId: string,
  bookingReference: string,
  confirmationNumber: string,
  recipientEmail: string,
  hotelDetails: {
    hotelName: string;
    checkIn: string;
    checkOut?: string;
    nights: number;
    city: string;
  },
  recipientPhone?: string,
  smsOptIn: boolean = false
): Promise<{ emailSent: boolean; smsSent: boolean }> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ecovira.com';
  const tripUrl = `${appUrl}/my-trips/${bookingId}`;

  // Format dates
  const checkInDate = hotelDetails.checkIn ? new Date(hotelDetails.checkIn) : null;
  const checkOutDate = hotelDetails.checkOut ? new Date(hotelDetails.checkOut) : null;

  // Send email using hotel-specific template
  const emailContent = getHotelBookingConfirmedEmail({
    bookingReference,
    confirmationNumber,
    tripUrl,
    hotel: {
      name: hotelDetails.hotelName,
      city: hotelDetails.city,
      checkIn: checkInDate?.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }) || hotelDetails.checkIn,
      checkOut: checkOutDate?.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }) || hotelDetails.checkOut || '',
      nights: hotelDetails.nights,
    },
  });

  // Import nodemailer transporter
  const nodemailer = await import('nodemailer');
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  let emailSent = false;
  let smsSent = false;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: recipientEmail,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    emailSent = true;
    console.log('[Hotel Notification] Email sent:', {
      bookingId,
      recipient: recipientEmail,
    });
  } catch (error) {
    console.error('[Hotel Notification] Failed to send email:', error);
  }

  // SMS (if opted in)
  if (smsOptIn && recipientPhone) {
    try {
      const twilio = await import('twilio');
      if (process.env.TWILIO_SID && process.env.TWILIO_TOKEN && process.env.TWILIO_PHONE) {
        const twilioClient = twilio.default(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
        const smsMessage = `✅ Hotel booking confirmed! Ref: ${bookingReference}\n${hotelDetails.hotelName}, ${hotelDetails.city}\nCheck-in: ${checkInDate?.toLocaleDateString() || hotelDetails.checkIn}\nView: ${tripUrl}`;
        
        await twilioClient.messages.create({
          body: smsMessage,
          from: process.env.TWILIO_PHONE,
          to: recipientPhone,
        });

        smsSent = true;
        console.log('[Hotel Notification] SMS sent:', {
          bookingId,
          recipient: recipientPhone,
        });
      }
    } catch (error) {
      console.error('[Hotel Notification] Failed to send SMS:', error);
    }
  }

  return { emailSent, smsSent };
}

