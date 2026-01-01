// Types for hotel booking system

export type HotelRoom = {
  id: string;
  name: string; // e.g., "Standard Double Room", "Deluxe Suite"
  type: 'standard' | 'deluxe' | 'suite' | 'executive' | 'family';
  bedType: string; // e.g., "1 Double Bed", "2 Single Beds", "1 King Bed"
  maxOccupancy: number; // Maximum guests
  pricePerNight: number;
  currency: string;
  refundable: boolean;
  mealPlan: 'room-only' | 'breakfast-included' | 'half-board' | 'full-board';
  amenities: string[]; // Room-specific amenities
  description?: string;
  images?: string[]; // Room images
};

export type HotelExtras = {
  breakfast?: {
    selected: boolean;
    pricePerPerson: number;
    currency: string;
  };
  lateCheckout?: {
    selected: boolean;
    price: number;
    currency: string;
  };
  additionalServices?: Array<{
    id: string;
    name: string;
    price: number;
    currency: string;
    selected: boolean;
  }>;
};

export type HotelBookingSelection = {
  room: HotelRoom;
  numberOfRooms: number;
  adults: number;
  children: number;
  extras: HotelExtras;
};

export type HotelDetails = {
  id: string;
  name: string;
  starRating: number;
  location: string; // City/address
  description: string;
  amenities: string[]; // Hotel amenities (Wi-Fi, pool, parking, etc.)
  checkInTime: string; // e.g., "14:00"
  checkOutTime: string; // e.g., "11:00"
  policies: {
    cancellation: string; // e.g., "Free cancellation until 24 hours before check-in"
    refund: string;
    checkIn: string;
    checkOut: string;
  };
  images: string[]; // Hotel photo gallery
  rooms: HotelRoom[]; // Available rooms
};

// Default pricing for hotel extras
export const HOTEL_EXTRAS_PRICING = {
  breakfast: {
    perPerson: 25,
  },
  lateCheckout: {
    standard: 30,
  },
  additionalServices: {
    parking: 15,
    airportTransfer: 50,
    spaAccess: 40,
  },
};

