"use client";

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';

type CurrencyState = {
  currency: string;
  crypto: string | null;
  setCurrency: (v: string) => void;
  setCrypto: (v: string | null) => void;
};

const CurrencyContext = createContext<CurrencyState | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState("AUD");
  const [crypto, setCryptoState] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ecovira.currency");
      const savedCrypto = localStorage.getItem("ecovira.crypto");
      if (saved) setCurrencyState(saved);
      if (savedCrypto) setCryptoState(savedCrypto);
    } catch {}
  }, []);

  const setCurrency = (v: string) => {
    setCurrencyState(v);
    try { localStorage.setItem("ecovira.currency", v); } catch {}
  };

  const setCrypto = (v: string | null) => {
    setCryptoState(v);
    try {
      if (v) localStorage.setItem("ecovira.crypto", v);
      else localStorage.removeItem("ecovira.crypto");
    } catch {}
  };

  const value = useMemo(
    () => ({ currency, crypto, setCurrency, setCrypto }),
    [currency, crypto]
  );

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used inside <CurrencyProvider>");
  return ctx;
}

