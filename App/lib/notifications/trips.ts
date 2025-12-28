// Notification system for trip-related alerts
// Email (always) + SMS (opt-in only)

import nodemailer from 'nodemailer';
import twilio from 'twilio';
import { getBookingConfirmedEmail, getCheckInOpensSoonEmail, getDepartureReminderEmail } from './email-templates';
import { getBookingConfirmedSms, getCheckInOpensSoonSms, getCheckInOpenSms, getDepartureReminderSms, getFlightDelayedSms } from './sms-templates';

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Initialize Twilio client (only if credentials are provided)
let twilioClient: twilio.Twilio | null = null;
try {
  if (process.env.TWILIO_SID && process.env.TWILIO_TOKEN) {
    twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
  }
} catch (error) {
  console.warn('[Notifications] Twilio not configured:', error);
}

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export type NotificationType = 
  | 'booking_confirmed'
  | 'checkin_opens_soon'
  | 'checkin_open'
  | 'flight_delayed'
  | 'gate_change'
  | 'departure_reminder';

export interface TripNotification {
  bookingId: string;
  type: NotificationType;
  recipientEmail?: string;
  recipientPhone?: string;
  data: {
    tripReference: string;
    flightNumber?: string;
    departureTime?: string;
    gate?: string;
    terminal?: string;
    checkInOpensAt?: string;
    route?: { from: string; to: string; departDate: string; returnDate?: string };
    flight?: { airline: string; flightNumber: string; departureTime: string; airport?: string; gate?: string; terminal?: string };
    checkInUrl?: string;
    tripUrl?: string;
    [key: string]: any;
  };
}

// Send notification (Email always, SMS if opted in)
export async function sendTripNotification(notification: TripNotification, smsOptIn: boolean = false): Promise<{ emailSent: boolean; smsSent: boolean }> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ecovira.com';
  const tripUrl = notification.data.tripUrl || `${appUrl}/my-trips/${notification.bookingId}`;
  
  let emailSent = false;
  let smsSent = false;

  // Always send email if email provided
  if (notification.recipientEmail) {
    try {
      let emailContent: { subject: string; html: string; text: string };

      switch (notification.type) {
        case 'booking_confirmed':
          emailContent = getBookingConfirmedEmail({
            bookingReference: notification.data.tripReference,
            tripUrl,
            route: notification.data.route,
            flight: notification.data.flight,
          });
          break;
        case 'checkin_opens_soon':
          emailContent = getCheckInOpensSoonEmail({
            bookingReference: notification.data.tripReference,
            tripUrl,
            flight: notification.data.flight,
            checkInOpensAt: notification.data.checkInOpensAt,
            checkInUrl: notification.data.checkInUrl,
          });
          break;
        case 'departure_reminder':
          emailContent = getDepartureReminderEmail({
            bookingReference: notification.data.tripReference,
            tripUrl,
            flight: notification.data.flight,
          });
          break;
        default:
          console.warn('[Trip Notification] Unknown type:', notification.type);
          return { emailSent: false, smsSent: false };
      }

      await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: notification.recipientEmail,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      });

      emailSent = true;
      console.log('[Trip Notification] Email sent:', {
        type: notification.type,
        bookingId: notification.bookingId,
        recipient: notification.recipientEmail,
      });
    } catch (error) {
      console.error('[Trip Notification] Failed to send email:', error);
    }
  }

  // Send SMS only if opted in and phone provided
  if (smsOptIn && notification.recipientPhone && twilioClient && process.env.TWILIO_PHONE) {
    try {
      let smsMessage: string;

      switch (notification.type) {
        case 'booking_confirmed':
          smsMessage = getBookingConfirmedSms({
            bookingReference: notification.data.tripReference,
            tripUrl,
          });
          break;
        case 'checkin_opens_soon':
          smsMessage = getCheckInOpensSoonSms({
            bookingReference: notification.data.tripReference,
            tripUrl,
            checkInOpensAt: notification.data.checkInOpensAt,
          });
          break;
        case 'checkin_open':
          smsMessage = getCheckInOpenSms({
            bookingReference: notification.data.tripReference,
            tripUrl,
          });
          break;
        case 'departure_reminder':
          smsMessage = getDepartureReminderSms({
            bookingReference: notification.data.tripReference,
            tripUrl,
            flightNumber: notification.data.flightNumber,
            departureTime: notification.data.departureTime,
          });
          break;
        case 'flight_delayed':
          smsMessage = getFlightDelayedSms({
            bookingReference: notification.data.tripReference,
            tripUrl,
            flightNumber: notification.data.flightNumber,
            estimatedTime: notification.data.estimatedTime,
          });
          break;
        default:
          console.warn('[Trip Notification] SMS not supported for type:', notification.type);
          return { emailSent, smsSent: false };
      }

      await twilioClient.messages.create({
        body: smsMessage,
        from: process.env.TWILIO_PHONE,
        to: notification.recipientPhone,
      });

      smsSent = true;
      console.log('[Trip Notification] SMS sent:', {
        type: notification.type,
        bookingId: notification.bookingId,
        recipient: notification.recipientPhone,
      });
    } catch (error) {
      console.error('[Trip Notification] Failed to send SMS:', error);
      // SMS failure doesn't affect email delivery
    }
  }

  return { emailSent, smsSent };
}

