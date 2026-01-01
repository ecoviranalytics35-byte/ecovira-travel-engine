"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plane, Calendar, Users, Clock, MapPin, AlertCircle, CheckCircle, ExternalLink, Hotel } from 'lucide-react';
import type { TripBooking, FlightStatus, CheckInInfo } from '@/lib/core/trip-types';
import { FlightTracking } from '@/components/trips/FlightTracking';
import { CheckInHub } from '@/components/trips/CheckInHub';
import { useTripContext } from '@/contexts/TripContext';

export default function TripDetails() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.bookingId as string;
  const { setTrip: setTripContext } = useTripContext();
  
  const [trip, setTrip] = useState<TripBooking | null>(null);
  const [flightStatus, setFlightStatus] = useState<FlightStatus | null>(null);
  const [checkInInfo, setCheckInInfo] = useState<CheckInInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (bookingId) {
      loadTripDetails();
    }
    
    // Cleanup: Clear trip context when component unmounts or bookingId changes
    return () => {
      setTripContext(null);
    };
  }, [bookingId, setTripContext]);

  const loadTripDetails = async () => {
    setLoading(true);
    setError('');

    try {
      // Load trip details
      const tripRes = await fetch(`/api/trips/${bookingId}`);
      const tripData = await tripRes.json();

      if (tripData.error) {
        setError(tripData.error);
        setLoading(false);
        return;
      }

      setTrip(tripData.trip);
      // Share trip context with AI chat widget
      setTripContext(tripData.trip);

      // Load flight status if it's a flight booking
      if (tripData.trip?.flightData) {
        const statusRes = await fetch(`/api/trips/${bookingId}/status`);
        const statusData = await statusRes.json();
        if (statusData.status) {
          setFlightStatus(statusData.status);
        }

        // Load check-in info
        const checkInRes = await fetch(`/api/trips/${bookingId}/checkin`);
        const checkInData = await checkInRes.json();
        if (checkInData.checkIn) {
          setCheckInInfo(checkInData.checkIn);
        }
      }
    } catch (err) {
      setError('We couldn\'t find a booking with those details. Please check your booking reference and last name exactly as on your ticket, or contact your airline if the booking was made directly.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-12 md:py-16 px-4 md:px-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-ec-card rounded w-1/3"></div>
          <div className="h-64 bg-ec-card rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="max-w-6xl mx-auto py-12 md:py-16 px-4 md:px-6">
        <div className="ec-card p-6 md:p-8">
          <div className="text-center">
            <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-ec-text mb-2">Trip Not Found</h2>
            <p className="text-ec-muted mb-6">{error || 'Unable to load trip details'}</p>
            <button
              onClick={() => router.push('/my-trips')}
              className="ec-btn ec-btn-primary"
            >
              Back to My Trips
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-12 md:py-16 px-4 md:px-6">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/my-trips')}
          className="mb-4 px-4 py-2 text-ec-muted hover:text-ec-text border-0 bg-transparent transition-colors"
        >
          ← Back to My Trips
        </button>
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-ec-text mb-2">
          Trip Details
        </h1>
        <p className="text-ec-muted">Booking Reference: {trip.bookingReference}</p>
      </div>

      {/* Trip Summary - Flight or Hotel */}
      {trip.flightData && (
        <div className="ec-card p-6 md:p-8 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold text-ec-text mb-4 flex items-center gap-2">
                <Plane size={20} className="text-ec-teal" />
                Route
              </h2>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-ec-muted mb-1">From</div>
                  <div className="text-lg font-medium text-ec-text">{trip.route?.from || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-xs text-ec-muted mb-1">To</div>
                  <div className="text-lg font-medium text-ec-text">{trip.route?.to || 'N/A'}</div>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-ec-text mb-4 flex items-center gap-2">
                <Calendar size={20} className="text-ec-teal" />
                Dates
              </h2>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-ec-muted mb-1">Departure</div>
                  <div className="text-lg font-medium text-ec-text">
                    {trip.route?.departDate ? new Date(trip.route.departDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                  </div>
                </div>
                {trip.route?.returnDate && (
                  <div>
                    <div className="text-xs text-ec-muted mb-1">Return</div>
                    <div className="text-lg font-medium text-ec-text">
                      {new Date(trip.route.returnDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        <div className="mt-6 pt-6 border-t border-[rgba(28,140,130,0.15)] grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-ec-muted mb-1">Passengers</div>
            <div className="text-ec-text font-medium flex items-center gap-2">
              <Users size={16} />
              {trip.passengerCount || 1}
            </div>
          </div>
          <div>
            <div className="text-xs text-ec-muted mb-1">Status</div>
            <div className={`text-ec-text font-medium capitalize ${
              trip.status === 'booked' || trip.status === 'ticketed' ? 'text-ec-teal' :
              trip.status === 'paid' ? 'text-ec-gold' :
              trip.status === 'cancelled' ? 'text-red-400' : 'text-ec-muted'
            }`}>
              {trip.status === 'ticketed' && <CheckCircle size={14} className="inline mr-1" />}
              {trip.status}
            </div>
          </div>
          {trip.supplierReference && (
            <div>
              <div className="text-xs text-ec-muted mb-1">Supplier Ref</div>
              <div className="text-ec-text font-medium text-sm">{trip.supplierReference}</div>
            </div>
          )}
          {trip.flightData?.pnr && (
            <div>
              <div className="text-xs text-ec-muted mb-1">PNR</div>
              <div className="text-ec-text font-medium text-sm">{trip.flightData.pnr}</div>
            </div>
          )}
        </div>
        
        {/* Booking Extras */}
        {trip.extras && (
          <div className="mt-6 pt-6 border-t border-[rgba(28,140,130,0.15)]">
            <h3 className="text-lg font-semibold text-ec-text mb-4">Booking Details</h3>
            <div className="space-y-4">
              {/* Seats */}
              {trip.extras.seats && trip.extras.seats.length > 0 && (
                <div>
                  <div className="text-xs text-ec-muted mb-2">Selected Seats</div>
                  <div className="flex flex-wrap gap-2">
                    {trip.extras.seats.map((seat, idx) => (
                      <div key={idx} className="px-3 py-1 bg-ec-teal/20 rounded-full text-sm text-ec-text">
                        {seat.seatNumber}
                        {seat.price > 0 && ` (${seat.currency} ${seat.price.toFixed(2)})`}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Baggage */}
              {trip.extras.baggage && (
                <div>
                  <div className="text-xs text-ec-muted mb-2">Baggage</div>
                  <div className="text-sm text-ec-text">Carry-on included</div>
                  {trip.extras.baggage.checkedBags && trip.extras.baggage.checkedBags.length > 0 && (
                    <div className="mt-1 space-y-1">
                      {trip.extras.baggage.checkedBags.map((bag, idx) => (
                        <div key={idx} className="text-sm text-ec-text">
                          {bag.type} checked bag ({bag.currency} {bag.price.toFixed(2)})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* Insurance */}
              {trip.extras.insurance && trip.extras.insurance.selected && (
                <div>
                  <div className="text-xs text-ec-muted mb-2">Travel Insurance</div>
                  <div className="text-sm text-ec-text">
                    {trip.extras.insurance.type === 'basic' ? 'Basic' : 'Premium'} Travel Insurance
                    ({trip.extras.insurance.currency} {trip.extras.insurance.price.toFixed(2)})
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      )}

      {/* Flight Tracking */}
      {trip.flightData && (
        <FlightTracking
          bookingId={bookingId}
          flightData={trip.flightData}
          status={flightStatus}
        />
      )}

      {/* Check-in Hub */}
      {trip.flightData && (
        <div id="checkin">
          <CheckInHub
            bookingId={bookingId}
            flightData={{
              ...trip.flightData,
              airlineName: trip.flightData.airlineIata, // Will be resolved by resolver
            }}
            checkInInfo={checkInInfo}
            trip={trip}
          />
        </div>
      )}
    </div>
  );
}

