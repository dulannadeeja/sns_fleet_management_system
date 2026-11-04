CREATE TABLE "golive_tick" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item" text NOT NULL,
	"done" boolean NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
	"created_by" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "golive_tick" ADD CONSTRAINT "golive_tick_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "golive_tick_newest" ON "golive_tick" USING btree ("item","created_at" DESC NULLS LAST);--> statement-breakpoint
-- The owner's ticks are insert-only: a change of mind is a new row (untick with a reason), never an edit.
CREATE TRIGGER golive_tick_insert_only BEFORE UPDATE OR DELETE ON golive_tick FOR EACH ROW EXECUTE FUNCTION refuse_change_insert_only();
--> statement-breakpoint
CREATE TRIGGER golive_tick_no_truncate BEFORE TRUNCATE ON golive_tick FOR EACH STATEMENT EXECUTE FUNCTION refuse_change_insert_only();
--> statement-breakpoint
GRANT SELECT, INSERT ON golive_tick TO sns_app;
--> statement-breakpoint
REVOKE UPDATE, DELETE, TRUNCATE ON golive_tick FROM sns_app;
