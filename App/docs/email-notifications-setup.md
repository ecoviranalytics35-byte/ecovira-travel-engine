# Email & SMS Notifications Setup Guide

## Overview

The Ecovira trip notification system sends automated emails to customers at key moments:
- **Booking Confirmed**: Immediately after successful payment
- **Check-in Opens Soon**: 24 hours before check-in opens (72 hours before departure)
- **Check-in Open**: When check-in becomes available (48 hours before departure)
- **Departure Reminder**: 3 hours before departure

## Environment Variables

Add these to your `.env` file:

```bash
# Email Configuration (Nodemailer)
EMAIL_SERVICE=gmail  # or 'smtp', 'sendgrid', etc.
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password  # For Gmail, use App Password
EMAIL_FROM=noreply@ecovira.com  # Optional: override from address

# SMS Configuration (Twilio) - Optional
TWILIO_SID=your-twilio-account-sid
TWILIO_TOKEN=your-twilio-auth-token
TWILIO_PHONE=+1234567890  # Your Twilio phone number

# App URL (for email links)
NEXT_PUBLIC_APP_URL=https://ecovira.com

# Cron Job Security (optional but recommended)
CRON_SECRET=your-random-secret-token
```

## Gmail Setup

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account → Security → 2-Step Verification → App passwords
   - Create a new app password for "Mail"
   - Use this password in `EMAIL_PASS`

## SMS Setup (Twilio)

SMS notifications are **opt-in only** and require Twilio configuration.

### Twilio Setup

1. Create a Twilio account: https://www.twilio.com
2. Get your Account SID and Auth Token from the Twilio Console
3. Purchase a phone number (or use trial number for testing)
4. Add credentials to `.env`:
   ```bash
   TWILIO_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_TOKEN=your_auth_token
   TWILIO_PHONE=+1234567890
   ```

### SMS Features

- **Opt-in only**: Customers must explicitly check "Receive important updates by SMS"
- **Short messages**: All SMS messages are under 160 characters with link to My Trips
- **No marketing**: Only critical trip updates (booking confirmed, check-in, departure)
- **Email always sends**: SMS is optional, email is always sent

### SMS Events

- Booking confirmed
- Check-in opens soon (24h before)
- Check-in open
- Departure reminder (3h before)
- Flight delayed (if tracking supports)

## Other Email Providers

### SendGrid
```bash
EMAIL_SERVICE=smtp
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
```

### Resend
```bash
EMAIL_SERVICE=smtp
EMAIL_USER=resend
EMAIL_PASS=your-resend-api-key
EMAIL_HOST=smtp.resend.com
EMAIL_PORT=587
```

## Cron Job Setup

The notification system requires a cron job to run every 15 minutes.

### Option 1: Vercel Cron (Recommended)

Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/trip-notifications",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

### Option 2: External Cron Service

Use a service like:
- **cron-job.org**: Free cron service
- **EasyCron**: Paid, reliable
- **GitHub Actions**: Free for public repos

Set up to call:
```
GET https://your-domain.com/api/cron/trip-notifications
Authorization: Bearer your-cron-secret-token
```

### Option 3: Server Cron (Self-hosted)

Add to crontab:
```bash
*/15 * * * * curl -H "Authorization: Bearer your-cron-secret-token" https://your-domain.com/api/cron/trip-notifications
```

## Database Migration

Run the migration script in `App/docs/database-schema-trips.md` to add:
- `booking_reference`
- `passenger_last_name`
- `supplier_reference`
- `passenger_email`
- `booking_confirmed_email_sent_at`
- `checkin_opens_email_sent_at`
- `checkin_email_sent_at`
- `departure_reminder_sent_at`

## Testing

### Manual Test

1. Create a test booking
2. Call the cron endpoint manually:
```bash
curl -H "Authorization: Bearer your-cron-secret-token" \
  http://localhost:3000/api/cron/trip-notifications
```

### Email Testing

Use a service like:
- **Mailtrap**: Free email testing
- **Ethereal Email**: Nodemailer test account
- **MailHog**: Self-hosted

## Email Templates

Templates are in `App/lib/notifications/email-templates.ts`:
- Premium HTML design with Ecovira branding
- Responsive mobile-friendly layout
- Plain text fallback
- Customizable colors and styling

## Troubleshooting

### Emails Not Sending

1. Check environment variables are set
2. Verify email credentials are correct
3. Check server logs for errors
4. Test email connection:
```typescript
import nodemailer from 'nodemailer';
const transporter = nodemailer.createTransport({...});
transporter.verify((error, success) => {
  if (error) console.error(error);
  else console.log('Email server ready');
});
```

### Duplicate Emails

The system uses idempotent flags (`*_email_sent_at`) to prevent duplicates. If emails are sent twice:
1. Check database flags are being set correctly
2. Verify cron job isn't running too frequently
3. Check for race conditions in concurrent requests

### Cron Job Not Running

1. Verify cron endpoint is accessible
2. Check authorization header matches `CRON_SECRET`
3. Review cron service logs
4. Test endpoint manually first

## Production Checklist

- [ ] Email service configured and tested
- [ ] Environment variables set in production
- [ ] Cron job scheduled and running
- [ ] Database migration completed
- [ ] Email templates reviewed and customized
- [ ] Test emails sent and verified
- [ ] Monitoring/logging set up for email failures

