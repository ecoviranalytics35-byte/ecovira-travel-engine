"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * DEPRECATED: This checkout page has been replaced by the unified checkout at /book/checkout
 * All products (flights, stays, cars, transfers) now use the unified checkout page.
 * This page redirects to maintain backward compatibility.
 */
export default function FlightCheckoutPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to unified checkout page
    router.replace('/book/checkout');
  }, [router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-ec-night">
      <div className="text-white text-center">
        <p className="text-lg mb-4">Redirecting to checkout...</p>
      </div>
    </div>
  );
  const [flightId, setFlightId] = useState<string | null>(null);
  const [cabinClass, setCabinClass] = useState<string>('economy');
  const [passengers, setPassengers] = useState<number>(1);
  const [currency, setCurrency] = useState<string>('AUD');
  const [extras, setExtras] = useState<BookingExtras | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const id = searchParams.get('flightId');
    const cabin = searchParams.get('cabinClass') || 'economy';
    const pax = parseInt(searchParams.get('passengers') || '1');
    const curr = searchParams.get('currency') || 'AUD';
    
    if (id) {
      setFlightId(id);
      setCabinClass(cabin);
      setPassengers(pax);
      setCurrency(curr);
      
      // Load extras from sessionStorage
      const storedExtras = sessionStorage.getItem('bookingExtras');
      if (storedExtras) {
        try {
          setExtras(JSON.parse(storedExtras));
        } catch (e) {
          console.error('[Checkout] Failed to parse stored extras', e);
        }
      }
    } else {
      console.warn("[FlightCheckoutPage] No flightId in query params");
    }
  }, [searchParams]);

  const handleSubmit = async (data: {
    passengerEmail: string;
    passengerLastName: string;
    phoneNumber?: string;
    smsOptIn: boolean;
    passportNumber?: string;
    nationality?: string;
    passportExpiry?: string;
  }) => {
    if (!flightId) {
      console.error("[FlightCheckoutPage] Cannot proceed without flightId");
      return;
    }

    setLoading(true);
    try {
      // TODO: Create itinerary with extras and proceed to payment
      console.log("[FlightCheckoutPage] Submitting checkout", { 
        flightId, 
        extras, 
        paymentMethod,
        ...data 
      });
      
      // For demo mode, create demo booking
      const isDemo = sessionStorage.getItem('ecovira_demo_mode') === 'true';
      if (isDemo) {
        // Create demo booking
        const response = await fetch('/api/bookings/create-demo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            flightId,
            cabinClass,
            passengers,
            currency,
            extras,
            paymentMethod,
            ...data,
          }),
        });
        
        if (response.ok) {
          const { bookingId } = await response.json();
          router.push(`/booking/confirmation?bookingId=${bookingId}`);
          return;
        }
      }
      
      // For real bookings, proceed with payment intent creation
      // TODO: Implement real payment flow
      router.push('/flights');
    } catch (error) {
      console.error("[FlightCheckoutPage] Error", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateExtrasTotal = () => {
    if (!extras) return 0;
    const seatTotal = extras.seats.reduce((sum, seat) => sum + seat.price, 0);
    const baggageTotal = extras.baggage.checkedBags.reduce((sum, bag) => sum + bag.price, 0);
    const insuranceTotal = extras.insurance?.price || 0;
    return seatTotal + baggageTotal + insuranceTotal;
  };

  if (!flightId) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="rounded-ec-lg bg-ec-card border border-[rgba(28,140,130,0.22)] shadow-ec-card p-8">
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
      </div>
    );
  }

  const extrasTotal = calculateExtrasTotal();

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-serif font-semibold text-ec-text mb-4">
          Checkout
        </h1>
        <p className="text-ec-muted text-lg">Review and complete your flight booking</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Booking Summary */}
          <div className="ec-card p-6 md:p-8">
            <h2 className="text-xl font-semibold text-ec-text mb-4">Flight Details</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-ec-text">
                <Plane size={16} className="text-ec-teal" />
                <span>Flight ID: {flightId}</span>
              </div>
              <div className="text-ec-muted">Cabin: {cabinClass.charAt(0).toUpperCase() + cabinClass.slice(1)}</div>
              <div className="text-ec-muted">Passengers: {passengers}</div>
            </div>
          </div>

          {/* Extras Summary */}
          {extras && (
            <div className="ec-card p-6 md:p-8">
              <h2 className="text-xl font-semibold text-ec-text mb-4">Selected Extras</h2>
              <div className="space-y-4">
                {/* Seats */}
                {extras.seats.length > 0 && (
                  <div>
                    <div className="text-sm text-ec-muted mb-2">Seats</div>
                    <div className="space-y-1">
                      {extras.seats.map((seat, idx) => (
                        <div key={idx} className="flex justify-between text-sm text-ec-text">
                          <span>Seat {seat.seatNumber}</span>
                          <span>{currency} {seat.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Baggage */}
                <div>
                  <div className="text-sm text-ec-muted mb-2 flex items-center gap-2">
                    <Luggage size={14} />
                    Baggage
                  </div>
                  <div className="text-sm text-ec-text">Carry-on included</div>
                  {extras.baggage.checkedBags.length > 0 && (
                    <div className="space-y-1 mt-1">
                      {extras.baggage.checkedBags.map((bag, idx) => (
                        <div key={idx} className="flex justify-between text-sm text-ec-text">
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
                    <div className="text-sm text-ec-muted mb-2 flex items-center gap-2">
                      <Shield size={14} />
                      Insurance
                    </div>
                    <div className="flex justify-between text-sm text-ec-text">
                      <span>{extras.insurance.type === 'basic' ? 'Basic' : 'Premium'} Travel Insurance</span>
                      <span>{currency} {extras.insurance.price.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment Options */}
          <div className="ec-card p-6 md:p-8">
            <PaymentOptions
              selectedMethod={paymentMethod}
              onMethodChange={setPaymentMethod}
              currency={currency}
            />
          </div>

          {/* Passenger Details Form */}
          <div className="ec-card p-6 md:p-8">
            <CheckoutForm onSubmit={handleSubmit} loading={loading} requirePassport={true} />
          </div>
        </div>

        {/* Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="ec-card p-6 sticky top-32">
            <h2 className="text-xl font-semibold text-ec-text mb-6">Price Summary</h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm text-ec-text">
                <span>Flight</span>
                <span>—</span>
              </div>
              
              {extras && extrasTotal > 0 && (
                <div className="flex justify-between text-sm text-ec-text">
                  <span>Extras</span>
                  <span>{currency} {extrasTotal.toFixed(2)}</span>
                </div>
              )}
            </div>
            
            <div className="pt-4 border-t border-[rgba(28,140,130,0.15)]">
              <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-semibold text-ec-text">Total</div>
                <div className="text-2xl font-bold text-ec-text">
                  {currency} {extrasTotal.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