// Booking confirmed (immediately after supplier booking success)
export async function notifyBookingConfirmed(
  bookingId: string,
  bookingReference: string,
  recipientEmail: string,
  route?: { from: string; to: string; departDate: string; returnDate?: string },
  flight?: { airline: string; flightNumber: string; departureTime: string; airport?: string },
  recipientPhone?: string,
  smsOptIn: boolean = false
): Promise<{ emailSent: boolean; smsSent: boolean }> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ecovira.com';
  return await sendTripNotification({
    bookingId,
    type: 'booking_confirmed',
    recipientEmail,
    recipientPhone,
    data: {
      tripReference: bookingReference,
      tripUrl: `${appUrl}/my-trips/${bookingId}`,
      route,
      flight,
    },
  }, smsOptIn);
}

// Check-in opens soon (24 hours before)
export async function notifyCheckInOpensSoon(
  bookingId: string,
  bookingReference: string,
  checkInOpensAt: string,
  recipientEmail: string,
  flight?: { airline: string; flightNumber: string; departureTime: string; airport?: string },
  checkInUrl?: string,
  recipientPhone?: string,
  smsOptIn: boolean = false
): Promise<{ emailSent: boolean; smsSent: boolean }> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ecovira.com';
  return await sendTripNotification({
    bookingId,
    type: 'checkin_opens_soon',
    recipientEmail,
    recipientPhone,
    data: {
      tripReference: bookingReference,
      tripUrl: `${appUrl}/my-trips/${bookingId}`,
      checkInOpensAt,
      flight,
      checkInUrl,
    },
  }, smsOptIn);
}

// Check-in is now open
export async function notifyCheckInOpen(
  bookingId: string,
  bookingReference: string,
  recipientEmail: string,
  flight?: { airline: string; flightNumber: string; departureTime: string; airport?: string },
  checkInUrl?: string,
  recipientPhone?: string,
  smsOptIn: boolean = false
): Promise<{ emailSent: boolean; smsSent: boolean }> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ecovira.com';
  return await sendTripNotification({
    bookingId,
    type: 'checkin_open',
    recipientEmail,
    recipientPhone,
    data: {
      tripReference: bookingReference,
      tripUrl: `${appUrl}/my-trips/${bookingId}`,
      checkInOpensAt: new Date().toISOString(), // Already open
      flight,
      checkInUrl,
    },
  }, smsOptIn);
}

// Flight delayed
export async function notifyFlightDelayed(
  bookingId: string,
  flightNumber: string,
  scheduledTime: string,
  estimatedTime: string,
  recipientEmail?: string
): Promise<void> {
  await sendTripNotification({
    bookingId,
    type: 'flight_delayed',
    recipientEmail,
    data: {
      tripReference: bookingId,
      flightNumber,
      scheduledTime,
      estimatedTime,
    },
  });
}

// Gate change
export async function notifyGateChange(
  bookingId: string,
  flightNumber: string,
  oldGate: string,
  newGate: string,
  terminal?: string,
  recipientEmail?: string
): Promise<void> {
  await sendTripNotification({
    bookingId,
    type: 'gate_change',
    recipientEmail,
    data: {
      tripReference: bookingId,
      flightNumber,
      oldGate,
      newGate,
      terminal,
    },
  });
}

// Departure reminder (3 hours before)
export async function notifyDepartureReminder(
  bookingId: string,
  bookingReference: string,
  flightNumber: string,
  departureTime: string,
  recipientEmail: string,
  airport?: string,
  gate?: string,
  terminal?: string,
  recipientPhone?: string,
  smsOptIn: boolean = false
): Promise<{ emailSent: boolean; smsSent: boolean }> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ecovira.com';
  const [airline, number] = flightNumber.split(' ');
  return await sendTripNotification({
    bookingId,
    type: 'departure_reminder',
    recipientEmail,
    recipientPhone,
    data: {
      tripReference: bookingReference,
      tripUrl: `${appUrl}/my-trips/${bookingId}`,
      flightNumber,
      departureTime,
      flight: {
        airline: airline || '',
        flightNumber: number || flightNumber,
        departureTime,
        airport,
        gate,
        terminal,
      },
    },
  }, smsOptIn);
}

