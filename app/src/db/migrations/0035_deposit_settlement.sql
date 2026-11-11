CREATE TABLE "deposit_settlement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rental_id" uuid NOT NULL,
	"older_agreed" boolean NOT NULL,
	"agreement_note" text,
	"created_at" timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
	"created_by" uuid NOT NULL,
	CONSTRAINT "deposit_settlement_one_per_rental" UNIQUE("rental_id"),
	CONSTRAINT "deposit_settlement_note" CHECK (older_agreed = (agreement_note is not null))
);
--> statement-breakpoint
ALTER TABLE "cash_movement" DROP CONSTRAINT "cash_movement_kind";--> statement-breakpoint
ALTER TABLE "deposit_movement" DROP CONSTRAINT "deposit_movement_kind";--> statement-breakpoint
ALTER TABLE "cash_movement" ADD COLUMN "deposit_movement_id" uuid;--> statement-breakpoint
ALTER TABLE "deposit_movement" ADD COLUMN "settlement_id" uuid;--> statement-breakpoint
ALTER TABLE "deposit_movement" ADD COLUMN "to_rental_id" uuid;--> statement-breakpoint
ALTER TABLE "deposit_movement" ADD COLUMN "method" text;--> statement-breakpoint
ALTER TABLE "deposit_movement" ADD COLUMN "reference" text;--> statement-breakpoint
ALTER TABLE "deposit_settlement" ADD CONSTRAINT "deposit_settlement_rental_id_rental_id_fk" FOREIGN KEY ("rental_id") REFERENCES "public"."rental"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deposit_settlement" ADD CONSTRAINT "deposit_settlement_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_movement" ADD CONSTRAINT "cash_movement_deposit_movement_id_deposit_movement_id_fk" FOREIGN KEY ("deposit_movement_id") REFERENCES "public"."deposit_movement"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deposit_movement" ADD CONSTRAINT "deposit_movement_settlement_id_deposit_settlement_id_fk" FOREIGN KEY ("settlement_id") REFERENCES "public"."deposit_settlement"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deposit_movement" ADD CONSTRAINT "deposit_movement_to_rental_id_rental_id_fk" FOREIGN KEY ("to_rental_id") REFERENCES "public"."rental"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "deposit_movement_by_to_rental" ON "deposit_movement" USING btree ("to_rental_id");--> statement-breakpoint
ALTER TABLE "cash_movement" ADD CONSTRAINT "cash_movement_refund_out" CHECK (kind <> 'refundOut' or deposit_movement_id is not null);--> statement-breakpoint
ALTER TABLE "cash_movement" ADD CONSTRAINT "cash_movement_kind" CHECK (kind in ('paymentIn', 'refundOut'));--> statement-breakpoint
ALTER TABLE "deposit_movement" ADD CONSTRAINT "deposit_movement_settled" CHECK ((kind = 'received') = (settlement_id is null));--> statement-breakpoint
ALTER TABLE "deposit_movement" ADD CONSTRAINT "deposit_movement_applied_to" CHECK ((kind = 'applied') = (to_rental_id is not null));--> statement-breakpoint
ALTER TABLE "deposit_movement" ADD CONSTRAINT "deposit_movement_refund_method" CHECK (case when kind = 'refunded' then method in ('cash', 'bank') and (method = 'cash') = (reference is null) else method is null and reference is null end);--> statement-breakpoint
ALTER TABLE "deposit_movement" ADD CONSTRAINT "deposit_movement_kind" CHECK (kind in ('received', 'applied', 'refunded'));--> statement-breakpoint
CREATE TRIGGER deposit_settlement_insert_only BEFORE UPDATE OR DELETE ON deposit_settlement FOR EACH ROW EXECUTE FUNCTION refuse_change_insert_only();--> statement-breakpoint
CREATE TRIGGER deposit_settlement_no_truncate BEFORE TRUNCATE ON deposit_settlement FOR EACH STATEMENT EXECUTE FUNCTION refuse_change_insert_only();--> statement-breakpoint
GRANT SELECT, INSERT ON deposit_settlement TO sns_app;--> statement-breakpoint
REVOKE UPDATE, DELETE, TRUNCATE ON deposit_settlement FROM sns_app;
