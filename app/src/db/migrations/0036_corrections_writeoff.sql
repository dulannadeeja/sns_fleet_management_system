CREATE TABLE "payment_adjustment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"payment_id" uuid NOT NULL,
	"rental_id" uuid NOT NULL,
	"amount" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
	"created_by" uuid NOT NULL,
	CONSTRAINT "payment_adjustment_amount" CHECK (amount <> 0)
);
--> statement-breakpoint
CREATE TABLE "refund" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rental_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"method" text NOT NULL,
	"reference" text,
	"amount" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
	"created_by" uuid NOT NULL,
	CONSTRAINT "refund_kind" CHECK (kind in ('overpaid')),
	CONSTRAINT "refund_method" CHECK (method in ('cash', 'bank') and (method = 'cash') = (reference is null)),
	CONSTRAINT "refund_amount" CHECK (amount > 0)
);
--> statement-breakpoint
CREATE TABLE "write_off" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"amount" bigint NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
	"created_by" uuid NOT NULL,
	CONSTRAINT "write_off_amount" CHECK (amount > 0),
	CONSTRAINT "write_off_reason" CHECK (length(reason) > 0)
);
--> statement-breakpoint
CREATE TABLE "write_off_line" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"write_off_id" uuid NOT NULL,
	"rental_id" uuid NOT NULL,
	"amount" bigint NOT NULL,
	CONSTRAINT "write_off_line_amount" CHECK (amount > 0)
);
--> statement-breakpoint
ALTER TABLE "cash_movement" DROP CONSTRAINT "cash_movement_kind";--> statement-breakpoint
ALTER TABLE "cash_movement" DROP CONSTRAINT "cash_movement_refund_out";--> statement-breakpoint
ALTER TABLE "deposit_movement" DROP CONSTRAINT "deposit_movement_kind";--> statement-breakpoint
ALTER TABLE "deposit_movement" DROP CONSTRAINT "deposit_movement_amount";--> statement-breakpoint
ALTER TABLE "deposit_movement" DROP CONSTRAINT "deposit_movement_received_has_payment";--> statement-breakpoint
ALTER TABLE "deposit_movement" DROP CONSTRAINT "deposit_movement_settled";--> statement-breakpoint
ALTER TABLE "approval_request" DROP CONSTRAINT "approval_request_kind";--> statement-breakpoint
ALTER TABLE "cash_movement" ADD COLUMN "refund_id" uuid;--> statement-breakpoint
ALTER TABLE "cash_movement" ADD COLUMN "request_id" uuid;--> statement-breakpoint
ALTER TABLE "deposit_movement" ADD COLUMN "request_id" uuid;--> statement-breakpoint
ALTER TABLE "approval_request" ADD COLUMN "payment_id" uuid;--> statement-breakpoint
ALTER TABLE "approval_request" ADD COLUMN "fix" text;--> statement-breakpoint
ALTER TABLE "approval_request" ADD COLUMN "new_amount" bigint;--> statement-breakpoint
ALTER TABLE "approval_request" ADD COLUMN "new_method" text;--> statement-breakpoint
ALTER TABLE "approval_request" ADD COLUMN "new_reference" text;--> statement-breakpoint
ALTER TABLE "approval_request" ADD COLUMN "to_rental_id" uuid;--> statement-breakpoint
ALTER TABLE "payment_adjustment" ADD CONSTRAINT "payment_adjustment_request_id_approval_request_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."approval_request"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_adjustment" ADD CONSTRAINT "payment_adjustment_payment_id_payment_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_adjustment" ADD CONSTRAINT "payment_adjustment_rental_id_rental_id_fk" FOREIGN KEY ("rental_id") REFERENCES "public"."rental"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_adjustment" ADD CONSTRAINT "payment_adjustment_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refund" ADD CONSTRAINT "refund_rental_id_rental_id_fk" FOREIGN KEY ("rental_id") REFERENCES "public"."rental"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refund" ADD CONSTRAINT "refund_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "write_off" ADD CONSTRAINT "write_off_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "write_off" ADD CONSTRAINT "write_off_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "write_off_line" ADD CONSTRAINT "write_off_line_write_off_id_write_off_id_fk" FOREIGN KEY ("write_off_id") REFERENCES "public"."write_off"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "write_off_line" ADD CONSTRAINT "write_off_line_rental_id_rental_id_fk" FOREIGN KEY ("rental_id") REFERENCES "public"."rental"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payment_adjustment_by_rental" ON "payment_adjustment" USING btree ("rental_id");--> statement-breakpoint
CREATE INDEX "payment_adjustment_by_payment" ON "payment_adjustment" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "refund_by_rental" ON "refund" USING btree ("rental_id");--> statement-breakpoint
CREATE INDEX "write_off_by_customer" ON "write_off" USING btree ("customer_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "write_off_line_by_rental" ON "write_off_line" USING btree ("rental_id");--> statement-breakpoint
ALTER TABLE "cash_movement" ADD CONSTRAINT "cash_movement_refund_id_refund_id_fk" FOREIGN KEY ("refund_id") REFERENCES "public"."refund"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_movement" ADD CONSTRAINT "cash_movement_request_id_approval_request_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."approval_request"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deposit_movement" ADD CONSTRAINT "deposit_movement_request_id_approval_request_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."approval_request"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_request" ADD CONSTRAINT "approval_request_to_rental_id_rental_id_fk" FOREIGN KEY ("to_rental_id") REFERENCES "public"."rental"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "approval_request_by_payment" ON "approval_request" USING btree ("payment_id");--> statement-breakpoint
ALTER TABLE "cash_movement" ADD CONSTRAINT "cash_movement_correction" CHECK ((kind in ('correctionIn', 'correctionOut')) = (request_id is not null));--> statement-breakpoint
ALTER TABLE "cash_movement" ADD CONSTRAINT "cash_movement_kind" CHECK (kind in ('paymentIn', 'refundOut', 'correctionIn', 'correctionOut'));--> statement-breakpoint
ALTER TABLE "cash_movement" ADD CONSTRAINT "cash_movement_refund_out" CHECK (kind <> 'refundOut' or (deposit_movement_id is null) <> (refund_id is null));--> statement-breakpoint
ALTER TABLE "deposit_movement" ADD CONSTRAINT "deposit_movement_adjusted_request" CHECK ((kind = 'adjusted') = (request_id is not null));--> statement-breakpoint
ALTER TABLE "deposit_movement" ADD CONSTRAINT "deposit_movement_kind" CHECK (kind in ('received', 'applied', 'refunded', 'adjusted'));--> statement-breakpoint
ALTER TABLE "deposit_movement" ADD CONSTRAINT "deposit_movement_amount" CHECK (case when kind = 'adjusted' then amount <> 0 else amount > 0 end);--> statement-breakpoint
ALTER TABLE "deposit_movement" ADD CONSTRAINT "deposit_movement_received_has_payment" CHECK (kind not in ('received', 'adjusted') or payment_id is not null);--> statement-breakpoint
ALTER TABLE "deposit_movement" ADD CONSTRAINT "deposit_movement_settled" CHECK ((kind in ('applied', 'refunded')) = (settlement_id is not null));--> statement-breakpoint
ALTER TABLE "approval_request" ADD CONSTRAINT "approval_request_kind" CHECK ((kind = 'rate' and new_daily_rate between 1 and 100000 and discount is null) or (kind = 'discount' and discount >= 1 and new_daily_rate is null) or (kind = 'garageDays' and days between 1 and 30) or (kind = 'split' and charge_id is not null) or (kind = 'correction' and payment_id is not null and ((fix = 'amount' and new_amount >= 0) or (fix = 'method' and new_method in ('cash', 'bank', 'card') and (new_method = 'cash') = (new_reference is null)) or (fix = 'reference' and new_reference is not null) or (fix = 'rental' and to_rental_id is not null))));--> statement-breakpoint
ALTER TABLE "approval_request" ADD CONSTRAINT "approval_request_payment_id_payment_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE TRIGGER payment_adjustment_insert_only BEFORE UPDATE OR DELETE ON payment_adjustment FOR EACH ROW EXECUTE FUNCTION refuse_change_insert_only();--> statement-breakpoint
CREATE TRIGGER payment_adjustment_no_truncate BEFORE TRUNCATE ON payment_adjustment FOR EACH STATEMENT EXECUTE FUNCTION refuse_change_insert_only();--> statement-breakpoint
CREATE TRIGGER refund_insert_only BEFORE UPDATE OR DELETE ON refund FOR EACH ROW EXECUTE FUNCTION refuse_change_insert_only();--> statement-breakpoint
CREATE TRIGGER refund_no_truncate BEFORE TRUNCATE ON refund FOR EACH STATEMENT EXECUTE FUNCTION refuse_change_insert_only();--> statement-breakpoint
CREATE TRIGGER write_off_insert_only BEFORE UPDATE OR DELETE ON write_off FOR EACH ROW EXECUTE FUNCTION refuse_change_insert_only();--> statement-breakpoint
CREATE TRIGGER write_off_no_truncate BEFORE TRUNCATE ON write_off FOR EACH STATEMENT EXECUTE FUNCTION refuse_change_insert_only();--> statement-breakpoint
CREATE TRIGGER write_off_line_insert_only BEFORE UPDATE OR DELETE ON write_off_line FOR EACH ROW EXECUTE FUNCTION refuse_change_insert_only();--> statement-breakpoint
CREATE TRIGGER write_off_line_no_truncate BEFORE TRUNCATE ON write_off_line FOR EACH STATEMENT EXECUTE FUNCTION refuse_change_insert_only();--> statement-breakpoint
GRANT SELECT, INSERT ON payment_adjustment, refund, write_off, write_off_line TO sns_app;--> statement-breakpoint
REVOKE UPDATE, DELETE, TRUNCATE ON payment_adjustment, refund, write_off, write_off_line FROM sns_app;
