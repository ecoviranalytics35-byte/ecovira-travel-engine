"use client";

import { useState, useEffect } from 'react';
import { X, Sparkles, Plane, Hotel, Car, CarTaxiFront, MessageCircle } from 'lucide-react';
import { EcoviraCard } from '../EcoviraCard';
import { cn } from '../../lib/utils';

interface FloatingAiAssistProps {
  type: 'flights' | 'stays' | 'cars' | 'transfers';
  results: any[];
  selectedFlight?: any;
  tripData?: {
    from?: string;
    to?: string;
    departDate?: string;
    returnDate?: string;
    adults?: number;
    nights?: number;
    days?: number;
  };
  onOpenChat?: () => void;
}

// Calculate AI Value Score (0-100)
function calculateValueScore(flight: any, allFlights: any[]): {
  overall: number;
  priceFairness: number;
  durationEfficiency: number;
  stopsPenalty: number;
  departureConvenience: number;
} {
  if (!flight || allFlights.length === 0) {
    return { overall: 0, priceFairness: 0, durationEfficiency: 0, stopsPenalty: 0, departureConvenience: 0 };
  }

  const price = parseFloat(flight.price || 0);
  const duration = parseFloat(flight.duration || '4') || 4;
  const stops = parseInt(flight.stops || '0') || 0;
  const allPrices = allFlights.map(f => parseFloat(f.price || 0)).filter(p => p > 0);
  const allDurations = allFlights.map(f => parseFloat(f.duration || '4') || 4).filter(d => d > 0);
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const minDuration = Math.min(...allDurations);
  const maxDuration = Math.max(...allDurations);

  // Price Fairness (0-100): Lower price = higher score
  const priceFairness = maxPrice > minPrice 
    ? Math.round(100 - ((price - minPrice) / (maxPrice - minPrice)) * 100)
    : 100;

  // Duration Efficiency (0-100): Shorter duration = higher score
  const durationEfficiency = maxDuration > minDuration
    ? Math.round(100 - ((duration - minDuration) / (maxDuration - minDuration)) * 100)
    : 100;

  // Stops Penalty (0-100): Direct = 100, 1 stop = 60, 2+ stops = 30
  const stopsPenalty = stops === 0 ? 100 : stops === 1 ? 60 : 30;

  // Departure Convenience (0-100): Morning/afternoon = 100, evening = 80, late night = 60
  const departureConvenience = 85; // Placeholder - would parse departure time

  // Overall weighted score
  const overall = Math.round(
    priceFairness * 0.35 +
    durationEfficiency * 0.25 +
    stopsPenalty * 0.25 +
    departureConvenience * 0.15
  );

  return { overall, priceFairness, durationEfficiency, stopsPenalty, departureConvenience };
}

// Estimate CO₂ (kg) - simplified model
function estimateCO2(distance: number, stops: number): number | null {
  // Rough estimate: ~0.2 kg CO₂ per km for short-haul, ~0.15 for long-haul
  // With stops penalty
  const baseCO2 = distance * 0.18;
  const stopsMultiplier = 1 + (stops * 0.15);
  return Math.round(baseCO2 * stopsMultiplier);
}

// Generate actionable tips
function generateTips(flight: any, allFlights: any[], score: any): string[] {
  const tips: string[] = [];
  
  if (score.priceFairness < 50) {
    tips.push("Consider alternative dates for better prices");
  }
  
  if (parseInt(flight.stops || '0') > 0) {
    tips.push("Avoid 1 stop if time-sensitive");
  }
  
  if (score.durationEfficiency < 60) {
    tips.push("Earlier departure reduces delays");
  }
  
  const hasDirect = allFlights.some(f => parseInt(f.stops || '0') === 0);
  if (parseInt(flight.stops || '0') > 0 && hasDirect) {
    tips.push("This route has higher CO₂ — consider direct option");
  }

  return tips.length > 0 ? tips : ["This option offers good value for your criteria"];
}

