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

      {/* Engine Search Card - Horizontal Layout */}
      <div className="ec-card mb-20">
        {/* Single Row: All Fields Horizontally */}
        <div className="ec-grid-6 mb-8">
          <div>
            <label>City</label>
            <Input 
              value={city} 
              onChange={e => setCity(e.target.value)} 
              placeholder="Melbourne" 
            />
          </div>
          <div>
            <DatePicker
              value={checkIn}
              onChange={setCheckIn}
              placeholder="Select check-in date"
              label="Check-in"
            />
          </div>
          <div>
            <label>Nights</label>
            <Input 
              type="number" 
              value={nights} 
              onChange={e => setNights(parseInt(e.target.value))} 
              min="1" 
            />
          </div>
          <div>
            <label>Adults</label>
            <Input 
              type="number" 
              value={adults} 
              onChange={e => setAdults(parseInt(e.target.value))} 
              min="1" 
            />
          </div>
          <div>
            <label>Children</label>
            <Input 
              type="number" 
              value={children} 
              onChange={e => setChildren(parseInt(e.target.value))} 
              min="0" 
            />
          </div>
          <div>
            <label>Room Type</label>
            <select
              value={roomType}
              onChange={e => setRoomType(e.target.value)}
            >
              <option value="single">Single</option>
              <option value="double">Double</option>
              <option value="suite">Suite</option>
            </select>
          </div>
        </div>

        {/* Row 2: Class + Currency + CTA */}
        <div className="flex items-end justify-between gap-6">
          <div className="flex gap-6 flex-1">
            <div className="flex-1 max-w-[200px]">
              <label>Class</label>
              <select
                value={classType}
                onChange={e => setClassType(e.target.value)}
              >
                <option value="standard">Standard</option>
                <option value="deluxe">Deluxe</option>
                <option value="luxury">Luxury</option>
              </select>
            </div>
            <div className="flex-1 max-w-[300px]">
              <CurrencySelector
                value={currency}
                onChange={setCurrency}
                showCrypto={true}
              />
            </div>
          </div>
          <div className="flex-shrink-0">
            <EcoviraButton 
              onClick={handleSearch} 
              disabled={loading} 
              size="lg"
              className="min-w-[320px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Searching...' : 'Search Stays →'}
            </EcoviraButton>
          </div>
        </div>
      </div>

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
            <div className="text-4xl mb-6 text-ec-gold">⚠</div>
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
        <EcoviraCard variant="glass" className="text-center py-16 md:py-20 px-6">
          <div className="text-6xl mb-8 text-ec-muted font-light">Ready</div>
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
            className="px-8"
          >
            Search Again
          </EcoviraButton>
        </EcoviraCard>
      )}

      {results.length > 0 && (
        <div className="mt-20">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-4xl md:text-5xl font-serif font-semibold text-ec-text mb-3">
                Results
              </h2>
              <p className="text-ec-muted text-lg">
                {results.length} {results.length === 1 ? 'stay' : 'stays'} found
              </p>
            </div>
            <select className="h-11 px-4 bg-ec-card border border-[rgba(255,255,255,0.10)] rounded-ec-md text-ec-text text-sm focus:outline-none focus:border-[rgba(28,140,130,0.55)] cursor-pointer">
              <option value="price" className="bg-ec-bg-2">Sort by Price</option>
              <option value="rating" className="bg-ec-bg-2">Sort by Rating</option>
            </select>
          </div>
          <div className="space-y-6">
            {results.map((stay, i) => (
              <EcoviraCard key={i} variant="glass" className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-ec-text mb-1">{stay.name}</h3>
                    <p className="text-ec-muted mb-2">{stay.city}</p>
                    <p className="text-sm text-ec-muted">
                      {stay.checkIn} • {stay.nights} nights • {stay.roomType} • {stay.classType}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-serif font-semibold text-ec-gold mb-1">
                      {stay.currency} {stay.total}
                    </div>
                    <p className="text-sm text-ec-muted">total</p>
                  </div>
                </div>
              </EcoviraCard>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
