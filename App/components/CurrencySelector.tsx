"use client";

import { useState, useRef, useEffect } from 'react';
import { cn } from '../lib/utils';
import { Search, ChevronDown, Check } from 'lucide-react';

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
  disabled?: boolean;
}

export function CurrencySelector({ 
  value, 
  onChange, 
  showCrypto = true,
  className,
  disabled = false
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
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            "ec-currency-trigger w-full h-[52px] px-4 bg-[rgba(21,24,29,0.75)] border-2 border-[rgba(28,140,130,0.35)] rounded-ec-md text-ec-text focus:outline-none focus:border-[rgba(28,140,130,0.65)] focus:shadow-[0_0_0_4px_rgba(28,140,130,0.25)] transition-all flex items-center justify-between group",
            isOpen && !disabled && "border-[rgba(28,140,130,0.65)] shadow-[0_0_0_4px_rgba(28,140,130,0.25)] bg-[rgba(21,24,29,0.85)]",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <span className="flex items-center gap-2 text-ec-text">
            <span className="font-medium text-ec-text">{selectedCurrency.code}</span>
            <span className="text-sm text-ec-muted">— {selectedCurrency.name}</span>
          </span>
          <ChevronDown 
            size={18} 
            className={cn(
              "transition-all duration-300",
              isOpen
                ? "text-ec-text drop-shadow-[0_0_18px_rgba(28,140,130,0.55)] drop-shadow-[0_0_10px_rgba(200,162,77,0.25)]"
                : "text-[rgba(237,237,237,0.75)] drop-shadow-[0_0_10px_var(--ec-teal-glow)] opacity-90 group-hover:text-ec-text group-hover:drop-shadow-[0_0_18px_rgba(28,140,130,0.55)] group-hover:drop-shadow-[0_0_10px_rgba(200,162,77,0.25)]"
            )}
          />
        </button>

        {isOpen && !disabled && (
          <div className="ec-dropdown absolute z-50 w-full mt-2 bg-[linear-gradient(180deg,rgba(21,24,29,0.95),rgba(15,17,20,0.95))] border border-[rgba(28,140,130,0.30)] rounded-[20px] shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-[16px] max-h-[400px] overflow-hidden flex flex-col">
            {/* Search Input */}
            <div className="p-3 border-b border-[rgba(255,255,255,0.06)]">
              <div className="relative group">
                <Search 
                  size={18} 
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(237,237,237,0.75)] drop-shadow-[0_0_8px_var(--ec-teal-glow)] opacity-90 transition-all duration-300 group-focus-within:text-ec-text group-focus-within:drop-shadow-[0_0_12px_rgba(28,140,130,0.55)] group-focus-within:drop-shadow-[0_0_6px_rgba(200,162,77,0.25)]" 
                />
                <input
                  type="text"
                  placeholder="Search currency..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ec-dropdown-search w-full h-[52px] pl-10 pr-4 bg-[rgba(15,17,20,0.55)] border border-[rgba(28,140,130,0.22)] rounded-ec-md text-ec-text text-sm placeholder-[rgba(237,237,237,0.45)] focus:outline-none focus:border-[rgba(28,140,130,0.55)] focus:shadow-[0_0_0_4px_rgba(28,140,130,0.18)] transition-all"
                  autoFocus
                />
              </div>
            </div>

            {/* Currency List */}
            <div className="overflow-y-auto flex-1 ec-currency-scrollbar">
              {fiatFiltered.length > 0 && (
                <div className="p-3">
                  <div className="ec-section-title text-xs font-medium uppercase tracking-[0.16em] mb-3 px-2">
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
                        "ec-item w-full text-left px-4 py-3 h-[48px] rounded-ec-sm transition-all mb-1 flex items-center justify-between",
                        value === currency.code && "ec-dropdown-item--active"
                      )}
                      data-selected={value === currency.code}
                      aria-selected={value === currency.code}
                    >
                      <span className="flex items-center gap-2">
                        <span className="font-semibold text-base text-ec-text">{currency.code}</span>
                        <span className="text-xs text-ec-muted">— {currency.name}</span>
                      </span>
                      {value === currency.code && (
                        <Check size={18} className="text-ec-gold flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {showCrypto && cryptoFiltered.length > 0 && (
                <div className="p-3 border-t border-[rgba(255,255,255,0.06)]">
                  <div className="ec-section-title text-xs font-medium uppercase tracking-[0.16em] mb-3 px-2">
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
                        "ec-item w-full text-left px-4 py-3 h-[48px] rounded-ec-sm transition-all mb-1 flex items-center justify-between",
                        value === currency.code && "ec-dropdown-item--active"
                      )}
                      data-selected={value === currency.code}
                      aria-selected={value === currency.code}
                    >
                      <span className="flex items-center gap-2">
                        <span className="font-semibold text-base text-ec-text">{currency.code}</span>
                        <span className="text-xs text-ec-muted">— {currency.name}</span>
                      </span>
                      {value === currency.code && (
                        <Check size={18} className="text-ec-gold flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {filteredCurrencies.length === 0 && (
                <div className="p-6 text-center text-sm text-ec-muted">
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