export function FloatingAiAssist({ type, results, selectedFlight, tripData, onOpenChat }: FloatingAiAssistProps) {
  const [isOpen, setIsOpen] = useState(false);
  // No need for activeTab state - we only show one tab per page
  const [analyzingFlight, setAnalyzingFlight] = useState<any>(null);

  useEffect(() => {
    if (selectedFlight) {
      setAnalyzingFlight(selectedFlight);
    } else if (results.length > 0) {
      // Default to cheapest
      const cheapest = results.reduce((min, f) => 
        parseFloat(f.price || 0) < parseFloat(min.price || 0) ? f : min, results[0]
      );
      setAnalyzingFlight(cheapest);
    }
  }, [selectedFlight, results]);

  if (!results || !Array.isArray(results) || results.length === 0) {
    return null;
  }

  // Calculate best options (smarter logic)
  const calculateBestOptions = () => {
    if (type !== 'flights' || results.length === 0) return null;
    
    const cheapest = results.reduce((min, f) => 
      parseFloat(f.price || 0) < parseFloat(min.price || 0) ? f : min, results[0]
    );
    
    const fastest = results.reduce((min, f) => {
      const minDuration = parseFloat(min.duration || '999') || 999;
      const fDuration = parseFloat(f.duration || '999') || 999;
      return fDuration < minDuration ? f : min;
    }, results[0]);
    
    // Best Value: weighted score (price 40%, duration 30%, stops 30%)
    const bestValue = results.reduce((best, f) => {
      const bestPrice = parseFloat(best.price || 0);
      const fPrice = parseFloat(f.price || 0);
      const bestDuration = parseFloat(best.duration || '4') || 4;
      const fDuration = parseFloat(f.duration || '4') || 4;
      const bestStops = parseInt(best.stops || '0') || 0;
      const fStops = parseInt(f.stops || '0') || 0;
      
      const allPrices = results.map(r => parseFloat(r.price || 0));
      const allDurations = results.map(r => parseFloat(r.duration || '4') || 4);
      const minPrice = Math.min(...allPrices);
      const maxPrice = Math.max(...allPrices);
      const minDuration = Math.min(...allDurations);
      const maxDuration = Math.max(...allDurations);
      
      const bestPriceScore = maxPrice > minPrice ? (maxPrice - bestPrice) / (maxPrice - minPrice) : 1;
      const bestDurationScore = maxDuration > minDuration ? (maxDuration - bestDuration) / (maxDuration - minDuration) : 1;
      const bestStopsScore = bestStops === 0 ? 1 : bestStops === 1 ? 0.6 : 0.3;
      const bestTotal = bestPriceScore * 0.4 + bestDurationScore * 0.3 + bestStopsScore * 0.3;
      
      const fPriceScore = maxPrice > minPrice ? (maxPrice - fPrice) / (maxPrice - minPrice) : 1;
      const fDurationScore = maxDuration > minDuration ? (maxDuration - fDuration) / (maxDuration - minDuration) : 1;
      const fStopsScore = fStops === 0 ? 1 : fStops === 1 ? 0.6 : 0.3;
      const fTotal = fPriceScore * 0.4 + fDurationScore * 0.3 + fStopsScore * 0.3;
      
      return fTotal > bestTotal ? f : best;
    }, results[0]);

    // Check for ties
    const isTie = (a: any, b: any) => {
      return Math.abs(parseFloat(a.price || 0) - parseFloat(b.price || 0)) < 0.01 &&
             Math.abs((parseFloat(a.duration || '4') || 4) - (parseFloat(b.duration || '4') || 4)) < 0.1;
    };

    return {
      cheapest,
      fastest,
      bestValue,
      isCheapestTie: results.filter(f => Math.abs(parseFloat(f.price || 0) - parseFloat(cheapest.price || 0)) < 0.01).length > 1,
      isFastestTie: results.filter(f => Math.abs((parseFloat(f.duration || '4') || 4) - (parseFloat(fastest.duration || '4') || 4)) < 0.1).length > 1,
    };
  };

  const bestOptions = calculateBestOptions();
  const currentFlight = analyzingFlight || (results.length > 0 ? results[0] : null);
  const valueScore = currentFlight ? calculateValueScore(currentFlight, results) : null;
  const co2Estimate = currentFlight ? estimateCO2(800, parseInt(currentFlight.stops || '0')) : null; // Placeholder distance
  const tips = currentFlight && valueScore ? generateTips(currentFlight, results, valueScore) : [];

  // Only show tabs for the current page type (page-specific mode)
  const tabs = [
    { id: type, label: type.charAt(0).toUpperCase() + type.slice(1), icon: type === 'flights' ? Plane : type === 'stays' ? Hotel : type === 'cars' ? Car : CarTaxiFront },
  ];

  // Extract icon component for JSX rendering
  const Icon = tabs[0]?.icon;

  return (
    <>
      {/* Collapsed Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-[96px] right-6 z-[9999] px-4 py-3 bg-gradient-to-br from-[rgba(28,140,130,0.95)] to-[rgba(28,140,130,0.85)] border-2 border-[rgba(28,140,130,0.6)] rounded-full text-ec-text font-semibold shadow-[0_0_12px_rgba(28,140,130,0.4),0_0_24px_rgba(28,140,130,0.3),0_8px_32px_rgba(0,0,0,0.4)] hover:shadow-[0_0_18px_rgba(28,140,130,0.6),0_0_32px_rgba(28,140,130,0.4),0_12px_40px_rgba(0,0,0,0.5)] transition-all flex items-center gap-2"
          style={{ 
            position: 'fixed', 
            bottom: '96px', 
            right: '24px', 
            zIndex: 9999,
            display: 'block',
            opacity: 1,
            visibility: 'visible'
          }}
          aria-label="Open AI Assist"
        >
          <Sparkles size={20} />
          <span>AI Assist</span>
        </button>
      )}

      {/* Expanded Panel */}
      {isOpen && (
        <div 
          className="fixed bottom-[96px] right-6 z-[9999] w-[400px] max-h-[75vh] flex flex-col"
          style={{ position: 'fixed', bottom: '96px', right: '24px', zIndex: 9999 }}
        >
          <EcoviraCard variant="glass" className="flex-1 flex flex-col p-0 shadow-[0_20px_60px_rgba(0,0,0,0.55)] overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-[rgba(28,140,130,0.22)] bg-[rgba(21,24,29,0.95)]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles size={20} className="text-ec-teal" />
                  <div>
                    <h3 className="text-lg font-semibold text-ec-text">Ecovira AI Assist</h3>
                    <p className="text-xs text-ec-muted">Helping you pick the best option</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 flex items-center justify-center text-ec-muted hover:text-ec-text hover:bg-[rgba(28,140,130,0.15)] rounded-ec-sm transition-colors"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
              {onOpenChat && (
                <button
                  onClick={onOpenChat}
                  className="w-full mt-3 px-3 py-2 bg-[rgba(28,140,130,0.15)] hover:bg-[rgba(28,140,130,0.25)] border border-[rgba(28,140,130,0.3)] rounded-ec-sm text-sm text-ec-text font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircle size={16} />
                  <span>Ask about this trip</span>
                </button>
              )}
            </div>

            {/* Page-specific header (no tabs needed for single mode) */}
            <div className="px-4 py-2 border-b border-[rgba(28,140,130,0.15)] bg-[rgba(15,17,20,0.4)]">
              <div className="flex items-center gap-2 text-sm text-ec-text font-medium">
                {Icon && <Icon size={16} />}
                <span>{tabs[0]?.label} Insights</span>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[rgba(15,17,20,0.4)]">
              {/* Flights Tab */}
              {type === 'flights' && bestOptions && currentFlight && valueScore && (
                <>
                  {/* Value Score Card */}
                  <div className="p-4 bg-gradient-to-br from-[rgba(28,140,130,0.15)] to-[rgba(15,17,20,0.6)] rounded-ec-md border border-[rgba(28,140,130,0.25)]">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-xs text-ec-muted uppercase tracking-[0.12em] mb-1">Ecovira AI Value Score</div>
                        <div className="text-3xl font-bold text-ec-text">{valueScore.overall}/100</div>
                      </div>
                      <div className="text-right text-xs text-ec-muted">
                        {selectedFlight ? 'Selected flight' : 'Currently analyzing: Cheapest option'}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div>
                        <div className="text-xs text-ec-muted mb-1">Price Fairness</div>
                        <div className="text-sm font-semibold text-ec-text">{valueScore.priceFairness}/100</div>
                      </div>
                      <div>
                        <div className="text-xs text-ec-muted mb-1">Duration Efficiency</div>
                        <div className="text-sm font-semibold text-ec-text">{valueScore.durationEfficiency}/100</div>
                      </div>
                      <div>
                        <div className="text-xs text-ec-muted mb-1">Stops Penalty</div>
                        <div className="text-sm font-semibold text-ec-text">{valueScore.stopsPenalty}/100</div>
                      </div>
                      <div>
                        <div className="text-xs text-ec-muted mb-1">Departure Convenience</div>
                        <div className="text-sm font-semibold text-ec-text">{valueScore.departureConvenience}/100</div>
                      </div>
                    </div>
                    {co2Estimate !== null ? (
                      <div className="mt-3 pt-3 border-t border-[rgba(28,140,130,0.15)]">
                        <div className="text-xs text-ec-muted mb-1">CO₂ Estimate</div>
                        <div className="text-sm font-semibold text-ec-text">{co2Estimate} kg</div>
                      </div>
                    ) : (
                      <div className="mt-3 pt-3 border-t border-[rgba(28,140,130,0.15)]">
                        <div className="text-xs text-ec-muted">CO₂ Estimate unavailable</div>
                      </div>
                    )}
                  </div>

                  {/* Actionable Tips */}
                  {tips.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-ec-text mb-2">Actionable Tips</h4>
                      <div className="space-y-2">
                        {tips.map((tip, i) => (
                          <div key={i} className="p-3 bg-[rgba(15,17,20,0.5)] rounded-ec-sm border border-[rgba(28,140,130,0.15)] text-sm text-ec-text">
                            • {tip}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Best Options */}
                  <div>
                    <h4 className="text-sm font-semibold text-ec-text mb-3">Best Options</h4>
                    <div className="space-y-2">
                      <div className="p-3 bg-[rgba(15,17,20,0.4)] rounded-ec-sm border border-[rgba(28,140,130,0.15)]">
                        <div className="text-xs text-ec-muted mb-1">
                          Cheapest {bestOptions.isCheapestTie && '(Tie)'}
                        </div>
                        <div className="text-sm font-semibold text-ec-text">
                          {bestOptions.cheapest.currency || 'USD'} {bestOptions.cheapest.price}
                        </div>
                      </div>
                      <div className="p-3 bg-[rgba(15,17,20,0.4)] rounded-ec-sm border border-[rgba(28,140,130,0.15)]">
                        <div className="text-xs text-ec-muted mb-1">
                          Fastest {bestOptions.isFastestTie && '(Tie)'}
                        </div>
                        <div className="text-sm font-semibold text-ec-text">
                          {bestOptions.fastest.currency || 'USD'} {bestOptions.fastest.price}
                        </div>
                      </div>
                      <div className="p-3 bg-[rgba(15,17,20,0.4)] rounded-ec-sm border border-[rgba(200,162,77,0.25)]">
                        <div className="text-xs text-ec-gold mb-1">Best Value</div>
                        <div className="text-sm font-semibold text-ec-text">
                          {bestOptions.bestValue.currency || 'USD'} {bestOptions.bestValue.price}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Service Fee Calculator */}
                  <div>
                    <h4 className="text-sm font-semibold text-ec-text mb-3">Service Fee</h4>
                    <div className="p-3 bg-[rgba(15,17,20,0.4)] rounded-ec-sm space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-ec-muted">Base:</span>
                        <span className="text-ec-text">{currentFlight.currency || 'USD'} {(parseFloat(currentFlight.price || '0') / 1.04).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ec-muted">Fee (4%):</span>
                        <span className="text-ec-gold">+{currentFlight.currency || 'USD'} {(parseFloat(currentFlight.price || '0') * 0.04 / 1.04).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-[rgba(28,140,130,0.15)]">
                        <span className="text-ec-text font-semibold">Total:</span>
                        <span className="text-ec-text font-semibold">{currentFlight.currency || 'USD'} {currentFlight.price}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Stays Tab */}
              {type === 'stays' && results.length > 0 && tripData?.nights && (
                <>
                  <div>
                    <h4 className="text-base font-semibold text-ec-text mb-3">Total Trip Cost</h4>
                    <div className="p-4 bg-gradient-to-br from-[rgba(28,140,130,0.15)] to-[rgba(15,17,20,0.6)] rounded-ec-md border border-[rgba(28,140,130,0.25)]">
                      {(() => {
                        const bestValue = results.reduce((best, s) => {
                          const bestPricePerNight = parseFloat(best.total || '0') / tripData.nights!;
                          const sPricePerNight = parseFloat(s.total || '0') / tripData.nights!;
                          return sPricePerNight < bestPricePerNight ? s : best;
                        }, results[0]);
                        const ratePerNight = parseFloat(bestValue.total || '0') / tripData.nights;
                        const estimatedTaxes = parseFloat(bestValue.total || '0') * 0.1;
                        const total = parseFloat(bestValue.total || '0') * 1.1;
                        return (
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-ec-muted">Rate per night:</span>
                              <span className="text-ec-text">{bestValue.currency || 'USD'} {ratePerNight.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-ec-muted">Nights:</span>
                              <span className="text-ec-text">{tripData.nights}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-ec-muted">Estimated taxes:</span>
                              <span className="text-ec-text">{bestValue.currency || 'USD'} {estimatedTaxes.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-[rgba(28,140,130,0.15)]">
                              <span className="text-ec-text font-semibold">Total:</span>
                              <span className="text-ec-text font-semibold">{bestValue.currency || 'USD'} {total.toFixed(2)}</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-ec-text mb-3">Best Value</h4>
                    <div className="p-3 bg-[rgba(15,17,20,0.4)] rounded-ec-sm border border-[rgba(28,140,130,0.15)] text-sm text-ec-text">
                      {(() => {
                        const bestValue = results.reduce((best, s) => {
                          const bestPricePerNight = parseFloat(best.total || '0') / tripData.nights!;
                          const sPricePerNight = parseFloat(s.total || '0') / tripData.nights!;
                          return sPricePerNight < bestPricePerNight ? s : best;
                        }, results[0]);
                        return `Based on location, rating, and price, ${bestValue.name || 'this option'} offers the best value at ${bestValue.currency || 'USD'} ${(parseFloat(bestValue.total || '0') / tripData.nights).toFixed(2)} per night.`;
                      })()}
                    </div>
                  </div>
                </>
              )}

              {/* Cars Tab */}
              {type === 'cars' && results.length > 0 && tripData?.days && (
                <>
                  <div>
                    <h4 className="text-base font-semibold text-ec-text mb-3">Rental Estimate</h4>
                    <div className="p-4 bg-gradient-to-br from-[rgba(28,140,130,0.15)] to-[rgba(15,17,20,0.6)] rounded-ec-md border border-[rgba(28,140,130,0.25)]">
                      {(() => {
                        const bestOption = results[0];
                        const dailyRate = parseFloat(bestOption.total || '0') / tripData.days;
                        const insuranceEstimate = parseFloat(bestOption.total || '0') * 0.15;
                        const total = parseFloat(bestOption.total || '0') * 1.15;
                        return (
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-ec-muted">Daily rate:</span>
                              <span className="text-ec-text">{bestOption.currency || 'USD'} {dailyRate.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-ec-muted">Days:</span>
                              <span className="text-ec-text">{tripData.days}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-ec-muted">Insurance estimate:</span>
                              <span className="text-ec-text">{bestOption.currency || 'USD'} {insuranceEstimate.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-[rgba(28,140,130,0.15)]">
                              <span className="text-ec-text font-semibold">Total:</span>
                              <span className="text-ec-text font-semibold">{bestOption.currency || 'USD'} {total.toFixed(2)}</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-ec-text mb-3">Fuel Estimate</h4>
                    <div className="p-3 bg-[rgba(15,17,20,0.4)] rounded-ec-sm border border-[rgba(28,140,130,0.15)] text-sm text-ec-text">
                      Estimate fuel cost based on distance. Average fuel consumption: ~0.15 per km. Enter your estimated distance in the search to get a precise calculation.
                    </div>
                  </div>
                </>
              )}

              {/* Transfers Tab */}
              {type === 'transfers' && results.length > 0 && (
                <>
                  <div>
                    <h4 className="text-base font-semibold text-ec-text mb-3">Price Estimate</h4>
                    <div className="p-4 bg-gradient-to-br from-[rgba(28,140,130,0.15)] to-[rgba(15,17,20,0.6)] rounded-ec-md border border-[rgba(28,140,130,0.25)]">
                      <div className="text-sm text-ec-text">
                        Estimated price: <span className="font-semibold text-lg">{results[0].currency || 'USD'} {results[0].total || '0.00'}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-ec-text mb-3">Best Pickup Time</h4>
                    <div className="p-3 bg-[rgba(15,17,20,0.4)] rounded-ec-sm border border-[rgba(28,140,130,0.15)] text-sm text-ec-text">
                      For flight arrivals, we recommend booking your transfer 30-45 minutes after scheduled landing time to account for baggage claim and customs. This ensures a smooth pickup experience.
                    </div>
                  </div>
                </>
              )}
            </div>
          </EcoviraCard>
        </div>
      )}
    </>
  );
}
