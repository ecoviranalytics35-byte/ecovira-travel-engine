"use client";

export const dynamic = "force-dynamic";
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Plane, Calendar, MapPin } from 'lucide-react';
import { EcoviraButton } from '@/components/Button';

function BookingConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get('bookingId');
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    if (bookingId) {
      // Load booking details
      fetch(`/api/trips/${bookingId}`)
        .then(res => res.json())
        .then(data => {
          if (data.trip) {
            setBooking(data.trip);
          }
        })
        .catch(err => console.error('[Confirmation] Error loading booking', err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [bookingId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="text-center">
          <div className="animate-pulse text-ec-muted">Loading confirmation...</div>
        </div>
      </div>
    );
  }

  if (!bookingId || !booking) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="ec-card p-8 text-center">
          <h1 className="text-2xl font-semibold text-ec-text mb-4">Booking Not Found</h1>
          <p className="text-ec-muted mb-6">Unable to load booking confirmation.</p>
          <EcoviraButton onClick={() => router.push('/my-trips')}>
            Go to My Trips
          </EcoviraButton>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="ec-card p-8 md:p-12 text-center mb-8">
        <div className="mb-6">
          <div className="w-20 h-20 rounded-full bg-ec-teal/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={48} className="text-ec-teal" />
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-semibold text-ec-text mb-4">
            Booking Confirmed
          </h1>
          <p className="text-ec-muted text-lg">
            Your flight has been successfully booked
          </p>
        </div>

        <div className="bg-[rgba(28,140,130,0.1)] rounded-ec-md p-6 mb-6">
          <div className="text-sm text-ec-muted mb-2">Booking Reference</div>
          <div className="text-2xl font-bold text-ec-text font-mono">
            {booking.bookingReference}
          </div>
        </div>

        {booking.flightData && (
          <div className="space-y-4 text-left max-w-md mx-auto">
            <div className="flex items-center gap-3 text-ec-text">
              <Plane size={20} className="text-ec-teal" />
              <div>
                <div className="text-sm text-ec-muted">Flight</div>
                <div className="font-semibold">
                  {booking.flightData.airlineIata} {booking.flightData.flightNumber}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-ec-text">
              <MapPin size={20} className="text-ec-teal" />
              <div>
                <div className="text-sm text-ec-muted">Route</div>
                <div className="font-semibold">
                  {booking.flightData.departureAirport} → {booking.flightData.arrivalAirport}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-ec-text">
              <Calendar size={20} className="text-ec-teal" />
              <div>
                <div className="text-sm text-ec-muted">Departure</div>
                <div className="font-semibold">
                  {new Date(booking.flightData.scheduledDeparture).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {booking.extras && (
          <div className="mt-6 pt-6 border-t border-[rgba(28,140,130,0.15)] text-left max-w-md mx-auto">
            <div className="text-sm font-semibold text-ec-text mb-3">Booking Details</div>
            {booking.extras.seats && booking.extras.seats.length > 0 && (
              <div className="text-sm text-ec-muted mb-2">
                Seats: {booking.extras.seats.map((s: any) => s.seatNumber).join(', ')}
              </div>
            )}
            {booking.extras.baggage && booking.extras.baggage.checkedBags.length > 0 && (
              <div className="text-sm text-ec-muted mb-2">
                Baggage: {booking.extras.baggage.checkedBags.map((b: any) => b.type).join(', ')}
              </div>
            )}
            {booking.extras.insurance && booking.extras.insurance.selected && (
              <div className="text-sm text-ec-muted">
                Insurance: {booking.extras.insurance.type === 'basic' ? 'Basic' : 'Premium'}
              </div>
            )}
          </div>
        )}

        <div className="mt-8 space-y-4">
          <EcoviraButton
            onClick={() => router.push(`/my-trips/${bookingId}`)}
            className="w-full md:w-auto"
          >
            View Booking Details
          </EcoviraButton>
          <div>
            <button
              onClick={() => router.push('/flights')}
              className="text-ec-muted hover:text-ec-text transition-colors text-sm"
            >
              Book Another Flight
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingConfirmationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">Loading...</div>}>
      <BookingConfirmationContent />
    </Suspense>
  );
}
