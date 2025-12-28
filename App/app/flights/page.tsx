"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FlightResult } from "@/lib/core/types";
import { EcoviraButton } from "../../components/Button";
import { Input } from "../../components/Input";
import { EcoviraCard } from "../../components/EcoviraCard";
import { FlightResultCard } from "../../components/FlightResultCard";
import { DatePicker } from "../../components/DatePicker";
import { CurrencySelector } from "../../components/CurrencySelector";
import { useCurrency } from "../../contexts/CurrencyContext";

function SkeletonLoader() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-5 bg-ec-teal-border/20 rounded-lg w-3/4"></div>
      <div className="h-4 bg-ec-teal-border/10 rounded-lg w-1/2"></div>
      <div className="h-4 bg-ec-teal-border/10 rounded-lg w-2/3"></div>
    </div>
  );
}

export default function Flights() {
  const router = useRouter();
  const [from, setFrom] = useState("MEL");
  const [to, setTo] = useState("SYD");
  const [departDate, setDepartDate] = useState("2026-01-15");
  const [adults, setAdults] = useState(1);
  const [cabinClass, setCabinClass] = useState("economy");
  const { currency, setCurrency } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<FlightResult[]>([]);

  const handleSearch = async () => {
    setLoading(true);
    setError("");
    setResults([]);
    try {
      const url = `/api/flights/search?from=${from}&to=${to}&departDate=${departDate}&adults=${adults}&cabinClass=${cabinClass}&currency=${currency}`;
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
          Search Flights
        </h1>
        <p className="text-ec-muted text-xl md:text-2xl mt-4">
          Enter your travel details below
        </p>
      </div>

      {/* Engine Search Card - Horizontal Layout */}
      <div className="ec-card mb-20">
        {/* Single Row: All Fields Horizontally */}
        <div className="ec-grid-6 mb-8">
          <div>
            <label>From</label>
            <Input 
              value={from} 
              onChange={e => setFrom(e.target.value)} 
              placeholder="MEL" 
            />
          </div>
          <div>
            <label>To</label>
            <Input 
              value={to} 
              onChange={e => setTo(e.target.value)} 
              placeholder="SYD" 
            />
          </div>
          <div>
            <DatePicker
              value={departDate}
              onChange={setDepartDate}
              placeholder="Select departure date"
              label="Departure"
            />
          </div>
          <div>
            <DatePicker
              value=""
              onChange={() => {}}
              placeholder="Select return date"
              label="Return"
            />
          </div>
          <div>
            <label>Passengers</label>
            <Input 
              type="number" 
              value={adults} 
              onChange={e => setAdults(parseInt(e.target.value))} 
              min="1" 
            />
          </div>
          <div>
            <label>Cabin Class</label>
            <select
              value={cabinClass}
              onChange={e => setCabinClass(e.target.value)}
            >
              <option value="economy">Economy</option>
              <option value="premium_economy">Premium Economy</option>
              <option value="business">Business</option>
              <option value="first">First</option>
            </select>
          </div>
        </div>

        {/* Row 2: Currency + CTA */}
        <div className="flex items-end justify-between gap-6">
          <div className="flex-1 max-w-[300px]">
            <CurrencySelector
              value={currency}
              onChange={setCurrency}
              showCrypto={true}
            />
          </div>
          <div className="flex-shrink-0">
            <EcoviraButton 
              onClick={handleSearch} 
              disabled={loading} 
              size="lg"
              className="min-w-[320px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Searching...' : 'Search Flights →'}
            </EcoviraButton>
          </div>
        </div>
      </div>

          {loading && (
            <div className="space-y-6 mt-12">
              {[...Array(3)].map((_, i) => (
                <EcoviraCard key={i} variant="glass" className="p-8 md:p-10">
                  <SkeletonLoader />
                </EcoviraCard>
              ))}
            </div>
          )}

          {error && (
            <EcoviraCard variant="glass" className="mt-12">
              <div className="text-center py-12 md:py-16 px-6">
                <div className="text-4xl mb-6 text-ec-gold">⚠</div>
                <h3 className="text-2xl md:text-3xl font-serif font-semibold text-ec-text mb-4">
                  Concierge Notice
                </h3>
                <p className="text-lg text-ec-muted mb-8 max-w-xl mx-auto leading-relaxed">
                  We can't reach the flight engine right now. Please try again in a moment. If the issue persists, contact concierge support.
                </p>
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                  <EcoviraButton 
                    variant="primary" 
                    onClick={() => setError("")}
                    size="lg"
                    className="px-8 h-[52px]"
                  >
                    Retry
                  </EcoviraButton>
                  <EcoviraButton 
                    variant="secondary" 
                    onClick={() => router.push('/')}
                    size="lg"
                    className="px-8 h-[52px]"
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
            <EcoviraCard variant="glass" className="mt-12">
              <div className="text-center py-16 md:py-20 px-6">
                <div className="text-6xl mb-8 text-ec-muted font-light">Ready</div>
                <h3 className="text-2xl md:text-3xl font-serif font-semibold text-ec-text mb-4">
                  No flights found
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
              </div>
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
                    {results.length} {results.length === 1 ? 'flight' : 'flights'} found
                  </p>
                </div>
                <select className="h-11 px-4 bg-ec-card border border-[rgba(255,255,255,0.10)] rounded-ec-md text-ec-text text-sm focus:outline-none focus:border-[rgba(28,140,130,0.55)] cursor-pointer">
                  <option value="price" className="bg-ec-bg-2">Sort by Price</option>
                  <option value="duration" className="bg-ec-bg-2">Sort by Duration</option>
                  <option value="departure" className="bg-ec-bg-2">Sort by Departure</option>
                </select>
              </div>
              <div className="space-y-6">
                {results.map((flight, i) => (
                  <FlightResultCard key={i} flight={flight} />
                ))}
              </div>
            </div>
          )}

    </>
  );
}