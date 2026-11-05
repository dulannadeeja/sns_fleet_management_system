CREATE TABLE "setting" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid
);
--> statement-breakpoint
ALTER TABLE "setting" ADD CONSTRAINT "setting_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
-- The app reads and changes owner settings but never deletes one (system design 3.2 "Owner settings").
GRANT SELECT, INSERT, UPDATE ON setting TO sns_app;
--> statement-breakpoint
REVOKE DELETE, TRUNCATE ON setting FROM sns_app;
