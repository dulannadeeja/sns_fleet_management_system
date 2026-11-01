CREATE TABLE "vehicle" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registration" text NOT NULL,
	"model" text NOT NULL,
	"ownership" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	CONSTRAINT "vehicle_one_per_registration" UNIQUE("registration"),
	CONSTRAINT "vehicle_ownership" CHECK (ownership in ('sns', 'partner'))
);
--> statement-breakpoint
CREATE TABLE "vehicle_terms_version" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"effective_from" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"daily_rate" integer NOT NULL,
	"km_per_day" integer NOT NULL,
	"extra_km_rate" integer NOT NULL,
	"commission_percent" integer,
	"long_rental_extra" integer NOT NULL,
	"long_rental_from_day" integer NOT NULL,
	"garage_day_charge" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vehicle" ADD CONSTRAINT "vehicle_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_terms_version" ADD CONSTRAINT "vehicle_terms_version_vehicle_id_vehicle_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicle"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_terms_version" ADD CONSTRAINT "vehicle_terms_version_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "vehicle_terms_newest" ON "vehicle_terms_version" USING btree ("vehicle_id","effective_from" DESC NULLS LAST);--> statement-breakpoint
-- A car's terms are kept as dated versions: insert-only, like the activity log (TRD › Integrity rules; 4.3, AT-05).
CREATE TRIGGER vehicle_terms_version_insert_only
  BEFORE UPDATE OR DELETE ON vehicle_terms_version
  FOR EACH ROW EXECUTE FUNCTION refuse_change_insert_only();
--> statement-breakpoint
CREATE TRIGGER vehicle_terms_version_no_truncate
  BEFORE TRUNCATE ON vehicle_terms_version
  FOR EACH STATEMENT EXECUTE FUNCTION refuse_change_insert_only();
--> statement-breakpoint
-- The app reads and adds cars and term versions; a car is never deleted (retiring comes with #22).
GRANT SELECT, INSERT ON vehicle TO sns_app;
--> statement-breakpoint
GRANT SELECT, INSERT ON vehicle_terms_version TO sns_app;
--> statement-breakpoint
REVOKE UPDATE, DELETE, TRUNCATE ON vehicle, vehicle_terms_version FROM sns_app;
