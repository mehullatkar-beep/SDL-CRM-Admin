CREATE TABLE "banners" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"headline" text DEFAULT '' NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"image_url" text DEFAULT '' NOT NULL,
	"link_url" text DEFAULT '' NOT NULL,
	"show_on_home" boolean DEFAULT true NOT NULL,
	"show_in_notifications" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"valid_from" timestamp with time zone,
	"valid_to" timestamp with time zone,
	"active" boolean DEFAULT true NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
