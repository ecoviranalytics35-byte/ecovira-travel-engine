'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/core/supabase';
import { Booking, Itinerary } from '../../../lib/core/types';

export default function AdminBookings() {
  const [bookings, setBookings] = useState<(Booking & { itinerary: Itinerary })[]>([]);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    const { data } = await supabase
      .from('bookings')
      .select('*, itineraries(*)')
      .order('created_at', { ascending: false });

    setBookings(data || []);
  };

  return (
    <div>
      <h1>Admin Bookings</h1>
      <ul>
        {bookings.map(booking => (
          <li key={booking.id}>
            Booking {booking.id}: {booking.status} - Itinerary {booking.itineraryId} - Total {booking.itinerary.total}
          </li>
        ))}
      </ul>
    </div>
  );
}