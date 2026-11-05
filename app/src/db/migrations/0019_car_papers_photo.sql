CREATE TABLE "vehicle_photo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"storage_key" text,
	"content_type" text,
	"size" integer,
	"created_at" timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
	"created_by" uuid,
	CONSTRAINT "vehicle_photo_file" CHECK ((storage_key is null) = (content_type is null) and (storage_key is null) = (size is null)),
	CONSTRAINT "vehicle_photo_kind" CHECK (content_type is null or content_type in ('image/jpeg', 'image/png', 'image/webp'))
);
--> statement-breakpoint
ALTER TABLE "vehicle" ADD COLUMN "insurance_expires" date;--> statement-breakpoint
ALTER TABLE "vehicle" ADD COLUMN "licence_expires" date;--> statement-breakpoint
ALTER TABLE "vehicle" ADD COLUMN "next_service_on" date;--> statement-breakpoint
ALTER TABLE "vehicle" ADD COLUMN "next_service_km" integer;--> statement-breakpoint
ALTER TABLE "vehicle_photo" ADD CONSTRAINT "vehicle_photo_vehicle_id_vehicle_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicle"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_photo" ADD CONSTRAINT "vehicle_photo_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "vehicle_photo_newest" ON "vehicle_photo" USING btree ("vehicle_id","created_at" DESC NULLS LAST);--> statement-breakpoint
-- Next service km is a whole number of km (system design 11).
ALTER TABLE vehicle ADD CONSTRAINT vehicle_next_service_km CHECK (next_service_km IS NULL OR next_service_km BETWEEN 0 AND 2000000);
--> statement-breakpoint
-- The app records a car's papers and service dates (#23); the old values are in the activity log.
GRANT UPDATE (insurance_expires, licence_expires, next_service_on, next_service_km) ON vehicle TO sns_app;
--> statement-breakpoint
-- Catalogue photos are insert-only: a new photo or a removal is a new row, never an edit.
CREATE TRIGGER vehicle_photo_insert_only
  BEFORE UPDATE OR DELETE ON vehicle_photo
  FOR EACH ROW EXECUTE FUNCTION refuse_change_insert_only();
--> statement-breakpoint
CREATE TRIGGER vehicle_photo_no_truncate
  BEFORE TRUNCATE ON vehicle_photo
  FOR EACH STATEMENT EXECUTE FUNCTION refuse_change_insert_only();
--> statement-breakpoint
GRANT SELECT, INSERT ON vehicle_photo TO sns_app;
--> statement-breakpoint
REVOKE UPDATE, DELETE, TRUNCATE ON vehicle_photo FROM sns_app;
