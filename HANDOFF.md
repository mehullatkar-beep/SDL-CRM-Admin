# Handoff — SDL Catalog Admin / Patient Portal

**Repo:** `/Users/mehullatkar/Documents/SDL-CRMAdmin-PatientPortal`  
**Branch:** `main` (still the Create Next App commit `a224e3e`). **Almost the entire product is uncommitted.** Run `git status` before anything else.  
**Stack:** Next.js 16 (App Router) + React 19 + Drizzle + Auth.js v5 + Tailwind 4 + shadcn  
**Local:** `http://localhost:3000` — `SEED_DEMO_USERS=true npm run db:seed` then `admin@sdl.local` / `Admin123!` (admin) or `crm@sdl.local` / `Crm123!` (view-only)

This is **catalog + coupon + banner + notification-trigger admin**, plus a **read-only patient catalog API**. There is no cart, checkout, payments, or booked-orders UI yet.

---

## Product decisions that must not drift

### Catalog

- Tests always come from the lab master. Admins never invent test codes. Overlay is `test_booking_configs`.
- Packages are admin bundles. Package `offerPrice` is the catalog price (percent/fixed baked in at save). Sequence of tests does not matter.
- Roles: `admin` mutates, `crm` views. Enforce with `requireAdmin()` on server actions, not only UI.

### Coupons (just shipped)

Spec: [`prd/coupon-management.md`](prd/coupon-management.md)

- Coupon sits **on top of the cart subtotal** (test list prices + package **offer** prices). It is not a second package-price editor.
- **Does not** discount home-collection, shipping, or consultation fees.
- Types: **percent** or **fixed** only. Whole cart. Optional min cart amount.
- One coupon per future checkout. Does not stack with other coupons.
- **No pause state.** Archive / unarchive only. The `active` column still exists and is kept in sync (`active = !archived`). Do not add an Active switch back.
- **Scheduled** = `validFrom` is still in the future. Not the same as archived. On that date it moves to Active by itself.
- Checkout must call [`evaluateCoupon`](src/lib/coupons.ts) — do not reimplement the math in the API layer.

### Out of scope until the user asks

- `POST /api/v1/checkout/validate-coupon`, cart, payments
- `coupon_redemptions` table (no patient/order identity yet)
- First-order-only, auto-apply, free home collection, package/test targeting
- Applying a code on `/p/{slug}`
- Inventing CrelioHealth order/webhook payloads

---

## What exists

| Area | Where | Notes |
|------|--------|--------|
| Tests overlay | `/catalog/tests` | Sheet editor; `src/actions/tests.ts` |
| Packages | `/catalog/packages` | 4-step wizard; cards + list; archive/duplicate |
| Coupons | `/coupons`, `/coupons/new`, `/coupons/[id]` | Table + single-page form; archive/unarchive/duplicate |
| Banners | `/banners`, `/banners/new`, `/banners/[id]` | Home and/or in-app inbox; archive/duplicate; image optional |
| Notifications | `/notifications` | Master trigger list; on/off only; no templates |
| Public package page | `/p/{slug}` | Share/QR landing; no booking |
| Mobile catalog API | `/api/v1/catalog/*`, `/api/v1/engagement/*`, `/api/openapi` | GET only; money as `{ amountMinor, currency }` |
| Crelio catalog adapter | `src/lib/lab-master/` | Mock locally; `LAB_MASTER_PROVIDER=http` required in managed production |
| LIMS orders | `src/lib/lims-orders/types.ts` | Interface only |
| Crelio webhook | `POST /api/webhooks/crelio` | Returns 501 |
| Deferred nav | `src/lib/deferred-modules.ts` | orders, branding, feedback, queries |

**Money:** admin/DB uses **integer major units**. Public API uses **minor units** via `catalogMoney()`. Currency env: `NEXT_PUBLIC_CATALOG_CURRENCY` (default SAR). Package form labels still say “INR” / “₹” in places — copy debt, not a second currency.

---

