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
      "inline-flex items-center gap-2 p-1 bg-[rgba(15,17,20,0.55)] border border-[rgba(28,140,130,0.22)] rounded-ec-md",
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
              "px-6 py-2.5 rounded-ec-sm text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-gradient-to-r from-[rgba(28,140,130,0.25)] to-[rgba(28,140,130,0.15)] text-ec-text border border-[rgba(200,162,77,0.30)] shadow-[0_0_0_1px_rgba(28,140,130,0.20),0_0_12px_rgba(28,140,130,0.15)]"
                : "text-ec-muted hover:text-ec-text hover:bg-[rgba(28,140,130,0.08)] border border-transparent"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

