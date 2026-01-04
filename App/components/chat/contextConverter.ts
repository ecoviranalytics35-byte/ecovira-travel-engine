import type { TripContext, FlightOption, Money } from "@/lib/ai/ecovira-brain/types";

// Widget context type (matches EcoviraChatWidgetProps['context'])
type WidgetContext = {
  page?: 'flights' | 'stays' | 'cars' | 'transfers' | 'my-trips';
  route?: { from?: string; to?: string };
  dates?: { depart?: string; return?: string };
  passengers?: number;
  cabin?: string;
  currency?: string;
  topFlights?: Array<{ price: string; duration: string; stops: string; from: string; to: string }>;
  selectedFlight?: any;
  results?: any[];
  trip?: {
    bookingId?: string;
    bookingReference?: string;
    airlineIata?: string;
    airlineName?: string;
    flightNumber?: string;
    scheduledDeparture?: string;
    departureAirport?: string;
    arrivalAirport?: string;
  };
};

// Convert the widget's context format to the brain's TripContext format
export function convertContextToBrainContext(
  context?: WidgetContext
): TripContext | undefined {
  if (!context) return undefined;

  // Convert topFlights to FlightOption[]
  const topFlights: FlightOption[] | undefined = context.topFlights?.map((f) => {
    const priceAmount = typeof f.price === 'string' 
      ? parseFloat(f.price.replace(/[^0-9.]/g, '')) || 0
      : typeof f.price === 'number' ? f.price : 0;

    return {
      id: `flight-${f.from}-${f.to}`,
      price: {
        amount: priceAmount,
        currency: context.currency || 'AUD',
        formatted: typeof f.price === 'string' ? f.price : `${context.currency || 'AUD'} ${priceAmount}`,
      },
      itineraries: [{
        segments: [{
          from: f.from || '',
          to: f.to || '',
        }],
        stops: typeof f.stops === 'string' ? parseInt(f.stops) || 0 : f.stops || 0,
        durationMins: typeof f.duration === 'string' 
          ? parseDurationToMinutes(f.duration) 
          : undefined,
      }],
      cabin: context.cabin,
    };
  });

  // Convert selectedFlight
  const selectedFlight: FlightOption | null = context.selectedFlight ? {
    id: context.selectedFlight.id || 'selected',
    price: {
      amount: typeof context.selectedFlight.price === 'string'
        ? parseFloat(context.selectedFlight.price.replace(/[^0-9.]/g, '')) || 0
        : typeof context.selectedFlight.price === 'number' ? context.selectedFlight.price : 0,
      currency: context.selectedFlight.currency || context.currency || 'AUD',
    },
    itineraries: [{
      segments: [{
        from: context.selectedFlight.from || '',
        to: context.selectedFlight.to || '',
      }],
    }],
  } : null;

  return {
    page: context.page,
    currency: context.currency,
    route: context.route,
    dates: context.dates,
    passengers: context.passengers,
    cabin: context.cabin,
    topFlights,
    selectedFlight,
    booking: context.trip ? {
      bookingId: context.trip.bookingId,
      bookingReference: context.trip.bookingReference,
      airlineIata: context.trip.airlineIata,
      airlineName: context.trip.airlineName,
      flightNumber: context.trip.flightNumber,
      scheduledDeparture: context.trip.scheduledDeparture,
      departureAirport: context.trip.departureAirport,
      arrivalAirport: context.trip.arrivalAirport,
    } : undefined,
  };
}

function parseDurationToMinutes(duration: string): number | undefined {
  // Parse formats like "2h 30m" or "2h30m" or "150m"
  const hourMatch = duration.match(/(\d+)h/);
  const minMatch = duration.match(/(\d+)m/);
  const hours = hourMatch ? parseInt(hourMatch[1]) : 0;
  const mins = minMatch ? parseInt(minMatch[1]) : 0;
  return hours * 60 + mins || undefined;
}


