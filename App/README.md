# devecovira-air-v2
## Run
npm install
npm run dev

## Env Setup
Create .env.local in repo root (same folder as package.json)
Add DUFFEL_ACCESS_TOKEN="..."
Add STRIPE_SECRET_KEY="..."
Restart: npm run dev

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