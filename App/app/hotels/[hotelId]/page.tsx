"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Star, MapPin, Wifi, Car, UtensilsCrossed, Waves, CheckCircle, Clock } from 'lucide-react';
import { EcoviraButton } from '@/components/Button';
import { generateDemoHotelDetails } from '@/lib/demo/hotel-helpers';
import type { HotelDetails } from '@/lib/core/hotel-types';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';

export default function HotelDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const hotelId = params.hotelId as string;
  
  const [hotel, setHotel] = useState<HotelDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Get search params
  const checkIn = searchParams.get('checkIn') || '';
  const nights = parseInt(searchParams.get('nights') || '2');
  const adults = parseInt(searchParams.get('adults') || '2');
  const children = parseInt(searchParams.get('children') || '0');
  const currency = searchParams.get('currency') || 'AUD';
  
  useEffect(() => {
    // Load hotel details
    // For demo, generate hotel details
    // In production, this would fetch from API
    const loadHotel = async () => {
      setLoading(true);
      try {
        // TODO: Fetch from API
        // For now, generate demo data
        const demoHotel = generateDemoHotelDetails('Ecovira Luxury Hotel', 'Melbourne', currency);
        setHotel(demoHotel);
      } catch (error) {
        console.error('[HotelDetails] Error loading hotel', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadHotel();
  }, [hotelId, currency]);
  
  const handleSelectRoom = (roomId: string) => {
    if (!hotel) return;
    
    // Route to room selection/extras page
    router.push(`/booking/hotel/rooms?hotelId=${hotelId}&roomId=${roomId}&checkIn=${checkIn}&nights=${nights}&adults=${adults}&children=${children}&currency=${currency}`);
  };
  
  const handleBack = () => {
    router.back();
  };
  
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-12 px-4">
        <div className="text-center">
          <div className="animate-pulse text-ec-muted">Loading hotel details...</div>
        </div>
      </div>
    );
  }
  
  if (!hotel) {
    return (
      <div className="max-w-6xl mx-auto py-12 px-4">
        <div className="ec-card p-8 text-center">
          <h1 className="text-2xl font-semibold text-ec-text mb-4">Hotel Not Found</h1>
          <p className="text-ec-muted mb-6">Unable to load hotel details.</p>
          <EcoviraButton onClick={() => router.push('/stays')}>
            Back to Stays
          </EcoviraButton>
        </div>
      </div>
    );
  }
  
  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % hotel.images.length);
  };
  
  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + hotel.images.length) % hotel.images.length);
  };
  
  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-ec-muted hover:text-ec-text transition-colors mb-6"
      >
        <ArrowLeft size={18} />
        Back
      </button>
      
      {/* Hotel Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-serif font-semibold text-ec-text mb-2">
              {hotel.name}
            </h1>
            <div className="flex items-center gap-3 text-ec-muted">
              <MapPin size={18} />
              <span>{hotel.location}</span>
              <div className="flex items-center gap-1">
                {Array.from({ length: hotel.starRating }).map((_, i) => (
                  <Star key={i} size={16} className="fill-ec-gold text-ec-gold" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Photo Gallery */}
      {hotel.images.length > 0 && (
        <div className="mb-8 relative">
          <div className="relative w-full h-[400px] md:h-[500px] rounded-ec-lg overflow-hidden bg-[rgba(15,17,20,0.4)]">
            <img
              src={hotel.images[currentImageIndex]}
              alt={`${hotel.name} - Photo ${currentImageIndex + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to placeholder if image fails to load
                (e.target as HTMLImageElement).src = `https://via.placeholder.com/800x600/1C8C82/FFFFFF?text=${encodeURIComponent(hotel.name)}`;
              }}
            />
            {hotel.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                >
                  <ChevronLeft size={24} className="text-white" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                >
                  <ChevronRight size={24} className="text-white" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {hotel.images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        idx === currentImageIndex ? 'bg-ec-teal w-6' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
          
          {/* Thumbnail Grid */}
          {hotel.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2 mt-4">
              {hotel.images.slice(0, 4).map((image, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`relative h-20 rounded-lg overflow-hidden border-2 transition-all ${
                    currentImageIndex === idx ? 'border-ec-teal' : 'border-transparent hover:border-ec-teal/50'
                  }`}
                >
                  <img
                    src={image}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://via.placeholder.com/200x150/1C8C82/FFFFFF?text=${idx + 1}`;
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Description */}
          <div className="ec-card p-6 md:p-8">
            <h2 className="text-2xl font-semibold text-ec-text mb-4">About This Hotel</h2>
            <p className="text-ec-text leading-relaxed">{hotel.description}</p>
          </div>
          
          {/* Amenities */}
          <div className="ec-card p-6 md:p-8">
            <h2 className="text-2xl font-semibold text-ec-text mb-4">Hotel Amenities</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {hotel.amenities.map((amenity, idx) => (
                <div key={idx} className="flex items-center gap-2 text-ec-text">
                  <CheckCircle size={16} className="text-ec-teal flex-shrink-0" />
                  <span className="text-sm">{amenity}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Policies */}
          <div className="ec-card p-6 md:p-8">
            <h2 className="text-2xl font-semibold text-ec-text mb-4">Policies</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Clock size={20} className="text-ec-teal mt-1 flex-shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-ec-text mb-1">Check-in / Check-out</div>
                  <div className="text-sm text-ec-muted">
                    Check-in: {hotel.checkInTime} | Check-out: {hotel.checkOutTime}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle size={20} className="text-ec-teal mt-1 flex-shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-ec-text mb-1">Cancellation Policy</div>
                  <div className="text-sm text-ec-muted">{hotel.policies.cancellation}</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Available Rooms */}
          <div className="ec-card p-6 md:p-8">
            <h2 className="text-2xl font-semibold text-ec-text mb-6">Available Rooms</h2>
            <div className="space-y-4">
              {hotel.rooms.map((room) => (
                <div
                  key={room.id}
                  className="p-4 bg-[rgba(15,17,20,0.4)] rounded-ec-md border border-[rgba(28,140,130,0.25)] hover:border-[rgba(28,140,130,0.45)] transition-all cursor-pointer"
                  onClick={() => handleSelectRoom(room.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-ec-text">{room.name}</h3>
                        {room.refundable && (
                          <span className="px-2 py-1 text-xs bg-ec-teal/20 text-ec-teal rounded">
                            Refundable
                          </span>
                        )}
                        {!room.refundable && (
                          <span className="px-2 py-1 text-xs bg-ec-muted/20 text-ec-muted rounded">
                            Non-refundable
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-ec-muted mb-2">
                        {room.bedType} • Up to {room.maxOccupancy} guests
                      </div>
                      {room.description && (
                        <p className="text-sm text-ec-text mb-3">{room.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {room.amenities.map((amenity, idx) => (
                          <span key={idx} className="text-xs text-ec-muted">
                            • {amenity}
                          </span>
                        ))}
                      </div>
                      <div className="mt-3 text-sm text-ec-muted">
                        Meal Plan: {room.mealPlan === 'room-only' ? 'Room Only' : 
                                   room.mealPlan === 'breakfast-included' ? 'Breakfast Included' :
                                   room.mealPlan === 'half-board' ? 'Half Board' : 'Full Board'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-ec-text mb-1">
                        {room.currency} {room.pricePerNight}
                      </div>
                      <div className="text-sm text-ec-muted">per night</div>
                      <EcoviraButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectRoom(room.id);
                        }}
                        className="mt-4"
                      >
                        Select Room
                      </EcoviraButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Sidebar - Booking Summary */}
        <div className="lg:col-span-1">
          <div className="ec-card p-6 sticky top-32">
            <h2 className="text-xl font-semibold text-ec-text mb-4">Your Stay</h2>
            <div className="space-y-4 text-sm">
              <div>
                <div className="text-ec-muted mb-1">Check-in</div>
                <div className="text-ec-text font-medium">
                  {checkIn ? new Date(checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Select date'}
                </div>
              </div>
              <div>
                <div className="text-ec-muted mb-1">Nights</div>
                <div className="text-ec-text font-medium">{nights}</div>
              </div>
              <div>
                <div className="text-ec-muted mb-1">Guests</div>
                <div className="text-ec-text font-medium">{adults} adult{adults > 1 ? 's' : ''} {children > 0 && `+ ${children} child${children > 1 ? 'ren' : ''}`}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

