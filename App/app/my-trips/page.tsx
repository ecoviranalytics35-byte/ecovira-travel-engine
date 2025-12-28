"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plane, Search, Calendar, Users } from 'lucide-react';
import type { TripBooking } from '@/lib/core/trip-types';

export default function MyTrips() {
  const router = useRouter();
  const [bookingRef, setBookingRef] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [trips, setTrips] = useState<TripBooking[]>([]);

  const handleLookup = async () => {
    if (!bookingRef.trim() || !lastName.trim()) {
      setError('Please enter both booking reference and last name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/trips/lookup?reference=${encodeURIComponent(bookingRef)}&lastName=${encodeURIComponent(lastName)}`);
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setTrips([]);
      } else {
        setTrips(data.trips || []);
        if (data.trips && data.trips.length === 0) {
          setError('No trips found with that booking reference and last name');
        }
      }
    } catch (err) {
      setError('Unable to retrieve trips. Please try again.');
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-12 md:py-16 px-4 md:px-6">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-ec-text mb-4">
          My Trips
        </h1>
        <p className="text-ec-muted text-lg">
          Track your flights and manage your bookings
        </p>
      </div>

      {/* Lookup Form */}
      <div className="ec-card p-6 md:p-8 mb-8">
        <h2 className="text-2xl font-semibold text-ec-text mb-6">Find Your Trip</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-3">
              Booking Reference
            </label>
            <input
              type="text"
              value={bookingRef}
              onChange={(e) => setBookingRef(e.target.value.toUpperCase())}
              placeholder="ABC123"
              onKeyPress={(e) => e.key === 'Enter' && handleLookup()}
              className="w-full h-[52px] px-4 rounded-ec-sm bg-[rgba(15,17,20,0.55)] border border-[rgba(28,140,130,0.25)] text-[rgba(255,255,255,0.92)] placeholder:text-[rgba(255,255,255,0.45)] focus:outline-none focus:ring-2 focus:ring-[rgba(28,140,130,0.35)]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-3">
              Last Name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Smith"
              onKeyPress={(e) => e.key === 'Enter' && handleLookup()}
              className="w-full h-[52px] px-4 rounded-ec-sm bg-[rgba(15,17,20,0.55)] border border-[rgba(28,140,130,0.25)] text-[rgba(255,255,255,0.92)] placeholder:text-[rgba(255,255,255,0.45)] focus:outline-none focus:ring-2 focus:ring-[rgba(28,140,130,0.35)]"
            />
          </div>
        </div>
        <button
          onClick={handleLookup}
          disabled={loading}
          className="ec-btn ec-btn-primary w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Search size={18} className="mr-2" />
          {loading ? 'Searching...' : 'Find My Trip'}
        </button>
        {error && (
          <div className="mt-4 p-3 bg-[rgba(200,50,50,0.15)] border border-[rgba(200,50,50,0.3)] rounded-ec-sm text-ec-text text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Trips List */}
      {trips.length > 0 && (
        <div className="space-y-4">
          {trips.map((trip) => (
            <div
              key={trip.id}
              className="ec-card p-6 md:p-8 cursor-pointer hover:border-[rgba(28,140,130,0.45)] transition-all"
              onClick={() => router.push(`/my-trips/${trip.id}`)}
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Plane size={20} className="text-ec-teal" />
                    <h3 className="text-xl font-semibold text-ec-text">
                      {trip.route?.from} → {trip.route?.to}
                    </h3>
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-[rgba(28,140,130,0.15)] border border-[rgba(28,140,130,0.3)] text-ec-text">
                      {trip.bookingReference}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-xs text-ec-muted mb-1">Departure</div>
                      <div className="text-ec-text font-medium flex items-center gap-2">
                        <Calendar size={14} />
                        {trip.route?.departDate ? new Date(trip.route.departDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                      </div>
                    </div>
                    {trip.route?.returnDate && (
                      <div>
                        <div className="text-xs text-ec-muted mb-1">Return</div>
                        <div className="text-ec-text font-medium flex items-center gap-2">
                          <Calendar size={14} />
                          {new Date(trip.route.returnDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="text-xs text-ec-muted mb-1">Passengers</div>
                      <div className="text-ec-text font-medium flex items-center gap-2">
                        <Users size={14} />
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
                        {trip.status}
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/my-trips/${trip.id}`);
                  }}
                  className="ec-btn ec-button-secondary text-white"
                >
                  View Details →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

