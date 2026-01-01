// Helper functions for demo hotel data generation
import type { HotelDetails, HotelRoom } from '@/lib/core/hotel-types';

/**
 * Generate demo hotel photos
 */
export function generateDemoHotelPhotos(count: number = 8): string[] {
  // Using placeholder images - in production these would be real hotel photos
  const photos: string[] = [];
  for (let i = 1; i <= count; i++) {
    photos.push(`https://images.unsplash.com/photo-${1560000000 + i}?w=800&h=600&fit=crop`);
  }
  return photos;
}

/**
 * Generate demo hotel rooms
 */
export function generateDemoHotelRooms(currency: string = 'AUD'): HotelRoom[] {
  return [
    {
      id: 'room-standard',
      name: 'Standard Double Room',
      type: 'standard',
      bedType: '1 Double Bed',
      maxOccupancy: 2,
      pricePerNight: 120,
      currency,
      refundable: true,
      mealPlan: 'room-only',
      amenities: ['Wi-Fi', 'TV', 'Air Conditioning', 'Private Bathroom'],
      description: 'Comfortable standard room with all essential amenities.',
    },
    {
      id: 'room-deluxe',
      name: 'Deluxe King Room',
      type: 'deluxe',
      bedType: '1 King Bed',
      maxOccupancy: 2,
      pricePerNight: 180,
      currency,
      refundable: true,
      mealPlan: 'breakfast-included',
      amenities: ['Wi-Fi', 'TV', 'Air Conditioning', 'Private Bathroom', 'Mini Bar', 'City View'],
      description: 'Spacious deluxe room with city views and breakfast included.',
    },
    {
      id: 'room-suite',
      name: 'Executive Suite',
      type: 'suite',
      bedType: '1 King Bed + Sofa Bed',
      maxOccupancy: 4,
      pricePerNight: 320,
      currency,
      refundable: true,
      mealPlan: 'breakfast-included',
      amenities: ['Wi-Fi', 'TV', 'Air Conditioning', 'Private Bathroom', 'Mini Bar', 'City View', 'Separate Living Area', 'Balcony'],
      description: 'Luxurious suite with separate living area and balcony.',
    },
    {
      id: 'room-family',
      name: 'Family Room',
      type: 'family',
      bedType: '2 Double Beds',
      maxOccupancy: 4,
      pricePerNight: 220,
      currency,
      refundable: false, // Non-refundable family rate
      mealPlan: 'room-only',
      amenities: ['Wi-Fi', 'TV', 'Air Conditioning', 'Private Bathroom', 'Extra Space'],
      description: 'Spacious family room perfect for families or groups.',
    },
  ];
}

/**
 * Generate demo hotel details
 */
export function generateDemoHotelDetails(hotelName: string, city: string, currency: string = 'AUD'): HotelDetails {
  return {
    id: `hotel-${hotelName.toLowerCase().replace(/\s+/g, '-')}`,
    name: hotelName,
    starRating: 4,
    location: city,
    description: `${hotelName} is a premium hotel located in the heart of ${city}. Our hotel offers exceptional comfort, modern amenities, and outstanding service to ensure a memorable stay.`,
    amenities: [
      'Free Wi-Fi',
      'Swimming Pool',
      'Fitness Center',
      'Restaurant',
      'Bar',
      'Parking',
      'Room Service',
      '24-Hour Front Desk',
      'Business Center',
      'Concierge Service',
    ],
    checkInTime: '14:00',
    checkOutTime: '11:00',
    policies: {
      cancellation: 'Free cancellation until 24 hours before check-in',
      refund: 'Full refund for cancellations made at least 24 hours before check-in',
      checkIn: 'Check-in from 14:00',
      checkOut: 'Check-out until 11:00',
    },
    images: generateDemoHotelPhotos(8),
    rooms: generateDemoHotelRooms(currency),
  };
}

