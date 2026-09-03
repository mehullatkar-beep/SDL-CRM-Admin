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

**Customer handoff:** follow [`DEPLOYMENT.md`](DEPLOYMENT.md) — Vercel dashboard only; migrations and first admin are automatic.

Summary:

1. Set `AUTH_SECRET`, `BOOTSTRAP_ADMIN_EMAIL`, and `BOOTSTRAP_ADMIN_PASSWORD` in Vercel.
2. Connect Neon (`DATABASE_URL`). Delete any placeholder `DATABASE_URL` first if Neon reports a conflict.
3. Deploy. Tables migrate on build; first admin is created on first request.
4. Sign in, then remove `BOOTSTRAP_ADMIN_PASSWORD` from Vercel.
5. Add Blob, Redis, and Crelio vars before go-live (see `DEPLOYMENT.md`).

Local development still uses PGlite and demo users (`SEED_DEMO_USERS=true npm run db:seed`).

Order write-back and CrelioHealth webhooks are reserved at `src/lib/lims-orders/` and `POST /api/webhooks/crelio` until the vendor documents those contracts. Do not invent payload fields.

## Quality gates

```bash
npm run check
npm run test:e2e
```

CI runs lint, TypeScript, unit tests, the production build, and Playwright desktop/mobile smoke flows. Database changes must include committed files in `drizzle/`.
