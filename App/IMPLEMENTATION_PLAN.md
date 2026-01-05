# ECOVIRA TRAVEL HUB — IMPLEMENTATION PLAN

## ✅ COMPLETED (Safe Fixes)

1. **Removed duplicate checkout page**: `/app/flights/checkout/page.tsx` (placeholder)
2. **Added redirects**: 
   - `/app/checkout/flight/page.tsx` → `/book/checkout`
   - `/app/checkout/stay/page.tsx` → `/book/checkout`
3. **Created architecture audit**: `ARCHITECTURE_AUDIT.md`

## ⚠️ CRITICAL FIXES REQUIRED (Do Not Break Existing Functionality)

### Phase 1: Extend Booking Store (CAREFUL - BREAKING CHANGE)

**Current State**: Booking store only supports flights
```typescript
selectedOffer: FlightResult | null;
```

**Required State**: Support all products
```typescript
selectedOffers: {
  flight?: FlightResult;
  stay?: StayResult;
  car?: CarResult;
  transfer?: TransferResult;
}
```

**Implementation Strategy**:
1. Add new `selectedOffers` field alongside `selectedOffer` (backward compatible)
2. Update all flight-related code to use `selectedOffers.flight` OR `selectedOffer` (fallback)
3. Gradually migrate to `selectedOffers` only
4. Remove `selectedOffer` after migration complete

**Files to Update**:
- `stores/bookingStore.ts` - Add `selectedOffers` field
- `app/book/checkout/page.tsx` - Support all product types
- `app/flights/page.tsx` - Set `selectedOffers.flight` instead of `selectedOffer`
- All booking flow pages (passengers, baggage, seats, insurance)

### Phase 2: Update Checkout Page (CAREFUL - Must Not Break Flights)

**Current State**: Checkout page only handles flights

**Required State**: Handle all products (flights, stays, cars, transfers)

**Implementation Strategy**:
1. Check `selectedOffers` for any product type
2. Calculate totals from all selected products
3. Display summary of all products
4. Route to appropriate confirmation page

**Files to Update**:
- `app/book/checkout/page.tsx` - Add product type detection and multi-product totals

### Phase 3: Product Selection Pages (NEW FEATURE)

**Required**: All product selection pages must route to `/book/checkout`

**Files to Update**:
- `app/stays/page.tsx` - Route to `/book/checkout` on selection
- `app/cars/page.tsx` - Route to `/book/checkout` on selection (if exists)
- `app/transfers/page.tsx` - Route to `/book/checkout` on selection (if exists)

### Phase 4: Verify NOWPayments IPN (VERIFICATION)

**Current State**: Stripe webhook verified, NOWPayments IPN needs verification

**Required**: Verify NOWPayments IPN follows same pipeline as Stripe

**Files to Check**:
- `app/api/payments/nowpayments/ipn/route.ts` - Verify it calls same confirmation pipeline

---

## 🚫 DO NOT TOUCH (Working Components)

1. **Payment Engine** - Stripe and NOWPayments are working correctly
2. **Crypto Payment Page** - QR code and invoice URL are correct
3. **Currency Conversion** - AUD → USD conversion is working
4. **Provider Abstraction** - All providers use correct interfaces
5. **UI/UX** - Dark theme and styling are correct

---

## 📋 TESTING CHECKLIST

After implementing fixes, verify:

- [ ] Flight-only booking still works
- [ ] Flight + stay booking works (when implemented)
- [ ] Flight + transfer booking works (when implemented)
- [ ] Full bundle booking works (when implemented)
- [ ] Stripe payment works for all combinations
- [ ] NOWPayments payment works for all combinations
- [ ] Confirmation pipeline works for all products
- [ ] Email delivery works
- [ ] PDF generation works

---

## 🎯 ACCEPTANCE CRITERIA

**DONE** when:
1. ✅ All products use unified booking store
2. ✅ Only ONE checkout page exists (redirects in place)
3. ✅ All products route to unified checkout
4. ✅ Payment works for all product combinations
5. ✅ Confirmation pipeline verified for all products
6. ✅ No existing functionality broken

---

## ⚠️ WARNINGS

1. **DO NOT** remove `selectedOffer` until all code migrated to `selectedOffers`
2. **DO NOT** change payment logic (Stripe/NOWPayments working correctly)
3. **DO NOT** change UI/UX (theme and styling are correct)
4. **DO NOT** change provider abstraction (interfaces are correct)

---

## 📝 NOTES

- Current implementation is **flight-focused** but architecture supports extension
- Booking store uses Zustand with sessionStorage (good for multi-product)
- Checkout page already has infrastructure for multi-product (just needs product detection)
- Provider abstraction already exists (no changes needed)

