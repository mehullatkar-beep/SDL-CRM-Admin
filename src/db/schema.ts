import { boolean, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const testBookingConfigs = pgTable("test_booking_configs", {
  id: text("id").primaryKey(),
  masterTestId: text("master_test_id").notNull().unique(),
  patientBookable: boolean("patient_bookable").notNull().default(false),
  physicianOrderRequired: boolean("physician_order_required").notNull().default(false),
  prepInstructions: text("prep_instructions").notNull().default(""),
  minAge: integer("min_age"),
  maxAge: integer("max_age"),
  genderRestriction: text("gender_restriction").notNull().default("any"),
  homeCollectionAllowed: boolean("home_collection_allowed").notNull().default(false),
  notesForPatient: text("notes_for_patient").notNull().default(""),
  active: boolean("active").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const packages = pgTable("packages", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull().default(""),
  category: text("category").notNull().default(""),
  tags: text("tags").notNull().default(""),
  visibility: text("visibility").notNull().default("public"),
  fulfillmentMode: text("fulfillment_mode").notNull().default("self_registration"),
  customAccentHex: text("custom_accent_hex").notNull().default(""),
  validFrom: timestamp("valid_from", { withTimezone: true }),
  validTo: timestamp("valid_to", { withTimezone: true }),
  listPrice: integer("list_price").notNull().default(0),
  discountType: text("discount_type").notNull().default("none"),
  discountValue: integer("discount_value").notNull().default(0),
  offerPrice: integer("offer_price").notNull().default(0),
  eligibilityNotes: text("eligibility_notes").notNull().default(""),
  terms: text("terms").notNull().default(""),
  cancellationPolicy: text("cancellation_policy").notNull().default(""),
  prepInstructions: text("prep_instructions").notNull().default(""),
  homeCollectionFee: integer("home_collection_fee").notNull().default(0),
  shippingFee: integer("shipping_fee").notNull().default(0),
  consultationFee: integer("consultation_fee").notNull().default(0),
  // Public path for the patient portal and app, e.g. /uploads/packages/{uuid}.jpg.
  bannerImageUrl: text("banner_image_url").notNull().default(""),
  theme: text("theme").notNull().default("sage"),
  highlights: text("highlights").notNull().default(""),
  fastingHours: integer("fasting_hours"),
  genderRestriction: text("gender_restriction").notNull().default("any"),
  minAge: integer("min_age"),
  maxAge: integer("max_age"),
  homeCollectionAllowed: boolean("home_collection_allowed").notNull().default(false),
  active: boolean("active").notNull().default(true),
  archived: boolean("archived").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const packageCategories = pgTable("package_categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const packageTests = pgTable("package_tests", {
  id: text("id").primaryKey(),
  packageId: text("package_id")
    .notNull()
    .references(() => packages.id, { onDelete: "cascade" }),
  masterTestId: text("master_test_id").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const banners = pgTable("banners", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  headline: text("headline").notNull().default(""),
  body: text("body").notNull().default(""),
  imageUrl: text("image_url").notNull().default(""),
  linkUrl: text("link_url").notNull().default(""),
  showOnHome: boolean("show_on_home").notNull().default(true),
  showInNotifications: boolean("show_in_notifications").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  validFrom: timestamp("valid_from", { withTimezone: true }),
  validTo: timestamp("valid_to", { withTimezone: true }),
  active: boolean("active").notNull().default(true),
  archived: boolean("archived").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const notificationTriggerSettings = pgTable("notification_trigger_settings", {
  triggerId: text("trigger_id").primaryKey(),
  enabled: boolean("enabled").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const coupons = pgTable("coupons", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  discountType: text("discount_type").notNull(),
  discountValue: integer("discount_value").notNull(),
  maxDiscountAmount: integer("max_discount_amount"),
  minCartAmount: integer("min_cart_amount").notNull().default(0),
  validFrom: timestamp("valid_from", { withTimezone: true }),
  validTo: timestamp("valid_to", { withTimezone: true }),
  maxRedemptions: integer("max_redemptions"),
  maxPerPatient: integer("max_per_patient").notNull().default(1),
  redemptionCount: integer("redemption_count").notNull().default(0),
  active: boolean("active").notNull().default(true),
  archived: boolean("archived").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
