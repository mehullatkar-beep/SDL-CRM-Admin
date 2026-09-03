# Catalog: Tests and Packages

Admin-panel slice for configuring which lab-master tests patients can book and how packages are composed. Patient booking, payments, orders, and the rest of the CRM modules are out of scope.

## Goals

- Lab admins configure the catalog the future patient portal will read.
- Tests always originate from a lab master; admins never invent test codes.
- Packages are admin-defined bundles, usually discounted versus a la carte tests.
- CRM staff can view the catalog; only admins can change it.

## Definitions

### Test

A lab investigation a patient may book (e.g. CBC, Vitamin D, Glucose). Canonical data lives in the lab master (`id`, `code`, `name`, department, sample type, turnaround, list price, physician-order flag, default age/gender/prep).

Not every master test is patient-bookable. Some require a physician order. The admin selects which master tests appear for patient booking and attaches extra requirements.

### Package

A group of tests defined by the lab admin (e.g. Glucose Panel), typically at a reduced rate. Created by selecting individual tests. Later, packages can be booked via the patient portal cart or via a stable public slug used in marketing links.

## User stories and acceptance criteria

### Tests

1. As an admin, I can search and filter the lab-master list by name, code, department, and sample type.
   - Empty search shows a clear empty state.
   - Master fetch failure shows an error state with retry (no silent blank table).
2. As an admin, I can enable a master test for patient booking and save prep instructions, age/gender restrictions, home-collection allowance, and patient-facing notes.
   - Enabling persists in the local overlay (`test_booking_configs`); the master record is not mutated.
   - Age min ≤ max when both are set.
3. As an admin, I can disable a previously bookable test.
   - Confirm before deactivating.
4. As CRM, I can view tests and booking config but cannot save changes.

### Packages

1. As an admin, I can create a package through a four-step form: Details, Tests & pricing, Availability, then Branding.
   - Details: name, description, category from a master list (select existing or create), fulfillment mode (self registration, appointment, home collection, appointment & home collection, kit), and active flag. A public slug is generated automatically and is not edited in the form.
   - Tests & pricing: search-and-add tests with individual list prices visible; package list price, discount, offer price, and additional charges that depend on the fulfillment mode (home collection fee, consultation fee, and/or kit shipping).
   - Availability: validity window, fasting hours, gender and age, terms, and cancellation/refund policy.
   - Branding is last: header banner, theme (presets plus custom hex/color picker), a live preview of how the package will look for patients, and a copyable public share link with QR download.
   - Header banner is a JPG, PNG, or WebP served at a public URL for the patient portal and app.
   - Create is gated step-by-step; edit lets the admin jump to any step and save. The generated slug stays stable after create so shared links and QR codes keep working.
2. As an admin, I pick constituent tests from the full lab master.
   - Standalone patient-bookable is irrelevant to package inclusion. Tests that are not sold individually can be bundled without a warning.
   - Search to add tests; selected tests appear in a list below with remove. Sequence does not matter because patients add the package as one cart item. Test count, sample types, and report TAT are derived from the selection.
3. As an admin, I can browse packages as cards (default) or a list, search by name, and switch between Active, Expired, and Archived tabs.
   - Cards show banner, name, one-line description, price, test count, validity dates, View details, and a menu.
   - Menu: Preview (later), Copy package (duplicate and open the copy in edit), Archive.
4. As an admin, I can edit and archive a package (confirm before archive).
5. As CRM, I can view packages but cannot save, copy, or archive.

## Edge cases

- Duplicate generated slug is uniquified with a numeric suffix.
- Validity: `validTo` cannot be before `validFrom`.
- Age: `minAge` cannot be greater than `maxAge` when both are set.
- Percent discount 0–100; fixed discount cannot exceed list price.
- Lab master is read-only; overlay rows are keyed by `masterTestId`.
- Mock lab-master client is the default; a real HTTP client swaps behind `LabMasterClient` later.
- `patientBookable` on a test overlay controls standalone catalog booking only, not package membership.

## Out of scope

- Patient portal, cart, payment gateway, results, 2FA
- Orders, branding, notifications, coupons, banners, feedback, queries
- Real lab-master HTTP integration
- Charging ancillary fees at checkout

## Technical context

- Adapter: `src/lib/lab-master/` (`LabMasterClient`, mock fixture)
- Overlay schema: `src/db/schema/` (`test_booking_configs`, `packages`, `package_tests`, `users`)
- Screens: `/catalog/tests`, `/catalog/packages`, `/catalog/packages/new`, `/catalog/packages/[id]`
- Auth: Auth.js credentials; roles `admin` (mutate) and `crm` (read)
