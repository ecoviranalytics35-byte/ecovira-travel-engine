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

// Calculate Premium Value Score (0-10, realistic, never 10/10 unless truly exceptional)
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

  // Price score (0-8): Lower price = higher score, but cap at 8 to avoid 10/10
  const priceScore = maxPrice > minPrice 
    ? 8 - ((price - minPrice) / (maxPrice - minPrice)) * 4
    : 8;

  // Duration score (0-8): Shorter = higher, cap at 8
  const durationScore = maxDuration > minDuration
    ? 8 - ((duration - minDuration) / (maxDuration - minDuration)) * 3
    : 8;

  // Stops penalty: Direct = 8, 1 stop = 6, 2+ stops = 3
  const stopsScore = stops === 0 ? 8 : stops === 1 ? 6 : 3;

  // Departure time comfort (if available in raw data, otherwise neutral)
  let timeScore = 5; // Neutral default
  if (flight.raw?.departureTime || flight.departureTime) {
    const depTime = flight.raw?.departureTime || flight.departureTime;
    const hour = new Date(depTime).getHours();
    // Morning (6-10) and afternoon (14-18) are best, red-eye (22-6) and very early (4-6) are worst
    if (hour >= 6 && hour < 10) timeScore = 7; // Good morning
    else if (hour >= 10 && hour < 14) timeScore = 6; // Midday
    else if (hour >= 14 && hour < 18) timeScore = 7; // Afternoon
    else if (hour >= 18 && hour < 22) timeScore = 5; // Evening
    else timeScore = 4; // Red-eye or very early
  }

  // Weighted overall (price 35%, duration 25%, stops 25%, time 15%)
  const overall = (priceScore * 0.35 + durationScore * 0.25 + stopsScore * 0.25 + timeScore * 0.15);
  
  // Cap at 9.5 to avoid unrealistic 10/10 scores
  const capped = Math.min(overall, 9.5);
  
  // Round to 1 decimal place for realistic scores
  return Math.round(capped * 10) / 10;
}

// Premium Intelligence Analysis
interface PremiumAnalysis {
  comfort: {
    stops: { count: number; quality: 'direct' | 'short' | 'ideal' | 'long' | 'unknown'; duration?: string };
    totalTime: { hours: number; vsDirect: 'same' | 'faster' | 'slower' | 'unknown'; penalty?: string };
    departureTime: { time: string | null; comfort: 'convenient' | 'okay' | 'red-eye' | 'very-early' | 'unknown' };
    layoverRisk: 'low' | 'medium' | 'high' | 'unknown';
    airportQuality: 'major-hub' | 'smaller' | 'unknown';
  };
  practical: {
    baggageIncluded: 'yes' | 'no' | 'unknown';
    changeFlexibility: 'flexible' | 'restricted' | 'unknown';
    reliability: { risk: 'low' | 'medium' | 'high' | 'unknown'; reason?: string };
  };
  price: {
    position: 'cheapest' | 'below-average' | 'average' | 'above-average' | 'premium';
    serviceFee: string;
    currencyNote?: string;
  };
}

