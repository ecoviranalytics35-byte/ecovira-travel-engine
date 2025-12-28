"use client";

import { useState } from "react";
import Link from "next/link";
import type { StayResult } from "@/lib/core/types";
import { EcoviraButton } from "../../components/Button";
import { Input } from "../../components/Input";
import { EcoviraCard } from "../../components/EcoviraCard";
import { EcoviraBadge } from "../../components/Badge";

function SkeletonLoader() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-ec-border rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-ec-border rounded w-1/2"></div>
    </div>
  );
}

export default function Stays() {
  const [city, setCity] = useState("Melbourne");
  const [checkIn, setCheckIn] = useState("2025-12-28");
  const [nights, setNights] = useState(2);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [roomType, setRoomType] = useState("double");
  const [classType, setClassType] = useState("standard");
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
    <main className="min-h-screen bg-ec-bg">
      {/* Hero Section */}
      <section className="bg-ec-night text-ec-bg py-16 md:py-20">
        <div className="max-w-4xl mx-auto text-center px-6">
          <div className="text-ec-gold text-sm font-medium uppercase tracking-wider mb-4">
            Ecovira Stays
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-semibold mb-6">
            Luxury stays, curated in seconds.
          </h1>
          <p className="text-lg text-ec-muted mb-8 max-w-2xl mx-auto">
            Discover premium hotels with live pricing and concierge support.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-ec-muted">
            <span>Live pricing</span>
            <span>Secure checkout</span>
            <span>Concierge support</span>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-6 md:px-10">

        <EcoviraCard className="mb-8 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <EcoviraCard variant="glass-hover" className="p-4">
                <label className="block text-xs font-medium text-ec-teal-primary uppercase tracking-wider mb-3">City</label>
                <Input value={city} onChange={e => setCity(e.target.value)} placeholder="Melbourne" className="bg-transparent border-0 text-ec-text-primary placeholder-ec-text-muted" />
              </EcoviraCard>
            </div>
            <div>
              <Card className="bg-ec-night/55 border-ec-gold/18 shadow-ec-1">
                <label className="block text-xs font-medium text-ec-ink-2 uppercase tracking-wider mb-3">Check-in</label>
                <Input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} className="bg-ec-surface border-0" />
              </Card>
            </div>
            <div>
              <Card className="bg-ec-night/55 border-ec-gold/18 shadow-ec-1">
                <label className="block text-xs font-medium text-ec-ink-2 uppercase tracking-wider mb-3">Nights</label>
                <Input type="number" value={nights} onChange={e => setNights(parseInt(e.target.value))} min="1" className="bg-ec-surface border-0" />
              </Card>
            </div>
            <div>
              <Card className="bg-ec-night/55 border-ec-gold/18 shadow-ec-1">
                <label className="block text-xs font-medium text-ec-ink-2 uppercase tracking-wider mb-3">Adults</label>
                <Input type="number" value={adults} onChange={e => setAdults(parseInt(e.target.value))} min="1" className="bg-ec-surface border-0" />
              </Card>
            </div>
            <div>
              <Card className="bg-ec-night/55 border-ec-gold/18 shadow-ec-1">
                <label className="block text-xs font-medium text-ec-ink-2 uppercase tracking-wider mb-3">Children</label>
                <Input type="number" value={children} onChange={e => setChildren(parseInt(e.target.value))} min="0" className="bg-ec-surface border-0" />
              </Card>
            </div>
            <div>
              <Card className="bg-ec-night/55 border-ec-gold/18 shadow-ec-1">
                <label className="block text-xs font-medium text-ec-ink-2 uppercase tracking-wider mb-3">Room Type</label>
                <select
                  value={roomType}
                  onChange={e => setRoomType(e.target.value)}
                  className="w-full px-4 py-3 bg-ec-surface border-0 rounded-ec-md text-ec-ink focus:outline-none focus:ring-2 focus:ring-ec-teal/20"
                >
                  <option value="single">Single</option>
                  <option value="double">Double</option>
                  <option value="suite">Suite</option>
                </select>
              </Card>
            </div>
            <div>
              <Card className="bg-ec-night/55 border-ec-gold/18 shadow-ec-1">
                <label className="block text-xs font-medium text-ec-ink-2 uppercase tracking-wider mb-3">Class</label>
                <select
                  value={classType}
                  onChange={e => setClassType(e.target.value)}
                  className="w-full px-4 py-3 bg-ec-surface border-0 rounded-ec-md text-ec-ink focus:outline-none focus:ring-2 focus:ring-ec-teal/20"
                >
                  <option value="standard">Standard</option>
                  <option value="deluxe">Deluxe</option>
                  <option value="luxury">Luxury</option>
                </select>
              </Card>
            </div>
            <div className="flex items-end">
              <EcoviraButton onClick={handleSearch} disabled={loading} size="lg" className="w-full px-8 py-4 text-lg">
                {loading ? 'Searching...' : 'Search Stays'} →
              </EcoviraButton>
            </div>
          </div>
        </EcoviraCard>

        {loading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <SkeletonLoader />
              </Card>
            ))}
          </div>
        )}

        {error && (
          <Card className="border-ec-error/20 bg-ec-error/5">
            <div className="text-center py-8">
              <div className="text-4xl mb-4">⚠️</div>
              <h3 className="text-xl font-serif font-medium text-ec-error mb-2">
                We can't reach the stays engine right now
              </h3>
              <p className="text-ec-muted mb-6">
                Please try again in a moment, or contact concierge support.
              </p>
              <div className="flex justify-center gap-4">
                <Button variant="secondary" onClick={() => setError("")}>
                  Retry
                </Button>
                <div className="text-sm text-ec-muted">
                  <div className="cursor-pointer hover:text-ec-ink" onClick={() => {}}>Technical details</div>
                  <p className="mt-2">{error}</p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {!loading && !error && results.length === 0 && (
          <Card>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏨</div>
              <h3 className="text-xl font-serif font-medium text-ec-ink mb-2">No stays available</h3>
              <p className="text-ec-muted mb-4">Try different dates or criteria.</p>
              <Button variant="secondary" onClick={() => setResults([])}>Search Again</Button>
            </div>
          </Card>
        )}

        {results.length > 0 && (
          <div className="space-y-4">
            {results.map((stay, i) => (
              <Card key={i} className="hover:shadow-ec-2 transition-shadow">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium text-ec-ink mb-1">{stay.name}</h3>
                    <div className="flex items-center gap-4 mb-2">
                      <span className="text-ec-ink-2">{stay.city}</span>
                      <Badge>{stay.provider}</Badge>
                    </div>
                    <p className="text-sm text-ec-muted">
                      {stay.checkIn} • {stay.nights} nights • {stay.roomType} • {stay.classType}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-serif font-semibold text-ec-gold">
                      {stay.currency} {stay.total}
                    </div>
                    <p className="text-sm text-ec-muted">total</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href="/" className="text-ec-teal hover:underline">Back to home</Link>
        </div>
      </div>
    </section>
    </main>
  );
}