"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FlightResult } from "@/lib/core/types";
import { EcoviraButton } from "../../components/Button";
import { Input } from "../../components/Input";
import { EcoviraCard } from "../../components/EcoviraCard";
import { FlightResultCard } from "../../components/FlightResultCard";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<FlightResult[]>([]);

  const handleSearch = async () => {
    setLoading(true);
    setError("");
    setResults([]);
    try {
      const url = `/api/flights/search?from=${from}&to=${to}&departDate=${departDate}&adults=${adults}&cabinClass=${cabinClass}`;
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
    <main className="min-h-screen relative">
      {/* Premium Background with Gradient + Radial Glows */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0D10] via-[#0F1114] to-[#07080A]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(28,140,130,0.18),transparent_45%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_45%,rgba(200,162,77,0.10),transparent_40%)]"></div>
      </div>

      {/* Hero Section */}
      <section className="relative z-10 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-6 md:px-10 py-20 md:py-28">
          <div className="max-w-4xl mx-auto text-center">
            <EcoviraCard variant="glass" className="inline-block px-6 py-2 mb-6">
              <div className="text-ec-gold text-xs font-medium uppercase tracking-[0.15em]">
                Ecovira Air
              </div>
            </EcoviraCard>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-semibold text-ec-text mb-8 leading-tight">
              Luxury flights,<br />
              <span className="text-ec-teal">curated in seconds</span>
            </h1>
            <p className="text-xl md:text-2xl text-ec-muted mb-12 max-w-2xl mx-auto leading-relaxed font-light">
              Discover premium airlines with live pricing and concierge support.
            </p>
            <div className="flex flex-wrap justify-center gap-8 md:gap-12">
              <div className="flex flex-col items-center">
                <div className="w-1 h-1 rounded-full bg-ec-teal mb-2"></div>
                <span className="text-sm text-ec-muted uppercase tracking-wider">Live pricing</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-1 h-1 rounded-full bg-ec-teal mb-2"></div>
                <span className="text-sm text-ec-muted uppercase tracking-wider">Secure checkout</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-1 h-1 rounded-full bg-ec-teal mb-2"></div>
                <span className="text-sm text-ec-muted uppercase tracking-wider">Concierge support</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="relative z-10 -mt-12 md:-mt-16">
        <div className="max-w-7xl mx-auto px-6 md:px-10 pb-20">
          <EcoviraCard variant="glass" className="p-8 md:p-10 mb-12">
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-serif font-semibold text-ec-text mb-2">
                Search Flights
              </h2>
              <p className="text-ec-muted text-sm md:text-base">
                Enter your travel details below
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
              <div className="md:col-span-2 lg:col-span-1">
                <div>
                  <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-3">
                    From
                  </label>
                  <Input 
                    value={from} 
                    onChange={e => setFrom(e.target.value)} 
                    placeholder="MEL" 
                    className="text-ec-text" 
                  />
                </div>
              </div>
              <div className="md:col-span-2 lg:col-span-1">
                <div>
                  <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-3">
                    To
                  </label>
                  <Input 
                    value={to} 
                    onChange={e => setTo(e.target.value)} 
                    placeholder="SYD" 
                    className="text-ec-text" 
                  />
                </div>
              </div>
              <div className="md:col-span-2 lg:col-span-1">
                <div>
                  <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-3">
                    Departure
                  </label>
                  <Input 
                    type="date" 
                    value={departDate} 
                    onChange={e => setDepartDate(e.target.value)} 
                    className="text-ec-text" 
                  />
                </div>
              </div>
              <div className="md:col-span-1 lg:col-span-1">
                <div>
                  <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-3">
                    Adults
                  </label>
                  <Input 
                    type="number" 
                    value={adults} 
                    onChange={e => setAdults(parseInt(e.target.value))} 
                    min="1" 
                    className="text-ec-text" 
                  />
                </div>
              </div>
              <div className="md:col-span-1 lg:col-span-1">
                <div>
                  <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-3">
                    Class
                  </label>
                  <select
                    value={cabinClass}
                    onChange={e => setCabinClass(e.target.value)}
                    className="w-full h-[48px] md:h-[52px] px-4 bg-[rgba(15,17,20,0.55)] border border-[rgba(255,255,255,0.10)] rounded-ec-md text-ec-text focus:outline-none focus:border-[rgba(28,140,130,0.55)] focus:shadow-[0_0_0_4px_rgba(28,140,130,0.18)] transition-all cursor-pointer"
                  >
                    <option value="economy" className="bg-ec-bg-2">Economy</option>
                    <option value="premium_economy" className="bg-ec-bg-2">Premium Economy</option>
                    <option value="business" className="bg-ec-bg-2">Business</option>
                    <option value="first" className="bg-ec-bg-2">First</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="mt-10 flex justify-center">
              <EcoviraButton 
                onClick={handleSearch} 
                disabled={loading} 
                size="lg" 
                className="px-16 py-5 text-lg font-semibold tracking-wide min-w-[240px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Searching...' : 'Search Flights →'}
              </EcoviraButton>
            </div>
          </EcoviraCard>

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
                <div className="text-4xl mb-6" style={{ color: 'rgba(139, 46, 46, 0.7)' }}>⚠️</div>
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
            <EcoviraCard variant="glass" className="mt-12">
              <div className="text-center py-16 md:py-20 px-6">
                <div className="text-7xl mb-8">✈️</div>
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
            <div className="mt-12 space-y-6">
              <div className="mb-8">
                <h2 className="text-2xl md:text-3xl font-serif font-semibold text-ec-text mb-2">
                  Available Flights
                </h2>
                <p className="text-ec-muted text-sm md:text-base">
                  {results.length} {results.length === 1 ? 'flight' : 'flights'} found
                </p>
              </div>
              {results.map((flight, i) => (
                <FlightResultCard key={i} flight={flight} />
              ))}
            </div>
          )}

          <div className="mt-16 flex justify-center">
            <EcoviraButton 
              variant="ghost" 
              onClick={() => router.push('/')}
              size="md"
            >
              ← Back to home
            </EcoviraButton>
          </div>
        </div>
      </section>
    </main>
  );
}