// Extract premium factors from flight data (only use available data, never invent)
function analyzePremiumFactors(flight: any, allFlights: any[]): PremiumAnalysis {
  const stops = parseInt(flight.stops || '0') || 0;
  const duration = parseFloat(flight.duration || '4') || 4;
  const price = parseFloat(flight.price || 0);
  const allPrices = allFlights.map(f => parseFloat(f.price || 0)).filter(p => p > 0);
  const minPrice = Math.min(...allPrices);
  const avgPrice = allPrices.reduce((a, b) => a + b, 0) / allPrices.length;
  const hasDirect = allFlights.some(f => parseInt(f.stops || '0') === 0);
  const directDuration = hasDirect ? allFlights.find(f => parseInt(f.stops || '0') === 0)?.duration : null;
  const directDurNum = directDuration ? parseFloat(directDuration) : null;

  // Comfort: Stops
  let stopQuality: 'direct' | 'short' | 'ideal' | 'long' | 'unknown' = 'unknown';
  let stopDuration: string | undefined;
  if (stops === 0) {
    stopQuality = 'direct';
  } else if (stops === 1) {
    // Try to get layover duration from raw data if available
    const layoverMins = flight.raw?.layoverDuration || flight.layoverDuration;
    if (layoverMins) {
      if (layoverMins < 60) stopQuality = 'short';
      else if (layoverMins < 120) stopQuality = 'ideal';
      else stopQuality = 'long';
      stopDuration = `${Math.round(layoverMins)} min`;
    } else {
      stopQuality = 'ideal'; // Default assumption for 1 stop
    }
  } else {
    stopQuality = 'long';
  }

  // Comfort: Total time vs direct
  let vsDirect: 'same' | 'faster' | 'slower' | 'unknown' = 'unknown';
  let timePenalty: string | undefined;
  if (directDurNum !== null && duration > directDurNum) {
    vsDirect = 'slower';
    const extraHours = Math.round((duration - directDurNum) * 10) / 10;
    timePenalty = `+${extraHours}h vs direct`;
  } else if (directDurNum !== null && duration < directDurNum) {
    vsDirect = 'faster';
  } else if (stops === 0) {
    vsDirect = 'same';
  }

  // Comfort: Departure time
  let depTime: string | null = null;
  let timeComfort: 'convenient' | 'okay' | 'red-eye' | 'very-early' | 'unknown' = 'unknown';
  if (flight.raw?.departureTime || flight.departureTime) {
    const dep = new Date(flight.raw?.departureTime || flight.departureTime);
    depTime = dep.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const hour = dep.getHours();
    if (hour >= 6 && hour < 10) timeComfort = 'convenient';
    else if (hour >= 10 && hour < 18) timeComfort = 'okay';
    else if (hour >= 22 || hour < 4) timeComfort = 'red-eye';
    else if (hour >= 4 && hour < 6) timeComfort = 'very-early';
  }

  // Comfort: Layover risk (only if we have layover duration)
  let layoverRisk: 'low' | 'medium' | 'high' | 'unknown' = 'unknown';
  if (stops > 0) {
    const layoverMins = flight.raw?.layoverDuration || flight.layoverDuration;
    if (layoverMins) {
      if (layoverMins < 45) layoverRisk = 'high';
      else if (layoverMins < 90) layoverRisk = 'medium';
      else layoverRisk = 'low';
    }
  } else {
    layoverRisk = 'low';
  }

  // Comfort: Airport quality (simple check from airport codes)
  let airportQuality: 'major-hub' | 'smaller' | 'unknown' = 'unknown';
  const majorHubs = ['SYD', 'MEL', 'BNE', 'PER', 'ADL', 'LAX', 'JFK', 'LHR', 'DXB', 'SIN', 'HKG', 'NRT'];
  if (flight.from && majorHubs.includes(flight.from.toUpperCase())) {
    airportQuality = 'major-hub';
  } else if (flight.from) {
    airportQuality = 'smaller';
  }

  // Practical: Baggage (check raw data, never invent)
  let baggageIncluded: 'yes' | 'no' | 'unknown' = 'unknown';
  if (flight.raw?.baggageIncluded !== undefined) {
    baggageIncluded = flight.raw.baggageIncluded ? 'yes' : 'no';
  } else if (flight.baggageIncluded !== undefined) {
    baggageIncluded = flight.baggageIncluded ? 'yes' : 'no';
  }

  // Practical: Change flexibility (check raw data)
  let changeFlexibility: 'flexible' | 'restricted' | 'unknown' = 'unknown';
  if (flight.raw?.changeable !== undefined) {
    changeFlexibility = flight.raw.changeable ? 'flexible' : 'restricted';
  } else if (flight.changeable !== undefined) {
    changeFlexibility = flight.changeable ? 'flexible' : 'restricted';
  }

  // Practical: Reliability
  let reliabilityRisk: 'low' | 'medium' | 'high' | 'unknown' = 'unknown';
  let reliabilityReason: string | undefined;
  if (stops > 1) {
    reliabilityRisk = 'medium';
    reliabilityReason = 'Multiple segments increase schedule risk';
  } else if (layoverRisk === 'high') {
    reliabilityRisk = 'high';
    reliabilityReason = 'Tight connection increases delay risk';
  } else if (stops === 0) {
    reliabilityRisk = 'low';
  } else {
    reliabilityRisk = 'low';
  }

  // Price position
  let pricePosition: 'cheapest' | 'below-average' | 'average' | 'above-average' | 'premium';
  if (price <= minPrice * 1.05) pricePosition = 'cheapest';
  else if (price < avgPrice * 0.9) pricePosition = 'below-average';
  else if (price <= avgPrice * 1.1) pricePosition = 'average';
  else if (price <= avgPrice * 1.3) pricePosition = 'above-average';
  else pricePosition = 'premium';

  const serviceFee = (price * 0.04).toFixed(2);

  return {
    comfort: {
      stops: { count: stops, quality: stopQuality, duration: stopDuration },
      totalTime: { hours: duration, vsDirect, penalty: timePenalty },
      departureTime: { time: depTime, comfort: timeComfort },
      layoverRisk,
      airportQuality,
    },
    practical: {
      baggageIncluded,
      changeFlexibility,
      reliability: { risk: reliabilityRisk, reason: reliabilityReason },
    },
    price: {
      position: pricePosition,
      serviceFee,
    },
  };
}

