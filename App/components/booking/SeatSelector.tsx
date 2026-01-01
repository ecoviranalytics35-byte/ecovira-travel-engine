"use client";

import { useState } from 'react';
import type { SeatSelection } from '@/lib/core/booking-extras';
import { EXTRAS_PRICING } from '@/lib/core/booking-extras';

interface SeatSelectorProps {
  cabinClass: 'economy' | 'business' | 'first';
  passengerCount: number;
  currency: string;
  onSeatsChange: (seats: SeatSelection[]) => void;
  initialSeats?: SeatSelection[];
}

// Mock seat map layout (3-3 configuration for economy, 2-2 for business/first)
const generateSeatMap = (cabinClass: 'economy' | 'business' | 'first') => {
  const rows = cabinClass === 'economy' ? 30 : 12;
  const config = cabinClass === 'economy' ? [3, 3] : [2, 2];
  
  const seats: Array<{ row: number; position: string; type: 'window' | 'aisle' | 'middle' | 'exit' | 'preferred'; available: boolean }> = [];
  
  for (let row = 1; row <= rows; row++) {
    const isExitRow = row === 10 || row === 20;
    const isPreferred = row <= 5;
    
    // Left side
    for (let i = 0; i < config[0]; i++) {
      const letter = String.fromCharCode(65 + i); // A, B, C or A, B
      const position = `${row}${letter}`;
      let type: 'window' | 'aisle' | 'middle' | 'exit' | 'preferred' = 'middle';
      
      if (i === 0) type = 'window';
      else if (i === config[0] - 1) type = 'aisle';
      else type = 'middle';
      
      if (isExitRow) type = 'exit';
      if (isPreferred && cabinClass === 'economy') type = 'preferred';
      
      seats.push({
        row,
        position,
        type,
        available: Math.random() > 0.3, // 70% available
      });
    }
    
    // Right side (aisle gap)
    for (let i = 0; i < config[1]; i++) {
      const letter = String.fromCharCode(65 + config[0] + i); // D, E, F or C, D
      const position = `${row}${letter}`;
      let type: 'window' | 'aisle' | 'middle' | 'exit' | 'preferred' = 'middle';
      
      if (i === 0) type = 'aisle';
      else if (i === config[1] - 1) type = 'window';
      else type = 'middle';
      
      if (isExitRow) type = 'exit';
      if (isPreferred && cabinClass === 'economy') type = 'preferred';
      
      seats.push({
        row,
        position,
        type,
        available: Math.random() > 0.3,
      });
    }
  }
  
  return seats;
};

