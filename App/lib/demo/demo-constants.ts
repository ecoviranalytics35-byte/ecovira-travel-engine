// Hardcoded demo booking references for end-to-end testing
// These references must ALWAYS work in demo mode, never return "Trip Not Found"

export const DEMO_BOOKING_REFERENCES = {
  FLIGHT: 'ECO-DEMO-FLT',
  STAY: 'ECO-DEMO-HTL',
  CAR: 'ECO-DEMO-CAR',
  TRANSFER: 'ECO-DEMO-TRF',
} as const;

export const DEMO_LAST_NAME = 'Smith';

export const DEMO_BOOKING_IDS = {
  FLIGHT: 'demo-flight-booking-001',
  STAY: 'demo-stay-booking-001',
  CAR: 'demo-car-booking-001',
  TRANSFER: 'demo-transfer-booking-001',
} as const;

/**
 * Check if a booking reference matches a demo reference
 */
export function isDemoReference(reference: string): boolean {
  const ref = reference.toUpperCase().trim();
  return Object.values(DEMO_BOOKING_REFERENCES).includes(ref as any) || 
         ref === 'TEST123' || 
         ref.startsWith('ECO-DEMO-');
}

/**
 * Check if a last name matches demo last name
 */
export function isDemoLastName(lastName: string): boolean {
  const name = lastName.trim().toLowerCase();
  return name === DEMO_LAST_NAME.toLowerCase() || name === 'test';
}

/**
 * Check if booking credentials indicate demo mode
 */
export function isDemoBooking(reference: string, lastName: string): boolean {
  return isDemoReference(reference) && isDemoLastName(lastName);
}

