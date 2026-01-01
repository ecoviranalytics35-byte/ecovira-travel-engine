// Types for booking extras (seats, baggage, insurance)

export type SeatSelection = {
  seatNumber: string;
  seatType: 'window' | 'aisle' | 'middle' | 'exit' | 'preferred';
  price: number;
  currency: string;
};

export type BaggageSelection = {
  carryOn: boolean; // Always included
  checkedBags: {
    type: '20kg' | '30kg' | 'extra';
    quantity: number;
    price: number;
    currency: string;
  }[];
};

export type InsuranceSelection = {
  selected: boolean;
  type: 'basic' | 'premium';
  price: number;
  currency: string;
  perPassenger: boolean;
};

export type BookingExtras = {
  seats: SeatSelection[];
  baggage: BaggageSelection;
  insurance: InsuranceSelection | null;
};

// Default pricing configuration
export const EXTRAS_PRICING = {
  seats: {
    economy: {
      default: 0, // Free for economy
      window: 0,
      aisle: 0,
      middle: 0,
      exit: 15,
      preferred: 10,
    },
    business: {
      default: 25,
      window: 30,
      aisle: 30,
      middle: 25,
      exit: 40,
      preferred: 35,
    },
    first: {
      default: 50,
      window: 60,
      aisle: 60,
      middle: 50,
      exit: 75,
      preferred: 65,
    },
  },
  baggage: {
    '20kg': 35,
    '30kg': 55,
    extra: 75,
  },
  insurance: {
    basic: 25,
    premium: 45,
    perPassenger: true,
  },
};

