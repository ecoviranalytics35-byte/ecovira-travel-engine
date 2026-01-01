"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { generateDemoHotelDetails } from '@/lib/demo/hotel-helpers';
import type { HotelRoom, HotelExtras } from '@/lib/core/hotel-types';
import { HOTEL_EXTRAS_PRICING } from '@/lib/core/hotel-types';
import { EcoviraButton } from '@/components/Button';
import { ArrowLeft, ArrowRight, Coffee, Clock, CheckCircle } from 'lucide-react';

export default function HotelRoomSelectionPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const hotelId = searchParams.get('hotelId');
  const roomId = searchParams.get('roomId');
  const checkIn = searchParams.get('checkIn') || '';
  const nights = parseInt(searchParams.get('nights') || '2');
  const adults = parseInt(searchParams.get('adults') || '2');
  const children = parseInt(searchParams.get('children') || '0');
  const currency = searchParams.get('currency') || 'AUD';
  
  const [selectedRoom, setSelectedRoom] = useState<HotelRoom | null>(null);
  const [numberOfRooms, setNumberOfRooms] = useState(1);
  const [extras, setExtras] = useState<HotelExtras>({
    breakfast: { selected: false, pricePerPerson: HOTEL_EXTRAS_PRICING.breakfast.perPerson, currency },
    lateCheckout: { selected: false, price: HOTEL_EXTRAS_PRICING.lateCheckout.standard, currency },
  });
  
  useEffect(() => {
    if (hotelId && roomId) {
      // Load hotel and find the selected room
      const hotel = generateDemoHotelDetails('Ecovira Luxury Hotel', 'Melbourne', currency);
      const room = hotel.rooms.find(r => r.id === roomId);
      if (room) {
        setSelectedRoom(room);
        // If room includes breakfast, don't show breakfast extra
        if (room.mealPlan === 'breakfast-included') {
          setExtras(prev => ({ ...prev, breakfast: { ...prev.breakfast!, selected: false } }));
        }
      }
    }
  }, [hotelId, roomId, currency]);
  
  const handleBreakfastToggle = () => {
    if (selectedRoom?.mealPlan === 'breakfast-included') return; // Can't add breakfast if already included
    setExtras(prev => ({
      ...prev,
      breakfast: { ...prev.breakfast!, selected: !prev.breakfast?.selected },
    }));
  };
  
  const handleLateCheckoutToggle = () => {
    setExtras(prev => ({
      ...prev,
      lateCheckout: { ...prev.lateCheckout!, selected: !prev.lateCheckout?.selected },
    }));
  };
  
  const calculateTotal = () => {
    if (!selectedRoom) return 0;
    
    const roomTotal = selectedRoom.pricePerNight * nights * numberOfRooms;
    const breakfastTotal = extras.breakfast?.selected 
      ? extras.breakfast.pricePerPerson * (adults + children) * nights
      : 0;
    const lateCheckoutTotal = extras.lateCheckout?.selected ? extras.lateCheckout.price : 0;
    
    return roomTotal + breakfastTotal + lateCheckoutTotal;
  };
  
  const handleContinue = () => {
    if (!hotelId || !selectedRoom) return;
    
    // Store selection in sessionStorage
    sessionStorage.setItem('hotelBookingSelection', JSON.stringify({
      room: selectedRoom,
      numberOfRooms,
      adults,
      children,
      extras,
    }));
    
    router.push(`/checkout/stay?hotelId=${hotelId}&checkIn=${checkIn}&nights=${nights}&currency=${currency}`);
  };
  
  const handleBack = () => {
    router.back();
  };
  
  if (!selectedRoom) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-ec-text mb-4">Room Not Found</h1>
          <p className="text-ec-muted mb-6">Unable to load room details.</p>
          <button
            onClick={handleBack}
            className="px-6 py-3 rounded-full bg-gradient-to-br from-[rgba(28,140,130,0.4)] to-[rgba(28,140,130,0.3)] border border-[rgba(28,140,130,0.5)] text-ec-text font-semibold"
          >
            Back
          </button>
        </div>
      </div>
    );
  }
  
  const total = calculateTotal();
  const roomTotal = selectedRoom.pricePerNight * nights * numberOfRooms;
  const breakfastTotal = extras.breakfast?.selected 
    ? extras.breakfast.pricePerPerson * (adults + children) * nights
    : 0;
  const lateCheckoutTotal = extras.lateCheckout?.selected ? extras.lateCheckout.price : 0;
  
  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-ec-muted hover:text-ec-text transition-colors mb-6"
      >
        <ArrowLeft size={18} />
        Back
      </button>
      
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-serif font-semibold text-ec-text mb-4">
          Customize Your Stay
        </h1>
        <p className="text-ec-muted text-lg">Select number of rooms and optional extras</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Selected Room Info */}
          <div className="ec-card p-6 md:p-8">
            <h2 className="text-xl font-semibold text-ec-text mb-4">Selected Room</h2>
            <div className="p-4 bg-[rgba(28,140,130,0.1)] rounded-ec-md border border-[rgba(28,140,130,0.2)]">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-ec-text mb-2">{selectedRoom.name}</h3>
                  <div className="text-sm text-ec-muted mb-2">
                    {selectedRoom.bedType} • Up to {selectedRoom.maxOccupancy} guests
                  </div>
                  <div className="text-sm text-ec-muted">
                    Meal Plan: {selectedRoom.mealPlan === 'room-only' ? 'Room Only' : 
                               selectedRoom.mealPlan === 'breakfast-included' ? 'Breakfast Included' :
                               selectedRoom.mealPlan === 'half-board' ? 'Half Board' : 'Full Board'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-ec-text">{currency} {selectedRoom.pricePerNight}</div>
                  <div className="text-sm text-ec-muted">per night</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Number of Rooms */}
          <div className="ec-card p-6 md:p-8">
            <h2 className="text-xl font-semibold text-ec-text mb-4">Number of Rooms</h2>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setNumberOfRooms(Math.max(1, numberOfRooms - 1))}
                className="w-10 h-10 rounded-full border-2 border-[rgba(28,140,130,0.5)] bg-transparent hover:bg-[rgba(28,140,130,0.1)] transition-colors text-ec-text font-semibold"
              >
                −
              </button>
              <div className="text-2xl font-semibold text-ec-text min-w-[3rem] text-center">{numberOfRooms}</div>
              <button
                type="button"
                onClick={() => setNumberOfRooms(numberOfRooms + 1)}
                className="w-10 h-10 rounded-full border-2 border-[rgba(28,140,130,0.5)] bg-transparent hover:bg-[rgba(28,140,130,0.1)] transition-colors text-ec-text font-semibold"
              >
                +
              </button>
              <div className="text-sm text-ec-muted">room{numberOfRooms > 1 ? 's' : ''}</div>
            </div>
          </div>
          
          {/* Extras */}
          <div className="ec-card p-6 md:p-8">
            <h2 className="text-xl font-semibold text-ec-text mb-4">Optional Extras</h2>
            
            <div className="space-y-4">
              {/* Breakfast (if not included) */}
              {selectedRoom.mealPlan !== 'breakfast-included' && (
                <button
                  type="button"
                  onClick={handleBreakfastToggle}
                  className={`w-full p-4 rounded-ec-md border-2 transition-all text-left ${
                    extras.breakfast?.selected
                      ? 'bg-[rgba(28,140,130,0.15)] border-ec-teal'
                      : 'bg-[rgba(15,17,20,0.4)] border-[rgba(28,140,130,0.25)] hover:border-[rgba(28,140,130,0.45)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={extras.breakfast?.selected || false}
                        onChange={handleBreakfastToggle}
                        className="mt-1 w-4 h-4 text-ec-teal focus:ring-ec-teal rounded"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Coffee size={18} className="text-ec-teal" />
                          <div className="text-ec-text font-semibold">Breakfast</div>
                        </div>
                        <div className="text-xs text-ec-muted">
                          {currency} {extras.breakfast?.pricePerPerson || 0} per person per night
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-ec-text font-semibold">
                        {currency} {(extras.breakfast?.pricePerPerson || 0) * (adults + children) * nights}
                      </div>
                      <div className="text-xs text-ec-muted">total</div>
                    </div>
                  </div>
                </button>
              )}
              
              {/* Late Check-out */}
              <button
                type="button"
                onClick={handleLateCheckoutToggle}
                className={`w-full p-4 rounded-ec-md border-2 transition-all text-left ${
                  extras.lateCheckout?.selected
                    ? 'bg-[rgba(28,140,130,0.15)] border-ec-teal'
                    : 'bg-[rgba(15,17,20,0.4)] border-[rgba(28,140,130,0.25)] hover:border-[rgba(28,140,130,0.45)]'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={extras.lateCheckout?.selected || false}
                      onChange={handleLateCheckoutToggle}
                      className="mt-1 w-4 h-4 text-ec-teal focus:ring-ec-teal rounded"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock size={18} className="text-ec-teal" />
                        <div className="text-ec-text font-semibold">Late Check-out</div>
                      </div>
                      <div className="text-xs text-ec-muted">
                        Check-out until 14:00 instead of 11:00
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-ec-text font-semibold">
                      {currency} {extras.lateCheckout?.price || 0}
                    </div>
                    <div className="text-xs text-ec-muted">one-time</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
        
        {/* Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="ec-card p-6 sticky top-32">
            <h2 className="text-xl font-semibold text-ec-text mb-6">Booking Summary</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <div className="text-sm text-ec-muted mb-2">Room</div>
                <div className="text-sm text-ec-text font-medium">{selectedRoom.name}</div>
                <div className="text-sm text-ec-muted">
                  {numberOfRooms} room{numberOfRooms > 1 ? 's' : ''} × {nights} night{nights > 1 ? 's' : ''}
                </div>
                <div className="text-sm text-ec-text font-semibold mt-1">
                  {currency} {roomTotal.toFixed(2)}
                </div>
              </div>
              
              {extras.breakfast?.selected && (
                <div>
                  <div className="text-sm text-ec-muted mb-2">Breakfast</div>
                  <div className="text-sm text-ec-text font-semibold">
                    {currency} {breakfastTotal.toFixed(2)}
                  </div>
                </div>
              )}
              
              {extras.lateCheckout?.selected && (
                <div>
                  <div className="text-sm text-ec-muted mb-2">Late Check-out</div>
                  <div className="text-sm text-ec-text font-semibold">
                    {currency} {lateCheckoutTotal.toFixed(2)}
                  </div>
                </div>
              )}
            </div>
            
            <div className="pt-4 border-t border-[rgba(28,140,130,0.15)]">
              <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-semibold text-ec-text">Total</div>
                <div className="text-2xl font-bold text-ec-text">
                  {currency} {total.toFixed(2)}
                </div>
              </div>
              
              <EcoviraButton
                onClick={handleContinue}
                className="w-full"
              >
                Continue to Checkout
                <ArrowRight size={18} className="ml-2" />
              </EcoviraButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

