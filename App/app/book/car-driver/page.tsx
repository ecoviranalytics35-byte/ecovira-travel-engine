"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useBookingStore } from "@/stores/bookingStore";
import { EcoviraButton } from "@/components/Button";
import { Input } from "@/components/Input";
import { EcoviraCard } from "@/components/EcoviraCard";
import { ArrowLeft, User, Mail, Phone, Car, Calendar, MapPin, CreditCard } from "lucide-react";
import type { CarResult } from "@/lib/core/types";

export default function CarDriverInfoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedOffer = useBookingStore((state) => state.selectedOffer);
  const setCarDriverInfo = useBookingStore((state) => state.setCarDriverInfo);
  const completeStep = useBookingStore((state) => state.completeStep);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseCountry, setLicenseCountry] = useState("AU");
  const [age, setAge] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  const carId = searchParams.get("carId");

  useEffect(() => {
    if (!selectedOffer || selectedOffer.type !== 'car' || selectedOffer.id !== carId) {
      // If no selected car or mismatch, redirect back to cars search
      router.replace("/cars");
    }
  }, [selectedOffer, carId, router]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!firstName) newErrors.firstName = "First name is required.";
    if (!lastName) newErrors.lastName = "Last name is required.";
    if (!email) newErrors.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Email is invalid.";
    if (!phone) newErrors.phone = "Phone number is required.";
    if (!age) newErrors.age = "Age is required.";
    else if (parseInt(age) < 18) newErrors.age = "Driver must be at least 18 years old.";
    else if (parseInt(age) > 100) newErrors.age = "Please enter a valid age.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    const driverInfo = {
      firstName,
      lastName,
      email,
      phone,
      licenseNumber: licenseNumber || undefined,
      licenseCountry: licenseCountry || "AU",
      age: parseInt(age),
    };
    setCarDriverInfo(driverInfo);
    completeStep('carDriverInfo');
    router.push("/book/checkout");
  };

  const handleBack = () => {
    router.back();
  };

  if (!selectedOffer || selectedOffer.type !== 'car') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ec-night">
        <div className="text-white text-center">
          <p className="text-lg mb-4">Loading car details or redirecting...</p>
        </div>
      </div>
    );
  }

  const car = selectedOffer as CarResult;

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-ec-muted hover:text-ec-text transition-colors mb-6"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-serif font-semibold text-ec-text mb-4">
          Driver Information
        </h1>
        <p className="text-ec-muted text-lg">Enter details for the primary driver</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <EcoviraCard variant="glass" className="p-6 md:p-8">
            <h2 className="text-xl font-semibold text-ec-text mb-6">Primary Driver Details</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-3">
                    First Name
                  </label>
                  <Input
                    icon={User}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    error={errors.firstName}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-3">
                    Last Name
                  </label>
                  <Input
                    icon={User}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    error={errors.lastName}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-3">
                  Email Address
                </label>
                <Input
                  icon={Mail}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john.doe@example.com"
                  error={errors.email}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-3">
                  Phone Number
                </label>
                <Input
                  icon={Phone}
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+61 412 345 678"
                  error={errors.phone}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-3">
                  Age
                </label>
                <Input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="25"
                  min="18"
                  max="100"
                  error={errors.age}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-3">
                    License Number (Optional)
                  </label>
                  <Input
                    icon={CreditCard}
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="12345678"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-3">
                    License Country
                  </label>
                  <Input
                    value={licenseCountry}
                    onChange={(e) => setLicenseCountry(e.target.value)}
                    placeholder="AU"
                  />
                </div>
              </div>
              <EcoviraButton
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                loading={loading}
              >
                Continue to Checkout →
              </EcoviraButton>
            </form>
          </EcoviraCard>
        </div>

        {/* Sidebar - Booking Summary */}
        <div className="lg:col-span-1">
          <EcoviraCard variant="glass" className="p-6 sticky top-32">
            <h2 className="text-xl font-semibold text-ec-text mb-4">Your Car Rental</h2>
            <div className="space-y-4 text-sm">
              <div>
                <div className="text-ec-muted mb-1">Vehicle</div>
                <div className="text-ec-text font-medium flex items-center gap-2">
                  <Car size={16} /> {car.name || car.vehicle}
                </div>
              </div>
              <div>
                <div className="text-ec-muted mb-1">Vendor</div>
                <div className="text-ec-text font-medium">{car.vendor}</div>
              </div>
              <div>
                <div className="text-ec-muted mb-1">Pickup Location</div>
                <div className="text-ec-text font-medium flex items-center gap-2">
                  <MapPin size={16} /> {car.pickupLocation || car.pickup}
                </div>
              </div>
              <div>
                <div className="text-ec-muted mb-1">Return Location</div>
                <div className="text-ec-text font-medium flex items-center gap-2">
                  <MapPin size={16} /> {car.returnLocation || car.dropoff}
                </div>
              </div>
              <div>
                <div className="text-ec-muted mb-1">Duration</div>
                <div className="text-ec-text font-medium flex items-center gap-2">
                  <Calendar size={16} /> {car.duration || 1} day{car.duration && car.duration > 1 ? 's' : ''}
                </div>
              </div>
              <div className="pt-4 border-t border-[rgba(28,140,130,0.15)]">
                <div className="flex items-center justify-between">
                  <div className="text-lg font-semibold text-ec-text">Total</div>
                  <div className="text-2xl font-bold text-ec-text">
                    {car.currency} {typeof car.total === 'string' ? parseFloat(car.total).toFixed(2) : car.total.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </EcoviraCard>
        </div>
      </div>
    </div>
  );
}

