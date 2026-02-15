# devecovira-air-v2
## Run
**IMPORTANT: Run from the App/ directory (where package.json is), NOT from App/app/**

```powershell
cd App
npm install
npm run dev
```

The dev server should start from `App/` (project root), not `App/app/` (Next.js app directory).

## Env Setup
**IMPORTANT: .env.local must be in the project root (same folder as package.json), NOT in app/.env.local**

Create `.env.local` in repo root (same folder as package.json):
```
# Stripe Configuration
STRIPE_SECRET_KEY=YOUR_STRIPE_SECRET_KEY_<set-in-env>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=YOUR_STRIPE_PUBLISHABLE_KEY_<set-in-env>
STRIPE_WEBHOOK_SECRET=YOUR_STRIPE_WEBHOOK_SECRET_<set-in-env>

# NOWPayments Configuration
NOWPAYMENTS_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxx
NOWPAYMENTS_IPN_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
NOWPAYMENTS_MODE=live
# NOWPAYMENTS_MODE can be "live" (default when API key exists) or "mock" (for testing)

# Admin/Debug Configuration (optional)
ADMIN_ISSUE_KEY=your-admin-key-here
# Used for debug endpoints like /api/debug/issue-ticket (requires X-ADMIN-KEY header)
SUPPORT_EMAIL=support@ecovira.air
# Support email address for tickets and customer service

# Application Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Provider selection (no hardcoding — use these for staging/production)
PRIMARY_FLIGHT_PROVIDER=duffel
PRIMARY_HOTEL_PROVIDER=liteapi

# Flights (Duffel) — server-side only, never exposed to client
DUFFEL_ACCESS_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxx

# Hotels (LiteAPI) — sandbox or production; server-side only
LITEAPI_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxx

# Amadeus Configuration (optional fallback / secondary)
AMADEUS_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxx
AMADEUS_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx

# Supabase Configuration (if using)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**CRITICAL:**
- NO quotes around values (or use quotes consistently)
- NO trailing spaces
- NO placeholder values like "sk_..." - use REAL full keys
- **Stripe Secret Key** (`STRIPE_SECRET_KEY`) must start with `YOUR_STRIPE_SECRET_KEY_` or `sk_test_` and be >30 characters
- **Stripe Publishable Key** (`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`) must start with `YOUR_STRIPE_PUBLISHABLE_KEY_` or `pk_test_` and be >30 characters
- The `NEXT_PUBLIC_` prefix is required for client-side environment variables
- Restart dev server after ANY changes: `npm run dev` (env vars only load on boot)

**If your .env.local is in app/.env.local, move it to the root:**
```powershell
# From the App directory (where package.json is)
Move-Item -Path "app\.env.local" -Destination ".env.local" -Force
# Then restart: npm run dev
```

**Troubleshooting:**

**Use the env-check endpoint to diagnose env var loading:**
Visit `http://localhost:3000/api/env-check` after starting the dev server. This will show:
- Which env vars exist (exists: true/false)
- Key length (should be >0 for configured vars)
- Key prefix (first 10 chars, for verification)
- CWD (current working directory - should match where package.json is)
- All env var names containing STRIPE/NOW/AMADEUS patterns

**Common issues:**
- If Stripe key length shows 11 or <30: Your key is truncated/placeholder. Get full key from Stripe dashboard.
- If NOWPayments/Amadeus key length shows 0: Check env var names match exactly. Restart dev server.
- If env-check shows all keys missing: `.env.local` is in wrong location OR dev server wasn't restarted after creating it.

## Amadeus Setup
Create .env.local in repo root
Add AMADEUS_API_KEY="..."
Add AMADEUS_API_SECRET="..."
Restart npm run dev

## Transfers Setup
Create .env.local in repo root
Add AMADEUS_API_KEY="..."
Add AMADEUS_API_SECRET="..."
Restart npm run dev

## Cars Test
Required query params: pickupLat, pickupLng, pickupDate, pickupTime, dropoffDate, dropoffTime
Example test URL: /api/transport/cars/search?pickupLat=-37.6733&pickupLng=144.8433&pickupDate=2026-01-15&pickupTime=10:00&dropoffDate=2026-01-18&dropoffTime=10:00&driverAge=30&debug=1
Reminder: restart dev server after editing .env.local
Invoke-RestMethod -Method Post `
  -Uri "http://localhost:3000/api/payments/create-intent" `
  -ContentType "application/json" `
  -Body '{"amount":1000,"currency":"aud"}'