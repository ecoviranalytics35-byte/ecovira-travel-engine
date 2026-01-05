"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Search } from "lucide-react";

export interface CryptoOption {
  ticker: string;
  name: string;
  network?: string;
}

interface CryptoCoin {
  ticker: string;
  name: string;
  network?: string;
}

// Most Popular cryptocurrencies (always shown as chips)
const MOST_POPULAR: CryptoCoin[] = [
  { ticker: "btc", name: "Bitcoin" },
  { ticker: "eth", name: "Ethereum" },
  { ticker: "sol", name: "Solana", network: "Solana" },
  { ticker: "usdttrc20", name: "USDT", network: "TRC20" },
  { ticker: "usdterc20", name: "USDT", network: "ERC20" },
  { ticker: "usdcerc20", name: "USDC", network: "ERC20" },
];

interface CryptoSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function CryptoSelector({ value, onChange, disabled }: CryptoSelectorProps) {
  const [coins, setCoins] = useState<CryptoCoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasSol, setHasSol] = useState(true);
  const [solUnavailable, setSolUnavailable] = useState(false);

  // Fetch coins from API
  useEffect(() => {
    const fetchCoins = async () => {
      try {
        const res = await fetch("/api/payments/nowpayments/coins");
        const data = await res.json();
        if (data.ok && Array.isArray(data.coins)) {
          setCoins(data.coins);
          setHasSol(data.hasSol !== false);
          // Check if SOL is in the list
          const solInList = data.coins.some((c: CryptoCoin) => c.ticker === "sol");
          setSolUnavailable(!solInList && !data.hasSol);
        } else {
          // Fallback to default list
          setCoins(MOST_POPULAR);
        }
      } catch (err) {
        console.error("[CryptoSelector] Failed to fetch coins:", err);
        // Fallback to default list
        setCoins(MOST_POPULAR);
      } finally {
        setLoading(false);
      }
    };

    fetchCoins();
  }, []);

  // Set default value if none selected (prefer BTC)
  useEffect(() => {
    if (!value && coins.length > 0 && !loading) {
      const btcCoin = coins.find((c) => c.ticker === "btc");
      const defaultTicker = btcCoin ? btcCoin.ticker : coins[0].ticker;
      console.log("[CryptoSelector] Setting default value", defaultTicker);
      onChange(defaultTicker);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, coins, loading]);

  const selectedCoin = value ? coins.find((c) => c.ticker === value) : null;
  const filteredCoins = coins.filter((c) =>
    c.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.network && c.network.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Get available most popular coins (only those in the coins list)
  const availablePopular = MOST_POPULAR.filter((pop) =>
    coins.some((c) => c.ticker === pop.ticker)
  );

  const glassPanelStyle: React.CSSProperties = {
    background: "rgba(10, 12, 14, 0.78)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 18px 55px rgba(0,0,0,0.55)",
  };

  return (
    <div className="space-y-4">
      {/* Most Popular Chips */}
      {!loading && availablePopular.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-white/80 mb-3">
            Most Popular
          </label>
          <div className="flex flex-wrap gap-2">
            {availablePopular.map((coin) => {
              const isSelected = value === coin.ticker;
              return (
                <button
                  key={coin.ticker}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!disabled) {
                      console.log("[CryptoSelector] Chip clicked", coin.ticker);
                      onChange(coin.ticker);
                    }
                  }}
                  disabled={disabled}
                  className={`px-4 py-2 rounded-full border font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                    isSelected
                      ? "bg-gradient-to-r from-[rgba(200,162,77,0.3)] to-[rgba(200,162,77,0.2)] border-[rgba(200,162,77,0.6)] text-ec-gold shadow-[0_0_20px_rgba(200,162,77,0.3)]"
                      : "bg-[rgba(255,255,255,0.05)] border-[rgba(200,162,77,0.3)] text-white hover:border-[rgba(200,162,77,0.5)] hover:bg-[rgba(255,255,255,0.08)]"
                  }`}
                >
                  {coin.name}
                  {coin.network && (
                    <span className="text-xs ml-1 opacity-70">({coin.network})</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* SOL Unavailable Message */}
      {solUnavailable && (
        <div className="p-3 rounded-lg border" style={{
          background: "rgba(239, 68, 68, 0.1)",
          borderColor: "rgba(239, 68, 68, 0.3)",
        }}>
          <p className="text-sm text-white/90">
            ⚠️ SOL temporarily unavailable, choose another coin
          </p>
        </div>
      )}

      {/* Searchable Dropdown */}
      <div className="relative">
        <label className="block text-sm font-medium text-white/80 mb-2">
          {value ? "Selected" : "Select Cryptocurrency"}
        </label>
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
            {selectedCoin ? (
              <>
                <span className="text-white font-semibold text-lg">
                  {selectedCoin.name}
                  {selectedCoin.network && (
                    <span className="text-sm font-normal ml-2" style={{ color: "rgba(255,255,255,0.60)" }}>
                      ({selectedCoin.network})
                    </span>
                  )}
                </span>
                <span className="text-xs uppercase" style={{ color: "rgba(255,255,255,0.50)" }}>
                  {selectedCoin.ticker}
                </span>
              </>
            ) : (
              <span className="text-white font-semibold">
                {loading ? "Loading cryptocurrencies..." : "Select cryptocurrency"}
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
                    autoFocus
                  />
                </div>
              </div>

              {/* Options */}
              <div className="max-h-64 overflow-y-auto">
                {filteredCoins.length === 0 ? (
                  <div className="p-4 text-center text-white/70">No cryptocurrencies found</div>
                ) : (
                  filteredCoins.map((coin) => {
                    const isSelected = value === coin.ticker;
                    return (
                      <button
                        key={coin.ticker}
                        type="button"
                      onClick={() => {
                        console.log("[CryptoSelector] Option clicked", coin.ticker);
                        onChange(coin.ticker);
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
                            {coin.name}
                            {coin.network && (
                              <span className="text-sm font-normal ml-2" style={{ color: "rgba(255,255,255,0.60)" }}>
                                ({coin.network})
                              </span>
                            )}
                          </span>
                          <span className="text-xs uppercase mt-1" style={{ color: "rgba(255,255,255,0.50)" }}>
                            {coin.ticker}
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
    </div>
  );
}
