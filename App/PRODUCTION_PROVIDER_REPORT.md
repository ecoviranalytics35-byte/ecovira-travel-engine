# Production Provider Simplification — Report

## 1. Amadeus code removed (airports / env / config)

- **`/api/airports/search`**
  - Removed: Amadeus OAuth token request (`client_credentials` to `test.api.amadeus.com/v1/security/oauth2/token`).
  - Removed: Amadeus Airport & City Search (`/v1/reference-data/locations` with `subType=AIRPORT`).
  - Removed: All use of `AMADEUS_API_KEY` and `AMADEUS_API_SECRET` in this route.
  - Removed: Static airport fallback in production (no `getStaticAirports()` when `VERCEL_ENV === "production"`).
  - Removed: Amadeus-specific error handling and logs (502 "Amadeus API authentication failed", etc.).

- **Environment**
  - **`/api/env-check`**: Removed `AMADEUS_API_KEY` and `AMADEUS_API_SECRET` from the required env list; removed `amadeusRelated` from diagnostics.

- **Provider config**
  - **`lib/config/providers.ts`**: Removed `AMADEUS` from `PROVIDER_NAMES.FLIGHT` and `PROVIDER_NAMES.HOTEL`.
  - **`lib/providers/flights/index.ts`**: Removed `amadeusFlightProvider`; flights use Duffel only.
  - **`lib/providers/hotels/index.ts`**: Removed `amadeusStaysProvider` and Amadeus fallback; production uses LiteAPI only.

**Note:** Amadeus is still used elsewhere for cars, transfers, seat maps, and trip status. Only airports search and flight/hotel provider selection no longer depend on Amadeus.

---

## 2. Duffel token validated

- **Airports**
  - In production, missing or empty `DUFFEL_ACCESS_TOKEN` causes a **500** with message:  
    `"Airport search unavailable: DUFFEL_ACCESS_TOKEN is required in production."`
  - No fallback provider; no demo/static data.

- **Flights**
  - In production, missing/empty token causes **500** with:  
    `"Flights search unavailable: DUFFEL_ACCESS_TOKEN is required in production."`
  - **`lib/providers/flights/duffel.ts`**:
    - Token is taken as `(process.env.DUFFEL_ACCESS_TOKEN ?? "").trim()` so it is clean (no newline/comments).
    - Header is `Authorization: Bearer <trimmed token>`.
    - Health check uses the same trimmed token check.

**Confirmation:** Duffel token is validated in production for both airports and flights; missing token returns 500, no demo fallback.

---

## 3. LiteAPI key validated

- **Stays**
  - In production, missing or empty `LITEAPI_API_KEY` causes a **500** from `/api/stays/search` with:  
    `"Hotel search unavailable: LITEAPI_API_KEY is required in production."`
  - **`lib/providers/hotels/index.ts`**: `getHotelProvider()` in production requires `LITEAPI_API_KEY` (trimmed); if missing, throws:  
    `"[production] LITEAPI_API_KEY is required"`.
  - No demo/mock fallback in production.

- **Logging**
  - **`lib/providers/hotels/liteapi.ts`**: Logs LiteAPI response count and status:  
    `event: "liteapi_stays_response", provider: "liteapi", count, status, city`.
  - **`/api/stays/search`**: Logs `event: "stays_search", provider: "liteapi", count, status, city`.

**Confirmation:** LiteAPI key is required in production; missing key returns 500 and is logged; response count and status are logged.

---

## 4. Production safety guard

- **`lib/core/env.ts`**
  - `isProduction()`: `process.env.VERCEL_ENV === "production"`.
  - `requireEnvInProduction(key)`: In production, requires non-empty (trimmed) value or throws.

- **Behaviour**
  - **Production:** No demo data, no fallback providers; missing env (Duffel token, LiteAPI key) causes 500 or thrown error.
  - **Non-production:** Demo/fallback behaviour unchanged where implemented (e.g. flights demo mode, transfer stubs).

---

## 5. Post-deploy checks

After redeploying production, confirm:

1. **`/api/airports/search?q=...`** → **200** and results from Duffel (e.g. `q=syd` or `q=lon`).
2. **`/api/flights/search`** (with valid origin/destination/dates) → **200** and real Duffel offers (no demo fallback).
3. **`/api/stays/search`** (e.g. city=London or Sydney) → **200** and LiteAPI results with **count > 0** for major cities.

---

*Generated after provider simplification: Airports → Duffel only; Flights → Duffel only; Hotels → LiteAPI only; Amadeus removed from airports and env/config.*
