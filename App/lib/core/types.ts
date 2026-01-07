export type ApiOk<T> = { ok: true; data: T };
export type ApiFail = { ok: false; error: string };

export type FlightSearchParams = { from: string; to: string; departDate: string; adults: number };
export type FlightResult = { type: 'flight'; id: string; from: string; to: string; departDate: string; price: string | number; currency: string; provider: string; raw: any };

export type StaySearchParams = { city: string; checkIn: string; nights: number; adults: number };
export type StayResult = { type: 'stay'; id: string; city: string; name: string; checkIn: string; nights: number; roomType: string; classType: string; total: string | number; currency: string; provider: string; raw: any };

export type CarResult = { 
  type: 'car'; 
  id: string; 
  vendor: string; 
  vehicle: string; 
  transmission: string; 
  fuel: string; 
  seats: number; 
  doors: number; 
  pickup: string; 
  dropoff: string; 
  total: string; 
  currency: string; 
  provider: string; 
  raw: any;
  // Additional fields for CarResultCard compatibility
  name?: string;
  category?: string;
  pickupLocation?: string;
  returnLocation?: string;
  duration?: number;
};

export type TransferResult = { 
  type: 'transfer'; 
  id: string; 
  from: string; 
  to: string; 
  dateTime: string; 
  total: string; 
  currency: string; 
  provider: string; 
  raw: any;
  // Additional fields for TransferResultCard compatibility
  name?: string;
  transferType?: string;
  passengers?: number;
};

export type ItineraryItem = {
  id: string;
  itineraryId: string;
  type: 'flight' | 'stay' | 'car' | 'transfer';
  item: FlightResult | StayResult | CarResult | TransferResult;
};

// Itinerary status enum
export type ItineraryStatus = 
  | 'draft'       // Initial creation
  | 'priced'      // Items added, pricing calculated
  | 'paid'         // Payment confirmed
  | 'confirmed'    // Provider booking confirmed
  | 'cancelled';   // Cancelled

export type Itinerary = {
  id: string;
  userId?: string;
  status: ItineraryStatus;
  total: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  items: ItineraryItem[];
};

// Booking status enum - production-ready state machine
export type BookingStatus = 
  | 'QUOTE_HELD'           // Quote created, awaiting payment
  | 'PAYMENT_PENDING'       // Payment initiated, awaiting confirmation
  | 'PAID'                  // Payment confirmed, awaiting fulfilment
  | 'FULFILLMENT_PENDING'   // Payment confirmed, booking with provider in progress
  | 'TICKETED'              // Fully confirmed, ticket/voucher issued (flights only)
  | 'FAILED'                // Booking failed (payment or provider error)
  | 'REFUND_PENDING';       // Refund initiated

// Legacy status values for backward compatibility
export type LegacyBookingStatus = 'pending' | 'paid' | 'confirmed' | 'issued' | 'failed';

export type Booking = {
  id: string;
  itineraryId: string;
  paymentId: string;
  status: BookingStatus | LegacyBookingStatus; // Support both for migration
  createdAt: string;
};