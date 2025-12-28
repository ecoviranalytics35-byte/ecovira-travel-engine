"use client";

import { EcoviraCard } from '../../components/EcoviraCard';
import { EcoviraButton } from '../../components/Button';
import { Input } from '../../components/Input';
import { DatePicker } from '../../components/DatePicker';
import { CurrencySelector } from '../../components/CurrencySelector';
import { SearchPanelShell } from '../../components/search/SearchPanelShell';
import { useCurrency } from '../../contexts/CurrencyContext';

export default function Transfers() {
  const { currency } = useCurrency();
  
  return (
    <>
      {/* Page Title */}
      <div className="mb-16 md:mb-20 lg:mb-24">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-semibold text-ec-text mb-6">
          Search Transfers
        </h1>
        <p className="text-ec-muted text-xl md:text-2xl mt-4">
          Premium airport and hotel transfers
        </p>
      </div>

      {/* Engine Search Card - Structured Layout */}
      <SearchPanelShell
        ctaLabel="Search Transfers →"
        onSearch={() => {}}
        disabled={true}
      >
        {/* Row 1: From | To */}
        <div className="ec-grid-2 mb-6">
          <div>
            <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-3">
              From
            </label>
            <Input placeholder="Airport or Address" disabled />
          </div>
          <div>
            <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-3">
              To
            </label>
            <Input placeholder="Hotel or Address" disabled />
          </div>
        </div>

        {/* Row 2: Date | Passengers | Currency */}
        <div className="ec-grid-3 mb-6">
          <DatePicker
            value=""
            onChange={() => {}}
            placeholder="Select date"
            label="Date"
            disabled
          />
          <div>
            <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-3">
              Passengers
            </label>
            <Input type="number" placeholder="1-8" disabled />
          </div>
          <CurrencySelector
            value={currency}
            onChange={() => {}}
            showCrypto={true}
            disabled={true}
          />
        </div>
      </SearchPanelShell>

      {/* Coming Soon Card */}
      <EcoviraCard variant="glass" className="text-center py-12 md:py-16 px-6">
        <h2 className="text-2xl md:text-3xl font-serif font-semibold text-ec-text mb-4">
          Transfers Coming Soon
        </h2>
        <p className="text-lg text-ec-muted mb-8 max-w-md mx-auto">
          Our premium transfer service is currently under development. Contact concierge support to be notified when this feature becomes available.
        </p>
        <EcoviraButton 
          variant="secondary" 
          size="lg"
          className="px-8 h-[52px]"
          disabled
        >
          Notify Me
        </EcoviraButton>
      </EcoviraCard>
    </>
  );
}

