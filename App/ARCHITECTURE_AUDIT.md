# ECOVIRA TRAVEL HUB — ARCHITECTURE AUDIT & FIXES

## Executive Summary

**Status**: ⚠️ PARTIAL COMPLIANCE — Critical fixes required

**Working Components**:
- ✅ Main checkout page (`/app/book/checkout/page.tsx`) with Stripe + NOWPayments
- ✅ Crypto payment page with QR code
- ✅ Booking store (Zustand) with session persistence
- ✅ Provider abstraction layer exists
- ✅ Confirmation pipeline (webhooks) exists

**Critical Issues**:
- ❌ Booking store only supports flights (not stays/cars/transfers)
- ❌ Multiple duplicate checkout pages exist
- ❌ No unified booking session structure
- ❌ Confirmation pipeline not verified for all products

---

## 1️⃣ CORE ARCHITECTURE

### Current State

**Booking Store** (`stores/bookingStore.ts`):
- ✅ Uses Zustand with sessionStorage persistence
- ❌ Only supports `FlightResult` in `selectedOffer`
- ❌ No support for stays, cars, transfers
- ✅ Has pricing, payment, booking info structure
- ✅ Step completion tracking exists

**Required Fix**:
```typescript
// Current (FLIGHTS ONLY)
selectedOffer: FlightResult | null;

// Required (ALL PRODUCTS)
selectedOffers: {
  flight?: FlightResult;
  stay?: StayResult;
  car?: CarResult;
  transfer?: TransferResult;
}
```

### Action Items

1. **Extend Booking Store** to support all product types
2. **Create unified BookingSession type** matching specification
3. **Update all product selection flows** to use unified store

---

## 2️⃣ UNIVERSAL FLOW

### Current State

**Flights**: ✅ Complete flow exists
- Search → Select → Configure → Review → Checkout → Payment → Confirmation

**Stays**: ⚠️ Partial
- Search → Select → ❌ No unified checkout

**Cars**: ⚠️ Partial
- Search → Select → ❌ No unified checkout

**Transfers**: ⚠️ Partial
- Search → Select → ❌ No unified checkout

### Action Items

1. **Route all products to `/book/checkout`**
2. **Remove duplicate checkout pages**
3. **Ensure all products follow same flow**

---

## 3️⃣ CHECKOUT PAGE (ONE ONLY)

### Current State

**Main Checkout**: ✅ `/app/book/checkout/page.tsx`
- Supports Stripe + NOWPayments
- Has currency selector
- Has crypto selector
- Calculates totals correctly

**Duplicate Pages** (MUST REMOVE):
- ❌ `/app/flights/checkout/page.tsx` (placeholder - safe to remove)
- ❌ `/app/checkout/flight/page.tsx` (old implementation - must redirect)
- ❌ `/app/checkout/stay/page.tsx` (must redirect)

### Action Items

1. **Delete** `/app/flights/checkout/page.tsx`
2. **Redirect** `/app/checkout/flight/page.tsx` → `/book/checkout`
3. **Redirect** `/app/checkout/stay/page.tsx` → `/book/checkout`
4. **Update all product selection pages** to route to `/book/checkout`

---

## 4️⃣ PAYMENT ENGINE

### Stripe

**Status**: ✅ WORKING
- ✅ Currency selector exists
- ✅ Auto-selects by location
- ✅ User can override
- ✅ Supports all Stripe currencies
- ✅ FX conversion handled

**Verification**: ✅ PASS

### NOWPayments (Crypto)

**Status**: ✅ WORKING (after recent fixes)
- ✅ Crypto selector exists
- ✅ `pay_currency` sent correctly
- ✅ Uses `/v1/invoice` endpoint
- ✅ AUD → USD conversion implemented
- ✅ `invoice_url` used directly
- ✅ QR code generates proper URIs

**Verification**: ✅ PASS

---

## 5️⃣ CRYPTO PAYMENT PAGE

**Status**: ✅ WORKING
- ✅ QR code from `pay_currency`, `pay_address`, `pay_amount`
- ✅ Deep-link compatible (bitcoin:, ethereum:, solana:, tron:)
- ✅ QR changes with crypto selection
- ✅ Address/amount match invoice

**Verification**: ✅ PASS

---

## 6️⃣ PROVIDER ABSTRACTION

### Current State

