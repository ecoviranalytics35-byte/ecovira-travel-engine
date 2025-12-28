import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/core/supabase';
import { notifyCheckInOpensSoon, notifyCheckInOpen, notifyDepartureReminder } from '@/lib/notifications/trips';

// Airline check-in URL helper (duplicated from checkin route to avoid import issues)
function getAirlineCheckInUrl(airlineIata: string, pnr?: string): string | undefined {
  const airlineUrls: Record<string, string> = {
    'QF': 'https://www.qantas.com/au/en/manage-booking/check-in.html',
    'VA': 'https://www.virginaustralia.com/au/en/manage-booking/check-in/',
    'JQ': 'https://www.jetstar.com/au/en/manage-booking/check-in',
    'AA': 'https://www.aa.com/reservation/findReservation',
    'UA': 'https://www.united.com/en/us/checkin',
    'DL': 'https://www.delta.com/check-in',
    'BA': 'https://www.britishairways.com/en-gb/information/check-in/online-check-in',
    'LH': 'https://www.lufthansa.com/online/checkin',
    'EK': 'https://www.emirates.com/au/english/manage-booking/check-in/',
    'SQ': 'https://www.singaporeair.com/en_UK/us/travel-info/check-in/',
  };

  const baseUrl = airlineUrls[airlineIata];
  if (!baseUrl) return undefined;

  if (pnr) {
    return `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}pnr=${pnr}`;
  }

  return baseUrl;
}

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
      const threeHoursBeforeTime = departureTime - (3 * 60 * 60 * 1000); // 3 hours before
      const twentyFourHoursBeforeCheckIn = checkInOpensTime - (24 * 60 * 60 * 1000); // 24h before check-in opens

      const airlineIata = itemData?.raw?.airline_iata || itemData?.from?.substring(0, 2);
      const flightNumber = itemData?.raw?.flight_number || 'N/A';
      const checkInUrl = getAirlineCheckInUrl(airlineIata, (booking as any).supplier_reference);

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

