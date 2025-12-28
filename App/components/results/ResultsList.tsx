"use client";

import { ReactNode } from 'react';

interface ResultsListProps {
  title: string;
  count: number;
  countLabel: string;
  children: ReactNode;
  sortOptions?: { value: string; label: string }[];
  onSortChange?: (value: string) => void;
}

export function ResultsList({
  title,
  count,
  countLabel,
  children,
  sortOptions,
  onSortChange,
}: ResultsListProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-serif font-semibold text-ec-text mb-2">
            {title}
          </h2>
          <p className="text-ec-muted">
            {count} {countLabel}
          </p>
        </div>
        {sortOptions && onSortChange && (
          <select
            onChange={(e) => onSortChange(e.target.value)}
            className="h-11 px-4 bg-[rgba(15,17,20,0.55)] border border-[rgba(28,140,130,0.22)] rounded-ec-md text-ec-text text-sm focus:outline-none focus:border-[rgba(28,140,130,0.55)] focus:shadow-[0_0_0_4px_rgba(28,140,130,0.18)] cursor-pointer transition-all"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value} className="bg-[rgba(15,17,20,0.95)]">
                {option.label}
              </option>
            ))}
          </select>
        )}
      </div>
      {children}
    </div>
  );
}

