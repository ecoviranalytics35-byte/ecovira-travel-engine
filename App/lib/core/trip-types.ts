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

