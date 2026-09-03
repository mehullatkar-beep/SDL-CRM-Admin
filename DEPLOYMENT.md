# SDL ops — deploy and hand off to the lab

**Internal only.** The lab customer receives a **URL + login credentials**. They do not configure Vercel, Neon, env vars, or run any scripts.

## What the customer gets

Share only:

| Item | Example |
| --- | --- |
| Admin URL | `https://sdl-crm-admin.vercel.app/login` |
| Work email | `admin@lab.com` |
| Password | (the password you set during setup below) |

Nothing else. No setup guide, no dashboard access, no terminal steps.

---

## SDL setup (before sharing the URL)

### 1. Vercel project

1. Import the GitHub repo into Vercel.
2. Connect **Neon** (Storage → Neon). Prefix **`DATABASE`** → `DATABASE_URL`.
   - If “DATABASE_URL already exists”: delete the placeholder in Environment Variables, then reconnect Neon.
3. Set **Production** env vars:

| Variable | Notes |
| --- | --- |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `DATABASE_URL` | From Neon (auto if connected) |
| `BOOTSTRAP_ADMIN_EMAIL` | The lab admin’s real work email |
| `BOOTSTRAP_ADMIN_PASSWORD` | Strong password you will share with the lab |
| `BOOTSTRAP_ADMIN_NAME` | e.g. `Lab Admin` |

4. **Deploy.** Migrations run on build; the admin account is created on the first request.

### 2. Verify before handoff

1. Open `/login` on the production URL.
2. Sign in with the bootstrap email and password.
3. Confirm `/catalog/tests` loads.
4. **Remove `BOOTSTRAP_ADMIN_PASSWORD`** from Vercel and redeploy (admin account remains in Neon).

### 3. Hand off to the lab

Send the URL, email, and password (secure channel). They sign in and start configuring tests/packages.

---

## Optional — add before go-live

Not required for admin login and catalog work. SDL adds these when integrations are ready:

| Variable | Purpose |
| --- | --- |
| `BLOB_READ_WRITE_TOKEN` | Image uploads |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | API rate limits |
| `LAB_MASTER_PROVIDER=http` + Crelio vars | Live test catalog |
| `NEXT_PUBLIC_CATALOG_CURRENCY` | e.g. `SAR` |
| `NEXT_PUBLIC_PATIENT_PORTAL_ORIGIN` | Patient portal URL |
| `ALLOWED_API_ORIGINS` | Mobile app origins |

Preview deployments can use Neon + `AUTH_SECRET` + bootstrap only; mock lab data until Crelio is wired.

---

## Troubleshooting (SDL ops)

| Symptom | Fix |
| --- | --- |
| 500 on every page | `AUTH_SECRET` missing for Production |
| Login fails | Redeploy after setting `BOOTSTRAP_*`; check build log for “Applied migrations to managed Postgres” |
| DATABASE_URL conflict | Delete empty placeholder, reconnect Neon |
