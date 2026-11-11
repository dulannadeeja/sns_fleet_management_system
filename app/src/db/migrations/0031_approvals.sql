CREATE TABLE "approval_decision" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"outcome" text NOT NULL,
	"note" text,
	"partner_extra" bigint,
	"split_reason" text,
	"self_approved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
	"created_by" uuid NOT NULL,
	CONSTRAINT "approval_decision_one_per_request" UNIQUE("request_id"),
	CONSTRAINT "approval_decision_outcome" CHECK (outcome in ('approved', 'rejected', 'withdrawn')),
	CONSTRAINT "approval_decision_reject_note" CHECK (outcome <> 'rejected' or (note is not null and length(note) > 0)),
	CONSTRAINT "approval_decision_split" CHECK ((partner_extra is null) = (split_reason is null) and (partner_extra is null or (outcome = 'approved' and partner_extra >= 0)))
);
--> statement-breakpoint
CREATE TABLE "approval_request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rental_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"new_daily_rate" bigint,
	"discount" bigint,
	"rate_was" bigint NOT NULL,
	"estimate_was" bigint NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
	"created_by" uuid NOT NULL,
	CONSTRAINT "approval_request_kind" CHECK ((kind = 'rate' and new_daily_rate between 1 and 100000 and discount is null) or (kind = 'discount' and discount >= 1 and new_daily_rate is null))
);
--> statement-breakpoint
ALTER TABLE "approval_decision" ADD CONSTRAINT "approval_decision_request_id_approval_request_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."approval_request"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_decision" ADD CONSTRAINT "approval_decision_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_request" ADD CONSTRAINT "approval_request_rental_id_rental_id_fk" FOREIGN KEY ("rental_id") REFERENCES "public"."rental"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_request" ADD CONSTRAINT "approval_request_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "approval_request_by_rental" ON "approval_request" USING btree ("rental_id","created_at" DESC NULLS LAST);--> statement-breakpoint
-- Requests and decisions are insert-only (TRD › Integrity rules): the app role may only add and read them.
CREATE TRIGGER approval_request_insert_only BEFORE UPDATE OR DELETE ON approval_request FOR EACH ROW EXECUTE FUNCTION refuse_change_insert_only();--> statement-breakpoint
CREATE TRIGGER approval_request_no_truncate BEFORE TRUNCATE ON approval_request FOR EACH STATEMENT EXECUTE FUNCTION refuse_change_insert_only();--> statement-breakpoint
CREATE TRIGGER approval_decision_insert_only BEFORE UPDATE OR DELETE ON approval_decision FOR EACH ROW EXECUTE FUNCTION refuse_change_insert_only();--> statement-breakpoint
CREATE TRIGGER approval_decision_no_truncate BEFORE TRUNCATE ON approval_decision FOR EACH STATEMENT EXECUTE FUNCTION refuse_change_insert_only();--> statement-breakpoint
GRANT SELECT, INSERT ON approval_request, approval_decision TO sns_app;--> statement-breakpoint
REVOKE UPDATE, DELETE, TRUNCATE ON approval_request, approval_decision FROM sns_app;
