# SDL prototype deployment (stakeholder review)

**Internal SDL ops only.** This is a **click-through prototype** for lab approval on flows, layout, and where configuration lives. It is **not** production, not a UAT environment, and not handed off as a self-service product.

## What stakeholders receive

Share only:

| Item | Value |
| --- | --- |
| URL | `https://your-project.vercel.app/login` |
| Admin login | `admin@sdl.local` / `Admin123!` |
| CRM login (view-only) | `crm@sdl.local` / `Crm123!` |

They browse the UI and give feedback. No setup, no Vercel access, no env vars.

Sample data includes mock lab tests, one wellness package, a coupon, and a banner.

---

## SDL one-time setup

### 1. Vercel env vars (Production)

| Variable | Value |
| --- | --- |
| `SDL_PROTOTYPE_MODE` | `true` |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `DATABASE_URL` | Neon connection string |
| `LAB_MASTER_PROVIDER` | `mock` (default — keep mock for prototype) |

Do **not** set Blob, Redis, or Crelio vars for the prototype.

If Neon connect fails with “DATABASE_URL already exists”, delete the empty placeholder in Environment Variables first.

### 2. Deploy

Push to `main` or redeploy. Migrations run on build; demo users and sample catalog seed on first request.

### 3. Verify

1. Open `/login` — demo credentials are shown on the page.
2. Sign in as admin and walk through Portal Configurations, Engagement, and Notifications.
3. Share the URL + credentials with stakeholders.

---

## Scope boundaries (tell stakeholders)

- Mock lab test catalog (not live Crelio data)
- Image uploads may not persist without Blob storage
- No patient app, checkout, or real notifications sent
- Data may reset if the Neon database is recreated

When the lab approves the flows, a separate production build drops `SDL_PROTOTYPE_MODE` and wires real integrations.
