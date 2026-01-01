import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/core/supabase';
import { notifyCheckInOpensSoon, notifyCheckInOpen, notifyDepartureReminder } from '@/lib/notifications/trips';
import { resolveAirlineCheckinUrl } from '@/lib/trips/airline-checkin-resolver';

// This endpoint should be called by a cron job every 15 minutes
// Protect with a secret token in production
export async function GET(request: NextRequest) {
  // Optional: Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ecovira.com';
    let sentCount = 0;
    let errorCount = 0;

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
      console.error('[Cron] Error fetching bookings:', error);
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
    }

    for (const booking of bookings) {
      const itinerary = (booking as any).itineraries;
      const flightItem = itinerary?.itinerary_items?.find((item: any) => item.type === 'flight');

      if (!flightItem) continue;

      const itemData = flightItem.item_data || flightItem.item;
      const scheduledDeparture = new Date(itemData?.departDate || '');
      if (isNaN(scheduledDeparture.getTime())) continue;

      const bookingReference = (booking as any).booking_reference || booking.id;
      const passengerEmail = (booking as any).passenger_email;
      const phoneNumber = (booking as any).phone_number;
      const smsOptIn = (booking as any).sms_opt_in === true;
      if (!passengerEmail) continue;

      // Calculate times
      const checkInOpens = new Date(scheduledDeparture);
      checkInOpens.setHours(checkInOpens.getHours() - 48); // 48 hours before

      const departureTime = scheduledDeparture.getTime();
      const nowTime = now.getTime();
      const checkInOpensTime = checkInOpens.getTime();
      const sixHoursBeforeTime = departureTime - (6 * 60 * 60 * 1000); // 6 hours before
      const threeHoursBeforeTime = departureTime - (3 * 60 * 60 * 1000); // 3 hours before
      const twoHoursBeforeTime = departureTime - (2 * 60 * 60 * 1000); // 2 hours before (optional)
      const twentyFourHoursBeforeCheckIn = checkInOpensTime - (24 * 60 * 60 * 1000); // 24h before check-in opens

      const airlineIata = itemData?.raw?.airline_iata || itemData?.from?.substring(0, 2);
      const flightNumber = itemData?.raw?.flight_number || 'N/A';
      const airlineInfo = resolveAirlineCheckinUrl(airlineIata);
      const checkInUrl = airlineInfo?.url;

      // Check-in opens soon (24 hours before check-in opens = 72 hours before departure)
      if (
        nowTime >= twentyFourHoursBeforeCheckIn &&
        nowTime < checkInOpensTime &&
        !(booking as any).checkin_opens_email_sent_at
      ) {
        try {
          await notifyCheckInOpensSoon(
            booking.id,
            bookingReference,
            checkInOpens.toISOString(),
            passengerEmail,
            {
              airline: airlineIata,
              flightNumber,
              departureTime: scheduledDeparture.toISOString(),
              airport: itemData?.from,
            },
            checkInUrl,
            phoneNumber,
            smsOptIn
          );

          // Mark as sent
          await supabaseAdmin
            .from('bookings')
            .update({ checkin_opens_email_sent_at: new Date().toISOString() })
            .eq('id', booking.id);

          sentCount++;
        } catch (err) {
          console.error(`[Cron] Failed to send check-in opens email for ${booking.id}:`, err);
          errorCount++;
        }
      }

      // Check-in is now open
      if (
        nowTime >= checkInOpensTime &&
        nowTime < departureTime &&
        !(booking as any).checkin_email_sent_at
      ) {
        try {
          await notifyCheckInOpen(
            booking.id,
            bookingReference,
            passengerEmail,
            {
              airline: airlineIata,
              flightNumber,
              departureTime: scheduledDeparture.toISOString(),
              airport: itemData?.from,
            },
            checkInUrl,
            phoneNumber,
            smsOptIn
          );

          // Mark as sent
          await supabaseAdmin
            .from('bookings')
            .update({ checkin_email_sent_at: new Date().toISOString() })
            .eq('id', booking.id);

          sentCount++;
        } catch (err) {
          console.error(`[Cron] Failed to send check-in open email for ${booking.id}:`, err);
          errorCount++;
        }
      }

      // Reminder 2: 6 hours before departure ("If not checked in yet...")
      if (
        nowTime >= sixHoursBeforeTime &&
        nowTime < threeHoursBeforeTime &&
        !(booking as any).six_hour_reminder_sent_at
      ) {
        try {
          // Use check-in open notification but with different messaging
          await notifyCheckInOpen(
            booking.id,
            bookingReference,
            passengerEmail,
            {
              airline: airlineIata,
              flightNumber,
              departureTime: scheduledDeparture.toISOString(),
              airport: itemData?.from,
            },
            checkInUrl,
            phoneNumber,
            smsOptIn
          );

          // Mark as sent
          await supabaseAdmin
            .from('bookings')
            .update({ six_hour_reminder_sent_at: new Date().toISOString() })
            .eq('id', booking.id);

          sentCount++;
        } catch (err) {
          console.error(`[Cron] Failed to send 6-hour reminder for ${booking.id}:`, err);
          errorCount++;
        }
      }

      // Departure reminder (3 hours before)
      if (
        nowTime >= threeHoursBeforeTime &&
        nowTime < departureTime &&
        !(booking as any).departure_reminder_sent_at
      ) {
        try {
          await notifyDepartureReminder(
            booking.id,
            bookingReference,
            `${airlineIata} ${flightNumber}`,
            scheduledDeparture.toISOString(),
            passengerEmail,
            itemData?.from,
            undefined, // Gate would come from flight status API
            undefined,  // Terminal would come from flight status API
            phoneNumber,
            smsOptIn
          );

          // Mark as sent
          await supabaseAdmin
            .from('bookings')
            .update({ departure_reminder_sent_at: new Date().toISOString() })
            .eq('id', booking.id);

          sentCount++;
        } catch (err) {
          console.error(`[Cron] Failed to send departure reminder for ${booking.id}:`, err);
          errorCount++;
        }
      }

      // Optional: 2 hours before departure ("Head to airport / documents reminder")
      if (
        nowTime >= twoHoursBeforeTime &&
        nowTime < departureTime &&
        !(booking as any).two_hour_reminder_sent_at
      ) {
        try {
          await notifyDepartureReminder(
            booking.id,
            bookingReference,
            `${airlineIata} ${flightNumber}`,
            scheduledDeparture.toISOString(),
            passengerEmail,
            itemData?.from,
            undefined,
            undefined,
            phoneNumber,
            smsOptIn
          );

          // Mark as sent
          await supabaseAdmin
            .from('bookings')
            .update({ two_hour_reminder_sent_at: new Date().toISOString() })
            .eq('id', booking.id);

          sentCount++;
        } catch (err) {
          console.error(`[Cron] Failed to send 2-hour reminder for ${booking.id}:`, err);
          errorCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      processed: bookings.length,
      sent: sentCount,
      errors: errorCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cron] Error processing notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

