"use client";

import { useState } from 'react';
import { Input } from '../Input';
import { EcoviraButton } from '../Button';
import { Mail, Phone, User, FileText } from 'lucide-react';

interface CheckoutFormProps {
  onSubmit: (data: {
    passengerEmail: string;
    passengerLastName: string;
    phoneNumber?: string;
    smsOptIn: boolean;
    passportNumber?: string;
    nationality?: string;
    passportExpiry?: string;
  }) => void;
  loading?: boolean;
  requirePassport?: boolean;
}

export function CheckoutForm({ onSubmit, loading, requirePassport = false }: CheckoutFormProps) {
  const [passengerEmail, setPassengerEmail] = useState('');
  const [passengerLastName, setPassengerLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [passportNumber, setPassportNumber] = useState('');
  const [nationality, setNationality] = useState('');
  const [passportExpiry, setPassportExpiry] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      passengerEmail,
      passengerLastName,
      phoneNumber: phoneNumber.trim() || undefined,
      smsOptIn,
      passportNumber: passportNumber.trim() || undefined,
      nationality: nationality.trim() || undefined,
      passportExpiry: passportExpiry.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Required Fields */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-3 flex items-center gap-2">
            <Mail size={14} />
            Email Address <span className="text-red-400">*</span>
          </label>
          <Input
            type="email"
            value={passengerEmail}
            onChange={(e) => setPassengerEmail(e.target.value)}
            placeholder="your.email@example.com"
            required
          />
          <p className="text-xs text-ec-muted mt-2">
            We'll send booking confirmation and important updates to this email
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-3 flex items-center gap-2">
            <User size={14} />
            Last Name <span className="text-red-400">*</span>
          </label>
          <Input
            type="text"
            value={passengerLastName}
            onChange={(e) => setPassengerLastName(e.target.value)}
            placeholder="Smith"
            required
          />
          <p className="text-xs text-ec-muted mt-2">
            As it appears on your passport/ID (for booking lookup)
          </p>
        </div>
      </div>

      {/* Passport Details (for international flights) */}
      {(requirePassport || true) && (
        <div className="pt-4 border-t border-[rgba(28,140,130,0.15)]">
          <h3 className="text-sm font-semibold text-ec-text mb-4 flex items-center gap-2">
            <FileText size={16} className="text-ec-teal" />
            Passport Details (International Travel)
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-3">
                Passport Number
              </label>
              <Input
                type="text"
                value={passportNumber}
                onChange={(e) => setPassportNumber(e.target.value.toUpperCase())}
                placeholder="A12345678"
                className="font-mono"
              />
              <p className="text-xs text-ec-muted mt-2">
                As shown on your passport
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-3">
                  Nationality
                </label>
                <Input
                  type="text"
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  placeholder="Australian"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-3">
                  Expiry Date
                </label>
                <Input
                  type="date"
                  value={passportExpiry}
                  onChange={(e) => setPassportExpiry(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Optional SMS Section */}
      <div className="pt-4 border-t border-[rgba(28,140,130,0.15)]">
        <div className="mb-4">
          <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-3 flex items-center gap-2">
            <Phone size={14} />
            Phone Number (Optional)
          </label>
          <Input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+1234567890"
          />
          <p className="text-xs text-ec-muted mt-2">
            For SMS updates about your trip (booking confirmations, check-in reminders, departure alerts)
          </p>
        </div>

        {phoneNumber.trim() && (
          <div className="flex items-start gap-3 p-4 bg-[rgba(28,140,130,0.1)] rounded-ec-md border border-[rgba(28,140,130,0.2)]">
            <input
              type="checkbox"
              id="smsOptIn"
              checked={smsOptIn}
              onChange={(e) => setSmsOptIn(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-[rgba(28,140,130,0.3)] bg-[rgba(15,17,20,0.55)] text-ec-teal focus:ring-ec-teal focus:ring-2"
            />
            <label htmlFor="smsOptIn" className="text-sm text-ec-text cursor-pointer flex-1">
              <strong>Receive important updates by SMS</strong>
              <p className="text-xs text-ec-muted mt-1">
                Get booking confirmations, check-in reminders, and departure alerts via text message. 
                No marketing messages. You can opt out anytime.
              </p>
            </label>
          </div>
        )}
      </div>

      <EcoviraButton
        type="submit"
        disabled={loading || !passengerEmail || !passengerLastName}
        className="w-full"
      >
        {loading ? 'Processing...' : 'Continue to Payment'}
      </EcoviraButton>
    </form>
  );
}

