"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '../lib/utils';
import { Plane, Hotel, Car, CarTaxiFront } from 'lucide-react';

interface Tab {
  label: string;
  path: string;
  icon: React.ReactNode;
}

interface EcoviraTabsProps {
  tabs: Tab[];
  className?: string;
}

export function EcoviraTabs({ tabs, className }: EcoviraTabsProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex items-center gap-4", className)}>
      {tabs.map((tab) => {
        const isActive = pathname === tab.path || (tab.path === '/flights' && pathname === '/');
        return (
          <Link
            key={tab.path}
            href={tab.path}
            className={cn(
              "ec-tab",
              isActive && "ec-tab-active"
            )}
          >
            <span className="w-5 h-5">{tab.icon}</span>
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