export function SeatSelector({ cabinClass, passengerCount, currency, onSeatsChange, initialSeats = [] }: SeatSelectorProps) {
  const [selectedSeats, setSelectedSeats] = useState<SeatSelection[]>(initialSeats);
  const seatMap = generateSeatMap(cabinClass);
  
  const getSeatPrice = (seatType: string): number => {
    const pricing = EXTRAS_PRICING.seats[cabinClass];
    return (pricing as any)[seatType] || pricing.default;
  };
  
  const handleSeatClick = (position: string, type: string, available: boolean) => {
    if (!available) return;
    
    const price = getSeatPrice(type);
    const existingIndex = selectedSeats.findIndex(s => s.seatNumber === position);
    
    if (existingIndex >= 0) {
      // Deselect
      const newSeats = selectedSeats.filter((_, i) => i !== existingIndex);
      setSelectedSeats(newSeats);
      onSeatsChange(newSeats);
    } else {
      // Select (but limit to passenger count)
      if (selectedSeats.length >= passengerCount) {
        // Replace first selected seat
        const newSeats = [
          ...selectedSeats.slice(1),
          { seatNumber: position, seatType: type as any, price, currency },
        ];
        setSelectedSeats(newSeats);
        onSeatsChange(newSeats);
      } else {
        // Add new seat
        const newSeats = [
          ...selectedSeats,
          { seatNumber: position, seatType: type as any, price, currency },
        ];
        setSelectedSeats(newSeats);
        onSeatsChange(newSeats);
      }
    }
  };
  
  const isSelected = (position: string) => selectedSeats.some(s => s.seatNumber === position);
  
  // Group seats by row
  const seatsByRow: Record<number, typeof seatMap> = {};
  seatMap.forEach(seat => {
    if (!seatsByRow[seat.row]) seatsByRow[seat.row] = [];
    seatsByRow[seat.row].push(seat);
  });
  
  const totalSeatPrice = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold text-ec-text mb-1">Select Seats</h3>
          <p className="text-sm text-ec-muted">
            {selectedSeats.length} of {passengerCount} seat{passengerCount > 1 ? 's' : ''} selected
            {cabinClass === 'economy' && ' (Free for Economy)'}
          </p>
        </div>
        {totalSeatPrice > 0 && (
          <div className="text-right">
            <div className="text-sm text-ec-muted">Seat selection</div>
            <div className="text-lg font-semibold text-ec-text">{currency} {totalSeatPrice.toFixed(2)}</div>
          </div>
        )}
      </div>
      
      {/* Helper Text */}
      <div className="p-3 bg-[rgba(28,140,130,0.1)] rounded-ec-md border border-[rgba(28,140,130,0.2)]">
        <p className="text-sm text-ec-text">
          <strong className="text-ec-teal">Note:</strong> Seat selection is free for Economy. Business and First may incur a fee.
        </p>
      </div>
      
      {/* Seat Map */}
      <div className="bg-[rgba(15,17,20,0.6)] rounded-ec-lg border border-[rgba(28,140,130,0.25)] p-8 overflow-x-auto">
        <div className="mb-6 text-center">
          <div className="text-sm font-medium text-ec-muted mb-2">Front of Aircraft</div>
          <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[rgba(28,140,130,0.3)] to-transparent"></div>
        </div>
        
        {/* Seat Legend - Premium & Clear */}
        <div className="flex items-center justify-center gap-6 mb-8 pb-6 border-b border-[rgba(28,140,130,0.15)]">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg border-2 border-[rgba(28,140,130,0.6)] flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(28,140,130,0.25), rgba(28,140,130,0.15))',
              }}
            >
              <span className="text-white font-semibold text-sm">A</span>
            </div>
            <div>
              <div className="text-sm font-medium text-ec-text">Available</div>
              <div className="text-xs text-ec-muted">Click to select</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg border-2 flex items-center justify-center relative"
              style={{
                background: 'linear-gradient(135deg, #1C8C82, #0F6B63)',
                borderColor: '#1C8C82',
                boxShadow: '0 0 12px rgba(28,140,130,0.5), 0 0 24px rgba(28,140,130,0.3)',
              }}
            >
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <div>
              <div className="text-sm font-medium text-ec-text">Selected</div>
              <div className="text-xs text-ec-muted">Your choice</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg border-2 flex items-center justify-center"
              style={{
                background: 'rgba(60, 60, 60, 0.4)',
                borderColor: 'rgba(100, 100, 100, 0.4)',
              }}
            >
              <span className="text-ec-muted font-medium text-sm line-through">C</span>
            </div>
            <div>
              <div className="text-sm font-medium text-ec-muted">Occupied</div>
              <div className="text-xs text-ec-muted">Not available</div>
            </div>
          </div>
        </div>
        
        {/* Seat Grid - Spacious & Clear */}
        <div className="flex justify-center">
          <div className="space-y-3 min-w-max">
            {Object.entries(seatsByRow).map(([row, seats]) => {
              // Split seats into left and right sides for aisle gap
              const leftSeats = seats.filter(s => {
                const letter = s.position.slice(-1);
                return cabinClass === 'economy' 
                  ? ['A', 'B', 'C'].includes(letter)
                  : ['A', 'B'].includes(letter);
              });
              const rightSeats = seats.filter(s => {
                const letter = s.position.slice(-1);
                return cabinClass === 'economy'
                  ? ['D', 'E', 'F'].includes(letter)
                  : ['C', 'D'].includes(letter);
              });
              
              return (
                <div key={row} className="flex items-center gap-4">
                  {/* Row Number */}
                  <div className="w-10 text-right">
                    <span className="text-base font-semibold text-ec-text">{row}</span>
                  </div>
                  
                  {/* Left Side Seats */}
                  <div className="flex items-center gap-2">
                    {leftSeats.map((seat) => {
                      const selected = isSelected(seat.position);
                      const price = getSeatPrice(seat.type);
                      
                      return (
                        <button
                          key={seat.position}
                          type="button"
                          onClick={() => handleSeatClick(seat.position, seat.type, seat.available)}
                          disabled={!seat.available}
                          className={`
                            w-12 h-12 rounded-lg border-2 font-semibold text-sm transition-all duration-200
                            flex items-center justify-center relative
                            ${selected 
                              ? 'cursor-pointer' 
                              : seat.available
                              ? 'cursor-pointer hover:scale-110 hover:shadow-lg'
                              : 'cursor-not-allowed opacity-50'
                            }
                          `}
                          style={selected 
                            ? {
                                background: 'linear-gradient(135deg, #1C8C82, #0F6B63)',
                                borderColor: '#1C8C82',
                                color: '#FFFFFF',
                                boxShadow: '0 0 12px rgba(28,140,130,0.6), 0 0 24px rgba(28,140,130,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
                              }
                            : seat.available
                            ? {
                                background: 'linear-gradient(135deg, rgba(28,140,130,0.3), rgba(28,140,130,0.2))',
                                borderColor: 'rgba(28,140,130,0.6)',
                                color: '#FFFFFF',
                              }
                            : {
                                background: 'rgba(60, 60, 60, 0.4)',
                                borderColor: 'rgba(100, 100, 100, 0.4)',
                                color: 'rgba(237, 237, 237, 0.4)',
                              }
                          }
                          title={seat.available ? `${seat.position}${price > 0 ? ` - ${currency} ${price.toFixed(2)}` : ' - Free'}` : `${seat.position} - Occupied`}
                        >
                          {seat.position.slice(-1)}
                          {selected && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-ec-gold rounded-full border border-white"></div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Aisle Gap */}
                  <div className="w-8 flex items-center justify-center">
                    <div className="h-px w-full bg-[rgba(28,140,130,0.2)]"></div>
                  </div>
                  
                  {/* Right Side Seats */}
                  <div className="flex items-center gap-2">
                    {rightSeats.map((seat) => {
                      const selected = isSelected(seat.position);
                      const price = getSeatPrice(seat.type);
                      
                      return (
                        <button
                          key={seat.position}
                          type="button"
                          onClick={() => handleSeatClick(seat.position, seat.type, seat.available)}
                          disabled={!seat.available}
                          className={`
                            w-12 h-12 rounded-lg border-2 font-semibold text-sm transition-all duration-200
                            flex items-center justify-center relative
                            ${selected 
                              ? 'cursor-pointer' 
                              : seat.available
                              ? 'cursor-pointer hover:scale-110 hover:shadow-lg'
                              : 'cursor-not-allowed opacity-50'
                            }
                          `}
                          style={selected 
                            ? {
                                background: 'linear-gradient(135deg, #1C8C82, #0F6B63)',
                                borderColor: '#1C8C82',
                                color: '#FFFFFF',
                                boxShadow: '0 0 12px rgba(28,140,130,0.6), 0 0 24px rgba(28,140,130,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
                              }
                            : seat.available
                            ? {
                                background: 'linear-gradient(135deg, rgba(28,140,130,0.3), rgba(28,140,130,0.2))',
                                borderColor: 'rgba(28,140,130,0.6)',
                                color: '#FFFFFF',
                              }
                            : {
                                background: 'rgba(60, 60, 60, 0.4)',
                                borderColor: 'rgba(100, 100, 100, 0.4)',
                                color: 'rgba(237, 237, 237, 0.4)',
                              }
                          }
                          title={seat.available ? `${seat.position}${price > 0 ? ` - ${currency} ${price.toFixed(2)}` : ' - Free'}` : `${seat.position} - Occupied`}
                        >
                          {seat.position.slice(-1)}
                          {selected && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-ec-gold rounded-full border border-white"></div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[rgba(28,140,130,0.3)] to-transparent"></div>
          <div className="text-sm font-medium text-ec-muted mt-2">Rear of Aircraft</div>
        </div>
      </div>
      
      {/* Selected Seats Summary */}
      {selectedSeats.length > 0 && (
        <div className="p-5 bg-gradient-to-br from-[rgba(28,140,130,0.15)] to-[rgba(28,140,130,0.08)] rounded-ec-md border border-[rgba(28,140,130,0.3)]">
          <div className="text-base font-semibold text-ec-text mb-3 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-ec-teal"></div>
            Selected Seats
          </div>
          <div className="flex flex-wrap gap-3">
            {selectedSeats.map((seat, index) => (
              <div 
                key={index} 
                className="px-4 py-2 rounded-lg text-sm font-medium text-ec-text"
                style={{
                  background: 'linear-gradient(135deg, rgba(28,140,130,0.25), rgba(28,140,130,0.15))',
                  border: '1px solid rgba(28,140,130,0.4)',
                }}
              >
                <span className="font-semibold">{seat.seatNumber}</span>
                {seat.price > 0 && (
                  <span className="text-ec-muted ml-2">({currency} {seat.price.toFixed(2)})</span>
                )}
                {seat.price === 0 && (
                  <span className="text-ec-teal ml-2 text-xs">Free</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