// Generate human-readable verdict with premium intelligence
function generateVerdict(flight: any, allFlights: any[], score: number): { 
  verdict: string; 
  reason: string; 
  comfort: string[]; 
  tradeoffs: string[]; 
  tip?: string;
  moreDetails?: {
    connectionRisk?: string;
    timeComfort?: string;
    baggageNotes?: string;
    changeNotes?: string;
    scoreBreakdown?: string;
  };
} {
  const analysis = analyzePremiumFactors(flight, allFlights);
  const price = parseFloat(flight.price || 0);
  const allPrices = allFlights.map(f => parseFloat(f.price || 0)).filter(p => p > 0);
  const minPrice = Math.min(...allPrices);
  const priceDiff = price - minPrice;
  const pricePercentDiff = minPrice > 0 ? (priceDiff / minPrice) * 100 : 0;
  const hasDirect = allFlights.some(f => parseInt(f.stops || '0') === 0);

  // Determine verdict based on score and premium factors
  let verdict: string;
  let reason: string;

  if (score >= 7.5) {
    if (analysis.comfort.stops.quality === 'direct' && pricePercentDiff < 20) {
      verdict = "✅ Best overall comfort/value";
      reason = "Direct + good departure time + lowest price today";
    } else if (analysis.comfort.stops.quality === 'direct') {
      verdict = "✅ Excellent comfort, premium price";
      reason = "Direct flight with convenient timing, but priced higher than alternatives";
    } else if (pricePercentDiff < 15) {
      verdict = "✅ Good value balance";
      reason = "Balances price and travel time well, with minimal stops";
    } else {
      verdict = "✅ Solid budget option";
      reason = "Lowest price with acceptable comfort trade-offs";
    }
  } else if (score >= 5.5) {
    verdict = "⚠️ Decent option — consider alternatives";
    if (pricePercentDiff > 30) {
      reason = "More expensive than alternatives, but schedule may work better";
    } else if (analysis.comfort.stops.count > 1) {
      reason = "Cheap but multiple stops increase travel time significantly";
    } else {
      reason = "Okay option, but better value may be available";
    }
  } else {
    verdict = "⚠️ Not great value — consider alternatives";
    if (pricePercentDiff > 40 && analysis.comfort.stops.count > 0) {
      reason = "Expensive with stops, less attractive than alternatives";
    } else if (pricePercentDiff > 40) {
      reason = "Significantly more expensive than alternatives with similar schedules";
    } else if (analysis.comfort.stops.count > 1) {
      reason = "Cheap but long stopover increases total travel time";
    } else {
      reason = "Has drawbacks that make it less appealing";
    }
  }

  // Build comfort factors (max 3 bullets)
  const comfort: string[] = [];
  if (analysis.comfort.stops.quality === 'direct') {
    comfort.push("Direct flight (no layover fatigue)");
  } else if (analysis.comfort.stops.count === 1) {
    if (analysis.comfort.stops.duration) {
      comfort.push(`${analysis.comfort.stops.count} stop (${analysis.comfort.stops.duration} layover)`);
    } else {
      comfort.push(`${analysis.comfort.stops.count} stop`);
    }
  } else {
    comfort.push(`${analysis.comfort.stops.count} stops (adds travel time)`);
  }

  if (analysis.comfort.departureTime.comfort === 'convenient') {
    comfort.push("Departure time is convenient");
  } else if (analysis.comfort.departureTime.comfort === 'red-eye') {
    comfort.push("Red-eye departure (overnight flight)");
  } else if (analysis.comfort.departureTime.comfort === 'very-early') {
    comfort.push("Very early departure time");
  }

  if (analysis.comfort.totalTime.vsDirect === 'same' || analysis.comfort.stops.quality === 'direct') {
    comfort.push("Total time is short");
  } else if (analysis.comfort.totalTime.penalty) {
    comfort.push(`Total time: ${analysis.comfort.totalTime.penalty}`);
  }

  // Build trade-offs (max 2-3 bullets)
  const tradeoffs: string[] = [];
  if (analysis.practical.baggageIncluded === 'unknown') {
    tradeoffs.push("Baggage details not shown (check fare rules)");
  } else if (analysis.practical.baggageIncluded === 'no') {
    tradeoffs.push("Baggage not included (may cost extra)");
  }

  if (analysis.practical.changeFlexibility === 'unknown') {
    tradeoffs.push("Change/refund policy not provided by supplier");
  } else if (analysis.practical.changeFlexibility === 'restricted') {
    tradeoffs.push("Restricted change/refund policy");
  }

  // Add economy class note if not premium
  tradeoffs.push("Economy (no extra legroom info available)");

  // Generate tip
  let tip: string | undefined;
  if (pricePercentDiff > 20 && pricePercentDiff < 35) {
    tip = `If you prefer more comfort, filter for "morning departure" or "fewer stops".`;
  } else if (analysis.comfort.stops.count > 0 && hasDirect) {
    const directOption = allFlights.find(f => parseInt(f.stops || '0') === 0);
    if (directOption) {
      const directPrice = parseFloat(directOption.price || 0);
      const extraCost = directPrice - price;
      if (extraCost > 0 && extraCost < price * 0.4) {
        tip = `Paying ${Math.round(extraCost)} more for a direct flight might be worth it.`;
      }
    }
  }

  // Build more details
  const moreDetails: {
    connectionRisk?: string;
    timeComfort?: string;
    baggageNotes?: string;
    changeNotes?: string;
    scoreBreakdown?: string;
  } = {};

  if (analysis.comfort.layoverRisk !== 'unknown' && analysis.comfort.layoverRisk !== 'low') {
    moreDetails.connectionRisk = `Connection risk: ${analysis.comfort.layoverRisk} (${analysis.comfort.stops.duration || 'layover duration unknown'}). ${analysis.comfort.layoverRisk === 'high' ? 'Tight connections increase delay risk.' : 'Moderate connection time.'}`;
  }

  if (analysis.comfort.departureTime.time) {
    const timeDesc = analysis.comfort.departureTime.comfort === 'convenient' ? 'Convenient' :
                     analysis.comfort.departureTime.comfort === 'okay' ? 'Acceptable' :
                     analysis.comfort.departureTime.comfort === 'red-eye' ? 'Red-eye (overnight)' :
                     analysis.comfort.departureTime.comfort === 'very-early' ? 'Very early' : 'Unknown';
    moreDetails.timeComfort = `Departure: ${analysis.comfort.departureTime.time} (${timeDesc}). ${analysis.comfort.departureTime.comfort === 'red-eye' ? 'Overnight flights can be tiring but may save money.' : ''}`;
  }

  if (analysis.practical.baggageIncluded !== 'unknown') {
    moreDetails.baggageNotes = `Baggage: ${analysis.practical.baggageIncluded === 'yes' ? 'Included' : 'Not included'}. Check fare rules for specific allowances.`;
  } else {
    moreDetails.baggageNotes = "Baggage: Not provided by supplier. Check airline fare rules during booking.";
  }

  if (analysis.practical.changeFlexibility !== 'unknown') {
    moreDetails.changeNotes = `Changes/Refunds: ${analysis.practical.changeFlexibility === 'flexible' ? 'Flexible (fees may apply)' : 'Restricted (may not be changeable)'}. Check fare rules for details.`;
  } else {
    moreDetails.changeNotes = "Change/Refund policy: Not provided by supplier. Check airline fare rules during booking.";
  }

  moreDetails.scoreBreakdown = `Score ${score}/10: Higher because ${analysis.comfort.stops.quality === 'direct' ? 'direct' : `${analysis.comfort.stops.count} stop(s)`} + ${analysis.price.position === 'cheapest' ? 'low price' : analysis.price.position}; lower if ${analysis.comfort.stops.count > 0 ? 'layovers' : 'awkward times'} or ${pricePercentDiff > 20 ? 'higher price' : 'longer duration'}.`;

  return { verdict, reason, comfort: comfort.slice(0, 3), tradeoffs: tradeoffs.slice(0, 3), tip, moreDetails };
}

