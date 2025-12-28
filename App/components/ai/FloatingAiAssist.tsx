"use client";

import { useState, useEffect } from 'react';
import { X, Sparkles, Plane, Hotel, Car, CarTaxiFront, MessageCircle } from 'lucide-react';
import { EcoviraCard } from '../EcoviraCard';
import { cn } from '../../lib/utils';

interface FloatingAiAssistProps {
  type: 'flights' | 'stays' | 'cars' | 'transfers';
  results: any[];
  selectedFlight?: any;
  selectedCar?: any;
  selectedTransfer?: any;
  selectedStay?: any;
  tripData?: {
    from?: string;
    to?: string;
    departDate?: string;
    returnDate?: string;
    adults?: number;
    nights?: number;
    days?: number;
  };
  chatContext?: any;
  onOpenChat?: () => void;
}

// Calculate simplified Value Score (0-10, rounded to 0.5)
function calculateValueScore(flight: any, allFlights: any[]): number {
  if (!flight || allFlights.length === 0) return 5.0;

  const price = parseFloat(flight.price || 0);
  const duration = parseFloat(flight.duration || '4') || 4;
  const stops = parseInt(flight.stops || '0') || 0;
  const allPrices = allFlights.map(f => parseFloat(f.price || 0)).filter(p => p > 0);
  const allDurations = allFlights.map(f => parseFloat(f.duration || '4') || 4).filter(d => d > 0);
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const minDuration = Math.min(...allDurations);
  const maxDuration = Math.max(...allDurations);

  // Price score (0-10): Lower price = higher score
  const priceScore = maxPrice > minPrice 
    ? 10 - ((price - minPrice) / (maxPrice - minPrice)) * 5
    : 10;

  // Duration score (0-10): Shorter = higher
  const durationScore = maxDuration > minDuration
    ? 10 - ((duration - minDuration) / (maxDuration - minDuration)) * 3
    : 10;

  // Stops penalty: Direct = 10, 1 stop = 7, 2+ stops = 4
  const stopsScore = stops === 0 ? 10 : stops === 1 ? 7 : 4;

  // Weighted overall (price 40%, duration 30%, stops 30%)
  const overall = (priceScore * 0.4 + durationScore * 0.3 + stopsScore * 0.3);
  
  // Round to nearest 0.5
  return Math.round(overall * 2) / 2;
}

// Generate human-readable verdict and reason
function generateVerdict(flight: any, allFlights: any[], score: number): { verdict: string; reason: string; warnings: string[]; tip?: string } {
  const price = parseFloat(flight.price || 0);
  const duration = parseFloat(flight.duration || '4') || 4;
  const stops = parseInt(flight.stops || '0') || 0;
  const allPrices = allFlights.map(f => parseFloat(f.price || 0)).filter(p => p > 0);
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const hasDirect = allFlights.some(f => parseInt(f.stops || '0') === 0);
  const priceDiff = price - minPrice;
  const pricePercentDiff = minPrice > 0 ? (priceDiff / minPrice) * 100 : 0;

  const warnings: string[] = [];
  let tip: string | undefined;

  // Determine verdict
  let verdict: string;
  let reason: string;

  if (score >= 7.5) {
    verdict = "✅ Good value for your trip";
    if (stops === 0 && pricePercentDiff < 20) {
      reason = "This direct flight balances price and convenience well.";
    } else if (stops === 0) {
      reason = "This direct flight is worth the extra cost if you want to avoid stops.";
    } else if (pricePercentDiff < 15) {
      reason = "This option balances price and travel time well, with minimal stops.";
    } else {
      reason = "This is a solid choice if you want the lowest price without major downsides.";
    }
  } else if (score >= 5.5) {
    verdict = "⚠️ Decent option — consider alternatives";
    if (pricePercentDiff > 30) {
      reason = "This flight is more expensive than other options, but the schedule might work better for you.";
    } else if (stops > 1) {
      reason = "This flight is cheap, but multiple stops increase total travel time significantly.";
    } else {
      reason = "This option is okay, but there might be better value elsewhere.";
    }
  } else {
    verdict = "⚠️ Not great value — consider alternatives";
    if (pricePercentDiff > 40 && stops > 0) {
      reason = "This flight is expensive and includes stops, making it less attractive than other options.";
    } else if (pricePercentDiff > 40) {
      reason = "This flight is significantly more expensive than alternatives with similar schedules.";
    } else if (stops > 1) {
      reason = "This flight is cheap, but the long stopover increases total travel time.";
    } else {
      reason = "This option has drawbacks that make it less appealing than other choices.";
    }
  }

  // Generate warnings (max 3)
  if (pricePercentDiff > 25 && pricePercentDiff <= 40) {
    warnings.push(`Price is ${Math.round(pricePercentDiff)}% higher than cheapest option`);
  } else if (pricePercentDiff > 40) {
    warnings.push(`Price is significantly higher (${Math.round(pricePercentDiff)}% more than cheapest)`);
  }

  if (stops === 1) {
    warnings.push(`Includes 1 stop (adds ~2h total travel time)`);
  } else if (stops > 1) {
    warnings.push(`Includes ${stops} stops (adds ~${stops * 2}h total travel time)`);
  }

  if (hasDirect && stops > 0) {
    const directPrice = allFlights.find(f => parseInt(f.stops || '0') === 0)?.price;
    if (directPrice && parseFloat(directPrice) - price < price * 0.3) {
      warnings.push(`Direct flights available for similar price`);
    }
  }

  // Generate smart tip (optional)
  if (pricePercentDiff > 20 && pricePercentDiff < 35) {
    tip = `Flying earlier or later could save around ${flight.currency || 'USD'} ${Math.round(priceDiff * 0.3)}.`;
  } else if (stops > 0 && hasDirect) {
    const directOption = allFlights.find(f => parseInt(f.stops || '0') === 0);
    if (directOption) {
      const directPrice = parseFloat(directOption.price || 0);
      const extraCost = directPrice - price;
      if (extraCost > 0 && extraCost < price * 0.4) {
        tip = `Paying ${Math.round(extraCost)} more for a direct flight might be worth it.`;
      }
    }
  }

  return { verdict, reason, warnings: warnings.slice(0, 3), tip };
}

