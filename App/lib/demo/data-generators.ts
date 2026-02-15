// Demo data generators for all services
import type { FlightResult, StayResult, CarResult, TransferResult } from '@/lib/core/types';

/**
 * Generate demo flight results
 */
export function generateDemoFlights(params: {
  from: string;
  to: string;
  departDate: string;
  returnDate?: string;
  adults?: number;
  cabinClass?: string;
}): FlightResult[] {
  const { from, to, departDate, returnDate, adults = 1, cabinClass = 'economy' } = params;
  
  const airlines = [
    { code: 'QF', name: 'Qantas', logo: 'QF' },
    { code: 'VA', name: 'Virgin Australia', logo: 'VA' },
    { code: 'JQ', name: 'Jetstar', logo: 'JQ' },
    { code: 'SQ', name: 'Singapore Airlines', logo: 'SQ' },
    { code: 'EK', name: 'Emirates', logo: 'EK' },
  ];

  const results: FlightResult[] = [];
  
  // Generate 10-15 demo flights
  for (let i = 0; i < 12; i++) {
    const airline = airlines[i % airlines.length];
    const isDirect = i % 3 === 0; // Every 3rd flight is direct
    const stops = isDirect ? 0 : 1;
    const basePrice = 200 + (i * 50) + (cabinClass === 'business' ? 500 : 0);
    
    results.push({
      type: 'flight',
      id: `demo-flight-${i}`,
      from,
      to,
      departDate,
      price: basePrice.toString(),
      currency: 'AUD',
      provider: 'demo',
      raw: {
        demo: true,
        index: i,
        airline: airline.code,
        airlineName: airline.name,
        flightNumber: `${airline.code}${100 + i}`,
        departTime: `${8 + (i % 12)}:00`,
        arriveDate: departDate,
        arriveTime: `${10 + (i % 12)}:00`,
        duration: `${1 + (i % 3)}h ${30 + (i * 10) % 60}m`,
        stops,
        stopDetails: stops > 0 ? [{ airport: 'SYD', duration: '1h 30m' }] : [],
        cabinClass,
        fareType: i % 2 === 0 ? 'Economy' : 'Premium Economy',
        baggage: '1 checked bag included',
        refundable: i % 3 === 0,
        valueScore: 85 + (i % 15),
      },
    });
  }

  // Add return flights if returnDate provided
  if (returnDate) {
    for (let i = 0; i < 8; i++) {
      const airline = airlines[i % airlines.length];
      const isDirect = i % 2 === 0;
      const stops = isDirect ? 0 : 1;
      const basePrice = 180 + (i * 40);
      
      results.push({
        type: 'flight',
        id: `demo-flight-return-${i}`,
        from: to,
        to: from,
        departDate: returnDate,
        price: basePrice.toString(),
        currency: 'AUD',
        provider: 'demo',
        raw: {
          demo: true,
          index: i,
          return: true,
          airline: airline.code,
          airlineName: airline.name,
          flightNumber: `${airline.code}${200 + i}`,
          departTime: `${14 + (i % 10)}:00`,
          arriveDate: returnDate,
          arriveTime: `${16 + (i % 10)}:00`,
          duration: `${1 + (i % 2)}h ${45 + (i * 5) % 60}m`,
          stops,
          stopDetails: stops > 0 ? [{ airport: 'MEL', duration: '1h 15m' }] : [],
          cabinClass,
          fareType: 'Economy',
          baggage: '1 checked bag included',
          refundable: i % 4 === 0,
          valueScore: 80 + (i % 20),
        },
      });
    }
  }

  return results;
}

/**
 * Generate demo stay results
 */
