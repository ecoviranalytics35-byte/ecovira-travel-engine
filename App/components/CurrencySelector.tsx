"use client";

import { useState, useRef, useEffect } from 'react';
import { cn } from '../lib/utils';
import { Search, ChevronDown } from 'lucide-react';

interface CurrencyOption {
  code: string;
  name: string;
  type: 'fiat' | 'crypto';
}

const FIAT_CURRENCIES: CurrencyOption[] = [
  { code: 'AUD', name: 'Australian Dollar', type: 'fiat' },
  { code: 'USD', name: 'US Dollar', type: 'fiat' },
  { code: 'EUR', name: 'Euro', type: 'fiat' },
  { code: 'GBP', name: 'British Pound', type: 'fiat' },
  { code: 'TRY', name: 'Turkish Lira', type: 'fiat' },
  { code: 'AED', name: 'UAE Dirham', type: 'fiat' },
  { code: 'SAR', name: 'Saudi Riyal', type: 'fiat' },
  { code: 'QAR', name: 'Qatari Riyal', type: 'fiat' },
  { code: 'KWD', name: 'Kuwaiti Dinar', type: 'fiat' },
  { code: 'INR', name: 'Indian Rupee', type: 'fiat' },
  { code: 'THB', name: 'Thai Baht', type: 'fiat' },
  { code: 'MYR', name: 'Malaysian Ringgit', type: 'fiat' },
  { code: 'SGD', name: 'Singapore Dollar', type: 'fiat' },
  { code: 'JPY', name: 'Japanese Yen', type: 'fiat' },
  { code: 'KRW', name: 'South Korean Won', type: 'fiat' },
];

const CRYPTO_CURRENCIES: CurrencyOption[] = [
  { code: 'USDT', name: 'Tether', type: 'crypto' },
  { code: 'USDC', name: 'USD Coin', type: 'crypto' },
  { code: 'BTC', name: 'Bitcoin', type: 'crypto' },
  { code: 'ETH', name: 'Ethereum', type: 'crypto' },
];

interface CurrencySelectorProps {
  value: string;
  onChange: (value: string) => void;
  showCrypto?: boolean;
  className?: string;
}

export function CurrencySelector({ 
  value, 
  onChange, 
  showCrypto = true,
  className 
}: CurrencySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const allCurrencies = showCrypto 
    ? [...FIAT_CURRENCIES, ...CRYPTO_CURRENCIES]
    : FIAT_CURRENCIES;

  const selectedCurrency = allCurrencies.find(c => c.code === value) || FIAT_CURRENCIES[0];

  const filteredCurrencies = allCurrencies.filter(currency => {
    const query = searchQuery.toLowerCase();
    return (
      currency.code.toLowerCase().includes(query) ||
      currency.name.toLowerCase().includes(query)
    );
  });

  const fiatFiltered = filteredCurrencies.filter(c => c.type === 'fiat');
  const cryptoFiltered = filteredCurrencies.filter(c => c.type === 'crypto');

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-3">
        Currency
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full h-[52px] px-4 bg-[rgba(15,17,20,0.55)] border border-[rgba(255,255,255,0.10)] rounded-ec-md text-ec-text focus:outline-none focus:border-[rgba(28,140,130,0.55)] focus:shadow-[0_0_0_4px_rgba(28,140,130,0.18)] transition-all flex items-center justify-between"
        >
          <span className="flex items-center gap-2">
            <span className="font-medium">{selectedCurrency.code}</span>
            <span className="text-sm text-ec-muted">— {selectedCurrency.name}</span>
          </span>
          <ChevronDown size={18} className="text-ec-muted" />
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-[rgba(15,17,20,0.95)] border border-[rgba(28,140,130,0.30)] rounded-ec-md shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-sm max-h-[400px] overflow-hidden flex flex-col">
            {/* Search Input */}
            <div className="p-3 border-b border-[rgba(255,255,255,0.08)]">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ec-muted" />
                <input
                  type="text"
                  placeholder="Search currency..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-10 pr-3 bg-[rgba(15,17,20,0.8)] border border-[rgba(255,255,255,0.10)] rounded-ec-sm text-ec-text text-sm focus:outline-none focus:border-[rgba(28,140,130,0.55)]"
                  autoFocus
                />
              </div>
            </div>

            {/* Currency List */}
            <div className="overflow-y-auto flex-1">
              {fiatFiltered.length > 0 && (
                <div className="p-2">
                  <div className="text-xs font-medium uppercase tracking-[0.12em] text-ec-muted mb-2 px-2">
                    Fiat Currencies
                  </div>
                  {fiatFiltered.map((currency) => (
                    <button
                      key={currency.code}
                      type="button"
                      onClick={() => {
                        onChange(currency.code);
                        setIsOpen(false);
                        setSearchQuery('');
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm rounded-ec-sm transition-colors mb-1",
                        value === currency.code
                          ? "bg-ec-teal/20 text-ec-text border border-ec-teal/40"
                          : "text-ec-muted hover:text-ec-text hover:bg-ec-card/50"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span className="font-medium">{currency.code}</span>
                        <span className="text-xs text-ec-dim">— {currency.name}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {showCrypto && cryptoFiltered.length > 0 && (
                <div className="p-2 border-t border-[rgba(255,255,255,0.08)]">
                  <div className="text-xs font-medium uppercase tracking-[0.12em] text-ec-muted mb-2 px-2">
                    Cryptocurrencies
                  </div>
                  {cryptoFiltered.map((currency) => (
                    <button
                      key={currency.code}
                      type="button"
                      onClick={() => {
                        onChange(currency.code);
                        setIsOpen(false);
                        setSearchQuery('');
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm rounded-ec-sm transition-colors mb-1",
                        value === currency.code
                          ? "bg-ec-gold/20 text-ec-text border border-ec-gold/40"
                          : "text-ec-muted hover:text-ec-text hover:bg-ec-card/50"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span className="font-medium">{currency.code}</span>
                        <span className="text-xs text-ec-dim">— {currency.name}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {filteredCurrencies.length === 0 && (
                <div className="p-4 text-center text-sm text-ec-muted">
                  No currencies found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
