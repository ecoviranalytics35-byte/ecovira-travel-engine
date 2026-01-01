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

  // Debounce search
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/airports/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results || []);
        setIsOpen(true);
      } catch (error) {
        console.error('[AirportInput] Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

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
    if (newValue.length >= 2) {
      setIsOpen(true);
    }
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
          onFocus={() => query.length >= 2 && setIsOpen(true)}
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

      {/* Dropdown Results */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-[rgba(15,17,20,0.95)] backdrop-blur-xl border border-[rgba(28,140,130,0.3)] rounded-ec-md shadow-[0_8px_32px_rgba(0,0,0,0.6)] overflow-hidden">
          <div className="max-h-64 overflow-y-auto">
            {results.map((airport, index) => (
              <button
                key={`${airport.iataCode}-${index}`}
                type="button"
                onClick={() => handleSelect(airport)}
                className="w-full px-4 py-3 text-left hover:bg-[rgba(28,140,130,0.15)] transition-colors border-b border-[rgba(28,140,130,0.1)] last:border-b-0"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-ec-text font-semibold text-sm mb-1">
                      {airport.name}
                    </div>
                    <div className="text-ec-muted text-xs">
                      {airport.city}, {airport.country}
                    </div>
                  </div>
                  <div className="ml-4 px-3 py-1 bg-[rgba(28,140,130,0.2)] border border-[rgba(28,140,130,0.4)] rounded text-ec-teal font-bold text-sm">
                    {airport.iataCode}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

