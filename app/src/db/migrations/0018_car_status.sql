CREATE TABLE "vehicle_status_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"status" text NOT NULL,
	"reason" text,
	"expected_back" date,
	"retired_on" date,
	"created_at" timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
	"created_by" uuid,
	CONSTRAINT "vehicle_status_kind" CHECK (status in ('available', 'repair', 'unavailable', 'retired')),
	CONSTRAINT "vehicle_status_retired_on" CHECK ((status = 'retired') = (retired_on is not null))
);
--> statement-breakpoint
ALTER TABLE "vehicle_status_event" ADD CONSTRAINT "vehicle_status_event_vehicle_id_vehicle_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicle"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_status_event" ADD CONSTRAINT "vehicle_status_event_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "vehicle_status_newest" ON "vehicle_status_event" USING btree ("vehicle_id","created_at" DESC NULLS LAST);--> statement-breakpoint
-- A car's status changes are insert-only (system design 11; #22): a change is a new row, never an edit.
CREATE TRIGGER vehicle_status_event_insert_only
  BEFORE UPDATE OR DELETE ON vehicle_status_event
  FOR EACH ROW EXECUTE FUNCTION refuse_change_insert_only();
--> statement-breakpoint
CREATE TRIGGER vehicle_status_event_no_truncate
  BEFORE TRUNCATE ON vehicle_status_event
  FOR EACH STATEMENT EXECUTE FUNCTION refuse_change_insert_only();
--> statement-breakpoint
GRANT SELECT, INSERT ON vehicle_status_event TO sns_app;
--> statement-breakpoint
REVOKE UPDATE, DELETE, TRUNCATE ON vehicle_status_event FROM sns_app;