export function generateDemoStays(params: {
  city: string;
  checkIn: string;
  nights: number;
  adults?: number;
}): StayResult[] {
  const { city, checkIn, nights, adults = 2 } = params;
  
  const hotelNames = [
    'Ecovira Luxury Suites',
    'Grand Harbour Hotel',
    'City Centre Plaza',
    'Riverside Boutique',
    'Skyline Tower',
    'Garden View Resort',
    'Metropolitan Inn',
    'Coastal Retreat',
    'Business District Hotel',
    'Historic Quarter Lodge',
    'Modern Art Hotel',
    'Waterfront Luxury',
    'Mountain View Resort',
    'Downtown Executive',
    'Beachside Paradise',
  ];

  const results: StayResult[] = [];
  
  for (let i = 0; i < 15; i++) {
    const basePrice = 120 + (i * 25);
    const rating = 4.0 + (i % 5) * 0.2;
    
    results.push({
      type: 'stay',
      id: `demo-stay-${i}`,
      city,
      name: hotelNames[i],
      checkIn,
      nights,
      roomType: i % 3 === 0 ? 'double' : i % 3 === 1 ? 'twin' : 'suite',
      classType: i % 4 === 0 ? 'luxury' : i % 4 === 1 ? 'premium' : 'standard',
      total: (basePrice * nights).toString(),
      currency: 'AUD',
      provider: 'demo',
      raw: { demo: true, index: i, rating, location: `${city} City Centre`, amenities: ['WiFi', 'Pool', 'Gym', 'Restaurant'] },
    });
  }

  return results;
}

/**
 * Generate demo car results
 */
export function generateDemoCars(params: {
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  dropoffDate: string;
}): CarResult[] {
  const { pickupLocation, dropoffLocation, pickupDate, dropoffDate } = params;
  
  const carTypes = [
    { name: 'Economy', class: 'economy', seats: 4, price: 35 },
    { name: 'Compact', class: 'compact', seats: 5, price: 45 },
    { name: 'Intermediate', class: 'intermediate', seats: 5, price: 55 },
    { name: 'Standard', class: 'standard', seats: 5, price: 65 },
    { name: 'Full Size', class: 'full-size', seats: 5, price: 75 },
    { name: 'Premium', class: 'premium', seats: 5, price: 90 },
    { name: 'Luxury', class: 'luxury', seats: 5, price: 120 },
    { name: 'SUV', class: 'suv', seats: 7, price: 100 },
  ];

  const providers = ['Hertz', 'Avis', 'Budget', 'Europcar', 'Thrifty'];

  const results: CarResult[] = [];
  const days = Math.ceil((new Date(dropoffDate).getTime() - new Date(pickupDate).getTime()) / (1000 * 60 * 60 * 24)) || 1;
  
  for (let i = 0; i < 12; i++) {
    const carType = carTypes[i % carTypes.length];
    const provider = providers[i % providers.length];
    const totalPrice = carType.price * days;
    
    results.push({
      type: 'car',
      id: `demo-car-${i}`,
      vendor: provider,
      vehicle: `${provider} ${carType.name}`,
      transmission: i % 2 === 0 ? 'automatic' : 'manual',
      fuel: 'petrol',
      seats: carType.seats,
      doors: 4,
      pickup: pickupLocation,
      dropoff: dropoffLocation,
      total: totalPrice.toString(),
      currency: 'AUD',
      provider,
      raw: { demo: true, index: i, carClass: carType.class, pickupDate, dropoffDate, features: ['Air Conditioning', 'GPS', 'Unlimited Mileage'] },
    });
  }

  return results;
}

/**
 * Generate demo transfer results
 */
export function generateDemoTransfers(params: {
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  pickupTime: string;
}): TransferResult[] {
  const { pickupLocation, dropoffLocation, pickupDate, pickupTime } = params;
  
  const vehicleTypes = [
    { name: 'Sedan', capacity: 3, price: 45 },
    { name: 'SUV', capacity: 5, price: 65 },
    { name: 'Van', capacity: 8, price: 85 },
    { name: 'Luxury Sedan', capacity: 3, price: 95 },
    { name: 'Luxury SUV', capacity: 5, price: 120 },
  ];

  const providers = ['Ecovira Transfers', 'Premium Transport', 'City Shuttle', 'Airport Express'];

  const results: TransferResult[] = [];
  
  for (let i = 0; i < 10; i++) {
    const vehicle = vehicleTypes[i % vehicleTypes.length];
    const provider = providers[i % providers.length];
    const isShared = i % 3 === 0;
    
    results.push({
      type: 'transfer',
      id: `demo-transfer-${i}`,
      from: pickupLocation,
      to: dropoffLocation,
      dateTime: `${pickupDate}T${pickupTime}`,
      total: (isShared ? vehicle.price * 0.6 : vehicle.price).toString(),
      currency: 'AUD',
      provider,
      raw: { demo: true, index: i, vehicleType: vehicle.name, capacity: vehicle.capacity, pickupDate, pickupTime, shared: isShared, duration: `${30 + (i * 5)} minutes` },
    });
  }

  return results;
}

