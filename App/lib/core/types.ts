export type ApiOk<T> = { ok: true; data: T };
export type ApiFail = { ok: false; error: string };

export type FlightSearchParams = { from: string; to: string; departDate: string; adults: number };
export type FlightResult = { type: 'flight'; id: string; from: string; to: string; departDate: string; price: string | number; currency: string; provider: string; raw: any };

export type StaySearchParams = { city: string; checkIn: string; nights: number; adults: number };
export type StayResult = { type: 'stay'; id: string; city: string; name: string; checkIn: string; nights: number; roomType: string; classType: string; total: string | number; currency: string; provider: string; raw: any };

export type CarResult = { type: 'car'; id: string; vendor: string; vehicle: string; transmission: string; fuel: string; seats: number; doors: number; pickup: string; dropoff: string; total: string; currency: string; provider: string; raw: any };

export type TransferResult = { type: 'transfer'; id: string; from: string; to: string; dateTime: string; total: string; currency: string; provider: string; raw: any };

export type ItineraryItem = {
  id: string;
  itineraryId: string;
  type: 'flight' | 'stay' | 'car' | 'transfer';
  item: FlightResult | StayResult | CarResult | TransferResult;
};

export type Itinerary = {
  id: string;
  userId?: string;
  status: 'draft' | 'priced' | 'paid' | 'confirmed' | 'cancelled';
  total: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  items: ItineraryItem[];
};

export type Booking = {
  id: string;
  itineraryId: string;
  paymentId: string;
  status: 'pending' | 'paid' | 'confirmed' | 'failed';
  createdAt: string;
};