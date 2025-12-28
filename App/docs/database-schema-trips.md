# Database Schema for My Trips & Flight Tracking

## Required Database Fields

To support the My Trips and Flight Tracking features, the following fields need to be added to the `bookings` table:

### Bookings Table Extensions

```sql
-- Add these columns to the bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS booking_reference TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS passenger_last_name TEXT,
ADD COLUMN IF NOT EXISTS supplier_reference TEXT,
ADD COLUMN IF NOT EXISTS passenger_email TEXT,
-- SMS opt-in fields
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS sms_opt_in BOOLEAN DEFAULT FALSE,
-- Email notification flags (idempotent - prevent duplicate emails)
ADD COLUMN IF NOT EXISTS booking_confirmed_email_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS checkin_opens_email_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS checkin_email_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS departure_reminder_sent_at TIMESTAMPTZ;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_bookings_reference ON bookings(booking_reference);
CREATE INDEX IF NOT EXISTS idx_bookings_last_name ON bookings(passenger_last_name);
```

### Booking Reference Generation

When creating a booking, generate a customer-facing reference:

```typescript
// Example: Generate booking reference
const bookingReference = `ECV${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
// Example output: ECV1A2B3C4D5E6F
```

### Flight Data Storage

Flight-specific data should be stored in the `itinerary_items` table's `item_data` field as JSON:

```json
{
  "type": "flight",
  "from": "MEL",
  "to": "SYD",
  "departDate": "2025-01-15T14:00:00Z",
  "arrivalDate": "2025-01-15T16:00:00Z",
  "raw": {
    "airline_iata": "QF",
    "flight_number": "400",
    "pnr": "ABC123",
    "ticket_number": "1234567890"
  }
}
```

## Migration Script (PostgreSQL/Supabase)

```sql
-- Migration: Add trip tracking fields to bookings
BEGIN;

-- Add new columns
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS booking_reference TEXT,
ADD COLUMN IF NOT EXISTS passenger_last_name TEXT,
ADD COLUMN IF NOT EXISTS supplier_reference TEXT,
ADD COLUMN IF NOT EXISTS passenger_email TEXT;

-- Generate booking references for existing bookings
UPDATE bookings
SET booking_reference = 'ECV' || UPPER(SUBSTRING(MD5(id::text) FROM 1 FOR 8))
WHERE booking_reference IS NULL;

-- Add SMS opt-in fields
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS sms_opt_in BOOLEAN DEFAULT FALSE;

-- Add email notification timestamp columns
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS booking_confirmed_email_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS checkin_opens_email_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS checkin_email_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS departure_reminder_sent_at TIMESTAMPTZ;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bookings_reference ON bookings(booking_reference);
CREATE INDEX IF NOT EXISTS idx_bookings_last_name ON bookings(LOWER(passenger_last_name));

COMMIT;
```

## Notes

- `booking_reference`: Customer-facing reference (e.g., "ECV1A2B3C")
- `passenger_last_name`: Used for lookup authentication (case-insensitive)
- `supplier_reference`: Duffel order ID, PNR, or other supplier identifier
- `passenger_email`: For notifications (required for email alerts)
- `phone_number`: Customer phone number (optional, for SMS notifications)
- `sms_opt_in`: Boolean flag indicating customer consent for SMS notifications (default: false)
- `booking_confirmed_email_sent_at`: Timestamp when booking confirmed email was sent (idempotent flag)
- `checkin_opens_email_sent_at`: Timestamp when "check-in opens soon" email was sent (idempotent flag)
- `checkin_email_sent_at`: Timestamp when "check-in open" email was sent (idempotent flag)
- `departure_reminder_sent_at`: Timestamp when departure reminder email was sent (idempotent flag)

The system will gracefully handle missing fields during MVP phase, but these fields should be added for production use.

