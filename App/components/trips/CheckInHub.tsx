"use client";

import { useState, useEffect } from 'react';
import { Clock, ExternalLink, AlertCircle, CheckCircle, FileText, Plane, Calendar, MapPin, User } from 'lucide-react';
import type { CheckInInfo, TripBooking } from '@/lib/core/trip-types';
import { resolveAirlineCheckinUrl, getAirlineName } from '@/lib/trips/airline-checkin-resolver';

interface CheckInHubProps {
  bookingId: string;
  flightData: {
    airlineIata: string;
    airlineName?: string;
    flightNumber: string;
    scheduledDeparture: string;
    departureAirport?: string;
    arrivalAirport?: string;
  };
  checkInInfo: CheckInInfo | null;
  trip?: TripBooking;
}

export function CheckInHub({ bookingId, flightData, checkInInfo: initialCheckInInfo, trip }: CheckInHubProps) {
  const [checkInInfo, setCheckInInfo] = useState<CheckInInfo | null>(initialCheckInInfo);
  const [loading, setLoading] = useState(false);
  const [checkInStatus, setCheckInStatus] = useState<'closed' | 'opens-soon' | 'open' | 'closed-permanently'>('closed');
  const [timeUntilCheckIn, setTimeUntilCheckIn] = useState<string>('');
  const [timeUntilClose, setTimeUntilClose] = useState<string>('');

  // Resolve airline check-in URL
  const airlineInfo = resolveAirlineCheckinUrl(flightData.airlineIata) || resolveAirlineCheckinUrl(flightData.airlineName || '');
  const airlineName = airlineInfo?.name || flightData.airlineName || getAirlineName(flightData.airlineIata);
  const checkInUrl = checkInInfo?.airlineCheckInUrl || airlineInfo?.url;

  // Calculate check-in window status
  useEffect(() => {
    const updateStatus = () => {
      const now = new Date();
      const departure = new Date(flightData.scheduledDeparture);
      
      // Default: check-in opens 48h before, closes 60-90 mins before
      const opensAt = checkInInfo?.opensAt ? new Date(checkInInfo.opensAt) : new Date(departure.getTime() - 48 * 60 * 60 * 1000);
      const closesAt = checkInInfo?.closesAt ? new Date(checkInInfo.closesAt) : new Date(departure.getTime() - 60 * 60 * 1000);
      
      if (now < opensAt) {
        // Check-in not yet open
        setCheckInStatus('opens-soon');
        const diff = opensAt.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        if (hours > 24) {
          const days = Math.floor(hours / 24);
          setTimeUntilCheckIn(`Check-in opens in ${days} day${days > 1 ? 's' : ''}`);
        } else if (hours > 0) {
          setTimeUntilCheckIn(`Check-in opens in ${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`);
        } else {
          setTimeUntilCheckIn(`Check-in opens in ${minutes} minute${minutes !== 1 ? 's' : ''}`);
        }
      } else if (now >= opensAt && now < closesAt) {
        // Check-in is open
        setCheckInStatus('open');
        const diff = closesAt.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        if (hours > 0) {
          setTimeUntilClose(`${hours}h ${minutes}m remaining`);
        } else {
          setTimeUntilClose(`${minutes}m remaining`);
        }
      } else {
        // Check-in closed (too late)
        setCheckInStatus('closed-permanently');
      }
    };

    updateStatus();
    const interval = setInterval(updateStatus, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [checkInInfo, flightData.scheduledDeparture]);

  const handleCheckIn = () => {
    if (checkInUrl) {
      window.open(checkInUrl, '_blank', 'noopener,noreferrer');
    } else {
      // Fallback: search for airline check-in page
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(`${airlineName} online check-in`)}`;
      window.open(searchUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="ec-card p-6 md:p-8">
      <h2 className="text-2xl font-semibold text-ec-text mb-6 flex items-center gap-2">
        <FileText size={24} className="text-ec-teal" />
        Online Check-In Hub
      </h2>

      {/* Flight Information */}
      <div className="mb-6 p-4 bg-[rgba(15,17,20,0.4)] rounded-ec-md border border-[rgba(28,140,130,0.15)]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <Plane size={20} className="text-ec-teal mt-1 flex-shrink-0" />
            <div>
              <div className="text-xs text-ec-muted mb-1">Airline & Flight</div>
              <div className="text-ec-text font-semibold">{airlineName}</div>
              <div className="text-sm text-ec-muted">{flightData.flightNumber}</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Calendar size={20} className="text-ec-teal mt-1 flex-shrink-0" />
            <div>
              <div className="text-xs text-ec-muted mb-1">Departure</div>
              <div className="text-ec-text font-semibold">{formatDate(flightData.scheduledDeparture)}</div>
              <div className="text-sm text-ec-muted">{formatTime(flightData.scheduledDeparture)}</div>
            </div>
          </div>
          {flightData.departureAirport && flightData.arrivalAirport && (
            <div className="flex items-start gap-3">
              <MapPin size={20} className="text-ec-teal mt-1 flex-shrink-0" />
              <div>
                <div className="text-xs text-ec-muted mb-1">Route</div>
                <div className="text-ec-text font-semibold">{flightData.departureAirport} → {flightData.arrivalAirport}</div>
              </div>
            </div>
          )}
          {trip?.bookingReference && (
            <div className="flex items-start gap-3">
              <FileText size={20} className="text-ec-teal mt-1 flex-shrink-0" />
              <div>
                <div className="text-xs text-ec-muted mb-1">Booking Reference</div>
                <div className="text-ec-text font-semibold font-mono">{trip.bookingReference}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Check-in Window Status */}
      <div className={`mb-6 p-4 rounded-ec-md border ${
        checkInStatus === 'open' 
          ? 'bg-[rgba(28,140,130,0.15)] border-[rgba(28,140,130,0.3)]' 
          : checkInStatus === 'opens-soon'
          ? 'bg-[rgba(200,162,77,0.1)] border-[rgba(200,162,77,0.2)]'
          : 'bg-[rgba(100,100,100,0.1)] border-[rgba(100,100,100,0.2)]'
      }`}>
        {checkInStatus === 'open' ? (
          <div className="flex items-center gap-2 text-ec-teal">
            <CheckCircle size={20} />
            <div>
              <span className="font-semibold">Check-in is open</span>
              {timeUntilClose && <span className="text-sm text-ec-muted ml-2">({timeUntilClose})</span>}
            </div>
          </div>
        ) : checkInStatus === 'opens-soon' ? (
          <div className="flex items-center gap-2 text-ec-gold">
            <Clock size={20} />
            <span className="font-semibold">{timeUntilCheckIn}</span>
          </div>
        ) : checkInStatus === 'closed-permanently' ? (
          <div className="flex items-center gap-2 text-ec-muted">
            <AlertCircle size={20} />
            <span>Check-in closed (airport check-in only)</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-ec-muted">
            <AlertCircle size={20} />
            <span>Check-in usually opens 24–48 hours before departure (varies by airline)</span>
          </div>
        )}
      </div>

      {/* Check-in Button */}
      <div className="mb-6">
        <button
          onClick={handleCheckIn}
          disabled={checkInStatus !== 'open'}
          className="ec-btn ec-btn-primary w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ExternalLink size={18} className="mr-2" />
          {checkInStatus === 'open' ? 'Open Airline Check-In' : checkInStatus === 'opens-soon' ? 'Check-In Not Yet Available' : 'Find Airline Check-In'}
        </button>
        <p className="text-xs text-ec-muted mt-2">
          {checkInStatus === 'open' 
            ? `You'll check in directly with ${airlineName} on their official website or app.`
            : `Check-in is completed with the airline.`}
        </p>
      </div>

      {/* Secondary CTA: Find Boarding Pass */}
      {checkInStatus === 'open' && (
        <div className="mb-6">
          <button
            onClick={() => {
              // Help text - guide user to airline app/website
              alert(`After completing check-in with ${airlineName}, your boarding pass will be available:\n\n• In the ${airlineName} mobile app\n• Via email from ${airlineName}\n• On the airline's website after check-in\n\nWe don't store or issue boarding passes - they come directly from the airline.`);
            }}
            className="ec-btn ec-button-secondary text-white w-full md:w-auto"
          >
            <FileText size={18} className="mr-2" />
            Find Boarding Pass
          </button>
          <p className="text-xs text-ec-muted mt-2">
            Help finding your boarding pass after check-in
          </p>
        </div>
      )}

      {/* What You'll Need */}
      <div className="p-4 bg-[rgba(15,17,20,0.4)] rounded-ec-md border border-[rgba(28,140,130,0.15)] mb-6">
        <h3 className="text-sm font-semibold text-ec-text mb-3 flex items-center gap-2">
          <User size={16} className="text-ec-teal" />
          What you'll need:
        </h3>
        <ul className="space-y-2 text-sm text-ec-muted">
          <li className="flex items-start gap-2">
            <span className="text-ec-teal mt-0.5">•</span>
            <span>Booking reference (PNR): <span className="font-mono font-semibold text-ec-text">{trip?.bookingReference || 'Required'}</span></span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-ec-teal mt-0.5">•</span>
            <span>Last name: <span className="font-semibold text-ec-text">{trip?.passengerLastName || 'As on booking'}</span></span>
          </li>
          {(checkInInfo?.requiredInfo.passport || !checkInInfo) && (
            <li className="flex items-start gap-2">
              <span className="text-ec-teal mt-0.5">•</span>
              <span>Passport details (for international travel)</span>
            </li>
          )}
        </ul>
      </div>

      {/* Important Note */}
      <div className="p-4 bg-[rgba(200,162,77,0.1)] border border-[rgba(200,162,77,0.2)] rounded-ec-md">
        <p className="text-sm text-ec-text">
          <strong className="text-ec-gold">Note:</strong> Check-in is completed with the airline.
        </p>
      </div>
    </div>
  );
}

