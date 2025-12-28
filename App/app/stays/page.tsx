"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { StayResult } from "@/lib/core/types";
import { EcoviraButton } from "../../components/Button";
import { Input } from "../../components/Input";
import { EcoviraCard } from "../../components/EcoviraCard";
import { DatePicker } from "../../components/DatePicker";
import { CurrencySelector } from "../../components/CurrencySelector";
import { useCurrency } from "../../contexts/CurrencyContext";
import { SearchPanelShell } from "../../components/search/SearchPanelShell";
import { ResultsList } from "../../components/results/ResultsList";
import { StayResultCard } from "../../components/results/StayResultCard";

function SkeletonLoader() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-5 bg-[rgba(28,140,130,0.1)] rounded-lg w-3/4"></div>
      <div className="h-4 bg-[rgba(28,140,130,0.05)] rounded-lg w-1/2"></div>
    </div>
  );
}

export default function Stays() {
  const router = useRouter();
  const [city, setCity] = useState("Melbourne");
  const [checkIn, setCheckIn] = useState("2025-12-28");
  const [nights, setNights] = useState(2);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [roomType, setRoomType] = useState("double");
  const [classType, setClassType] = useState("standard");
  const { currency, setCurrency } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<StayResult[]>([]);

  const handleSearch = async () => {
    setLoading(true);
    setError("");
    setResults([]);
    try {
      const params = new URLSearchParams({
        city,
        checkIn,
        nights: nights.toString(),
        adults: adults.toString(),
        children: children.toString(),
        roomType,
        classType,
      });
      const url = `/api/stays/search?${params.toString()}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.errors && data.errors.length > 0) {
        setError(data.errors[0]);
        setResults([]);
      } else {
        setResults(data.results);
        setError("");
      }
    } catch (err) {
      setError("We encountered a network issue. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Page Title */}
      <div className="mb-16 md:mb-20 lg:mb-24">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-semibold text-ec-text mb-6">
          Search Stays
        </h1>
        <p className="text-ec-muted text-xl md:text-2xl mt-4">
          Enter your accommodation details below
        </p>
      </div>

      {/* Engine Search Card - Structured Layout */}
      <SearchPanelShell
        ctaLabel="Search Stays →"
        onSearch={handleSearch}
        loading={loading}
      >
        {/* Row 1: City | Check-in */}
        <div className="ec-grid-2 mb-6">
          <div>
            <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-3">
              City
            </label>
            <Input 
              value={city} 
              onChange={e => setCity(e.target.value)} 
              placeholder="Melbourne" 
            />
          </div>
          <DatePicker
            value={checkIn}
            onChange={setCheckIn}
            placeholder="Select check-in date"
            label="Check-in"
          />
        </div>

        {/* Row 2: Nights | Adults | Children */}
        <div className="ec-grid-3 mb-6">
          <div>
            <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-3">
              Nights
            </label>
            <Input 
              type="number" 
              value={nights} 
              onChange={e => setNights(parseInt(e.target.value) || 1)} 
              min="1" 
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-3">
              Adults
            </label>
            <Input 
              type="number" 
              value={adults} 
              onChange={e => setAdults(parseInt(e.target.value) || 1)} 
              min="1" 
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-3">
              Children
            </label>
            <Input 
              type="number" 
              value={children} 
              onChange={e => setChildren(parseInt(e.target.value) || 0)} 
              min="0" 
            />
          </div>
        </div>

        {/* Row 3: Room Type | Class | Currency */}
        <div className="ec-grid-3 mb-6">
          <div>
            <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-3">
              Room Type
            </label>
            <select
              value={roomType}
              onChange={e => setRoomType(e.target.value)}
              className="w-full h-[52px] px-4 bg-[rgba(15,17,20,0.55)] border border-[rgba(28,140,130,0.22)] rounded-ec-md text-ec-text focus:outline-none focus:border-[rgba(28,140,130,0.55)] focus:shadow-[0_0_0_4px_rgba(28,140,130,0.18)] transition-all"
            >
              <option value="single">Single</option>
              <option value="double">Double</option>
              <option value="suite">Suite</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-3">
              Class
            </label>
            <select
              value={classType}
              onChange={e => setClassType(e.target.value)}
              className="w-full h-[52px] px-4 bg-[rgba(15,17,20,0.55)] border border-[rgba(28,140,130,0.22)] rounded-ec-md text-ec-text focus:outline-none focus:border-[rgba(28,140,130,0.55)] focus:shadow-[0_0_0_4px_rgba(28,140,130,0.18)] transition-all"
            >
              <option value="standard">Standard</option>
              <option value="deluxe">Deluxe</option>
              <option value="luxury">Luxury</option>
            </select>
          </div>
          <CurrencySelector
            value={currency}
            onChange={setCurrency}
            showCrypto={true}
          />
        </div>
      </SearchPanelShell>

      {loading && (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <EcoviraCard key={i} variant="glass" className="p-6 md:p-8">
              <SkeletonLoader />
            </EcoviraCard>
          ))}
        </div>
      )}

      {error && (
        <EcoviraCard variant="glass" className="mb-8">
          <div className="text-center py-12 md:py-16 px-6">
            <h3 className="text-2xl md:text-3xl font-serif font-semibold text-ec-text mb-4">
              Concierge Notice
            </h3>
            <p className="text-lg text-ec-muted mb-8 max-w-xl mx-auto leading-relaxed">
              We can't reach the stays engine right now. Please try again in a moment. If the issue persists, contact concierge support.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <EcoviraButton 
                variant="primary" 
                onClick={() => setError("")}
                size="lg"
                className="px-8"
              >
                Retry
              </EcoviraButton>
              <EcoviraButton 
                variant="secondary" 
                onClick={() => router.push('/')}
                size="lg"
                className="px-8"
              >
                Back to Home
              </EcoviraButton>
            </div>
            <details className="mt-6 text-sm text-ec-dim">
              <summary className="cursor-pointer hover:text-ec-muted transition-colors px-4 py-2">
                Technical details
              </summary>
              <p className="mt-3 text-ec-muted max-w-md mx-auto text-left font-mono text-xs break-all">{error}</p>
            </details>
          </div>
        </EcoviraCard>
      )}

      {!loading && !error && results.length === 0 && (
        <EcoviraCard variant="glass" className="text-center py-12 md:py-16 px-6">
          <h3 className="text-2xl md:text-3xl font-serif font-semibold text-ec-text mb-4">
            No stays found
          </h3>
          <p className="text-lg text-ec-muted mb-8 max-w-md mx-auto">
            Try adjusting your search criteria or dates.
          </p>
          <EcoviraButton 
            variant="secondary" 
            onClick={() => setResults([])}
            size="lg"
            className="px-8 h-[52px]"
          >
            Search Again
          </EcoviraButton>
        </EcoviraCard>
      )}

      {results.length > 0 && (
        <ResultsList
          title="Results"
          count={results.length}
          countLabel={results.length === 1 ? 'stay' : 'stays'}
          sortOptions={[
            { value: 'price', label: 'Sort by Price' },
            { value: 'rating', label: 'Sort by Rating' },
          ]}
          onSortChange={(value) => {
            // TODO: Implement sorting
            console.log('Sort by:', value);
          }}
        >
          {results.map((stay, i) => (
            <StayResultCard key={i} stay={stay} />
          ))}
        </ResultsList>
      )}
    </>
  );
}
