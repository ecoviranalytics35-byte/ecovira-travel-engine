"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SeatSelector } from '@/components/booking/SeatSelector';
import { BaggageSelector } from '@/components/booking/BaggageSelector';
import { InsuranceSelector } from '@/components/booking/InsuranceSelector';
import type { BookingExtras, SeatSelection, BaggageSelection, InsuranceSelection } from '@/lib/core/booking-extras';
import { EcoviraButton } from '@/components/Button';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export default function BookingExtrasPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Get flight data from query params or sessionStorage
  const flightId = searchParams.get('flightId');
  const cabinClass = (searchParams.get('cabinClass') || 'economy') as 'economy' | 'business' | 'first';
  const passengerCount = parseInt(searchParams.get('passengers') || '1');
  const currency = searchParams.get('currency') || 'AUD';
  
  const [extras, setExtras] = useState<BookingExtras>({
    seats: [],
    baggage: {
      carryOn: true,
      checkedBags: [],
    },
    insurance: null,
  });
  
  const handleSeatsChange = (seats: SeatSelection[]) => {
    setExtras(prev => ({ ...prev, seats }));
  };
  
  const handleBaggageChange = (baggage: BaggageSelection) => {
    setExtras(prev => ({ ...prev, baggage }));
  };
  
  const handleInsuranceChange = (insurance: InsuranceSelection | null) => {
    setExtras(prev => ({ ...prev, insurance }));
  };
  
  const calculateTotal = () => {
    const seatTotal = extras.seats.reduce((sum, seat) => sum + seat.price, 0);
    const baggageTotal = extras.baggage.checkedBags.reduce((sum, bag) => sum + bag.price, 0);
    const insuranceTotal = extras.insurance?.price || 0;
    return seatTotal + baggageTotal + insuranceTotal;
  };
  
  const handleContinue = () => {
    if (!flightId) {
      router.push('/flights');
      return;
    }
    
    // Store extras in sessionStorage for checkout
    sessionStorage.setItem('bookingExtras', JSON.stringify(extras));
    
    // Navigate to checkout with flight ID
    router.push(`/checkout/flight?flightId=${flightId}&cabinClass=${cabinClass}&passengers=${passengerCount}&currency=${currency}`);
  };
  
  const handleBack = () => {
    router.back();
  };
  
  if (!flightId) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-ec-text mb-4">Flight Not Found</h1>
          <p className="text-ec-muted mb-6">No flight selected. Please select a flight from the search results.</p>
          <button
            onClick={() => router.push('/flights')}
            className="px-6 py-3 rounded-full bg-gradient-to-br from-[rgba(28,140,130,0.4)] to-[rgba(28,140,130,0.3)] border border-[rgba(28,140,130,0.5)] text-ec-text font-semibold"
          >
            Back to Flights
          </button>
        </div>
      </div>
    );
  }
  
  const total = calculateTotal();
  
  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <div className="mb-8">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-ec-muted hover:text-ec-text transition-colors mb-4"
        >
          <ArrowLeft size={18} />
          Back
        </button>
        <h1 className="text-4xl md:text-5xl font-serif font-semibold text-ec-text mb-4">
          Customize Your Trip
        </h1>
        <p className="text-ec-muted text-lg">Select seats, baggage, and optional insurance</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Seat Selection */}
          <div className="ec-card p-6 md:p-8">
            <SeatSelector
              cabinClass={cabinClass}
              passengerCount={passengerCount}
              currency={currency}
              onSeatsChange={handleSeatsChange}
              initialSeats={extras.seats}
            />
          </div>
          
          {/* Baggage Selection */}
          <div className="ec-card p-6 md:p-8">
            <BaggageSelector
              currency={currency}
              onBaggageChange={handleBaggageChange}
              initialBaggage={extras.baggage}
            />
          </div>
          
          {/* Insurance Selection */}
          <div className="ec-card p-6 md:p-8">
            <InsuranceSelector
              currency={currency}
              passengerCount={passengerCount}
              onInsuranceChange={handleInsuranceChange}
              initialInsurance={extras.insurance}
            />
          </div>
        </div>
        
        {/* Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="ec-card p-6 sticky top-32">
            <h2 className="text-xl font-semibold text-ec-text mb-6">Booking Summary</h2>
            
            <div className="space-y-4 mb-6">
              {/* Seats */}
              <div>
                <div className="text-sm text-ec-muted mb-2">Seats</div>
                {extras.seats.length > 0 ? (
                  <div className="space-y-1">
                    {extras.seats.map((seat, idx) => (
                      <div key={idx} className="text-sm text-ec-text flex justify-between">
                        <span>Seat {seat.seatNumber}</span>
                        <span>{currency} {seat.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-ec-muted">No seats selected</div>
                )}
              </div>
              
              {/* Baggage */}
              <div>
                <div className="text-sm text-ec-muted mb-2">Baggage</div>
                <div className="text-sm text-ec-text">Carry-on included</div>
                {extras.baggage.checkedBags.length > 0 && (
                  <div className="space-y-1 mt-1">
                    {extras.baggage.checkedBags.map((bag, idx) => (
                      <div key={idx} className="text-sm text-ec-text flex justify-between">
                        <span>{bag.type} checked bag</span>
                        <span>{currency} {bag.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Insurance */}
              {extras.insurance && (
                <div>
                  <div className="text-sm text-ec-muted mb-2">Insurance</div>
                  <div className="text-sm text-ec-text flex justify-between">
                    <span>{extras.insurance.type === 'basic' ? 'Basic' : 'Premium'} Travel Insurance</span>
                    <span>{currency} {extras.insurance.price.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="pt-4 border-t border-[rgba(28,140,130,0.15)]">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-semibold text-ec-text">Extras Total</div>
                <div className="text-lg font-semibold text-ec-text">
                  {currency} {total.toFixed(2)}
                </div>
              </div>
              
              <EcoviraButton
                onClick={handleContinue}
                disabled={loading}
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

