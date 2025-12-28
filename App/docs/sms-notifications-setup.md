# SMS Notifications Setup Guide

## Overview

SMS notifications are **optional and consent-based**. Customers must explicitly opt-in to receive SMS updates.

## Features

- ✅ **Opt-in only**: No SMS sent without explicit consent
- ✅ **Short messages**: All SMS under 160 characters with link to My Trips
- ✅ **No marketing**: Only critical trip updates
- ✅ **Email always sends**: SMS is optional, email is always sent
- ✅ **Legal compliance**: Respects customer consent and opt-out

## SMS Events

1. **Booking Confirmed**: Immediately after payment
2. **Check-in Opens Soon**: 24 hours before check-in opens
3. **Check-in Open**: When check-in becomes available
4. **Departure Reminder**: 3 hours before departure
5. **Flight Delayed**: If flight tracking detects delays (future)

## Setup

### 1. Twilio Account

1. Sign up at https://www.twilio.com
2. Get Account SID and Auth Token from Console
3. Purchase a phone number (or use trial number for testing)

### 2. Environment Variables

Add to `.env`:

```bash
TWILIO_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_TOKEN=your_auth_token_here
TWILIO_PHONE=+1234567890  # Your Twilio phone number (E.164 format)
```

### 3. Database Migration

Run the migration in `App/docs/database-schema-trips.md` to add:
- `phone_number` (TEXT)
- `sms_opt_in` (BOOLEAN, default: false)

## Customer Experience

### Checkout Form

The checkout form includes:
- **Phone Number** field (optional)
- **SMS Opt-in checkbox** (only shown if phone number is provided)
- Clear messaging: "Receive important updates by SMS"
- Privacy note: "No marketing messages. You can opt out anytime."

### SMS Message Format

All SMS messages:
- Under 160 characters
- Include booking reference
- Include short link to My Trips page
- Use clear, concise language

Example:
```
✅ Booking confirmed! Ref: ECV1A2B3C. Track: ecovira.com/my-trips/abc123
```

## Legal & Compliance

### Consent Management

- ✅ Explicit opt-in required (checkbox)
- ✅ Clear purpose stated ("important updates")
- ✅ No marketing messages
- ✅ Easy opt-out (reply STOP or contact support)

### Best Practices

1. **Never send SMS without opt-in**: System checks `sms_opt_in` flag
2. **Email always sends**: SMS failure doesn't affect email delivery
3. **Respect opt-out**: If customer opts out, remove from SMS list
4. **Short messages**: Keep under 160 chars for single SMS
5. **Clear links**: Use short URLs or domain names

## Testing

### Test SMS

1. Use Twilio trial account (free credits)
2. Test with your own phone number
3. Verify opt-in checkbox works
4. Confirm SMS only sends when opted in

### Test Flow

```bash
# 1. Create booking with SMS opt-in
POST /api/payments/create-intent
{
  "itineraryId": "...",
  "passengerEmail": "test@example.com",
  "passengerLastName": "Test",
  "phoneNumber": "+1234567890",
  "smsOptIn": true
}

# 2. Complete payment (triggers booking confirmed SMS)

# 3. Wait for cron job (or trigger manually)
GET /api/cron/trip-notifications
```

## Troubleshooting

### SMS Not Sending

1. Check Twilio credentials are set
2. Verify phone number format (E.164: +1234567890)
3. Check `sms_opt_in` is true in database
4. Review Twilio console for errors
5. Check account balance (Twilio requires credits)

### Duplicate SMS

- System uses same idempotent flags as email
- SMS failure doesn't retry automatically
- Check cron job isn't running too frequently

### Opt-out Handling

To handle opt-out:
1. Customer replies "STOP" to Twilio number
2. Twilio webhook notifies your system
3. Update `sms_opt_in = false` in database
4. Future SMS will not send

## Production Checklist

- [ ] Twilio account created and verified
- [ ] Phone number purchased
- [ ] Environment variables set
- [ ] Database migration completed
- [ ] Test SMS sent and received
- [ ] Opt-in checkbox tested
- [ ] Opt-out mechanism implemented
- [ ] Monitoring/logging set up

## Cost Considerations

- Twilio pricing: ~$0.0075 per SMS (US)
- International SMS: Varies by country
- Trial account: Free credits for testing
- Production: Monitor usage and costs

## Security

- Never log full phone numbers in production
- Store phone numbers encrypted if required by regulations
- Respect GDPR/CCPA opt-out requests
- Implement rate limiting for SMS sending

