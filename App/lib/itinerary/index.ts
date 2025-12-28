import { supabaseAdmin } from '../core/supabase';
import { Itinerary, ItineraryItem, Booking } from '../core/types';

export async function createItinerary(items: Omit<ItineraryItem, 'id' | 'itineraryId'>[], userId?: string): Promise<Itinerary> {
  const total = items.reduce((sum, item) => sum + Number((item.item as any).price || (item.item as any).total || 0), 0);
  const currency = items[0]?.item.currency || 'USD';

  const { data: itineraryData, error: itineraryError } = await supabaseAdmin
    .from('itineraries')
    .insert({
      user_id: userId,
      status: 'draft',
      total,
      currency,
    })
    .select()
    .single();

  if (itineraryError) throw itineraryError;

  const itineraryItems = items.map(item => ({
    itinerary_id: itineraryData.id,
    type: item.type,
    item_data: item.item,
  }));

  const { error: itemsError } = await supabaseAdmin
    .from('itinerary_items')
    .insert(itineraryItems);

  if (itemsError) throw itemsError;

  return {
    ...itineraryData,
    items: itineraryItems.map((item, index) => ({ ...item, id: `temp-${index}`, itineraryId: itineraryData.id })),
  } as Itinerary;
}

export async function getItinerary(id: string): Promise<Itinerary | null> {
  const { data: itineraryData, error: itineraryError } = await supabaseAdmin
    .from('itineraries')
    .select('*')
    .eq('id', id)
    .single();

  if (itineraryError) return null;

  const { data: itemsData, error: itemsError } = await supabaseAdmin
    .from('itinerary_items')
    .select('*')
    .eq('itinerary_id', id);

  if (itemsError) return null;

  return {
    ...itineraryData,
    items: itemsData.map(item => ({
      id: item.id,
      itineraryId: item.itinerary_id,
      type: item.type,
      item: item.item_data,
    })),
  } as Itinerary;
}

export async function updateItinerary(id: string, updates: Partial<Pick<Itinerary, 'status' | 'total'>>): Promise<void> {
  const { error } = await supabaseAdmin
    .from('itineraries')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

export async function updateItineraryItems(itineraryId: string, items: Omit<ItineraryItem, 'id' | 'itineraryId'>[]): Promise<void> {
  // Delete old items
  await supabaseAdmin.from('itinerary_items').delete().eq('itinerary_id', itineraryId);

  // Insert new items
  const itineraryItems = items.map(item => ({
    itinerary_id: itineraryId,
    type: item.type,
    item_data: item.item,
  }));

  const { error } = await supabaseAdmin.from('itinerary_items').insert(itineraryItems);
  if (error) throw error;
}

export async function createBooking(
  itineraryId: string,
  paymentId: string,
  options?: {
    passengerEmail?: string;
    passengerLastName?: string;
    phoneNumber?: string;
    smsOptIn?: boolean;
    bookingReference?: string;
    supplierReference?: string;
  }
): Promise<Booking> {
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .insert({
      itinerary_id: itineraryId,
      payment_id: paymentId,
      status: 'pending',
      passenger_email: options?.passengerEmail,
      passenger_last_name: options?.passengerLastName,
      phone_number: options?.phoneNumber,
      sms_opt_in: options?.smsOptIn || false,
      booking_reference: options?.bookingReference,
      supplier_reference: options?.supplierReference,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Booking;
}

export async function updateBookingStatus(bookingId: string, status: Booking['status']): Promise<void> {
  const { error } = await supabaseAdmin
    .from('bookings')
    .update({ status })
    .eq('id', bookingId);

  if (error) throw error;
}

export async function getBookingByPaymentId(paymentId: string): Promise<Booking | null> {
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select('*')
    .eq('payment_id', paymentId)
    .single();

  if (error) return null;
  return data as Booking;
}