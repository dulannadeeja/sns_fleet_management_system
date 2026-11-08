CREATE TABLE "reference_document" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference_person_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"storage_key" text NOT NULL,
	"content_type" text NOT NULL,
	"size" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	CONSTRAINT "reference_document_one_key" UNIQUE("storage_key"),
	CONSTRAINT "reference_document_kind" CHECK (kind in ('nicFront', 'nicBack', 'licence'))
);
--> statement-breakpoint
CREATE TABLE "reference_person" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"name" text NOT NULL,
	"nic" text NOT NULL,
	"phone" text NOT NULL,
	"relationship" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	CONSTRAINT "reference_person_one_per_nic" UNIQUE("customer_id","nic"),
	CONSTRAINT "reference_person_of_customer" UNIQUE("customer_id","id"),
	CONSTRAINT "reference_person_relationship" CHECK (relationship is null or relationship in ('family', 'friend', 'employer', 'other'))
);
--> statement-breakpoint
ALTER TABLE "rental" ADD COLUMN "deposit_amount" bigint;--> statement-breakpoint
ALTER TABLE "rental" ADD COLUMN "deposit_waived_reason" text;--> statement-breakpoint
ALTER TABLE "rental" ADD COLUMN "rent_paid" text;--> statement-breakpoint
ALTER TABLE "rental" ADD COLUMN "fuel" text;--> statement-breakpoint
ALTER TABLE "rental" ADD COLUMN "reference_required" boolean;--> statement-breakpoint
ALTER TABLE "rental" ADD COLUMN "reference_person_id" uuid;--> statement-breakpoint
ALTER TABLE "rental" ADD COLUMN "terms_set_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "reference_document" ADD CONSTRAINT "reference_document_reference_person_id_reference_person_id_fk" FOREIGN KEY ("reference_person_id") REFERENCES "public"."reference_person"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reference_document" ADD CONSTRAINT "reference_document_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reference_person" ADD CONSTRAINT "reference_person_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reference_person" ADD CONSTRAINT "reference_person_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reference_document_newest" ON "reference_document" USING btree ("reference_person_id","kind","created_at" DESC NULLS LAST);--> statement-breakpoint
ALTER TABLE "rental" ADD CONSTRAINT "rental_reference_person_id_reference_person_id_fk" FOREIGN KEY ("reference_person_id") REFERENCES "public"."reference_person"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental" ADD CONSTRAINT "rental_reference_of_customer" FOREIGN KEY ("customer_id","reference_person_id") REFERENCES "public"."reference_person"("customer_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental" ADD CONSTRAINT "rental_deposit" CHECK ((deposit_amount is null or deposit_amount between 1 and 500000) and not (deposit_amount is not null and deposit_waived_reason is not null));--> statement-breakpoint
ALTER TABLE "rental" ADD CONSTRAINT "rental_rent_paid" CHECK (rent_paid is null or rent_paid in ('now', 'return'));--> statement-breakpoint
ALTER TABLE "rental" ADD CONSTRAINT "rental_fuel" CHECK (fuel is null or fuel in ('notCounted', 'sameLevel'));--> statement-breakpoint
ALTER TABLE "rental" ADD CONSTRAINT "rental_reference_only_if_required" CHECK (reference_person_id is null or reference_required = true);--> statement-breakpoint
ALTER TABLE "rental" ADD CONSTRAINT "rental_terms_complete" CHECK (terms_set_at is null or ((deposit_amount is not null or deposit_waived_reason is not null) and rent_paid is not null and fuel is not null and reference_required is not null));
--> statement-breakpoint
-- A reference person's copies are insert-only, like the customer's (system design 6; ST-05.5).
CREATE TRIGGER reference_document_insert_only BEFORE UPDATE OR DELETE ON reference_document
  FOR EACH ROW EXECUTE FUNCTION refuse_change_insert_only();
--> statement-breakpoint
CREATE TRIGGER reference_document_no_truncate BEFORE TRUNCATE ON reference_document
  FOR EACH STATEMENT EXECUTE FUNCTION refuse_change_insert_only();
--> statement-breakpoint
-- The app adds reference people and their copies (no correcting yet); it changes a rental's step-4 terms until handover.
GRANT SELECT, INSERT ON reference_person, reference_document TO sns_app;

--> statement-breakpoint
REVOKE DELETE, TRUNCATE ON reference_person, reference_document FROM sns_app;
--> statement-breakpoint
REVOKE UPDATE ON reference_person, reference_document FROM sns_app;
--> statement-breakpoint
GRANT UPDATE (deposit_amount, deposit_waived_reason, rent_paid, fuel, reference_required, reference_person_id, terms_set_at) ON rental TO sns_app;