export function FloatingAiAssist({ type, results, selectedFlight, selectedCar, selectedTransfer, selectedStay, tripData, chatContext, onOpenChat }: FloatingAiAssistProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
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
              {/* Flights Tab - Premium Intelligence Format */}
              {type === 'flights' && bestOptions && currentFlight && valueScore !== null && verdictData && (
                <>
                  {/* Verdict: Clean, Big */}
                  <div className="mb-4">
                    <div className="text-xl md:text-2xl font-bold text-ec-text mb-2 leading-tight">
                      {verdictData.verdict}
                    </div>
                    <div className="text-sm text-ec-muted leading-relaxed">
                      {verdictData.reason}
                    </div>
                  </div>

                  {/* Value Score - Realistic */}
                  <div className="mb-4 pb-3 border-b border-[rgba(28,140,130,0.15)]">
                    <div className="flex items-center gap-3">
                      <div className="text-xl font-bold text-ec-text">Ecovira Value Score: {valueScore}/10</div>
                    </div>
                    {verdictData.moreDetails?.scoreBreakdown && (
                      <div className="text-xs text-ec-muted mt-1">
                        {verdictData.moreDetails.scoreBreakdown}
                      </div>
                    )}
                  </div>

                  {/* Comfort - Structured */}
                  {verdictData.comfort.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs font-semibold text-ec-text uppercase tracking-[0.1em] mb-2">Comfort:</div>
                      <ul className="space-y-1 text-sm text-ec-muted">
                        {verdictData.comfort.map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-ec-teal mt-0.5">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Trade-offs - Structured */}
                  {verdictData.tradeoffs.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs font-semibold text-ec-text uppercase tracking-[0.1em] mb-2">Trade-offs:</div>
                      <ul className="space-y-1 text-sm text-ec-muted">
                        {verdictData.tradeoffs.map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-ec-muted mt-0.5">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Tip - Optional */}
                  {verdictData.tip && (
                    <div className="mb-3 p-2.5 bg-[rgba(200,162,77,0.1)] border border-[rgba(200,162,77,0.2)] rounded-ec-sm">
                      <div className="text-xs text-ec-text flex items-start gap-2">
                        <span className="text-ec-gold">💡</span>
                        <span>{verdictData.tip}</span>
                      </div>
                    </div>
                  )}

                  {/* More Details - Expandable */}
                  {verdictData.moreDetails && (
                    <div className="mb-3">
                      <button
                        onClick={() => setShowMoreDetails(!showMoreDetails)}
                        className="text-xs text-ec-teal hover:text-ec-text font-medium transition-colors flex items-center gap-1"
                      >
                        {showMoreDetails ? '▼' : '▶'} More details
                      </button>
                      {showMoreDetails && (
                        <div className="mt-2 space-y-2 text-xs text-ec-muted pl-4 border-l border-[rgba(28,140,130,0.2)]">
                          {verdictData.moreDetails.connectionRisk && (
                            <div>
                              <div className="font-medium text-ec-text mb-0.5">Connection Risk:</div>
                              <div>{verdictData.moreDetails.connectionRisk}</div>
                            </div>
                          )}
                          {verdictData.moreDetails.timeComfort && (
                            <div>
                              <div className="font-medium text-ec-text mb-0.5">Time Comfort:</div>
                              <div>{verdictData.moreDetails.timeComfort}</div>
                            </div>
                          )}
                          {verdictData.moreDetails.baggageNotes && (
                            <div>
                              <div className="font-medium text-ec-text mb-0.5">Baggage:</div>
                              <div>{verdictData.moreDetails.baggageNotes}</div>
                            </div>
                          )}
                          {verdictData.moreDetails.changeNotes && (
                            <div>
                              <div className="font-medium text-ec-text mb-0.5">Changes/Refunds:</div>
                              <div>{verdictData.moreDetails.changeNotes}</div>
                            </div>
                          )}
                        </div>
                      )}
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
