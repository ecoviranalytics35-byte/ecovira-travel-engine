"use client";

import { cn } from '../../lib/utils';

interface SegmentedToggleOption {
  value: string;
  label: string;
}

interface SegmentedToggleProps {
  options: SegmentedToggleOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SegmentedToggle({
  options,
  value,
  onChange,
  className,
}: SegmentedToggleProps) {
  return (
    <div className={cn(
      "inline-flex items-center gap-3",
      className
    )}>
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300",
              isActive
                ? "bg-gradient-to-br from-[rgba(28,140,130,0.4)] to-[rgba(28,140,130,0.3)] border-2 border-[rgba(28,140,130,0.5)] text-white shadow-[0_0_8px_rgba(28,140,130,0.3),0_0_16px_rgba(28,140,130,0.2)] hover:shadow-[0_0_12px_rgba(28,140,130,0.4),0_0_24px_rgba(28,140,130,0.3)] hover:border-[rgba(28,140,130,0.7)] hover:from-[rgba(28,140,130,0.5)] hover:to-[rgba(28,140,130,0.4)]"
                : "bg-[rgba(15,17,20,0.45)] border-2 border-[rgba(28,140,130,0.30)] text-white hover:text-white hover:bg-[rgba(28,140,130,0.15)] hover:border-[rgba(28,140,130,0.45)] hover:shadow-[0_0_8px_rgba(28,140,130,0.2)]"
            )}
            style={isActive ? { color: '#FFFFFF' } : { color: '#FFFFFF' }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