## Coupon files

| Path | Role |
|------|------|
| `prd/coupon-management.md` | Spec |
| `src/db/schema.ts` (`coupons`) | Table; unique uppercase `code` |
| `drizzle/0001_public_warpath.sql` | Migration |
| `src/lib/coupons.ts` | `evaluateCoupon`, code normalize/generate |
| `src/lib/coupon-lifecycle.ts` | Active / Scheduled / Expired / Archived |
| `src/lib/coupon-queries.ts` | Loaders |
| `src/lib/coupon-form.ts` | Form values + client validation |
| `src/actions/coupons.ts` | `saveCoupon`, `setCouponArchived`, `duplicateCoupon` |
| `src/components/coupons/` | List + form |
| `src/lib/coupons.test.ts` | Engine + lifecycle |
| `tests/e2e/admin-coupons.spec.ts` | Admin create; CRM cannot save |

List tabs: Active (in window, not archived) / Scheduled (`validFrom` future) / Expired / Archived.

---

## Persistence gotchas

- Production: Neon (`DATABASE_URL`) + Vercel Blob + Upstash Redis. Fail-closed via [`src/lib/env.ts`](src/lib/env.ts) + [`src/instrumentation.ts`](src/instrumentation.ts). Skips the check during `NEXT_PHASE=phase-production-build`.
- Local: PGlite under `.data/`. [`src/db/pglite-migrate.ts`](src/db/pglite-migrate.ts) **stamps migration 0000** when `users` already exists but the Drizzle journal does not, then applies pending files (needed for `coupons`).
- After pulling schema changes: `npm run db:migrate`. If the journal is hopeless, wipe `.data` and migrate + seed.
- [`src/db/index.ts`](src/db/index.ts) `DB_CACHE_GENERATION` — bump if in-process PGlite cache must reset.
- This repo is **not linked to Vercel**. Do not go live on mock lab-master data.

---

## Quality gates

```bash
npm run check      # lint, typecheck, unit tests, build
npm run test:e2e   # Playwright; uses production `start` on :3100 + PGlite `e2e`
```

Playwright `webServer` seeds demo users. Coupon e2e codes must be unique (`Date.now()`); heading matchers need `{ exact: true }` because “No coupons yet” also matches “Coupons”.

---

## Suggested next work (ask the user; do not assume order)

1. **Checkout coupon apply** — `POST /api/v1/checkout/validate-coupon` (or cart session) that calls `evaluateCoupon`; OpenAPI; `coupon_redemptions` + increment `redemptionCount` / `maxPerPatient` once a patient/order identity exists.
2. **Notification templates** — Portal → Notifications is on/off only; email/SMS/push copy waits on the portal.
3. **Cart / booked orders** — `/orders` is still a placeholder; LIMS write-back waits on Crelio docs.
4. **Vercel go-live** — SDL ops follows [`DEPLOYMENT.md`](DEPLOYMENT.md); lab gets URL + credentials only. Need Neon, `AUTH_SECRET`, bootstrap admin; Blob/Upstash/Crelio before full production.
5. **Crelio HTTP mapper** — replace guessed field mapping only when official sandbox docs exist. Token header is `X-Internal-Token`; lab filter is `LAB_MASTER_LAB_PUBLIC_KEY`.

---

## Agent habits for this repo

- Read `node_modules/next/dist/docs/` before new Next APIs (see `AGENTS.md`). This is Next 16; proxy is `src/proxy.ts` exporting `config`, not `middleware.ts`.
- Mirror packages for admin CRUD: server actions + Zod + `requireAdmin()` + `canEdit` in UI.
- PRDs live in `prd/`. Coupon apply at checkout is **not** in the catalog PRD.
- Do not add a coupon pause/active toggle. Archive is the off switch.
- Do not add a banner pause/active toggle. Archive is the off switch.
- Portal → Notifications is trigger on/off only. Do not add templates, channels, or a composer yet.
- Do not invent Crelio order/webhook JSON.
