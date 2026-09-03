import { count } from "drizzle-orm";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import {
  banners,
  coupons,
  packageTests,
  packages,
  testBookingConfigs,
} from "./schema";

type Db = NeonHttpDatabase<typeof schema>;

export async function seedPrototypeDemoContent(db: Db) {
  const [packageCount] = await db.select({ value: count() }).from(packages);
  if ((packageCount?.value ?? 0) > 0) return;

  const now = new Date();

  await db
    .insert(testBookingConfigs)
    .values([
      {
        id: "proto-cbc",
        masterTestId: "mst-cbc",
        patientBookable: true,
        physicianOrderRequired: false,
        prepInstructions: "No special preparation. Stay hydrated.",
        genderRestriction: "any",
        homeCollectionAllowed: true,
        notesForPatient: "Walk-in or home collection available.",
        active: true,
        updatedAt: now,
      },
      {
        id: "proto-fbs",
        masterTestId: "mst-fbs",
        patientBookable: true,
        physicianOrderRequired: false,
        prepInstructions: "Fast for 8–12 hours. Water is allowed.",
        genderRestriction: "any",
        homeCollectionAllowed: true,
        notesForPatient: "",
        active: true,
        updatedAt: now,
      },
    ])
    .onConflictDoNothing({ target: testBookingConfigs.masterTestId });

  const packageId = "proto-wellness-package";
  await db
    .insert(packages)
    .values({
      id: packageId,
      name: "Full body wellness",
      slug: "full-body-wellness",
      description: "A starter wellness bundle for the prototype review.",
      category: "Wellness",
      tags: "wellness,annual",
      visibility: "public",
      fulfillmentMode: "appointment_home_collection",
      listPrice: 1200,
      discountType: "percent",
      discountValue: 15,
      offerPrice: 1020,
      eligibilityNotes: "Adults 18+. Sample prototype copy.",
      prepInstructions: "Fast for 8–12 hours before blood draw.",
      homeCollectionFee: 50,
      consultationFee: 0,
      shippingFee: 0,
      theme: "sage",
      highlights: "CBC|Fasting glucose|Vitamin D",
      fastingHours: 8,
      homeCollectionAllowed: true,
      active: true,
      archived: false,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing({ target: packages.slug });

  await db
    .insert(packageTests)
    .values([
      { id: "proto-pt-1", packageId, masterTestId: "mst-cbc", sortOrder: 0 },
      { id: "proto-pt-2", packageId, masterTestId: "mst-fbs", sortOrder: 1 },
      { id: "proto-pt-3", packageId, masterTestId: "mst-vitd", sortOrder: 2 },
    ])
    .onConflictDoNothing();

  await db
    .insert(coupons)
    .values({
      id: "proto-welcome-coupon",
      code: "WELCOME10",
      name: "Welcome 10% off",
      description: "Sample coupon for prototype review.",
      discountType: "percent",
      discountValue: 10,
      minCartAmount: 500,
      maxPerPatient: 1,
      active: true,
      archived: false,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing({ target: coupons.code });

  await db
    .insert(banners)
    .values({
      id: "proto-diwali-banner",
      name: "Diwali 2026",
      headline: "Happy Diwali from SDL",
      body: "Book a festive wellness package this week.",
      showOnHome: true,
      showInNotifications: true,
      sortOrder: 0,
      active: true,
      archived: false,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing({ target: banners.id });
}
