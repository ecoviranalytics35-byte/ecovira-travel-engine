export type Money = {
  amount: number; // numeric
  currency: string; // "AUD"
  formatted?: string; // "$123.45"
};

export type FeeBreakdown = {
  baseFare?: Money;
  taxes?: Money;
  airlineFees?: Money;
  paymentProcessingFee?: Money;
  ecoviraServiceFee?: Money;
  total?: Money;
};

export type FareRulesSnapshot = {
  refundable?: boolean;
  changeable?: boolean;
  changeFeeNote?: string; // "Changes permitted with fee"
  cancellationNote?: string;
  baggageIncluded?: string; // "1 carry-on + 1 checked bag"
  seatsIncluded?: string; // "Seat selection may cost extra"
};

export type Segment = {
  from: string; // IATA, e.g. "MEL"
  to: string; // IATA, e.g. "SYD"
  departTime?: string; // ISO string
  arriveTime?: string; // ISO string
  airlineIata?: string; // "QF"
  flightNumber?: string; // "QF400"
  durationMins?: number;
};

export type Itinerary = {
  segments: Segment[];
  stops?: number;
  durationMins?: number;
};

export type FlightOption = {
  id: string;
  price: Money;
  itineraries: Itinerary[]; // usually outbound + return
  cabin?: string; // "Economy"
  airlineIata?: string;
  airlineName?: string;
  refundable?: boolean;
  changeable?: boolean;
  fareRules?: FareRulesSnapshot;
  scoreHints?: {
    provider?: "amadeus" | "duffel" | "other";
    isBestValue?: boolean;
  };
};

export type TripContext = {
  page?: "flights" | "stays" | "cars" | "transfers" | "my-trips";
  locale?: string; // "en-AU"
  currency?: string; // "AUD"
  route?: { from?: string; to?: string };
  dates?: { depart?: string; return?: string };
  passengers?: number;
  cabin?: string;

  // Search context
  topFlights?: FlightOption[]; // top N results
  selectedFlight?: FlightOption | null;

  // Checkout / totals
  feeBreakdown?: FeeBreakdown | null;

  // Existing booking context
  booking?: {
    bookingReference?: string;
    bookingId?: string;
    airlineIata?: string;
    airlineName?: string;
    flightNumber?: string;
    scheduledDeparture?: string;
    departureAirport?: string;
    arrivalAirport?: string;
  };
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type BrainInput = {
  userMessage: string;
  history: ChatMessage[];
  context?: TripContext;
};

export type BrainOutput = {
  // Clean user-facing text (premium concierge)
  replyText: string;

  // If you want to render chips in UI
  quickChips?: string[];

  // Used for debugging in dev; do not show to user in prod
  debug?: {
    intent: string;
    confidence: number;
    followUpUsed: boolean;
    usedContextKeys: string[];
  };
};

