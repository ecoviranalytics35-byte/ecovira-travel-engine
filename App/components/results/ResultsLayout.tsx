"use client";

import { ReactNode } from 'react';
import { EcoviraCard } from '../EcoviraCard';
import { cn } from '../../lib/utils';

interface ResultsLayoutProps {
  children: ReactNode;
  sidebar: ReactNode | null;
}

export function ResultsLayout({ children, sidebar }: ResultsLayoutProps) {
  return (
    <div className="mt-20 pointer-events-auto">
      <div className={cn(
        "grid gap-6 ec-results-layout",
        sidebar ? "grid-cols-1 lg:grid-cols-10" : "grid-cols-1"
      )}>
        {/* Left: Results List (70% if sidebar, 100% if no sidebar) */}
        <div className={cn("space-y-5 pointer-events-auto", sidebar ? "lg:col-span-7" : "lg:col-span-12")}>
          {children}
        </div>

        {/* Right: Sticky Sidebar (30%) */}
        {sidebar && (
          <div className="lg:col-span-3 ec-results-sidebar">
            <div className="sticky top-6 space-y-6">
              {sidebar}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

