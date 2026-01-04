"use client";

import { useState, useEffect, useRef } from 'react';
// Input component not needed - using native input
import { Plane } from 'lucide-react';

interface Airport {
  iataCode: string;
  name: string;
  city: string;
  country: string;
  displayName: string;
  fullDisplay: string;
}

interface AirportInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

export function AirportInput({ value, onChange, placeholder = "MEL", label }: AirportInputProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<Airport[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search - trigger on any query length (not just >= 2) to show results immediately
  useEffect(() => {
    if (query.length < 1) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/airports/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        const results = data.results || [];
        setResults(results);
        // Only open dropdown if we have results
        setIsOpen(results.length > 0);
      } catch (error) {
        console.error('[AirportInput] Search error:', error);
        setResults([]);
        setIsOpen(false);
      } finally {
        setLoading(false);
      }
    }, 200); // Reduced debounce for faster response

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (airport: Airport) => {
    setQuery(airport.iataCode);
    onChange(airport.iataCode);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toUpperCase();
    setQuery(newValue);
    onChange(newValue);
    // Don't force open here - let the search effect handle it based on results
  };

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-3">
          {label}
        </label>
      )}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-ec-muted">
          <Plane size={18} />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (query.length >= 1 && results.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          className="w-full pl-12 pr-4 bg-[rgba(15,17,20,0.55)] border border-[rgba(255,255,255,0.10)] rounded-ec-md text-ec-text placeholder-[rgba(237,237,237,0.45)] focus:outline-none focus:border-[rgba(28,140,130,0.55)] focus:shadow-[0_0_0_4px_rgba(28,140,130,0.18)] transition-all h-[48px] md:h-[52px]"
          style={{ color: '#EDEDED' }}
        />
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-ec-teal border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Dropdown Results - Chip/Bubble Style */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-[rgba(15,17,20,0.95)] backdrop-blur-xl border border-[rgba(28,140,130,0.3)] rounded-ec-md shadow-[0_8px_32px_rgba(0,0,0,0.6)] overflow-hidden">
          <div className="max-h-64 overflow-y-auto p-2">
            <div className="flex flex-wrap gap-2">
              {results.map((airport, index) => (
                <button
                  key={`${airport.iataCode}-${index}`}
                  type="button"
                  onClick={() => handleSelect(airport)}
                  className="px-4 py-2 bg-[rgba(28,140,130,0.15)] hover:bg-[rgba(28,140,130,0.25)] border border-[rgba(28,140,130,0.3)] hover:border-[rgba(28,140,130,0.5)] rounded-full text-ec-text transition-all flex items-center gap-2 group"
                >
                  <span className="font-semibold text-sm">{airport.iataCode}</span>
                  <span className="text-ec-muted text-xs hidden sm:inline">
                    {airport.city}
                  </span>
                  <span className="text-ec-muted text-xs opacity-75 hidden md:inline">
                    {airport.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

