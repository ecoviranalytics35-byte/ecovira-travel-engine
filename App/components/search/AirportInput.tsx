"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Plane } from "lucide-react";

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
  /** When ?debug=1, parent can pass this to capture last request info */
  onDebugInfo?: (info: { url: string; status: number; count: number; error?: string }) => void;
}

const DEBOUNCE_MS = 300;

export function AirportInput({ value, onChange, placeholder = "MEL", label, onDebugInfo }: AirportInputProps) {
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState<Airport[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastSelectedIataRef = useRef<string | null>(null);

  const syncFromParent = useCallback(() => {
    if (value !== lastSelectedIataRef.current) {
      setQuery(value || "");
      lastSelectedIataRef.current = null;
    }
  }, [value]);

  useEffect(syncFromParent, [syncFromParent]);

  useEffect(() => {
        if (query.length < 1) {
      setResults([]);
      setIsOpen(false);
      setDropdownRect(null);
      return;
    }

    const abortController = new AbortController();
    const timeoutId = setTimeout(async () => {
      const input = query.trim();
      const url = `/api/airports/search?q=${encodeURIComponent(input)}`;
      setLoading(true);
      try {
        const res = await fetch(url, { cache: "no-store", signal: abortController.signal });
        const text = await res.text();
        let data: { results?: unknown };
        try {
          data = text ? JSON.parse(text) : {};
        } catch (parseErr) {
          if (onDebugInfo && typeof console.debug === "function") {
            console.debug("airport_autocomplete", { q: input, url, status: res.status, parseError: String(parseErr), responsePreview: text.slice(0, 200) });
          }
          setResults([]);
          setIsOpen(false);
          setDropdownRect(null);
          onDebugInfo?.({ url, status: res.status, count: 0, error: "Invalid JSON" });
          setLoading(false);
          return;
        }
        const list = Array.isArray(data.results) ? data.results as Airport[] : [];
        if (abortController.signal.aborted) return;
        setResults(list);
        setIsOpen(list.length > 0);
        if (list.length > 0 && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          setDropdownRect({ top: rect.bottom + 4, left: rect.left, width: rect.width });
        } else {
          setDropdownRect(null);
        }
        if (onDebugInfo && typeof console.debug === "function") {
          console.debug("airport_autocomplete", { q: input, url, status: res.status, count: list.length, first: list[0] ?? null });
        }
        onDebugInfo?.({ url, status: res.status, count: list.length });
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        const msg = error instanceof Error ? error.message : String(error);
        setResults([]);
        setIsOpen(false);
        setDropdownRect(null);
        onDebugInfo?.({ url, status: 0, count: 0, error: msg });
        if (onDebugInfo && typeof console.debug === "function") {
          console.debug("airport_autocomplete", { q: input, url, status: 0, error: msg });
        }
      } finally {
        if (!abortController.signal.aborted) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [query, onDebugInfo]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current && !containerRef.current.contains(target)) {
        const portalEl = document.getElementById("airport-dropdown-portal");
        if (portalEl && portalEl.contains(target)) return;
        setIsOpen(false);
        setDropdownRect(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (airport: Airport) => {
    lastSelectedIataRef.current = airport.iataCode;
    setQuery(airport.displayName);
    onChange(airport.iataCode);
    setIsOpen(false);
    setResults([]);
    setDropdownRect(null);
    inputRef.current?.blur();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setQuery(raw);
    lastSelectedIataRef.current = null;
    const trimmed = raw.trim();
    if (trimmed.length === 3 && /^[A-Za-z]{3}$/.test(trimmed)) {
      onChange(trimmed.toUpperCase());
    } else if (trimmed.length === 0) {
      onChange("");
    }
  };

  return (
    <div ref={containerRef} className="relative overflow-visible">
      {label && (
        <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-3">
          {label}
        </label>
      )}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-ec-muted pointer-events-none">
          <Plane size={18} />
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

      {typeof document !== "undefined" &&
        isOpen &&
        results.length > 0 &&
        dropdownRect &&
        createPortal(
          <div
            id="airport-dropdown-portal"
            role="listbox"
            className="fixed z-[99999] bg-[rgba(15,17,20,0.98)] backdrop-blur-xl border border-[rgba(28,140,130,0.3)] rounded-ec-md shadow-[0_8px_32px_rgba(0,0,0,0.6)] overflow-hidden"
            style={{ top: dropdownRect.top, left: dropdownRect.left, width: dropdownRect.width, minWidth: 200 }}
          >
            <div className="max-h-64 overflow-y-auto p-2">
              {results.map((airport, index) => (
                <button
                  key={`${airport.iataCode}-${index}`}
                  type="button"
                  role="option"
                  onClick={() => handleSelect(airport)}
                  className="w-full text-left px-4 py-3 rounded-lg bg-[rgba(28,140,130,0.08)] hover:bg-[rgba(28,140,130,0.2)] border border-transparent hover:border-[rgba(28,140,130,0.3)] text-ec-text transition-all flex flex-col gap-0.5"
                >
                  <span className="font-semibold text-sm">{airport.displayName}</span>
                  <span className="text-ec-muted text-xs">
                    {[airport.city, airport.country].filter(Boolean).join(", ")}
                  </span>
                </button>
              ))}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
