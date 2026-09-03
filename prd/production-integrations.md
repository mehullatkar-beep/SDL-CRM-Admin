# Production, CrelioHealth, and Patient API Readiness

## Goal

Run SDL Catalog Admin safely on Vercel and provide a stable catalog contract for the patient mobile app while isolating all CrelioHealth-specific mapping behind provider interfaces.

## Production requirements

- Managed Postgres is the durable source of truth; PGlite is local/test only.
- Package media uses durable object storage and public CDN URLs.
- Production never starts with demo users, mock LIMS data, or missing secrets.
- Admin and CRM authorization remains enforced at the mutation/data boundary.
- Health, readiness, structured errors, rate limits, migrations, and CI checks exist before promotion.

## Patient catalog API

- `GET /api/v1/catalog/tests` returns active, standalone patient-bookable tests only.
- `GET /api/v1/catalog/packages` returns active, public, non-archived, non-expired packages only.
- `GET /api/v1/catalog/packages/{slug}` uses the stable package slug.
- `GET /api/v1/catalog/categories` returns categories represented in the public package catalog.
- Prices are represented as ISO currency plus integer minor units.
- Collection endpoints support bounded pagination and machine-readable error codes.
- `/api/openapi` is the mobile-team contract source.

## CrelioHealth boundary

- CrelioHealth remains canonical for tests; SDL owns booking overlays and package composition.
- The adapter must validate all upstream payloads, time out, retry transient failures, and expose normalized errors.
- Stable Crelio test IDs must be confirmed before production cutover.
- Live vendor field mapping, authentication, orders, status updates, and result webhooks require official sandbox documentation and credentials.
- No guessed vendor payload is accepted as a production contract.

## Acceptance criteria

- Sidebar brand row and application header are both 64px on desktop.
- Lint, TypeScript, unit tests, production build, and Playwright smoke tests pass.
- A Vercel preview retains database rows and banners across redeploys.
- `/api/ready` reports both Postgres and Crelio availability.
- Mobile endpoints reject invalid pagination, enforce rate limits, and never expose archived/private catalog data.
- Production configuration fails closed when durable storage, rate limiting, auth, or real LIMS configuration is absent.
