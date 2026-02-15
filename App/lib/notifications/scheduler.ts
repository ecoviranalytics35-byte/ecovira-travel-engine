// Background job scheduler for trip notifications
// This would run as a cron job or scheduled task

import { supabaseAdmin } from '@/lib/core/supabase';
import { notifyCheckInOpensSoon, notifyCheckInOpen, notifyDepartureReminder, notifyBookingConfirmed, notifyFlightDelayed } from './trips';

// This function should be called periodically (e.g., every hour via cron)
export async function processTripNotifications(): Promise<void> {
  const now = new Date();
  const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  // Get all active bookings with flights
  const { data: bookings, error } = await supabaseAdmin
    .from('bookings')
    .select(`
      *,
      itineraries!inner (
        *,
        itinerary_items!inner (*)
      )
    `)
    .in('status', ['paid', 'booked', 'ticketed'])
    .eq('itineraries.itinerary_items.type', 'flight');

  if (error || !bookings) {
    console.error('[Notification Scheduler] Error fetching bookings:', error);
    return;
  }

  for (const booking of bookings) {
    const itinerary = (booking as any).itineraries;
    const flightItem = itinerary?.itinerary_items?.find((item: any) => item.type === 'flight');

    if (!flightItem) continue;

    const scheduledDeparture = new Date(flightItem.item?.departDate || '');
    if (isNaN(scheduledDeparture.getTime())) continue;

    const checkInOpens = new Date(scheduledDeparture);
    checkInOpens.setHours(checkInOpens.getHours() - 48);

    const departureTime = scheduledDeparture.getTime();
    const nowTime = now.getTime();
    const checkInOpensTime = checkInOpens.getTime();
    const twoHoursBeforeTime = departureTime - (2 * 60 * 60 * 1000);

    // Check-in opens soon (24 hours before check-in opens = 72 hours before departure)
    const checkInOpensSoonTime = checkInOpensTime - (24 * 60 * 60 * 1000);
    if (nowTime >= checkInOpensSoonTime && nowTime < checkInOpensTime) {
      // TODO: Check if notification already sent (store in notifications table)
      const bookingRef = (booking as any).reference ?? (booking as any).booking_reference ?? booking.id;
      await notifyCheckInOpensSoon(
        booking.id,
        bookingRef,
        checkInOpens.toISOString(),
        (booking as any).passenger_email ?? ''
      );
    }

    // Check-in is now open
    if (nowTime >= checkInOpensTime && nowTime < departureTime) {
      // TODO: Check if notification already sent
      const bookingRef = (booking as any).reference ?? (booking as any).booking_reference ?? booking.id;
      await notifyCheckInOpen(booking.id, bookingRef, (booking as any).passenger_email ?? '');
    }

    // Departure reminder (2 hours before)
    if (nowTime >= twoHoursBeforeTime && nowTime < departureTime) {
      // TODO: Check if notification already sent
      const bookingRef = (booking as any).reference ?? (booking as any).booking_reference ?? booking.id;
      await notifyDepartureReminder(
        booking.id,
        bookingRef,
        `${flightItem.item?.raw?.airline_iata || ''} ${flightItem.item?.raw?.flight_number || ''}`,
        scheduledDeparture.toISOString(),
        (booking as any).passenger_email ?? ''
      );
    }
  }
}

// This would be called when flight status is updated (via webhook or polling)
export async function processFlightStatusUpdate(
  bookingId: string,
  status: {
    departure?: { status: string; estimated?: string; gate?: string; terminal?: string };
    arrival?: { status: string; estimated?: string };
  }
): Promise<void> {
  // Get booking
  const { data: booking, error } = await supabaseAdmin
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single();

  if (error || !booking) return;

    // Notify on delay
    if (status.departure?.status === 'delayed' && status.departure?.estimated) {
      // TODO: Check if delay notification already sent
      const { data: itinerary } = await supabaseAdmin
        .from('itineraries')
        .select(`
          *,
          itinerary_items (*)
        `)
        .eq('id', booking.itinerary_id)
        .single();

      const flightItem = itinerary?.itinerary_items?.find((item: any) => item.type === 'flight');
      
      if (flightItem) {
        await notifyFlightDelayed(
          bookingId,
          `${flightItem.item_data?.raw?.airline_iata || ''} ${flightItem.item_data?.raw?.flight_number || ''}`,
          flightItem.item_data?.departDate || '',
          status.departure.estimated,
          (booking as any).passenger_email
        );
      }
    }

  // Notify on gate change (would need to track previous gate)
  // TODO: Implement gate change tracking
}

