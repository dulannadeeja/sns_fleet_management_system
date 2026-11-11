CREATE TABLE "charge" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rental_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"amount" bigint NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"reason" text,
	"allocation" text NOT NULL,
	"partner_share" bigint,
	"created_at" timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
	"created_by" uuid NOT NULL,
	CONSTRAINT "charge_kind" CHECK (kind in ('rent', 'rentExtra', 'longRental', 'discount', 'extraKm', 'late', 'fuel', 'accessory', 'damage', 'garageDays')),
	CONSTRAINT "charge_allocation" CHECK (allocation in ('commission', 'split', 'sns', 'admin')),
	CONSTRAINT "charge_share" CHECK ((allocation in ('commission', 'split')) = (partner_share is not null))
);
--> statement-breakpoint
CREATE TABLE "rental_return" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rental_id" uuid NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"in_km" integer NOT NULL,
	"fuel" text NOT NULL,
	"accessories" jsonb NOT NULL,
	"fuel_taken_out" integer,
	"late_minutes" integer NOT NULL,
	"next_state" text NOT NULL,
	"next_reason" text,
	"pay_later_note" text,
	"created_at" timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
	"created_by" uuid NOT NULL,
	CONSTRAINT "rental_return_one_per_rental" UNIQUE("rental_id"),
	CONSTRAINT "rental_return_km" CHECK (in_km between 0 and 999999),
	CONSTRAINT "rental_return_fuel" CHECK (fuel in ('empty', 'quarter', 'half', 'threeQuarters', 'full')),
	CONSTRAINT "rental_return_next" CHECK (next_state in ('available', 'repair', 'unavailable') and (next_state = 'available' or next_reason is not null))
);
--> statement-breakpoint
ALTER TABLE "rental" DROP CONSTRAINT "rental_status";--> statement-breakpoint
ALTER TABLE "approval_request" DROP CONSTRAINT "approval_request_kind";--> statement-breakpoint
ALTER TABLE "approval_request" ADD COLUMN "days" integer;--> statement-breakpoint
ALTER TABLE "approval_request" ADD COLUMN "charge_id" uuid;--> statement-breakpoint
ALTER TABLE "charge" ADD CONSTRAINT "charge_rental_id_rental_id_fk" FOREIGN KEY ("rental_id") REFERENCES "public"."rental"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charge" ADD CONSTRAINT "charge_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_return" ADD CONSTRAINT "rental_return_rental_id_rental_id_fk" FOREIGN KEY ("rental_id") REFERENCES "public"."rental"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_return" ADD CONSTRAINT "rental_return_vehicle_id_vehicle_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicle"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_return" ADD CONSTRAINT "rental_return_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "charge_by_rental" ON "charge" USING btree ("rental_id","created_at");--> statement-breakpoint
CREATE INDEX "rental_return_by_vehicle" ON "rental_return" USING btree ("vehicle_id","created_at" DESC NULLS LAST);--> statement-breakpoint
ALTER TABLE "rental" ADD CONSTRAINT "rental_status" CHECK (status in ('draft', 'active', 'notCollected', 'returned'));--> statement-breakpoint
ALTER TABLE "approval_request" ADD CONSTRAINT "approval_request_kind" CHECK ((kind = 'rate' and new_daily_rate between 1 and 100000 and discount is null) or (kind = 'discount' and discount >= 1 and new_daily_rate is null) or (kind = 'garageDays' and days between 1 and 30) or (kind = 'split' and charge_id is not null));--> statement-breakpoint
-- The return and the bill lines are insert-only (TRD › Integrity rules): the app role may only add and read them.
CREATE TRIGGER rental_return_insert_only BEFORE UPDATE OR DELETE ON rental_return FOR EACH ROW EXECUTE FUNCTION refuse_change_insert_only();--> statement-breakpoint
CREATE TRIGGER rental_return_no_truncate BEFORE TRUNCATE ON rental_return FOR EACH STATEMENT EXECUTE FUNCTION refuse_change_insert_only();--> statement-breakpoint
CREATE TRIGGER charge_insert_only BEFORE UPDATE OR DELETE ON charge FOR EACH ROW EXECUTE FUNCTION refuse_change_insert_only();--> statement-breakpoint
CREATE TRIGGER charge_no_truncate BEFORE TRUNCATE ON charge FOR EACH STATEMENT EXECUTE FUNCTION refuse_change_insert_only();--> statement-breakpoint
GRANT SELECT, INSERT ON rental_return, charge TO sns_app;--> statement-breakpoint
REVOKE UPDATE, DELETE, TRUNCATE ON rental_return, charge FROM sns_app;
