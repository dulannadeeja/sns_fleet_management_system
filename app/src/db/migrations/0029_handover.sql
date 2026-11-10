CREATE TABLE "handover_photo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rental_id" uuid NOT NULL,
	"storage_key" text NOT NULL,
	"content_type" text NOT NULL,
	"size" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
	"created_by" uuid NOT NULL,
	CONSTRAINT "handover_photo_one_key" UNIQUE("storage_key")
);
--> statement-breakpoint
CREATE TABLE "rental_handover" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rental_id" uuid NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"out_km" integer NOT NULL,
	"fuel" text NOT NULL,
	"accessories" jsonb NOT NULL,
	"papers_reason" text,
	"created_at" timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
	"created_by" uuid NOT NULL,
	CONSTRAINT "rental_handover_one_per_rental" UNIQUE("rental_id"),
	CONSTRAINT "rental_handover_km" CHECK (out_km between 0 and 999999),
	CONSTRAINT "rental_handover_fuel" CHECK (fuel in ('empty', 'quarter', 'half', 'threeQuarters', 'full'))
);
--> statement-breakpoint
ALTER TABLE "rental" DROP CONSTRAINT "rental_status";--> statement-breakpoint
ALTER TABLE "handover_photo" ADD CONSTRAINT "handover_photo_rental_id_rental_id_fk" FOREIGN KEY ("rental_id") REFERENCES "public"."rental"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "handover_photo" ADD CONSTRAINT "handover_photo_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_handover" ADD CONSTRAINT "rental_handover_rental_id_rental_id_fk" FOREIGN KEY ("rental_id") REFERENCES "public"."rental"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_handover" ADD CONSTRAINT "rental_handover_vehicle_id_vehicle_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicle"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_handover" ADD CONSTRAINT "rental_handover_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "handover_photo_by_rental" ON "handover_photo" USING btree ("rental_id","created_at");--> statement-breakpoint
CREATE INDEX "rental_handover_by_vehicle" ON "rental_handover" USING btree ("vehicle_id","created_at" DESC NULLS LAST);--> statement-breakpoint
ALTER TABLE "rental" ADD CONSTRAINT "rental_status" CHECK (status in ('draft', 'active'));--> statement-breakpoint
-- The handover and its photos are insert-only (TRD › Integrity rules): the app role may only add and read them.
CREATE TRIGGER rental_handover_insert_only BEFORE UPDATE OR DELETE ON rental_handover FOR EACH ROW EXECUTE FUNCTION refuse_change_insert_only();--> statement-breakpoint
CREATE TRIGGER rental_handover_no_truncate BEFORE TRUNCATE ON rental_handover FOR EACH STATEMENT EXECUTE FUNCTION refuse_change_insert_only();--> statement-breakpoint
CREATE TRIGGER handover_photo_insert_only BEFORE UPDATE OR DELETE ON handover_photo FOR EACH ROW EXECUTE FUNCTION refuse_change_insert_only();--> statement-breakpoint
CREATE TRIGGER handover_photo_no_truncate BEFORE TRUNCATE ON handover_photo FOR EACH STATEMENT EXECUTE FUNCTION refuse_change_insert_only();--> statement-breakpoint
GRANT SELECT, INSERT ON rental_handover, handover_photo TO sns_app;--> statement-breakpoint
REVOKE UPDATE, DELETE, TRUNCATE ON rental_handover, handover_photo FROM sns_app;
