'use client';

import { useEffect, useState } from 'react';
import { supabaseAdmin } from '../../../lib/core/supabase';
import { Booking, Itinerary } from '../../../lib/core/types';
import { Card } from '../../../components/Card';
import { Badge } from '../../../components/Badge';

export default function AdminBookings() {
  const [bookings, setBookings] = useState<(Booking & { itineraries: Itinerary & { itinerary_items: any[] } })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    const { data } = await supabaseAdmin
      .from('bookings')
      .select(`
        *,
        itineraries (
          *,
          itinerary_items (*)
        )
      `)
      .order('created_at', { ascending: false });

    setBookings(data || []);
    setLoading(false);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'paid': return 'info';
      case 'pending': return 'warn';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  return (
    <main className="min-h-screen bg-ec-night p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-serif font-semibold text-ec-bg mb-8">Booking Management</h1>

        {loading ? (
          <Card>
            <div className="animate-pulse">
              <div className="h-4 bg-ec-border rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-ec-border rounded w-1/2"></div>
            </div>
          </Card>
        ) : bookings.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-serif font-medium text-ec-bg mb-2">No bookings yet</h3>
              <p className="text-ec-muted">Bookings will appear here once created.</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookings.map(booking => (
              <Card key={booking.id} className="hover:shadow-ec-2 transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium text-ec-bg">Booking #{booking.id.slice(-8)}</h3>
                      <Badge variant={getStatusVariant(booking.status)}>{booking.status}</Badge>
                    </div>
                    <p className="text-sm text-ec-muted">
                      Created: {new Date(booking.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-serif font-semibold text-ec-gold">
                      {booking.itineraries.currency} {booking.itineraries.total}
                    </div>
                    <p className="text-sm text-ec-muted">{booking.itineraries.itinerary_items.length} items</p>
                  </div>
                </div>

                <div className="border-t border-ec-night-border pt-4">
                  <h4 className="font-medium text-ec-bg mb-2">Items</h4>
                  <div className="space-y-2">
                    {booking.itineraries.itinerary_items.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-ec-muted capitalize">{item.type}: {item.item_data.name || `${item.item_data.from} → ${item.item_data.to}`}</span>
                        <span className="text-ec-bg">{item.item_data.currency} {item.item_data.price || item.item_data.total}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}