# devecovira-air-v2
## Run
npm install
npm run dev

## Env Setup
Create .env.local in repo root (same folder as package.json)
Add DUFFEL_ACCESS_TOKEN="..."
Add STRIPE_SECRET_KEY="..."
Restart: npm run dev

Test create-intent with PowerShell:
Invoke-RestMethod -Method Post `
  -Uri "http://localhost:3000/api/payments/create-intent" `
  -ContentType "application/json" `
  -Body '{"amount":1000,"currency":"aud"}'