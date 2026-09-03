# SDL Lab Admin — catalog configuration

Admin panel for configuring which lab-master tests patients can book and how packages are bundled. Patient booking, payments, and other CRM modules are out of scope for this slice.

## Setup

```bash
cp .env.example .env.local
# set AUTH_SECRET to a random string
npm install
npm run db:migrate
SEED_DEMO_USERS=true npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Local seed accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@sdl.local | Admin123! |
| CRM (view-only) | crm@sdl.local | Crm123! |

## Catalog

- **Tests** (`/catalog/tests`) — browse the lab master (mock adapter), enable patient booking, prep, age/gender, home collection.
- **Packages** (`/catalog/packages`) — browse as cards (default) or a list, with search and Active / Expired / Archived tabs. Copy a package to duplicate it into edit; archive hides it from the active list. Create bundles in a four-step wizard (details, tests & pricing, availability, branding). Details include a category master (select or create) and fulfillment mode (self registration, appointment, home collection, appointment & home collection, or kit). Additional charges follow that mode. Tests and pricing sit together so list prices stay visible while setting the package price. Branding is last: banner, theme (including a custom hex/color picker), live patient preview, and a copyable share link with QR download. Banner files are served at `/uploads/packages/{filename}` for the patient portal and app.

Simulate a lab-master outage: `/catalog/tests?simulateError=1`.

## Coupons

- **Coupons** (`/coupons`) — create percent or fixed promotional codes that later apply on top of the patient cart subtotal (not fulfillment fees). Search and filter Active / Scheduled / Expired / Archived. CRM is view-only. Checkout apply and redemption recording are not in this slice.

## Patient catalog API

The mobile-facing, read-only contract is versioned:

- `GET /api/v1/catalog/tests`
- `GET /api/v1/catalog/packages`
- `GET /api/v1/catalog/packages/{slug}`
- `GET /api/v1/catalog/categories`
- `GET /api/openapi`

List endpoints accept `page`, `pageSize`, and `query`; packages also accept `category`. Prices are returned as ISO currency plus integer minor units. Configure `NEXT_PUBLIC_PATIENT_PORTAL_ORIGIN`, `NEXT_PUBLIC_MOBILE_APP_ORIGIN`, and `ALLOWED_API_ORIGINS` for the deployed clients.

## CrelioHealth integration

`src/lib/lab-master/` is the only LIMS catalog boundary. Local development uses the mock provider. Production requires:

```bash
LAB_MASTER_PROVIDER=http
LAB_MASTER_API_URL=https://your-normalized-crelio-gateway.example/v1/
LAB_MASTER_API_TOKEN=...
```

The HTTP adapter expects the normalized contract documented by `/api/openapi`-adjacent integration tests. Replace the isolated mapper when official CrelioHealth sandbox documentation is available; do not spread vendor payload fields into catalog or UI code.

## Vercel production setup

1. Provision Neon Postgres through Vercel Marketplace and set `DATABASE_URL`.
2. Provision Vercel Blob and set `BLOB_READ_WRITE_TOKEN`.
3. Provision Upstash Redis and set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
4. Set a strong `AUTH_SECRET` (Production **and** Preview), Crelio variables, origins, and `NEXT_PUBLIC_CATALOG_CURRENCY`. Generate with `openssl rand -base64 32`. The Next.js build no longer requires it at compile time; the running app does.
5. Run `npm run db:migrate`, then bootstrap the first admin with temporary `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` values via `npm run db:seed`. Remove the bootstrap password afterward.
6. Validate `/api/health`, `/api/ready`, `/api/openapi`, login/RBAC, package media, and mobile catalog responses on a preview deployment before promotion.

PGlite and local `.data` uploads are development fallbacks only. Production fails closed if managed storage, rate limiting, auth, or the real lab-master provider is missing.

Order write-back and CrelioHealth webhooks are reserved at `src/lib/lims-orders/` and `POST /api/webhooks/crelio` until the vendor documents those contracts. Do not invent payload fields.

## Quality gates

```bash
npm run check
npm run test:e2e
```

CI runs lint, TypeScript, unit tests, the production build, and Playwright desktop/mobile smoke flows. Database changes must include committed files in `drizzle/`.