**Flights**: ✅
- `lib/flights/amadeus.ts`
- `lib/flights/duffel.ts`
- `lib/search/orchestrator.ts` (unified interface)

**Stays**: ✅
- `lib/stays/provider.ts` (interface)
- `lib/stays/amadeus.ts` (implementation)

**Cars**: ✅
- `lib/transport/cars/amadeus.ts`

**Transfers**: ✅
- `lib/transport/transfers/amadeus.ts`

**Status**: ✅ Provider abstraction exists

---

## 7️⃣ CURRENCY & FX

### Current State

**Display Currency**: ✅ User choice (stored in booking store)
**Base Currency**: ✅ Provider currency (from API)
**FX Conversion**: ✅ Handled in checkout (AUD → USD for NOWPayments)

**Status**: ✅ WORKING

---

## 8️⃣ CONFIRMATION PIPELINE

### Current State

**Webhook Handler**: ✅ `/app/api/payments/webhook/stripe/route.ts`
- ✅ Payment confirmed
- ✅ Provider booking (via `issueTicket`)
- ✅ Store provider reference
- ✅ Generate PDF (via `issueTicket`)
- ✅ Email customer (via `sendConfirmation`)
- ✅ WhatsApp customer (via `sendConfirmation`)

**NOWPayments IPN**: ⚠️ Needs verification
- Endpoint exists: `/api/payments/nowpayments/ipn`
- Must verify it follows same pipeline

**Status**: ⚠️ PARTIAL (Stripe verified, NOWPayments needs verification)

---

## 9️⃣ UI / UX

### Current State

**Theme**: ✅ Dark luxury theme
**Text**: ✅ White text on dark backgrounds
**Borders**: ✅ Glowing borders (emerald/gold)
**Buttons**: ✅ Unified button styles
**Components**: ✅ Consistent spacing

**Status**: ✅ COMPLIANT

---

## 🔟 ERROR HANDLING

### Current State

**Retry**: ⚠️ Not implemented
**Cancel**: ✅ Cancel URLs exist
**Resume**: ⚠️ Not implemented
**Refund**: ⚠️ Not implemented
**Manual Override**: ⚠️ Not implemented

**Status**: ⚠️ PARTIAL

---

## 1️⃣1️⃣ REAL PAYMENT READINESS

### Test Checklist

| Test | Status |
|------|--------|
| Stripe live payments | ⚠️ Needs verification |
| Crypto payment on-chain | ⚠️ Needs verification |
| QR + invoice match | ✅ Verified |
| Email delivery | ⚠️ Needs verification |
| PDF opens on mobile | ⚠️ Needs verification |
| Flight only flow | ✅ Working |
| Flight + stay flow | ❌ Not implemented |
| Flight + transfer flow | ❌ Not implemented |
| Full bundle flow | ❌ Not implemented |

---

## CRITICAL FIXES REQUIRED

### Priority 1 (MUST FIX)

1. **Extend Booking Store** to support all products
2. **Remove duplicate checkout pages**
3. **Route all products to unified checkout**
4. **Verify NOWPayments IPN pipeline**

### Priority 2 (SHOULD FIX)

1. **Implement error handling** (retry, resume, refund)
2. **Test all product combinations**
3. **Verify email/PDF delivery**

### Priority 3 (NICE TO HAVE)

1. **Add manual override** for failed payments
2. **Add payment retry UI**
3. **Add refund flow**

---

## IMPLEMENTATION PLAN

### Phase 1: Core Architecture (CRITICAL)
1. Extend `BookingState` to support all products
2. Update booking store actions
3. Remove duplicate checkout pages
4. Add redirects from old checkout pages

### Phase 2: Universal Flow (CRITICAL)
1. Update all product selection pages to use unified store
2. Route all products to `/book/checkout`
3. Update checkout page to handle all product types

### Phase 3: Verification (HIGH)
1. Verify NOWPayments IPN pipeline
2. Test all product combinations
3. Verify email/PDF delivery

### Phase 4: Error Handling (MEDIUM)
1. Implement retry logic
2. Implement resume logic
3. Add refund flow

---

## ACCEPTANCE CRITERIA

✅ **DONE** when:
1. All products use same booking store
2. Only ONE checkout page exists
3. All products route to unified checkout
4. Payment works for all product combinations
5. Confirmation pipeline works for all products
6. Error handling implemented
7. All tests pass

