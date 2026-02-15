"use client";

import { useState, useRef, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { cn } from '../lib/utils';
import { EcoviraCard } from './EcoviraCard';
import { Calendar } from 'lucide-react';
import 'react-day-picker/dist/style.css';

/** YYYY-MM-DD for today (client local). */
function todayISO(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

/** YYYY-MM-DD for date + N days. */
function addDaysISO(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  /** Min selectable date YYYY-MM-DD (default: today). */
  minDate?: string;
  /** Max selectable date YYYY-MM-DD (default: 365 days from today). */
  maxDate?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  disabled = false,
  className,
  label,
  minDate,
  maxDate,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const todayStr = todayISO();
  const minStr = minDate ?? todayStr;
  const maxStr = maxDate ?? addDaysISO(todayStr, 365);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const selectedDate = value ? new Date(value + "T12:00:00") : undefined;
  const minDateObj = new Date(minStr + "T00:00:00");
  const maxDateObj = new Date(maxStr + "T23:59:59");

  const formatDisplay = (dateStr: string): string => {
    if (!dateStr) return '';
    // Use consistent formatting to avoid hydration mismatches
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      onChange(`${y}-${m}-${d}`);
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {label && (
        <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-3">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "w-full h-[52px] px-4 bg-[rgba(15,17,20,0.55)] border border-[rgba(255,255,255,0.10)] rounded-ec-md text-left text-ec-text placeholder-[rgba(237,237,237,0.45)] focus:outline-none focus:border-[rgba(28,140,130,0.55)] focus:shadow-[0_0_0_4px_rgba(28,140,130,0.18)] transition-all flex items-center justify-between group",
          disabled && "opacity-50 cursor-not-allowed",
          !disabled && "cursor-pointer hover:border-[rgba(28,140,130,0.30)]"
        )}
      >
        <span className={cn(value ? "text-[#EDEDED]" : "text-[rgba(237,237,237,0.45)]")}>
          {value ? formatDisplay(value) : placeholder}
        </span>
        <Calendar 
          size={20} 
          className={cn(
            "transition-all duration-300",
            isOpen 
              ? "text-ec-text drop-shadow-[0_0_18px_rgba(28,140,130,0.55)] drop-shadow-[0_0_10px_rgba(200,162,77,0.25)] opacity-100"
              : "text-[rgba(237,237,237,0.75)] drop-shadow-[0_0_10px_var(--ec-teal-glow)] opacity-90 group-hover:text-ec-text group-hover:drop-shadow-[0_0_18px_rgba(28,140,130,0.55)] group-hover:drop-shadow-[0_0_10px_rgba(200,162,77,0.25)]"
          )}
        />
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 mt-2 left-0 right-0 md:left-auto md:right-0 md:w-[380px]">
          <EcoviraCard variant="glass" className="p-6 shadow-ec-card">
            <style jsx global>{`
              .rdp {
                --rdp-cell-size: 40px;
                --rdp-accent-color: var(--ec-teal);
                --rdp-background-color: rgba(28, 140, 130, 0.15);
                --rdp-accent-color-dark: var(--ec-teal);
                --rdp-background-color-dark: rgba(28, 140, 130, 0.25);
                --rdp-outline: 2px solid var(--ec-gold);
                --rdp-outline-selected: 2px solid var(--ec-gold);
                margin: 0;
              }
              .rdp-day {
                border-radius: 50%;
                color: var(--ec-text);
                font-weight: 500;
              }
              .rdp-day:hover:not([disabled]):not(.rdp-day_selected) {
                background-color: rgba(28, 140, 130, 0.15);
                color: var(--ec-teal);
              }
              .rdp-day_selected {
                background: linear-gradient(135deg, rgba(28, 140, 130, 0.35), rgba(28, 140, 130, 0.25));
                border: 2px solid var(--ec-gold);
                box-shadow: 0 0 0 3px rgba(28, 140, 130, 0.20), 0 0 20px rgba(28, 140, 130, 0.30);
                font-weight: 700;
              }
              .rdp-day_today {
                border: 2px solid rgba(28, 140, 130, 0.40);
                background-color: rgba(28, 140, 130, 0.08);
              }
              .rdp-day[disabled] {
                opacity: 0.4;
                cursor: not-allowed;
              }
              .rdp-caption_label {
                color: var(--ec-text);
                font-weight: 600;
                font-size: 16px;
              }
              .rdp-nav_button {
                color: var(--ec-muted);
                border-radius: var(--ec-r-sm);
              }
              .rdp-nav_button:hover {
                background-color: var(--ec-card-2);
                color: var(--ec-text);
              }
              .rdp-head_cell {
                color: var(--ec-muted);
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.1em;
              }
            `}</style>
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={(date) => {
                const d = new Date(date);
                d.setHours(0, 0, 0, 0);
                return d < minDateObj || d > maxDateObj;
              }}
              fromDate={minDateObj}
              toDate={maxDateObj}
              className="text-ec-text"
            />
            <p className="mt-4 text-xs text-ec-muted text-center">
              Select your date — pricing updates dynamically based on availability.
            </p>
          </EcoviraCard>
        </div>
      )}
    </div>
  );
}
