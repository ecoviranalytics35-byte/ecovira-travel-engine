"use client";

import { ReactNode } from 'react';
import { EcoviraCard } from '../EcoviraCard';

interface ResultsLayoutProps {
  children: ReactNode;
  sidebar: ReactNode;
}

export function ResultsLayout({ children, sidebar }: ResultsLayoutProps) {
  return (
    <div className="mt-20">
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 ec-results-layout">
        {/* Left: Results List (70%) */}
        <div className="lg:col-span-7 space-y-5">
          {children}
        </div>

        {/* Right: Sticky Sidebar (30%) */}
        <div className="lg:col-span-3 ec-results-sidebar">
          <div className="sticky top-6 space-y-6">
            {sidebar}
          </div>
        </div>
      </div>
    </div>
  );
}

