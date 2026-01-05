"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * DEPRECATED: This checkout page has been replaced by the unified checkout at /book/checkout
 * All products (flights, stays, cars, transfers) now use the unified checkout page.
 * This page redirects to maintain backward compatibility.
 */
export default function StayCheckoutPage() {
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
  const [hotelId, setHotelId] = useState<string | null>(null);
  const [checkIn, setCheckIn] = useState<string>('');
  const [nights, setNights] = useState<number>(2);
  const [currency, setCurrency] = useState<string>('AUD');
  const [bookingSelection, setBookingSelection] = useState<HotelBookingSelection | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const id = searchParams.get('hotelId');
    const checkInDate = searchParams.get('checkIn') || '';
    const nightsCount = parseInt(searchParams.get('nights') || '2');
    const curr = searchParams.get('currency') || 'AUD';
    
    if (id) {
      setHotelId(id);
      setCheckIn(checkInDate);
      setNights(nightsCount);
      setCurrency(curr);
      
      // Load booking selection from sessionStorage
      const stored = sessionStorage.getItem('hotelBookingSelection');
      if (stored) {
        try {
          setBookingSelection(JSON.parse(stored));
        } catch (e) {
          console.error('[Checkout] Failed to parse stored selection', e);
        }
      }
    }
  }, [searchParams]);

  const handleSubmit = async (data: {
    passengerEmail: string;
    passengerLastName: string;
    phoneNumber?: string;
    smsOptIn: boolean;
  }) => {
    if (!hotelId || !bookingSelection) {
      console.error("[StayCheckoutPage] Cannot proceed without hotelId or booking selection");
      return;
    }

    setLoading(true);
    try {
      // For demo mode, create demo booking
      const isDemo = sessionStorage.getItem('ecovira_demo_mode') === 'true';
      if (isDemo) {
        const response = await fetch('/api/bookings/create-demo-stay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hotelId,
            checkIn,
            nights,
            currency,
            bookingSelection,
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
      
      // TODO: Implement real payment flow
      router.push('/stays');
    } catch (error) {
      console.error("[StayCheckoutPage] Error", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    if (!bookingSelection) return 0;
    
    const roomTotal = bookingSelection.room.pricePerNight * nights * bookingSelection.numberOfRooms;
    const breakfastTotal = bookingSelection.extras.breakfast?.selected 
      ? (bookingSelection.extras.breakfast.pricePerPerson * (bookingSelection.adults + bookingSelection.children) * nights)
      : 0;
    const lateCheckoutTotal = bookingSelection.extras.lateCheckout?.selected 
      ? bookingSelection.extras.lateCheckout.price 
      : 0;
    
    return roomTotal + breakfastTotal + lateCheckoutTotal;
  };

  if (!hotelId || !bookingSelection) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="ec-card p-8 text-center">
          <h1 className="text-2xl font-semibold text-ec-text mb-4">Booking Not Found</h1>
          <p className="text-ec-muted mb-6">No hotel or room selection found. Please select a hotel and room first.</p>
          <button
            onClick={() => router.push('/stays')}
            className="px-6 py-3 rounded-full bg-gradient-to-br from-[rgba(28,140,130,0.4)] to-[rgba(28,140,130,0.3)] border border-[rgba(28,140,130,0.5)] text-ec-text font-semibold"
          >
            Back to Stays
          </button>
        </div>
      </div>
    );
  }

  const total = calculateTotal();
  const roomTotal = bookingSelection.room.pricePerNight * nights * bookingSelection.numberOfRooms;
  const breakfastTotal = bookingSelection.extras.breakfast?.selected 
    ? (bookingSelection.extras.breakfast.pricePerPerson * (bookingSelection.adults + bookingSelection.children) * nights)
    : 0;
  const lateCheckoutTotal = bookingSelection.extras.lateCheckout?.selected 
    ? bookingSelection.extras.lateCheckout.price 
    : 0;

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-serif font-semibold text-ec-text mb-4">
          Checkout
        </h1>
        <p className="text-ec-muted text-lg">Review and complete your hotel booking</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hotel & Room Summary */}
          <div className="ec-card p-6 md:p-8">
            <h2 className="text-xl font-semibold text-ec-text mb-4">Booking Details</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-ec-text">
                <Hotel size={20} className="text-ec-teal" />
                <div>
                  <div className="text-sm text-ec-muted">Hotel</div>
                  <div className="font-semibold">Ecovira Luxury Hotel</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 text-ec-text">
                <Calendar size={20} className="text-ec-teal" />
                <div>
                  <div className="text-sm text-ec-muted">Check-in / Check-out</div>
                  <div className="font-semibold">
                    {checkIn ? new Date(checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'} - 
                    {checkIn ? new Date(new Date(checkIn).getTime() + nights * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                  </div>
                  <div className="text-sm text-ec-muted">{nights} night{nights > 1 ? 's' : ''}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 text-ec-text">
                <Users size={20} className="text-ec-teal" />
                <div>
                  <div className="text-sm text-ec-muted">Guests</div>
                  <div className="font-semibold">
                    {bookingSelection.adults} adult{bookingSelection.adults > 1 ? 's' : ''}
                    {bookingSelection.children > 0 && ` + ${bookingSelection.children} child${bookingSelection.children > 1 ? 'ren' : ''}`}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Room Selection Summary */}
          <div className="ec-card p-6 md:p-8">
            <h2 className="text-xl font-semibold text-ec-text mb-4">Selected Room</h2>
            <div className="p-4 bg-[rgba(28,140,130,0.1)] rounded-ec-md border border-[rgba(28,140,130,0.2)]">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-lg font-semibold text-ec-text mb-1">{bookingSelection.room.name}</div>
                  <div className="text-sm text-ec-muted">
                    {bookingSelection.numberOfRooms} room{bookingSelection.numberOfRooms > 1 ? 's' : ''} × {nights} night{nights > 1 ? 's' : ''}
                  </div>
                  <div className="text-sm text-ec-muted">
                    {bookingSelection.room.bedType} • {bookingSelection.room.mealPlan === 'room-only' ? 'Room Only' : 
                     bookingSelection.room.mealPlan === 'breakfast-included' ? 'Breakfast Included' :
                     bookingSelection.room.mealPlan === 'half-board' ? 'Half Board' : 'Full Board'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-ec-text">{currency} {roomTotal.toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Extras Summary */}
          {(bookingSelection.extras.breakfast?.selected || bookingSelection.extras.lateCheckout?.selected) && (
            <div className="ec-card p-6 md:p-8">
              <h2 className="text-xl font-semibold text-ec-text mb-4">Selected Extras</h2>
              <div className="space-y-3">
                {bookingSelection.extras.breakfast?.selected && (
                  <div className="flex items-center justify-between text-ec-text">
                    <div className="flex items-center gap-2">
                      <Coffee size={16} className="text-ec-teal" />
                      <span className="text-sm">Breakfast</span>
                    </div>
                    <span className="text-sm font-semibold">{currency} {breakfastTotal.toFixed(2)}</span>
                  </div>
                )}
                {bookingSelection.extras.lateCheckout?.selected && (
                  <div className="flex items-center justify-between text-ec-text">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-ec-teal" />
                      <span className="text-sm">Late Check-out</span>
                    </div>
                    <span className="text-sm font-semibold">{currency} {lateCheckoutTotal.toFixed(2)}</span>
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
            <CheckoutForm onSubmit={handleSubmit} loading={loading} />
          </div>
        </div>

        {/* Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="ec-card p-6 sticky top-32">
            <h2 className="text-xl font-semibold text-ec-text mb-6">Price Summary</h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm text-ec-text">
                <span>Room</span>
                <span>{currency} {roomTotal.toFixed(2)}</span>
              </div>
              
              {breakfastTotal > 0 && (
                <div className="flex justify-between text-sm text-ec-text">
                  <span>Breakfast</span>
                  <span>{currency} {breakfastTotal.toFixed(2)}</span>
                </div>
              )}
              
              {lateCheckoutTotal > 0 && (
                <div className="flex justify-between text-sm text-ec-text">
                  <span>Late Check-out</span>
                  <span>{currency} {lateCheckoutTotal.toFixed(2)}</span>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
