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

Copy `App/.env.local.example` to `App/.env.local` and fill in real values. **Never commit `.env.local`.**

Required for Duffel + LiteAPI + Supabase (use placeholders in .env.local only; never commit real keys):
- `DUFFEL_ACCESS_TOKEN=YOUR_DUFFEL_TOKEN` — Flights (server-side only)
- `LITEAPI_API_KEY` — Hotels (server-side only)
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL only
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Public anon key (client-safe)
- `SUPABASE_SERVICE_ROLE_KEY` — Server-only; never use `NEXT_PUBLIC_` for this
- `PRIMARY_FLIGHT_PROVIDER=duffel`
- `PRIMARY_HOTEL_PROVIDER=liteapi`

Add Stripe, NOWPayments, Amadeus, etc. as needed. Use placeholders only, e.g. `STRIPE_SECRET_KEY=YOUR_STRIPE_SECRET_KEY`. See `.env.local.example` for variable names (no real values).

**CRITICAL:**
- All API keys and secrets must come from environment variables only; no hardcoded tokens in the repo.
- Restart dev server after any env changes: `npm run dev`

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