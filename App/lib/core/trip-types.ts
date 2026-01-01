// Extended types for My Trips and Flight Tracking

export type TripBooking = {
  id: string;
  bookingReference: string; // Customer-facing reference
  itineraryId: string;
  status: 'pending' | 'paid' | 'booked' | 'ticketed' | 'cancelled';
  supplierReference?: string; // Duffel order ID / PNR
  createdAt: string;
  updatedAt: string;
  // Flight-specific data (stored at booking time)
  flightData?: {
    airlineIata: string;
    flightNumber: string;
    departureAirport: string;
    arrivalAirport: string;
    scheduledDeparture: string; // ISO datetime
    scheduledArrival: string; // ISO datetime
    pnr?: string;
    ticketNumber?: string;
  };
  // Passenger info (for lookup)
  passengerLastName?: string;
  passengerCount?: number;
  // Route summary
  route?: {
    from: string;
    to: string;
    departDate: string;
    returnDate?: string;
  };
  // Booking extras (seats, baggage, insurance)
  extras?: {
    seats?: Array<{ seatNumber: string; seatType: string; price: number; currency: string }>;
    baggage?: {
      carryOn: boolean;
      checkedBags: Array<{ type: string; quantity: number; price: number; currency: string }>;
    };
    insurance?: {
      selected: boolean;
      type: string;
      price: number;
      currency: string;
    } | null;
  };
  // Hotel-specific data (stored at booking time)
  hotelData?: {
    hotelId: string;
    hotelName: string;
    checkIn: string; // ISO datetime
    checkOut: string; // ISO datetime
    nights: number;
    room: {
      id: string;
      name: string;
      type: string;
      bedType: string;
      maxOccupancy: number;
      pricePerNight: number;
      currency: string;
      refundable: boolean;
      mealPlan: string;
    };
    numberOfRooms: number;
    adults: number;
    children: number;
    extras?: {
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
    };
  };
};

export type FlightStatus = {
  flightNumber: string;
  airlineIata: string;
  departure: {
    airport: string;
    scheduled: string;
    estimated?: string;
    actual?: string;
    gate?: string;
    terminal?: string;
    status: 'on-time' | 'delayed' | 'cancelled' | 'boarding' | 'departed';
  };
  arrival: {
    airport: string;
    scheduled: string;
    estimated?: string;
    actual?: string;
    gate?: string;
    terminal?: string;
    baggageBelt?: string;
    status: 'on-time' | 'delayed' | 'cancelled' | 'arrived';
  };
  lastUpdated: string;
  source: 'amadeus' | 'manual' | 'unavailable';
};

export type CheckInInfo = {
  isOpen: boolean;
  opensAt?: string; // ISO datetime when check-in opens
  closesAt?: string; // ISO datetime when check-in closes
  airlineCheckInUrl?: string; // Deep link to airline check-in page
  requiredInfo: {
    bookingReference: boolean;
    lastName: boolean;
    passport?: boolean; // For international
    ticketNumber?: boolean;
  };
};

