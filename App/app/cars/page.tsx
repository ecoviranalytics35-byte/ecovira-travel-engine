"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { CarResult } from "@/lib/core/types";
import { Input } from '../../components/Input';
import { DatePicker } from '../../components/DatePicker';
import { CurrencySelector } from '../../components/CurrencySelector';
import { useCurrency } from '../../contexts/CurrencyContext';
import { ResultsList } from '../../components/results/ResultsList';
import { CarResultCard } from '../../components/results/CarResultCard';
import { FloatingAiAssist } from '../../components/ai/FloatingAiAssist';
import { TestModeBanner } from '../../components/ui/TestModeBanner';
import { getCoordinates } from '@/lib/utils/geocoding';
import { SearchPanelSkeleton } from '../../components/search/SearchPanelSkeleton';
import { useBookingStore } from "@/stores/bookingStore";
import { useEvent } from "@/lib/hooks/useEvent";

// Client-only SearchPanelShell (no SSR to prevent hydration errors from browser extensions)
const SearchPanelShellClient = dynamic(
  () => import('../../components/search/SearchPanelShell.client'),
  { 
    ssr: false,
    loading: () => <SearchPanelSkeleton />
  }
);

function SkeletonLoader() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-5 bg-[rgba(28,140,130,0.1)] rounded-lg w-3/4"></div>
      <div className="h-4 bg-[rgba(28,140,130,0.05)] rounded-lg w-1/2"></div>
    </div>
  );
}

export default function Cars() {
  const router = useRouter();
  const { currency, setCurrency } = useCurrency();
  const setSelectedOffer = useBookingStore((state) => state.setSelectedOffer);
  const [pickupLocation, setPickupLocation] = useState("Melbourne");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("10:00");
  const [returnDate, setReturnDate] = useState("");
  const [returnTime, setReturnTime] = useState("10:00");
  const [driverAge, setDriverAge] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<CarResult[]>([]);
  const [selectedCar, setSelectedCar] = useState<CarResult | null>(null);

  const handleSearch = async () => {
    setLoading(true);
    setError("");
    setResults([]);
    try {
      const coords = getCoordinates(pickupLocation);
      if (!coords) {
        setError("Please enter a valid city or airport code");
        setLoading(false);
        return;
      }

      if (!pickupDate || !returnDate) {
        setError("Please select both pickup and return dates");
        setLoading(false);
        return;
      }

      const params = new URLSearchParams({
        pickupLat: coords.lat.toString(),
        pickupLng: coords.lng.toString(),
        pickupDate,
        pickupTime,
        dropoffDate: returnDate,
        dropoffTime: returnTime,
        driverAge: driverAge.toString(),
        currency: currency || 'AUD',
      });
      const url = `/api/transport/cars/search?${params.toString()}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.errors && data.errors.length > 0) {
        setError(data.errors[0]);
        setResults([]);
      } else {
        setResults(data.results || []);
        setError("");
      }
    } catch (err) {
      setError("We encountered a network issue. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle car selection - navigate to driver information page
  const handleSelectCar = useCallback((car: CarResult) => {
    try {
      // Store selected car in booking store
      setSelectedOffer(car);
      
      const params = new URLSearchParams({
        carId: car.id,
        ...(pickupDate && { pickupDate }),
        ...(returnDate && { returnDate }),
        ...(pickupTime && { pickupTime }),
        ...(returnTime && { returnTime }),
        ...(driverAge && { driverAge: driverAge.toString() }),
        ...(currency && { currency }),
      });
      // Navigate to driver information page
      const driverUrl = `/book/car-driver?${params.toString()}`;
      router.push(driverUrl);
    } catch (err) {
      console.error("[handleSelectCar] ERROR", err);
    }
  }, [router, pickupDate, returnDate, pickupTime, returnTime, driverAge, currency, setSelectedOffer]);
  
  const onSelectCar = useEvent(handleSelectCar);

  return (
    <>
      {/* Page Title */}
      <div className="mb-16 md:mb-20 lg:mb-24">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-semibold text-ec-text mb-6">
          Search Cars
        </h1>
        <p className="text-ec-muted text-xl md:text-2xl mt-4">
          Premium car rentals with concierge support
        </p>
      </div>

      {/* Test Mode Banner */}
      <TestModeBanner />

      {/* Engine Search Card - Structured Layout (Client-only to prevent hydration errors) */}
      <SearchPanelShellClient
        ctaLabel="Search Cars →"
        onSearch={handleSearch}
        loading={loading}
      >
        {/* Row 1: Pickup Location | Pickup Date */}
        <div className="ec-grid-2 mb-6">
          <div>
            <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-3">
              Pickup Location
            </label>
            <Input 
              value={pickupLocation} 
              onChange={e => setPickupLocation(e.target.value)} 
              placeholder="City or Airport (e.g., Melbourne, MEL)" 
            />
          </div>
          <DatePicker
            value={pickupDate}
            onChange={setPickupDate}
            placeholder="Select pickup date"
            label="Pickup Date"
          />
        </div>

        {/* Row 2: Return Date | Pickup Time | Return Time */}
        <div className="ec-grid-3 mb-6">
          <DatePicker
            value={returnDate}
            onChange={setReturnDate}
            placeholder="Select return date"
            label="Return Date"
          />
          <div>
            <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-3">
              Pickup Time
            </label>
            <Input 
              type="time" 
              value={pickupTime} 
              onChange={e => setPickupTime(e.target.value)} 
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-3">
              Return Time
            </label>
            <Input 
              type="time" 
              value={returnTime} 
              onChange={e => setReturnTime(e.target.value)} 
            />
          </div>
        </div>

        {/* Row 3: Driver Age | Currency */}
        <div className="ec-grid-2 mb-6">
          <div>
            <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-3">
              Driver Age
            </label>
            <Input 
              type="number" 
              value={driverAge} 
              onChange={e => setDriverAge(parseInt(e.target.value) || 30)} 
              placeholder="25+" 
            />
          </div>
          <CurrencySelector
            value={currency}
            onChange={setCurrency}
            showCrypto={true}
          />
        </div>
      </SearchPanelShellClient>

      {/* Error Message */}
      {error && (
        <div className="mt-8 p-4 bg-[rgba(220,38,38,0.15)] border border-[rgba(220,38,38,0.3)] rounded-ec-md text-ec-text">
          {error}
        </div>
      )}

      {/* Results */}
      {loading && (
        <div className="mt-12 space-y-4">
          <SkeletonLoader />
          <SkeletonLoader />
          <SkeletonLoader />
        </div>
      )}

      {!loading && results.length > 0 && (
        <>
          <ResultsList
            title="Car Rental Results"
            count={results.length}
            countLabel="cars found"
          >
            {results.map((car) => (
              <CarResultCard
                key={car.id}
                car={car}
                onSelect={(c) => {
                  setSelectedCar(c);
                  handleSelectCar(c);
                }}
              />
            ))}
          </ResultsList>
          <FloatingAiAssist
            type="cars"
            results={results}
            selectedCar={selectedCar}
            chatContext={{
              page: 'cars',
              currency,
              route: { from: pickupLocation, to: pickupLocation },
            }}
          />
        </>
      )}

      {!loading && results.length === 0 && !error && (
        <div className="mt-12 text-center py-16">
          <p className="text-lg text-ec-muted">
            Enter your search criteria above and click "Search Cars" to find available rentals.
          </p>
        </div>
      )}
    </>
  );
}

