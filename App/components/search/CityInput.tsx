"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin } from "lucide-react";

interface CityResult {
  cityName: string;
  countryCode: string;
  displayName: string;
}

interface CityInputProps {
  value: string;
  onChange: (cityName: string, countryCode?: string) => void;
  placeholder?: string;
  label?: string;
  onDebugInfo?: (info: { url: string; status: number; count: number; error?: string }) => void;
}

const DEBOUNCE_MS = 300;

export function CityInput({ value, onChange, placeholder = "Melbourne", label, onDebugInfo }: CityInputProps) {
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState<CityResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastSelectedRef = useRef<string | null>(null);

  useEffect(() => {
    if (value !== lastSelectedRef.current) {
      setQuery(value || "");
      lastSelectedRef.current = null;
    }
  }, [value]);

  useEffect(() => {
    if (query.length < 1) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      const url = `/api/cities/search?q=${encodeURIComponent(query.trim())}`;
      try {
        const res = await fetch(url);
        const data = await res.json();
        const list = Array.isArray(data.results) ? data.results : [];
        setResults(list);
        setIsOpen(list.length > 0);
        if (typeof console.debug === "function") {
          console.debug("city_autocomplete_request", { query: query.trim(), responseCount: list.length });
        }
        onDebugInfo?.({ url, status: res.status, count: list.length });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        setResults([]);
        setIsOpen(false);
        onDebugInfo?.({ url, status: 0, count: 0, error: msg });
        if (typeof console.debug === "function") {
          console.debug("city_autocomplete_request", { query: query.trim(), error: msg });
        }
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [query, onDebugInfo]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (city: CityResult) => {
    lastSelectedRef.current = city.cityName;
    setQuery(city.displayName);
    onChange(city.cityName, city.countryCode);
    setIsOpen(false);
    setResults([]);
    inputRef.current?.blur();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    lastSelectedRef.current = null;
    if (!e.target.value.trim()) onChange("");
  };

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-3">
          {label}
        </label>
      )}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-ec-muted pointer-events-none">
          <MapPin size={18} />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full pl-12 pr-4 bg-[rgba(15,17,20,0.55)] border border-[rgba(255,255,255,0.10)] rounded-ec-md text-ec-text placeholder-[rgba(237,237,237,0.45)] focus:outline-none focus:border-[rgba(28,140,130,0.55)] focus:shadow-[0_0_0_4px_rgba(28,140,130,0.18)] transition-all h-[48px] md:h-[52px]"
          style={{ color: "#EDEDED" }}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={isOpen && results.length > 0}
        />
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <div className="w-4 h-4 border-2 border-ec-teal border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div
          className="absolute z-[9999] w-full mt-2 bg-[rgba(15,17,20,0.98)] backdrop-blur-xl border border-[rgba(28,140,130,0.3)] rounded-ec-md shadow-[0_8px_32px_rgba(0,0,0,0.6)] overflow-hidden"
          role="listbox"
        >
          <div className="max-h-64 overflow-y-auto p-2">
            {results.map((city, index) => (
              <button
                key={`${city.cityName}-${city.countryCode}-${index}`}
                type="button"
                role="option"
                onClick={() => handleSelect(city)}
                className="w-full text-left px-4 py-3 rounded-lg bg-[rgba(28,140,130,0.08)] hover:bg-[rgba(28,140,130,0.2)] border border-transparent hover:border-[rgba(28,140,130,0.3)] text-ec-text transition-all"
              >
                <span className="font-semibold text-sm">{city.displayName}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
