"use client";

import { useState, useEffect } from 'react';
import { Clock, MapPin, AlertCircle, CheckCircle, XCircle, Plane } from 'lucide-react';
import type { FlightStatus } from '@/lib/core/trip-types';

interface FlightTrackingProps {
  bookingId: string;
  flightData: {
    airlineIata: string;
    flightNumber: string;
    departureAirport: string;
    arrivalAirport: string;
    scheduledDeparture: string;
    scheduledArrival: string;
  };
  status: FlightStatus | null;
}

export function FlightTracking({ bookingId, flightData, status: initialStatus }: FlightTrackingProps) {
  const [status, setStatus] = useState<FlightStatus | null>(initialStatus);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const refreshStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/trips/${bookingId}/status`);
      const data = await res.json();
      if (data.status) {
        setStatus(data.status);
        setLastRefresh(new Date());
      }
    } catch (err) {
      console.error('Failed to refresh flight status:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(refreshStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [bookingId]);

  const getStatusIcon = (statusType: string) => {
    switch (statusType) {
      case 'on-time':
      case 'arrived':
        return <CheckCircle size={20} className="text-ec-teal" />;
      case 'delayed':
      case 'boarding':
        return <AlertCircle size={20} className="text-ec-gold" />;
      case 'cancelled':
        return <XCircle size={20} className="text-red-400" />;
      case 'departed':
        return <Plane size={20} className="text-ec-teal" />;
      default:
        return <Clock size={20} className="text-ec-muted" />;
    }
  };

  const getStatusColor = (statusType: string) => {
    switch (statusType) {
      case 'on-time':
      case 'arrived':
        return 'text-ec-teal';
      case 'delayed':
      case 'boarding':
        return 'text-ec-gold';
      case 'cancelled':
        return 'text-red-400';
      default:
        return 'text-ec-muted';
    }
  };

  return (
    <div className="ec-card p-6 md:p-8 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-ec-text flex items-center gap-2">
          <Plane size={24} className="text-ec-teal" />
          Flight Status
        </h2>
        <button
          onClick={refreshStatus}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium bg-[rgba(28,140,130,0.15)] hover:bg-[rgba(28,140,130,0.25)] border border-[rgba(28,140,130,0.3)] rounded-ec-sm text-ec-text transition-colors disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {status ? (
        <>
          {/* Flight Number */}
          <div className="mb-6 p-4 bg-[rgba(28,140,130,0.1)] rounded-ec-md border border-[rgba(28,140,130,0.2)]">
            <div className="text-sm text-ec-muted mb-1">Flight</div>
            <div className="text-2xl font-bold text-ec-text">
              {status.airlineIata} {status.flightNumber}
            </div>
          </div>

          {/* Departure */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              {getStatusIcon(status.departure.status)}
              <h3 className="text-lg font-semibold text-ec-text">Departure</h3>
              <span className={`px-3 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(status.departure.status)} bg-[rgba(28,140,130,0.1)]`}>
                {status.departure.status.replace('-', ' ')}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-ec-muted mb-1 flex items-center gap-1">
                  <MapPin size={12} />
                  Airport
                </div>
                <div className="text-ec-text font-medium">{status.departure.airport}</div>
              </div>
              <div>
                <div className="text-xs text-ec-muted mb-1 flex items-center gap-1">
                  <Clock size={12} />
                  Scheduled
                </div>
                <div className="text-ec-text font-medium">
                  {new Date(status.departure.scheduled).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              {status.departure.estimated && (
                <div>
                  <div className="text-xs text-ec-muted mb-1">Estimated</div>
                  <div className="text-ec-text font-medium">
                    {new Date(status.departure.estimated).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              )}
              {status.departure.gate && (
                <div>
                  <div className="text-xs text-ec-muted mb-1">Gate</div>
                  <div className="text-ec-text font-medium">{status.departure.gate}</div>
                </div>
              )}
              {status.departure.terminal && (
                <div>
                  <div className="text-xs text-ec-muted mb-1">Terminal</div>
                  <div className="text-ec-text font-medium">{status.departure.terminal}</div>
                </div>
              )}
            </div>
          </div>

          {/* Arrival */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              {getStatusIcon(status.arrival.status)}
              <h3 className="text-lg font-semibold text-ec-text">Arrival</h3>
              <span className={`px-3 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(status.arrival.status)} bg-[rgba(28,140,130,0.1)]`}>
                {status.arrival.status.replace('-', ' ')}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-ec-muted mb-1 flex items-center gap-1">
                  <MapPin size={12} />
                  Airport
                </div>
                <div className="text-ec-text font-medium">{status.arrival.airport}</div>
              </div>
              <div>
                <div className="text-xs text-ec-muted mb-1 flex items-center gap-1">
                  <Clock size={12} />
                  Scheduled
                </div>
                <div className="text-ec-text font-medium">
                  {new Date(status.arrival.scheduled).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              {status.arrival.estimated && (
                <div>
                  <div className="text-xs text-ec-muted mb-1">Estimated</div>
                  <div className="text-ec-text font-medium">
                    {new Date(status.arrival.estimated).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              )}
              {status.arrival.gate && (
                <div>
                  <div className="text-xs text-ec-muted mb-1">Gate</div>
                  <div className="text-ec-text font-medium">{status.arrival.gate}</div>
                </div>
              )}
              {status.arrival.baggageBelt && (
                <div>
                  <div className="text-xs text-ec-muted mb-1">Baggage Belt</div>
                  <div className="text-ec-text font-medium">{status.arrival.baggageBelt}</div>
                </div>
              )}
            </div>
          </div>

          {/* Last Updated */}
          <div className="mt-6 pt-6 border-t border-[rgba(28,140,130,0.15)]">
            <div className="text-xs text-ec-muted">
              Last updated: {new Date(status.lastUpdated).toLocaleString('en-US')} • Source: {status.source}
            </div>
            <div className="text-xs text-ec-muted mt-1">
              Status is best-effort and depends on live data availability.
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <AlertCircle size={48} className="text-ec-muted mx-auto mb-4" />
          <p className="text-ec-muted mb-4">Flight status unavailable</p>
          <p className="text-sm text-ec-muted">
            Scheduled departure: {new Date(flightData.scheduledDeparture).toLocaleString('en-US')}
          </p>
        </div>
      )}
    </div>
  );
}

