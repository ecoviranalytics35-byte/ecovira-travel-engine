"use client";

import { ReactNode } from 'react';

interface SearchPanelShellProps {
  children: ReactNode;
  ctaLabel: string;
  onSearch: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function SearchPanelShell({
  children,
  ctaLabel,
  onSearch,
  loading = false,
  disabled = false,
}: SearchPanelShellProps) {
  return (
    <div className="ec-card mb-20">
      {children}
      {/* CTA Row - Right Aligned */}
      <div className="ec-cta-row">
        <button
          onClick={onSearch}
          disabled={loading || disabled}
          className="px-8 py-4 min-w-[320px] rounded-full bg-gradient-to-br from-[rgba(28,140,130,0.5)] to-[rgba(28,140,130,0.4)] border-2 border-[rgba(28,140,130,0.6)] text-ec-text font-semibold text-base shadow-[0_0_12px_rgba(28,140,130,0.4),0_0_24px_rgba(28,140,130,0.3),0_8px_32px_rgba(0,0,0,0.4)] hover:shadow-[0_0_18px_rgba(28,140,130,0.6),0_0_32px_rgba(28,140,130,0.4),0_12px_40px_rgba(0,0,0,0.5)] hover:border-[rgba(28,140,130,0.8)] hover:from-[rgba(28,140,130,0.6)] hover:to-[rgba(28,140,130,0.5)] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-[0_0_12px_rgba(28,140,130,0.4),0_0_24px_rgba(28,140,130,0.3),0_8px_32px_rgba(0,0,0,0.4)] disabled:hover:border-[rgba(28,140,130,0.6)]"
        >
          {loading ? 'Searching...' : ctaLabel}
        </button>
      </div>
    </div>
  );
}

