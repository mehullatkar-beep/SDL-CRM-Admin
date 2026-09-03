CREATE TABLE "package_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "package_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "package_tests" (
	"id" text PRIMARY KEY NOT NULL,
	"package_id" text NOT NULL,
	"master_test_id" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "packages" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"category" text DEFAULT '' NOT NULL,
	"tags" text DEFAULT '' NOT NULL,
	"visibility" text DEFAULT 'public' NOT NULL,
	"fulfillment_mode" text DEFAULT 'self_registration' NOT NULL,
	"custom_accent_hex" text DEFAULT '' NOT NULL,
	"valid_from" timestamp with time zone,
	"valid_to" timestamp with time zone,
	"list_price" integer DEFAULT 0 NOT NULL,
	"discount_type" text DEFAULT 'none' NOT NULL,
	"discount_value" integer DEFAULT 0 NOT NULL,
	"offer_price" integer DEFAULT 0 NOT NULL,
	"eligibility_notes" text DEFAULT '' NOT NULL,
	"terms" text DEFAULT '' NOT NULL,
	"cancellation_policy" text DEFAULT '' NOT NULL,
	"prep_instructions" text DEFAULT '' NOT NULL,
	"home_collection_fee" integer DEFAULT 0 NOT NULL,
	"shipping_fee" integer DEFAULT 0 NOT NULL,
	"consultation_fee" integer DEFAULT 0 NOT NULL,
	"banner_image_url" text DEFAULT '' NOT NULL,
	"theme" text DEFAULT 'sage' NOT NULL,
	"highlights" text DEFAULT '' NOT NULL,
	"fasting_hours" integer,
	"gender_restriction" text DEFAULT 'any' NOT NULL,
	"min_age" integer,
	"max_age" integer,
	"home_collection_allowed" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "packages_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "test_booking_configs" (
	"id" text PRIMARY KEY NOT NULL,
	"master_test_id" text NOT NULL,
	"patient_bookable" boolean DEFAULT false NOT NULL,
	"physician_order_required" boolean DEFAULT false NOT NULL,
	"prep_instructions" text DEFAULT '' NOT NULL,
	"min_age" integer,
	"max_age" integer,
	"gender_restriction" text DEFAULT 'any' NOT NULL,
	"home_collection_allowed" boolean DEFAULT false NOT NULL,
	"notes_for_patient" text DEFAULT '' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "test_booking_configs_master_test_id_unique" UNIQUE("master_test_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "package_tests" ADD CONSTRAINT "package_tests_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE cascade ON UPDATE no action;