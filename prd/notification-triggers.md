# Notification triggers

Admin-panel slice for the lab’s master list of patient notification events. Templates, channels (email / SMS / push), and sending are out of scope.

## Goals

- Lab admins turn patient notifications on or off so the lab controls what the patient receives.
- One screen lists every trigger. Common events are grouped together; fulfillment-specific events sit under Self registration, Appointment, Home collection, and Kit.
- CRM staff can view the list; only admins can change a trigger.
- The catalog of trigger ids is defined in code so the exact list can be replaced when the lab provides it. Settings (on/off) persist in the database.

## Definitions

### Trigger

A named event in a booking workflow (for example **Order booked** or **Results ready**). It has no patient-facing copy, channel, or schedule in this slice. It is either **on** or **off**.

### Common

Events that apply to every fulfillment mode: self registration, appointment, home collection, and kit.

### Fulfillment-specific

Events that only make sense for one booking type. They do not replace common events.

## User stories and acceptance criteria

1. As an admin, I see a grouped master list of notification triggers and can switch each one on or off.
   - Missing settings default to **on**.
   - Unknown trigger ids are rejected.
   - Toggles persist after refresh.
2. As an admin, I do not create, rename, archive, or edit trigger copy. There is no detail page.
3. As CRM, I can view the list but cannot change a switch.

## Edge cases

- Failed load shows an error with retry.
- Adding a new trigger in code shows it on next load, default **on**, without a data migration of rows.
- Removing a trigger from the catalog hides it from the admin list; leftover settings rows are ignored.
- Portal → Notifications is this module. Engagement → Banners remains the in-app announcement inbox.

## Out of scope

- Email, SMS, push, or in-app message templates
- Per-patient targeting, quiet hours, or language
- Actually sending notifications
- Inventing Crelio order/webhook payloads
- Booking / order UI

## Technical context

- Catalog: `src/lib/notification-triggers.ts`
- Schema: `notification_trigger_settings` in `src/db/schema.ts`
- Loaders: `src/lib/notification-queries.ts`
- Actions: `src/actions/notifications.ts` with `requireAdmin()`
- Screen: `/notifications`
- Auth: Auth.js credentials; roles `admin` (mutate) and `crm` (read)