export function FloatingAiAssist({ type, results, selectedFlight, selectedCar, selectedTransfer, selectedStay, tripData, chatContext, onOpenChat }: FloatingAiAssistProps) {
  const [isOpen, setIsOpen] = useState(false);
  // No need for activeTab state - we only show one tab per page
  const [analyzingFlight, setAnalyzingFlight] = useState<any>(null);

  useEffect(() => {
    const selected = selectedFlight || selectedCar || selectedTransfer || selectedStay;
    if (selected) {
      setAnalyzingFlight(selected);
    } else if (results.length > 0) {
      // Default to cheapest
      const cheapest = results.reduce((min, f) => 
        parseFloat(f.price || f.total || 0) < parseFloat(min.price || min.total || 0) ? f : min, results[0]
      );
      setAnalyzingFlight(cheapest);
    }
  }, [selectedFlight, selectedCar, selectedTransfer, selectedStay, results]);

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
  const verdictData = currentFlight && valueScore !== null ? generateVerdict(currentFlight, results, valueScore) : null;

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
          className="fixed bottom-[96px] right-6 z-[9999] w-[400px] max-h-[500px] flex flex-col"
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
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[rgba(15,17,20,0.4)]" style={{ maxHeight: 'calc(500px - 180px)' }}>
              {/* Flights Tab */}
              {type === 'flights' && bestOptions && currentFlight && valueScore !== null && verdictData && (
                <>
                  {/* Clear Verdict - TOP, BIG TEXT */}
                  <div className="mb-4">
                    <div className="text-2xl md:text-3xl font-bold text-ec-text mb-3 leading-tight">
                      {verdictData.verdict}
                    </div>
                    <div className="text-base text-ec-muted leading-relaxed mb-4">
                      {verdictData.reason}
                    </div>
                  </div>

                  {/* Value Score - Single, Rounded */}
                  <div className="mb-4 pb-4 border-b border-[rgba(28,140,130,0.15)]">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl font-bold text-ec-text">{valueScore}/10</div>
                      <div className="text-sm text-ec-muted">Ecovira Value Score</div>
                    </div>
                  </div>

                  {/* What to Know - MAX 3 bullets */}
                  {verdictData.warnings.length > 0 && (
                    <div className="mb-4">
                      <div className="text-sm font-medium text-ec-text mb-2">What to know:</div>
                      <ul className="space-y-1.5 text-sm text-ec-muted">
                        {verdictData.warnings.map((warning, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-ec-teal mt-0.5">•</span>
                            <span>{warning}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Smart Tip - OPTIONAL, 1 line */}
                  {verdictData.tip && (
                    <div className="mb-4 p-3 bg-[rgba(200,162,77,0.1)] border border-[rgba(200,162,77,0.2)] rounded-ec-sm">
                      <div className="text-sm text-ec-text flex items-start gap-2">
                        <span className="text-ec-gold">💡</span>
                        <span>{verdictData.tip}</span>
                      </div>
                    </div>
                  )}

                  {/* Best Options - Clean & Minimal, only if meaningfully different */}
                  {(() => {
                    const cheapestPrice = parseFloat(bestOptions.cheapest.price || '0');
                    const fastestPrice = parseFloat(bestOptions.fastest.price || '0');
                    const bestValuePrice = parseFloat(bestOptions.bestValue.price || '0');
                    const priceRange = Math.max(cheapestPrice, fastestPrice, bestValuePrice) - Math.min(cheapestPrice, fastestPrice, bestValuePrice);
                    const isAllSimilar = priceRange < cheapestPrice * 0.1; // Within 10%

                    if (isAllSimilar) {
                      return (
                        <div className="text-sm text-ec-muted">
                          All options are similarly priced today.
                        </div>
                      );
                    }

                    return (
                      <div>
                        <div className="text-sm font-medium text-ec-text mb-2">Best options:</div>
                        <div className="space-y-1.5 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-ec-muted">Cheapest</span>
                            <span className="text-ec-text font-semibold">{bestOptions.cheapest.currency || 'USD'} {bestOptions.cheapest.price}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-ec-muted">Fastest</span>
                            <span className="text-ec-text font-semibold">{bestOptions.fastest.currency || 'USD'} {bestOptions.fastest.price}</span>
                          </div>
                          <div className="flex justify-between items-center pt-1 border-t border-[rgba(28,140,130,0.15)]">
                            <span className="text-ec-gold font-medium">Best Balance</span>
                            <span className="text-ec-text font-semibold">{bestOptions.bestValue.currency || 'USD'} {bestOptions.bestValue.price}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
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
