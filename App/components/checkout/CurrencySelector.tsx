"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Search } from "lucide-react";

interface CurrencySelectorProps {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const POPULAR_CURRENCIES = [
  'AUD', 'USD', 'EUR', 'GBP', 'TRY', 'THB', 'AED', 'SGD', 'NZD', 'CAD', 'CHF', 'HKD', 'JPY'
];

export function CurrencySelector({ value, onChange, disabled }: CurrencySelectorProps) {
  const [currencies, setCurrencies] = useState<string[]>([]);
  const [popular, setPopular] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch currencies from API
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const res = await fetch("/api/currencies/stripe");
        const data = await res.json();
        if (data.ok && Array.isArray(data.currencies)) {
          setCurrencies(data.currencies);
          setPopular(data.popular || POPULAR_CURRENCIES);
        } else {
          // Fallback
          setCurrencies(POPULAR_CURRENCIES);
          setPopular(POPULAR_CURRENCIES);
        }
      } catch (err) {
        console.error("[CurrencySelector] Failed to fetch currencies:", err);
        setCurrencies(POPULAR_CURRENCIES);
        setPopular(POPULAR_CURRENCIES);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrencies();
  }, []);

  // Set default value if none selected
  useEffect(() => {
    if (!value && currencies.length > 0 && !loading) {
      onChange(currencies[0]);
    }
  }, [value, currencies, loading, onChange]);

  const filteredCurrencies = currencies.filter((c) =>
    c.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.toUpperCase().includes(searchQuery.toUpperCase())
  );

  const glassPanelStyle: React.CSSProperties = {
    background: "rgba(10, 12, 14, 0.78)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 18px 55px rgba(0,0,0,0.55)",
  };

  return (
    <div className="relative">
      {/* Popular chips */}
      {!isOpen && popular.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {popular.map((code) => {
            const isSelected = value === code;
            return (
              <button
                key={code}
                type="button"
                onClick={() => !disabled && onChange(code)}
                disabled={disabled}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                  isSelected ? "text-ec-teal border-2" : "border"
                }`}
                style={{
                  ...(isSelected
                    ? {
                        background: "rgba(28, 140, 130, 0.15)",
                        borderColor: "rgba(28, 140, 130, 0.5)",
                        color: "#1C8C82",
                      }
                    : {
                        background: "rgba(255, 255, 255, 0.05)",
                        borderColor: "rgba(255, 255, 255, 0.1)",
                        color: "rgba(255, 255, 255, 0.8)",
                      }),
                }}
              >
                {code}
              </button>
            );
          })}
        </div>
      )}

      {/* Main selector button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled || loading}
        className="w-full px-6 py-4 rounded-xl border text-left transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-between"
        style={{
          ...glassPanelStyle,
          borderColor: "rgba(28, 140, 130, 0.4)",
        }}
      >
        <div className="flex flex-col">
          {value ? (
            <>
              <span className="text-white font-semibold text-lg">{value}</span>
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.50)" }}>
                Pay in {value}
              </span>
            </>
          ) : (
            <span className="text-white font-semibold">
              {loading ? "Loading currencies..." : "Select currency"}
            </span>
          )}
        </div>
        <ChevronDown
          size={20}
          className="text-ec-teal transition-transform"
          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="absolute z-50 w-full mt-2 rounded-xl border overflow-hidden"
            style={glassPanelStyle}
          >
            {/* Search */}
            <div className="p-3 border-b" style={{ borderColor: "rgba(255,255,255,0.10)" }}>
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.50)" }} />
                <input
                  type="text"
                  placeholder="Search currencies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-transparent text-white placeholder-white/50 border"
                  style={{ borderColor: "rgba(255,255,255,0.10)" }}
                />
              </div>
            </div>

            {/* Options */}
            <div className="max-h-64 overflow-y-auto">
              {filteredCurrencies.length === 0 ? (
                <div className="p-4 text-center text-white/70">No currencies found</div>
              ) : (
                filteredCurrencies.map((code) => {
                  const isSelected = value === code;
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => {
                        onChange(code);
                        setIsOpen(false);
                        setSearchQuery("");
                      }}
                      className="w-full px-6 py-4 text-left hover:bg-white/5 transition-colors border-b"
                      style={{
                        borderColor: "rgba(255,255,255,0.05)",
                        background: isSelected ? "rgba(28, 140, 130, 0.15)" : "transparent",
                      }}
                    >
                      <div className="flex flex-col">
                        <span className="text-white font-semibold">{code}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Overlay to close dropdown */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
        </>
      )}
    </div>
  );
}

