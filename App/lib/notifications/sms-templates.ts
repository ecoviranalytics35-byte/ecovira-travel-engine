// SMS message templates for trip notifications
// SMS must be short (160 chars recommended) and include link to My Trips

export interface SmsTemplateData {
  bookingReference: string;
  tripUrl: string;
  flightNumber?: string;
  departureTime?: string;
  checkInOpensAt?: string;
}

// Booking Confirmed SMS
export function getBookingConfirmedSms(data: SmsTemplateData): string {
  const shortUrl = data.tripUrl.replace('https://', '').replace('http://', '');
  return `✅ Booking confirmed! Ref: ${data.bookingReference}. Track: ${shortUrl}`;
}

// Check-in Opens Soon SMS
export function getCheckInOpensSoonSms(data: SmsTemplateData): string {
  const shortUrl = data.tripUrl.replace('https://', '').replace('http://', '');
  const checkInTime = data.checkInOpensAt ? new Date(data.checkInOpensAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'soon';
  return `✈️ Check-in opens ${checkInTime}. Ref: ${data.bookingReference}. ${shortUrl}`;
}

// Check-in Open SMS
export function getCheckInOpenSms(data: SmsTemplateData): string {
  const shortUrl = data.tripUrl.replace('https://', '').replace('http://', '');
  return `✈️ Check-in now open! Ref: ${data.bookingReference}. Check in: ${shortUrl}`;
}

// Departure Reminder SMS
export function getDepartureReminderSms(data: SmsTemplateData): string {
  const shortUrl = data.tripUrl.replace('https://', '').replace('http://', '');
  const depTime = data.departureTime ? new Date(data.departureTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'soon';
  const flight = data.flightNumber ? ` ${data.flightNumber}` : '';
  return `✈️ Flight${flight} departs ${depTime}. Track: ${shortUrl}`;
}

// Flight Delayed SMS
export function getFlightDelayedSms(data: SmsTemplateData & { estimatedTime?: string }): string {
  const shortUrl = data.tripUrl.replace('https://', '').replace('http://', '');
  const estTime = data.estimatedTime ? new Date(data.estimatedTime).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'delayed';
  return `⚠️ Flight ${data.flightNumber || ''} delayed. New time: ${estTime}. ${shortUrl}`;
}

