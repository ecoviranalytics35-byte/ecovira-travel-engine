"use client";

import { ReactNode } from 'react';
import { EcoviraButton } from '../Button';

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
        <EcoviraButton
          onClick={onSearch}
          disabled={loading || disabled}
          size="lg"
          variant="primary"
          className="ec-btn-primary min-w-[320px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Searching...' : ctaLabel}
        </EcoviraButton>
      </div>
    </div>
  );
}

