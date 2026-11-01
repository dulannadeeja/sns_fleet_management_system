CREATE TABLE "customer" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nic" text NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"address" text,
	"licence_number" text NOT NULL,
	"licence_expires" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customer_one_per_nic" UNIQUE("nic")
);
--> statement-breakpoint
CREATE TABLE "customer_document" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"storage_key" text NOT NULL,
	"content_type" text NOT NULL,
	"size" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	CONSTRAINT "customer_document_one_key" UNIQUE("storage_key")
);
--> statement-breakpoint
CREATE TABLE "document_access" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"opened_by" uuid NOT NULL,
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customer" ADD CONSTRAINT "customer_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_document" ADD CONSTRAINT "customer_document_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_document" ADD CONSTRAINT "customer_document_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_access" ADD CONSTRAINT "document_access_document_id_customer_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."customer_document"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_access" ADD CONSTRAINT "document_access_opened_by_user_id_fk" FOREIGN KEY ("opened_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "customer_by_name" ON "customer" USING btree ("name");--> statement-breakpoint
CREATE INDEX "customer_document_newest" ON "customer_document" USING btree ("customer_id","kind","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "document_access_by_document" ON "document_access" USING btree ("document_id","opened_at" DESC NULLS LAST);--> statement-breakpoint
-- Document copies and their openings are kept as they happened: insert-only (TRD › Integrity rules; AT-59).
CREATE TRIGGER customer_document_insert_only BEFORE UPDATE OR DELETE ON customer_document FOR EACH ROW EXECUTE FUNCTION refuse_change_insert_only();
--> statement-breakpoint
CREATE TRIGGER customer_document_no_truncate BEFORE TRUNCATE ON customer_document FOR EACH STATEMENT EXECUTE FUNCTION refuse_change_insert_only();
--> statement-breakpoint
CREATE TRIGGER document_access_insert_only BEFORE UPDATE OR DELETE ON document_access FOR EACH ROW EXECUTE FUNCTION refuse_change_insert_only();
--> statement-breakpoint
CREATE TRIGGER document_access_no_truncate BEFORE TRUNCATE ON document_access FOR EACH STATEMENT EXECUTE FUNCTION refuse_change_insert_only();
--> statement-breakpoint
-- The app adds customers and corrects their details (the NIC only by the owner or the admin, in the module); it adds
-- copies and records each opening.
GRANT SELECT, INSERT ON customer, customer_document, document_access TO sns_app;
--> statement-breakpoint
GRANT UPDATE (name, phone, address, licence_number, licence_expires, nic, updated_at) ON customer TO sns_app;
--> statement-breakpoint
REVOKE DELETE, TRUNCATE ON customer, customer_document, document_access FROM sns_app;
--> statement-breakpoint
-- "Customer access" is a new permission (system design 3.2, Proposed): staff and admins who already exist get it, as a
-- new person would (their role's defaults).
INSERT INTO permission_grant (user_id, permission)
SELECT id, 'customerAccess' FROM "user" WHERE role IN ('staff', 'admin')
ON CONFLICT DO NOTHING;
