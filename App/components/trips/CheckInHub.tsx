"use client";

import { useState, useEffect } from 'react';
import { Clock, ExternalLink, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import type { CheckInInfo } from '@/lib/core/trip-types';

interface CheckInHubProps {
  bookingId: string;
  flightData: {
    airlineIata: string;
    flightNumber: string;
    scheduledDeparture: string;
  };
  checkInInfo: CheckInInfo | null;
}

export function CheckInHub({ bookingId, flightData, checkInInfo: initialCheckInInfo }: CheckInHubProps) {
  const [checkInInfo, setCheckInInfo] = useState<CheckInInfo | null>(initialCheckInInfo);
  const [loading, setLoading] = useState(false);
  const [timeUntilCheckIn, setTimeUntilCheckIn] = useState<string>('');

  useEffect(() => {
    if (checkInInfo?.opensAt) {
      const updateCountdown = () => {
        const now = new Date();
        const opensAt = new Date(checkInInfo.opensAt!);
        const diff = opensAt.getTime() - now.getTime();

        if (diff <= 0) {
          setTimeUntilCheckIn('Check-in is now open');
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          if (hours > 24) {
            const days = Math.floor(hours / 24);
            setTimeUntilCheckIn(`${days} day${days > 1 ? 's' : ''} until check-in opens`);
          } else if (hours > 0) {
            setTimeUntilCheckIn(`${hours}h ${minutes}m until check-in opens`);
          } else {
            setTimeUntilCheckIn(`${minutes}m until check-in opens`);
          }
        }
      };

      updateCountdown();
      const interval = setInterval(updateCountdown, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [checkInInfo?.opensAt]);

  const handleCheckIn = () => {
    if (checkInInfo?.airlineCheckInUrl) {
      window.open(checkInInfo.airlineCheckInUrl, '_blank', 'noopener,noreferrer');
    } else {
      // Fallback: search for airline check-in page
      const airlineName = getAirlineName(flightData.airlineIata);
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(`${airlineName} online check-in`)}`;
      window.open(searchUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const getAirlineName = (iata: string): string => {
    const airlines: Record<string, string> = {
      'QF': 'Qantas',
      'VA': 'Virgin Australia',
      'JQ': 'Jetstar',
      'AA': 'American Airlines',
      'UA': 'United Airlines',
      'DL': 'Delta',
      'BA': 'British Airways',
      'LH': 'Lufthansa',
      'EK': 'Emirates',
      'SQ': 'Singapore Airlines',
    };
    return airlines[iata] || `${iata} Airlines`;
  };

  return (
    <div className="ec-card p-6 md:p-8">
      <h2 className="text-2xl font-semibold text-ec-text mb-6 flex items-center gap-2">
        <FileText size={24} className="text-ec-teal" />
        Online Check-in
      </h2>

      {checkInInfo ? (
        <>
          {/* Check-in Window Status */}
          <div className="mb-6 p-4 bg-[rgba(28,140,130,0.1)] rounded-ec-md border border-[rgba(28,140,130,0.2)]">
            {checkInInfo.isOpen ? (
              <div className="flex items-center gap-2 text-ec-teal">
                <CheckCircle size={20} />
                <span className="font-semibold">Check-in is now open</span>
              </div>
            ) : checkInInfo.opensAt ? (
              <div className="flex items-center gap-2 text-ec-gold">
                <Clock size={20} />
                <span className="font-semibold">{timeUntilCheckIn}</span>
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
              disabled={!checkInInfo.isOpen && checkInInfo.opensAt && new Date(checkInInfo.opensAt) > new Date()}
              className="ec-btn ec-btn-primary w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ExternalLink size={18} className="mr-2" />
              {checkInInfo.isOpen ? 'Check in via Airline' : 'Check-in Not Yet Available'}
            </button>
            <p className="text-xs text-ec-muted mt-2">
              We'll take you to {getAirlineName(flightData.airlineIata)}'s official check-in page
            </p>
          </div>

          {/* What You'll Need */}
          <div className="p-4 bg-[rgba(15,17,20,0.4)] rounded-ec-md border border-[rgba(28,140,130,0.15)]">
            <h3 className="text-sm font-semibold text-ec-text mb-3">What you'll need:</h3>
            <ul className="space-y-2 text-sm text-ec-muted">
              {checkInInfo.requiredInfo.bookingReference && (
                <li className="flex items-start gap-2">
                  <span className="text-ec-teal mt-0.5">•</span>
                  <span>Booking reference (PNR) or ticket number</span>
                </li>
              )}
              {checkInInfo.requiredInfo.lastName && (
                <li className="flex items-start gap-2">
                  <span className="text-ec-teal mt-0.5">•</span>
                  <span>Last name (as on booking)</span>
                </li>
              )}
              {checkInInfo.requiredInfo.passport && (
                <li className="flex items-start gap-2">
                  <span className="text-ec-teal mt-0.5">•</span>
                  <span>Passport details (for international travel)</span>
                </li>
              )}
            </ul>
          </div>

          {/* Important Note */}
          <div className="mt-6 p-4 bg-[rgba(200,162,77,0.1)] border border-[rgba(200,162,77,0.2)] rounded-ec-md">
            <p className="text-sm text-ec-text">
              <strong className="text-ec-gold">Note:</strong> Check-in is completed through the airline's official system. 
              We guide you to their check-in page and provide the information you'll need.
            </p>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <AlertCircle size={48} className="text-ec-muted mx-auto mb-4" />
          <p className="text-ec-muted mb-4">Check-in information unavailable</p>
          <button
            onClick={handleCheckIn}
            className="ec-btn ec-button-secondary text-white"
          >
            <ExternalLink size={18} className="mr-2" />
            Search for Airline Check-in
          </button>
        </div>
      )}
    </div>
  );
}

