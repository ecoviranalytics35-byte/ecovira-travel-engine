"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Search } from "lucide-react";

export interface CryptoOption {
  code: string;
  label: string;
  network?: string;
}

// Crypto metadata for display
const CRYPTO_METADATA: Record<string, { label: string; network?: string }> = {
  btc: { label: "Bitcoin" },
  eth: { label: "Ethereum" },
  sol: { label: "Solana", network: "Solana" },
  bnb: { label: "BNB", network: "BNB Chain" },
  xrp: { label: "XRP" },
  ada: { label: "Cardano" },
  doge: { label: "Dogecoin" },
  trx: { label: "Tron" },
  matic: { label: "Polygon", network: "Polygon" },
  pol: { label: "Polygon", network: "Polygon" },
  ltc: { label: "Litecoin" },
  usdttrc20: { label: "USDT", network: "TRC20" },
  usdterc20: { label: "USDT", network: "ERC20" },
  usdtbep20: { label: "USDT", network: "BEP20" },
  usdctrc20: { label: "USDC", network: "TRC20" },
  usdcerc20: { label: "USDC", network: "ERC20" },
  usdcbep20: { label: "USDC", network: "BEP20" },
};

// Format currency code for display
function formatCryptoLabel(code: string): CryptoOption {
  const normalized = code.toLowerCase();
  const meta = CRYPTO_METADATA[normalized];
  if (meta) {
    return { code: normalized, label: meta.label, network: meta.network };
  }
  // Fallback: capitalize first letter
  return {
    code: normalized,
    label: normalized.charAt(0).toUpperCase() + normalized.slice(1).toUpperCase(),
  };
}

interface CryptoSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function CryptoSelector({ value, onChange, disabled }: CryptoSelectorProps) {
  const [currencies, setCurrencies] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch currencies from API
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const res = await fetch("/api/payments/nowpayments/currencies");
        const data = await res.json();
        if (data.ok && Array.isArray(data.currencies)) {
          setCurrencies(data.currencies);
        } else {
          // Fallback to default list
          setCurrencies([
            "btc", "eth", "sol", "usdttrc20", "usdterc20", "usdtbep20",
            "usdctrc20", "usdcerc20", "usdcbep20", "bnb", "xrp", "ada", "doge", "trx", "matic", "ltc"
          ]);
        }
      } catch (err) {
        console.error("[CryptoSelector] Failed to fetch currencies:", err);
        // Fallback to default list
        setCurrencies([
          "btc", "eth", "sol", "usdttrc20", "usdterc20", "usdtbep20",
          "usdctrc20", "usdcerc20", "usdcbep20", "bnb", "xrp", "ada", "doge", "trx", "matic", "ltc"
        ]);
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

  const selectedOption = value ? formatCryptoLabel(value) : null;
  const filteredCurrencies = currencies.filter((c) =>
    c.toLowerCase().includes(searchQuery.toLowerCase()) ||
    formatCryptoLabel(c).label.toLowerCase().includes(searchQuery.toLowerCase())
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
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled || loading}
        className="w-full px-6 py-4 rounded-xl border text-left transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-between"
        style={{
          ...glassPanelStyle,
          borderColor: "rgba(200, 162, 77, 0.4)",
        }}
      >
        <div className="flex flex-col">
          {selectedOption ? (
            <>
              <span className="text-white font-semibold text-lg">
                {selectedOption.label}
                {selectedOption.network && (
                  <span className="text-sm font-normal ml-2" style={{ color: "rgba(255,255,255,0.60)" }}>
                    ({selectedOption.network})
                  </span>
                )}
              </span>
              <span className="text-xs uppercase" style={{ color: "rgba(255,255,255,0.50)" }}>
                {selectedOption.code}
              </span>
            </>
          ) : (
            <span className="text-white font-semibold">
              {loading ? "Loading currencies..." : "Select cryptocurrency"}
            </span>
          )}
        </div>
        <ChevronDown
          size={20}
          className="text-ec-gold transition-transform"
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
                  placeholder="Search cryptocurrencies..."
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
                  const option = formatCryptoLabel(code);
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
                        background: isSelected ? "rgba(200, 162, 77, 0.15)" : "transparent",
                      }}
                    >
                      <div className="flex flex-col">
                        <span className="text-white font-semibold">
                          {option.label}
                          {option.network && (
                            <span className="text-sm font-normal ml-2" style={{ color: "rgba(255,255,255,0.60)" }}>
                              ({option.network})
                            </span>
                          )}
                        </span>
                        <span className="text-xs uppercase mt-1" style={{ color: "rgba(255,255,255,0.50)" }}>
                          {option.code}
                        </span>
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

