# Coupon management

Admin-panel slice for promotional codes that later reduce a patient cart. Portal and mobile apply, redemption recording, and checkout are out of scope.

## Goals

- Lab admins create and manage e-commerce-style promo codes so patients can continue booking instead of abandoning a cart.
- A coupon sits **on top of the cart subtotal** (catalog offer prices). It is not a second editor for package list/offer prices.
- CRM staff can view coupons; only admins can change them.
- Evaluation rules live in one server-side function so a future checkout API cannot drift from what staff configured.

## Definitions

### Coupon

A unique promotional code (`WELCOME10`) with a percent or fixed amount off the **whole cart**. Optional minimum cart amount, schedule, global redemption cap, and per-patient cap. Applies to any tests or packages in the future cart.

### Cart subtotal

Sum of catalog prices the patient is booking: test `listPrice` and package `offerPrice`. Home-collection, shipping, and consultation fees are **not** part of the subtotal a coupon discounts.

### Stacking

- Package/list discounts are already baked into catalog `offerPrice`.
- The coupon runs after those prices.
- One coupon per future checkout. Coupons do not stack with other coupons.
- Fulfillment fees are added after the coupon; they are not discounted.

## User stories and acceptance criteria

1. As an admin, I can create a coupon: name, unique code, optional patient-facing description, percent or fixed discount, optional percent cap, optional minimum cart amount, optional validity window, optional max redemptions, and per-patient max (default 1).
   - Code is stored uppercase, 3–24 characters, `A–Z` and `0–9` only.
   - Percent value is 1–100; optional max discount cannot be below 1 when set.
   - Fixed value is at least 1 major unit and never takes the cart below zero.
   - `validTo` cannot be before `validFrom`.
   - Duplicate codes are rejected.
2. As an admin, I see a live preview: on a cart of amount X, this code saves Y and the patient pays Z. Preview uses the same `evaluateCoupon` function checkout will call.
3. As an admin, I can browse coupons in a table, search by name or code, and switch Active / Scheduled / Expired / Archived tabs.
   - Usage shows `redemptionCount / max` (or Unlimited). Count stays 0 until checkout records redemptions.
4. As an admin, I can edit, duplicate, and archive a coupon (confirm before archive). Unarchive restores it. Duplicate requires a new unique code. There is no separate pause state.
5. As CRM, I can view coupons but cannot save, duplicate, or archive.

## Edge cases

- Empty search shows a clear empty state; failed load shows an error with retry.
- Exhausted global cap (`redemptionCount >= maxRedemptions`) fails evaluation with `exhausted`.
- Scheduled (`validFrom` in the future) and expired (`validTo` end of day in the past) fail evaluation even if the coupon is not archived.
- Archived coupons fail evaluation and do not appear on Active.
- Per-patient max is stored now and enforced only when patient identity exists at checkout.
- Money is integer major units in admin/DB (same as packages).

## Out of scope

- Patient portal / mobile apply UI and `POST /api/v1/checkout/validate-coupon`
- Cart, orders, payments, Crelio write-back
- Redemption audit table
- First-order-only, auto-apply, free home-collection, or targeting specific packages/tests/categories
- Applying a code on `/p/{slug}`

## Technical context

- Schema: `coupons` in `src/db/schema.ts`
- Engine: `src/lib/coupons.ts` (`evaluateCoupon`)
- Lifecycle: `src/lib/coupon-lifecycle.ts`
- Screens: `/coupons`, `/coupons/new`, `/coupons/[id]`
- Actions: `src/actions/coupons.ts` with `requireAdmin()`
- Auth: Auth.js credentials; roles `admin` (mutate) and `crm` (read)
