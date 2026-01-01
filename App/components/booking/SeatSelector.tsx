"use client";

import { useState, useEffect } from 'react';
import type { SeatSelection } from '@/lib/core/booking-extras';
import { EXTRAS_PRICING } from '@/lib/core/booking-extras';
import { X, ArrowLeft } from 'lucide-react';

interface SeatSelectorProps {
  cabinClass: 'economy' | 'business' | 'first';
  passengerCount: number;
  currency: string;
  onSeatsChange: (seats: SeatSelection[]) => void;
  initialSeats?: SeatSelection[];
  onClose?: () => void;
  onSkip?: () => void;
  onConfirm?: () => void;
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

export function SeatSelector({ cabinClass, passengerCount, currency, onSeatsChange, initialSeats = [], onClose, onSkip, onConfirm }: SeatSelectorProps) {
  const [selectedSeats, setSelectedSeats] = useState<SeatSelection[]>(initialSeats);
  const seatMap = generateSeatMap(cabinClass);
  
  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);
  
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
    <div 
      className="fixed inset-0 flex items-center justify-center p-2 md:p-4 bg-black/60 backdrop-blur-sm"
      style={{ 
        zIndex: 9999,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      {/* Luxury Centered Card - Full screen on mobile */}
      <div 
        className="w-full md:max-w-[780px] bg-[rgba(15,17,20,0.95)] backdrop-blur-xl border border-[rgba(28,140,130,0.3)] rounded-ec-lg shadow-[0_20px_60px_rgba(0,0,0,0.8)] flex flex-col"
        style={{
          maxHeight: '90vh',
          height: 'auto',
          zIndex: 10000,
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[rgba(28,140,130,0.2)]">
          <div className="flex-1">
            <h2 className="text-2xl font-serif font-semibold text-white mb-1">Choose your seat</h2>
            <p className="text-sm text-white/70">
              {cabinClass.charAt(0).toUpperCase() + cabinClass.slice(1)} Class • {passengerCount} passenger{passengerCount > 1 ? 's' : ''}
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-[rgba(28,140,130,0.15)] rounded-lg transition-colors text-white/70 hover:text-white"
            >
              <X size={20} />
            </button>
          )}
        </div>
        
        {/* Legend Row - Pill Chips */}
        <div className="px-6 py-4 border-b border-[rgba(28,140,130,0.15)]">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg border border-[rgba(28,140,130,0.5)] bg-[rgba(28,140,130,0.15)] flex items-center justify-center">
                <span className="text-white text-xs font-semibold">A</span>
              </div>
              <span className="text-sm text-white/90">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg border-2 border-[rgba(28,140,130,0.8)] bg-gradient-to-br from-[rgba(28,140,130,0.4)] to-[rgba(28,140,130,0.3)] flex items-center justify-center shadow-[0_0_8px_rgba(28,140,130,0.4)]">
                <span className="text-white text-xs font-bold">B</span>
              </div>
              <span className="text-sm text-white/90">Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg border border-[rgba(100,100,100,0.4)] bg-[rgba(60,60,60,0.3)] flex items-center justify-center opacity-50">
                <span className="text-white/40 text-xs font-medium line-through">C</span>
              </div>
              <span className="text-sm text-white/70">Occupied</span>
            </div>
          </div>
        </div>
        
        {/* Scrollable Seat Map Container */}
        <div 
          className="flex-1 overflow-y-auto px-6 py-6"
          style={{ 
            maxHeight: 'calc(90vh - 280px)',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {/* Front of Aircraft Label - Top Left */}
          <div className="mb-4">
            <span className="text-xs font-medium text-white/60">Front of aircraft</span>
          </div>
          
          {/* Seat Grid - Clean Fixed Layout */}
          <div className="flex justify-center">
            <div className="space-y-2">
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
                  <div key={row} className="flex items-center gap-3">
                    {/* Fixed Row Number - Left Aligned */}
                    <div className="w-8 text-right">
                      <span className="text-sm font-semibold text-white/90">{row}</span>
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
                              w-9 h-9 rounded-lg border font-semibold text-xs transition-all duration-200
                              flex items-center justify-center relative
                              ${selected 
                                ? 'cursor-pointer' 
                                : seat.available
                                ? 'cursor-pointer hover:scale-105 hover:shadow-[0_0_8px_rgba(28,140,130,0.4)]'
                                : 'cursor-not-allowed opacity-50'
                              }
                            `}
                            style={selected 
                              ? {
                                  background: 'linear-gradient(135deg, rgba(28,140,130,0.6), rgba(28,140,130,0.5))',
                                  borderColor: 'rgba(28,140,130,0.8)',
                                  color: '#FFFFFF',
                                  boxShadow: '0 0 8px rgba(28,140,130,0.5)',
                                }
                              : seat.available
                              ? {
                                  background: 'rgba(28,140,130,0.15)',
                                  borderColor: 'rgba(28,140,130,0.5)',
                                  color: '#FFFFFF',
                                  borderWidth: '1px',
                                }
                              : {
                                  background: 'rgba(60, 60, 60, 0.3)',
                                  borderColor: 'rgba(100, 100, 100, 0.4)',
                                  color: 'rgba(255,255,255,0.4)',
                                  borderWidth: '1px',
                                }
                            }
                            title={seat.available ? `${seat.position}${price > 0 ? ` - ${currency} ${price.toFixed(2)}` : ' - Free'}` : `${seat.position} - Occupied`}
                          >
                            {seat.position.slice(-1)}
                            {selected && (
                              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[rgba(200,162,77,0.9)] rounded-full border border-white"></div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    
                    {/* Aisle Gap */}
                    <div className="w-10 flex items-center justify-center">
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
                              w-9 h-9 rounded-lg border font-semibold text-xs transition-all duration-200
                              flex items-center justify-center relative
                              ${selected 
                                ? 'cursor-pointer' 
                                : seat.available
                                ? 'cursor-pointer hover:scale-105 hover:shadow-[0_0_8px_rgba(28,140,130,0.4)]'
                                : 'cursor-not-allowed opacity-50'
                              }
                            `}
                            style={selected 
                              ? {
                                  background: 'linear-gradient(135deg, rgba(28,140,130,0.6), rgba(28,140,130,0.5))',
                                  borderColor: 'rgba(28,140,130,0.8)',
                                  color: '#FFFFFF',
                                  boxShadow: '0 0 8px rgba(28,140,130,0.5)',
                                }
                              : seat.available
                              ? {
                                  background: 'rgba(28,140,130,0.15)',
                                  borderColor: 'rgba(28,140,130,0.5)',
                                  color: '#FFFFFF',
                                  borderWidth: '1px',
                                }
                              : {
                                  background: 'rgba(60, 60, 60, 0.3)',
                                  borderColor: 'rgba(100, 100, 100, 0.4)',
                                  color: 'rgba(255,255,255,0.4)',
                                  borderWidth: '1px',
                                }
                            }
                            title={seat.available ? `${seat.position}${price > 0 ? ` - ${currency} ${price.toFixed(2)}` : ' - Free'}` : `${seat.position} - Occupied`}
                          >
                            {seat.position.slice(-1)}
                            {selected && (
                              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[rgba(200,162,77,0.9)] rounded-full border border-white"></div>
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
          
          {/* Rear of Aircraft Label */}
          <div className="mt-4 text-center">
            <span className="text-xs font-medium text-white/60">Rear of aircraft</span>
          </div>
        </div>
        
        {/* Sticky Footer */}
        <div className="sticky bottom-0 p-6 border-t border-[rgba(28,140,130,0.2)] bg-[rgba(15,17,20,0.98)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              {selectedSeats.length > 0 ? (
                <div>
                  <div className="text-sm text-white/70 mb-1">Selected: {selectedSeats.map(s => s.seatNumber).join(', ')}</div>
                  <div className="text-lg font-semibold text-white">
                    {totalSeatPrice > 0 ? `${currency} ${totalSeatPrice.toFixed(2)}` : 'Free'}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-white/70">No seats selected</div>
              )}
            </div>
            <div className="flex items-center gap-3">
              {onSkip && (
                <button
                  onClick={onSkip}
                  className="px-6 py-2.5 rounded-lg border border-[rgba(28,140,130,0.3)] text-white/90 hover:bg-[rgba(28,140,130,0.15)] transition-colors text-sm font-medium"
                >
                  Skip
                </button>
              )}
              {onConfirm && (
                <button
                  onClick={onConfirm}
                  className="px-6 py-2.5 rounded-lg bg-gradient-to-br from-[rgba(28,140,130,0.5)] to-[rgba(28,140,130,0.4)] border border-[rgba(28,140,130,0.6)] text-white font-semibold text-sm shadow-[0_0_12px_rgba(28,140,130,0.3)] hover:shadow-[0_0_16px_rgba(28,140,130,0.4)] transition-all"
                >
                  Confirm seat{selectedSeats.length > 1 ? 's' : ''}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
