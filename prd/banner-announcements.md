# Banner announcements

Admin-panel slice for patient-facing announcements that later appear on the app home carousel and/or in the in-app notifications list. Device push, read state, and a patient portal home page are out of scope.

## Goals

- Lab admins publish festive wishes, promotional creatives, and operational notices from one Engagement → Banners screen.
- One record can show as a home-screen banner, as an in-app notification, or both.
- CRM staff can view banners; only admins can change them.
- Public APIs expose only currently live items so the mobile app does not reimplement schedule or archive rules.

## Definitions

### Banner

An announcement with an admin-only **name**, optional patient-facing **headline** and **body**, optional **image**, optional **link URL**, a schedule, and placement flags. Image-only home banners are valid. Text-only home banners are valid.

### Home banner

Shown in the patient app home carousel. An uploaded image is the full creative — no headline or body is drawn on top. Text-only (headline and/or body, no image) is also valid.

### In-app notification

A row in the patient app notifications list. Requires a **headline**. Body and thumbnail image are optional. This is not email, SMS, or device push.

### Live

Not archived, `validFrom` is not in the future, and `validTo` (end of day) is not in the past. Scheduled items become live on their start date without a separate publish action.

## User stories and acceptance criteria

1. As an admin, I can create a banner: name, optional headline, optional body, optional JPG/PNG/WebP image (5 MB), optional link URL, home and/or notification placement, optional sort order, optional validity window.
   - Name is required (min 2 characters) so image-only items still list and search.
   - At least one placement is required.
   - Home placement requires an image **or** headline/body.
   - Notification placement requires a headline.
   - `validTo` cannot be before `validFrom`.
   - Link URL, when set, is `https://` or a site-relative path starting with `/`.
2. As an admin, I see a live preview of the home strip and the inbox row while editing.
3. As an admin, I can browse banners in a table, search by name or headline, and switch Active / Scheduled / Expired / Archived tabs.
4. As an admin, I can edit, duplicate, and archive a banner (confirm before archive). Unarchive restores it. Duplicate copies the image and suffixes the name `(copy)`. There is no separate pause state. `active = !archived`.
5. As CRM, I can view banners but cannot save, duplicate, or archive.

## Edge cases

- Empty search shows a clear empty state; failed load shows an error with retry.
- Scheduled (`validFrom` in the future) and expired (`validTo` end of day in the past) stay off the public APIs even if not archived.
- Archived banners do not appear on Active or in public APIs.
- Several home banners can be live at once; the app receives them ordered by `sortOrder` then `createdAt`.
- Notification feed is newest `createdAt` first.
- Portal → Notifications is the trigger on/off list. Message templates are later.

## Out of scope

- Device push (FCM/APNs), read/unread, per-patient targeting
- Patient portal `/home`
- Email/SMS templates
- Applying a coupon from a banner tap
- Inventing Crelio order/webhook payloads

## Technical context

- Schema: `banners` in `src/db/schema.ts`
- Lifecycle: `src/lib/banner-lifecycle.ts`
- Public filter: `src/lib/public-banners.ts`
- Screens: `/banners`, `/banners/new`, `/banners/[id]`
- Actions: `src/actions/banners.ts` with `requireAdmin()`
- Public API: `GET /api/v1/engagement/banners`, `GET /api/v1/engagement/notifications`
- Auth: Auth.js credentials; roles `admin` (mutate) and `crm` (read)
