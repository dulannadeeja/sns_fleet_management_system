CREATE TABLE "customer_flag" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"details" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"closed_at" timestamp with time zone,
	"closed_by" uuid,
	"close_reason" text,
	CONSTRAINT "customer_flag_kind" CHECK (kind in ('unpaid', 'damage', 'other')),
	CONSTRAINT "customer_flag_closed" CHECK ((closed_at is null) = (closed_by is null) and (closed_at is null) = (close_reason is null))
);
--> statement-breakpoint
CREATE TABLE "customer_go_ahead" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"flag_ids" uuid[] DEFAULT '{}' NOT NULL,
	"licence_expired" boolean NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customer_flag" ADD CONSTRAINT "customer_flag_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_flag" ADD CONSTRAINT "customer_flag_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_flag" ADD CONSTRAINT "customer_flag_closed_by_user_id_fk" FOREIGN KEY ("closed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_go_ahead" ADD CONSTRAINT "customer_go_ahead_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_go_ahead" ADD CONSTRAINT "customer_go_ahead_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "customer_flag_by_customer" ON "customer_flag" USING btree ("customer_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "customer_go_ahead_by_customer" ON "customer_go_ahead" USING btree ("customer_id","created_at" DESC NULLS LAST);--> statement-breakpoint
-- A flag is never changed or removed, except that it is closed once, with who and why (system design 6, AT-48).
CREATE FUNCTION customer_flag_close_once() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP <> 'UPDATE' OR OLD.closed_at IS NOT NULL
     OR NEW.customer_id IS DISTINCT FROM OLD.customer_id OR NEW.kind IS DISTINCT FROM OLD.kind OR NEW.details IS DISTINCT FROM OLD.details
     OR NEW.created_at IS DISTINCT FROM OLD.created_at OR NEW.created_by IS DISTINCT FROM OLD.created_by THEN
    RAISE EXCEPTION 'customer_flag is insert-only: % is not allowed (a flag is only closed, once)', TG_OP USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER customer_flag_close_once BEFORE UPDATE OR DELETE ON customer_flag FOR EACH ROW EXECUTE FUNCTION customer_flag_close_once();
--> statement-breakpoint
CREATE TRIGGER customer_flag_no_truncate BEFORE TRUNCATE ON customer_flag FOR EACH STATEMENT EXECUTE FUNCTION refuse_change_insert_only();
--> statement-breakpoint
CREATE TRIGGER customer_go_ahead_insert_only BEFORE UPDATE OR DELETE ON customer_go_ahead FOR EACH ROW EXECUTE FUNCTION refuse_change_insert_only();
--> statement-breakpoint
CREATE TRIGGER customer_go_ahead_no_truncate BEFORE TRUNCATE ON customer_go_ahead FOR EACH STATEMENT EXECUTE FUNCTION refuse_change_insert_only();
--> statement-breakpoint
GRANT SELECT, INSERT ON customer_flag, customer_go_ahead TO sns_app;
--> statement-breakpoint
GRANT UPDATE (closed_at, closed_by, close_reason) ON customer_flag TO sns_app;
--> statement-breakpoint
REVOKE DELETE, TRUNCATE ON customer_flag, customer_go_ahead FROM sns_app;
--> statement-breakpoint
REVOKE UPDATE ON customer_go_ahead FROM sns_app;
