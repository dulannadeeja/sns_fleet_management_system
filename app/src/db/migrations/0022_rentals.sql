CREATE TABLE "rental" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"pickup_at" timestamp with time zone NOT NULL,
	"days" integer NOT NULL,
	"deadline_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
	CONSTRAINT "rental_status" CHECK (status in ('draft')),
	CONSTRAINT "rental_days" CHECK (days >= 1 AND days <= 90),
	CONSTRAINT "rental_deadline_after_pickup" CHECK (deadline_at > pickup_at)
);
--> statement-breakpoint
CREATE TABLE "rental_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rental_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "rental_terms_snapshot" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rental_id" uuid NOT NULL,
	"pickup_cutoff" text NOT NULL,
	"return_deadline" text NOT NULL,
	"fuel_price_per_litre" bigint,
	"created_at" timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
	"created_by" uuid,
	CONSTRAINT "rental_terms_one_per_rental" UNIQUE("rental_id")
);
--> statement-breakpoint
CREATE TABLE "rental_vehicle_segment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rental_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"terms_version_id" uuid NOT NULL,
	"daily_rate" bigint NOT NULL,
	"km_per_day" integer NOT NULL,
	"extra_km_rate" bigint NOT NULL,
	"commission_percent" integer,
	"long_rental_extra" bigint NOT NULL,
	"long_rental_from_day" integer NOT NULL,
	"garage_day_charge" bigint NOT NULL,
	"owner_pays" text[] DEFAULT '{}' NOT NULL,
	"out_km" integer,
	"in_km" integer,
	"created_at" timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "vehicle_hold" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"held" "tstzrange" NOT NULL,
	"rental_id" uuid,
	"created_at" timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
	"created_by" uuid,
	CONSTRAINT "vehicle_hold_for_something" CHECK (rental_id is not null)
);
--> statement-breakpoint
ALTER TABLE "rental" ADD CONSTRAINT "rental_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental" ADD CONSTRAINT "rental_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_event" ADD CONSTRAINT "rental_event_rental_id_rental_id_fk" FOREIGN KEY ("rental_id") REFERENCES "public"."rental"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_event" ADD CONSTRAINT "rental_event_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_terms_snapshot" ADD CONSTRAINT "rental_terms_snapshot_rental_id_rental_id_fk" FOREIGN KEY ("rental_id") REFERENCES "public"."rental"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_terms_snapshot" ADD CONSTRAINT "rental_terms_snapshot_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_vehicle_segment" ADD CONSTRAINT "rental_vehicle_segment_rental_id_rental_id_fk" FOREIGN KEY ("rental_id") REFERENCES "public"."rental"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_vehicle_segment" ADD CONSTRAINT "rental_vehicle_segment_vehicle_id_vehicle_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicle"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_vehicle_segment" ADD CONSTRAINT "rental_vehicle_segment_terms_version_id_vehicle_terms_version_id_fk" FOREIGN KEY ("terms_version_id") REFERENCES "public"."vehicle_terms_version"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_vehicle_segment" ADD CONSTRAINT "rental_vehicle_segment_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_hold" ADD CONSTRAINT "vehicle_hold_vehicle_id_vehicle_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicle"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_hold" ADD CONSTRAINT "vehicle_hold_rental_id_rental_id_fk" FOREIGN KEY ("rental_id") REFERENCES "public"."rental"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_hold" ADD CONSTRAINT "vehicle_hold_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "rental_by_customer" ON "rental" USING btree ("customer_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "rental_event_by_rental" ON "rental_event" USING btree ("rental_id","created_at");--> statement-breakpoint
CREATE INDEX "rental_segment_by_rental" ON "rental_vehicle_segment" USING btree ("rental_id","position");--> statement-breakpoint
-- One rental or reservation per car at any time (TRD › Integrity rules; AT-08, AT-30, AT-32): overlapping holds of the
-- same car are refused by the database itself, also when two people save at the same moment.
CREATE EXTENSION IF NOT EXISTS btree_gist;
--> statement-breakpoint
ALTER TABLE "vehicle_hold" ADD CONSTRAINT "vehicle_hold_no_overlap" EXCLUDE USING gist ("vehicle_id" WITH =, "held" WITH &&);
--> statement-breakpoint
ALTER TABLE "vehicle_hold" ADD CONSTRAINT "vehicle_hold_not_empty" CHECK (NOT isempty("held") AND NOT lower_inf("held") AND NOT upper_inf("held"));
--> statement-breakpoint
CREATE INDEX "vehicle_hold_by_rental" ON "vehicle_hold" USING btree ("rental_id");
--> statement-breakpoint
-- A rental's saved terms and its history are insert-only (4.3, PR-08): a change is a new row or a new event.
CREATE TRIGGER rental_terms_snapshot_insert_only BEFORE UPDATE OR DELETE ON rental_terms_snapshot
  FOR EACH ROW EXECUTE FUNCTION refuse_change_insert_only();
--> statement-breakpoint
CREATE TRIGGER rental_terms_snapshot_no_truncate BEFORE TRUNCATE ON rental_terms_snapshot
  FOR EACH STATEMENT EXECUTE FUNCTION refuse_change_insert_only();
--> statement-breakpoint
CREATE TRIGGER rental_event_insert_only BEFORE UPDATE OR DELETE ON rental_event
  FOR EACH ROW EXECUTE FUNCTION refuse_change_insert_only();
--> statement-breakpoint
CREATE TRIGGER rental_event_no_truncate BEFORE TRUNCATE ON rental_event
  FOR EACH STATEMENT EXECUTE FUNCTION refuse_change_insert_only();
--> statement-breakpoint
-- The app adds rentals and changes only their status, dates and updated time; a segment's terms are never changed (only
-- its readings, at handover and return); holds are added, moved and removed as rentals change.
GRANT SELECT, INSERT ON rental, rental_terms_snapshot, rental_vehicle_segment, rental_event TO sns_app;
--> statement-breakpoint
GRANT UPDATE (status, days, deadline_at, updated_at) ON rental TO sns_app;
--> statement-breakpoint
GRANT UPDATE (out_km, in_km) ON rental_vehicle_segment TO sns_app;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON vehicle_hold TO sns_app;
--> statement-breakpoint
REVOKE DELETE, TRUNCATE ON rental, rental_terms_snapshot, rental_vehicle_segment, rental_event FROM sns_app;
--> statement-breakpoint
REVOKE UPDATE ON rental_terms_snapshot, rental_event FROM sns_app;
--> statement-breakpoint
-- A segment's saved terms never change (4.3, AT-05): only its km readings may be added later. Deleting a segment is
-- refused too. The message names insert-only like the other kept tables.
CREATE FUNCTION refuse_segment_terms_change() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' OR (to_jsonb(NEW) - 'out_km' - 'in_km') IS DISTINCT FROM (to_jsonb(OLD) - 'out_km' - 'in_km') THEN
    RAISE EXCEPTION 'rental_vehicle_segment terms are insert-only: only the km readings may be added';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER rental_vehicle_segment_terms_kept BEFORE UPDATE OR DELETE ON rental_vehicle_segment
  FOR EACH ROW EXECUTE FUNCTION refuse_segment_terms_change();
--> statement-breakpoint
CREATE TRIGGER rental_vehicle_segment_no_truncate BEFORE TRUNCATE ON rental_vehicle_segment
  FOR EACH STATEMENT EXECUTE FUNCTION refuse_change_insert_only();
