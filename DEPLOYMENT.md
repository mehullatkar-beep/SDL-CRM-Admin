# Deploy SDL Catalog Admin on Vercel

Customer-facing checklist. Everything below is done in the **Vercel dashboard** — no developer laptop required after the repo is connected.

## 1. Import the project

1. [vercel.com/new](https://vercel.com/new) → import `mehullatkar-beep/SDL-CRM-Admin` (or your fork).
2. Framework preset: **Next.js** (auto-detected).
3. Do **not** deploy yet if you can pause — set env vars first (step 2).

## 2. Required environment variables

Open **Project → Settings → Environment Variables**. Add these for **Production** and **Preview**.

| Variable | What to enter |
| --- | --- |
| `AUTH_SECRET` | Run `openssl rand -base64 32` once and paste the output. |
| `DATABASE_URL` | From Neon (step 3). |
| `BOOTSTRAP_ADMIN_EMAIL` | Email the lab admin will use to sign in. |
| `BOOTSTRAP_ADMIN_PASSWORD` | Strong temporary password for first login. |
| `BOOTSTRAP_ADMIN_NAME` | Optional display name (defaults to “Lab Admin”). |

**Important:** If Vercel shows “DATABASE_URL already exists” when connecting Neon, go to Environment Variables, **delete the old empty `DATABASE_URL`**, then connect Neon again (prefix `DATABASE` → `DATABASE_URL`).

## 3. Connect Neon Postgres

1. **Storage → Connect Database → Neon**.
2. Environments: **Production** and **Preview**.
3. Prefix: **`DATABASE`** (creates `DATABASE_URL`).
4. **Connect Project**, then **Redeploy**.

Database tables are created automatically during deploy (`vercel-build` runs migrations). The first admin account is created automatically on the first request when `BOOTSTRAP_*` vars are set and no users exist yet.

## 4. First login

1. Open the Vercel URL (e.g. `https://your-project.vercel.app/login`).
2. Sign in with `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD`.
3. After confirming login works, **delete `BOOTSTRAP_ADMIN_PASSWORD`** from Vercel env vars and redeploy. The admin account stays; the env password is no longer needed.

## 5. Smoke checks

| URL | Expected |
| --- | --- |
| `/api/health` | `{ "status": "ok" }` |
| `/login` | Sign-in page loads |
| After login | `/catalog/tests` loads |

## 6. Before go-live (production only)

Add when the lab is ready — not required for admin login and catalog setup:

| Variable | Purpose |
| --- | --- |
| `BLOB_READ_WRITE_TOKEN` | Package and banner image uploads |
| `UPSTASH_REDIS_REST_URL` | API rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | API rate limiting |
| `LAB_MASTER_PROVIDER` | Set to `http` |
| `LAB_MASTER_API_URL` | Crelio catalog gateway |
| `LAB_MASTER_API_TOKEN` | Crelio token |
| `LAB_MASTER_LAB_PUBLIC_KEY` | Lab public key |
| `NEXT_PUBLIC_CATALOG_CURRENCY` | e.g. `SAR` |
| `NEXT_PUBLIC_PATIENT_PORTAL_ORIGIN` | Patient portal URL |
| `ALLOWED_API_ORIGINS` | Mobile app / portal origins |

Preview deployments can run with Neon + `AUTH_SECRET` + bootstrap vars only. Mock lab data is used until Crelio vars are set.

## Troubleshooting

- **Internal Server Error on every page** — check `AUTH_SECRET` is set for the environment you deployed (Production vs Preview).
- **Login fails “Invalid credentials”** — confirm `BOOTSTRAP_*` vars were set **before** first deploy, or redeploy after adding them. Check Neon has tables (Vercel build log should show “Applied migrations to managed Postgres”).
- **DATABASE_URL conflict** — delete the placeholder variable in Vercel, then reconnect Neon.
