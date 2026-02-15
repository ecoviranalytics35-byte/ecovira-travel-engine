# Vercel environment variables checklist

Add these in **Vercel → Project → Settings → Environment Variables**. Use the same names as in `.env.local.example`. Never commit real values.

## Required for Duffel + LiteAPI + Supabase

| Variable | Notes |
|----------|--------|
| `DUFFEL_ACCESS_TOKEN` | Flights (server-only). From Duffel dashboard. |
| `LITEAPI_API_KEY` | Hotels (server-only). Sandbox or production. |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL only. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (client-safe). |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only. Never use `NEXT_PUBLIC_` for this. |
| `PRIMARY_FLIGHT_PROVIDER` | Set to `duffel`. |
| `PRIMARY_HOTEL_PROVIDER` | Set to `liteapi`. |

## Optional (payments, etc.)

- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- `NOWPAYMENTS_API_KEY`, `NOWPAYMENTS_IPN_SECRET`
- `AMADEUS_API_KEY`, `AMADEUS_API_SECRET`
- `NEXT_PUBLIC_SITE_URL` (e.g. `https://your-app.vercel.app`)

## After adding

- Redeploy so new variables are picked up.
- Health checks: `/api/health/flights`, `/api/health/hotels`.
