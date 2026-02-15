"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { MapPin } from "lucide-react";

export interface PlaceResult {
  label: string;
  city: string;
  countryCode: string;
  lat: number;
  lng: number;
}

interface PlacesInputProps {
  value: string;
  onChange: (city: string, countryCode: string, lat?: number, lng?: number) => void;
  placeholder?: string;
  label?: string;
  onDebugInfo?: (info: { url: string; status: number; count: number; error?: string }) => void;
}

const DEBOUNCE_MS = 300;

export function PlacesInput({ value, onChange, placeholder = "Melbourne", label, onDebugInfo }: PlacesInputProps) {
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastSelectedRef = useRef<string | null>(null);
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null);

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
      setDropdownRect(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      const url = `/api/places/search?q=${encodeURIComponent(query.trim())}`;
      // #region agent log
      const _log1 = { location: 'PlacesInput.tsx:effect', message: 'places_effect_start', data: { query: query.trim(), url }, hypothesisId: 'H1' };
      console.log('[DEBUG]', _log1);
      fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({..._log1,timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      try {
        const res = await fetch(url, { cache: "no-store" });
        const text = await res.text();
        let data: { results?: unknown };
        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          setResults([]);
          setIsOpen(false);
          setDropdownRect(null);
          setLoading(false);
          return;
        }
        const list = Array.isArray(data.results) ? data.results as PlaceResult[] : [];
        const hasContainerRef = !!containerRef.current;
        // #region agent log
        const _log2 = { location: 'PlacesInput.tsx:after_parse', message: 'places_after_fetch', data: { status: res.status, textLen: text.length, listLength: list.length, hasContainerRef }, hypothesisId: 'H2,H3,H4' };
        console.log('[DEBUG]', _log2);
        fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({..._log2,timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        setResults(list);
        setIsOpen(list.length > 0);
        if (list.length > 0 && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          setDropdownRect({ top: rect.bottom + 4, left: rect.left, width: rect.width });
        } else {
          setDropdownRect(null);
        }
        if (onDebugInfo && typeof console.debug === "function") {
          console.debug("places_autocomplete", { q: query.trim(), count: list.length });
        }
        onDebugInfo?.({ url, status: res.status, count: list.length });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        // #region agent log
        const _logC = { location: 'PlacesInput.tsx:catch', message: 'places_fetch_error', data: { error: msg }, hypothesisId: 'H1,H2' };
        console.log('[DEBUG]', _logC);
        fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({..._logC,timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        setResults([]);
        setIsOpen(false);
        setDropdownRect(null);
        onDebugInfo?.({ url, status: 0, count: 0, error: msg });
        if (onDebugInfo && typeof console.debug === "function") {
          console.debug("places_autocomplete", { q: query.trim(), error: msg });
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

  const handleSelect = (place: PlaceResult) => {
    lastSelectedRef.current = place.label;
    setQuery(place.label);
    onChange(place.city, place.countryCode, place.lat || undefined, place.lng || undefined);
    setIsOpen(false);
    setResults([]);
    setDropdownRect(null);
    inputRef.current?.blur();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    lastSelectedRef.current = null;
    if (!e.target.value.trim()) onChange("", "");
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

      {typeof document !== "undefined" &&
        (() => {
          const showPortal = isOpen && results.length > 0 && dropdownRect != null;
          // #region agent log
          const _logR = { location: 'PlacesInput.tsx:render', message: 'places_render_condition', data: { isOpen, resultsLength: results.length, hasDropdownRect: dropdownRect != null, showPortal }, hypothesisId: 'H4,H5' };
          console.log('[DEBUG]', _logR);
          fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({..._logR,timestamp:Date.now()})}).catch(()=>{});
          // #endregion
          return showPortal;
        })() &&
        createPortal(
          <div
            id="places-dropdown-portal"
            role="listbox"
            className="fixed z-[99999] bg-[rgba(15,17,20,0.98)] backdrop-blur-xl border border-[rgba(28,140,130,0.3)] rounded-ec-md shadow-[0_8px_32px_rgba(0,0,0,0.6)] overflow-hidden"
            style={{ top: dropdownRect.top, left: dropdownRect.left, width: dropdownRect.width, minWidth: 200 }}
          >
            <div className="max-h-64 overflow-y-auto p-2">
              {results.map((place, index) => (
                <button
                  key={`${place.city}-${place.countryCode}-${index}`}
                  type="button"
                  role="option"
                  onClick={() => handleSelect(place)}
                  className="w-full text-left px-4 py-3 rounded-lg bg-[rgba(28,140,130,0.08)] hover:bg-[rgba(28,140,130,0.2)] border border-transparent hover:border-[rgba(28,140,130,0.3)] text-ec-text transition-all"
                >
                  <span className="font-semibold text-sm">{place.label}</span>
                </button>
              ))}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
