import { supabase } from '../core/supabase';
import { Itinerary, ItineraryItem, Booking } from '../core/types';

export async function createItinerary(items: ItineraryItem[], userId?: string): Promise<Itinerary> {
  const total = items.reduce((sum, item) => sum + Number((item.item as any).price || (item.item as any).total || 0), 0);
  const currency = items[0]?.item.currency || 'USD';

  const { data, error } = await supabase
    .from('itineraries')
    .insert({
      user_id: userId,
      status: 'draft',
      items: items,
      total,
      currency,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Itinerary;
}

export async function getItinerary(id: string): Promise<Itinerary | null> {
  const { data, error } = await supabase
    .from('itineraries')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data as Itinerary;
}

export async function updateItinerary(id: string, updates: Partial<Pick<Itinerary, 'status' | 'items' | 'total'>>): Promise<void> {
  const { error } = await supabase
    .from('itineraries')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

export async function createBooking(itineraryId: string, paymentId: string): Promise<Booking> {
  const { data, error } = await supabase
    .from('bookings')
    .insert({
      itinerary_id: itineraryId,
      payment_id: paymentId,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return data as Booking;
}

export async function updateBookingStatus(bookingId: string, status: Booking['status']): Promise<void> {
  const { error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', bookingId);

  if (error) throw error;
}

export async function getBookingByPaymentId(paymentId: string): Promise<Booking | null> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('payment_id', paymentId)
    .single();

  if (error) return null;
  return data as Booking;
}