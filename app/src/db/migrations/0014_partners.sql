CREATE TABLE "partner_owner" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"nic" text NOT NULL,
	"bank_account" text,
	"agreement_signed_on" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	CONSTRAINT "partner_owner_one_account" UNIQUE("user_id"),
	CONSTRAINT "partner_owner_one_per_nic" UNIQUE("nic")
);
--> statement-breakpoint
ALTER TABLE "vehicle" ADD COLUMN "partner_owner_id" uuid;--> statement-breakpoint
ALTER TABLE "vehicle_terms_version" ADD COLUMN "owner_pays" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "partner_owner" ADD CONSTRAINT "partner_owner_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_owner" ADD CONSTRAINT "partner_owner_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle" ADD CONSTRAINT "vehicle_partner_owner_id_partner_owner_id_fk" FOREIGN KEY ("partner_owner_id") REFERENCES "public"."partner_owner"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
-- Only a partner car has a partner owner.
ALTER TABLE "vehicle" ADD CONSTRAINT "vehicle_partner_owner_only_partner" CHECK (ownership = 'partner' OR partner_owner_id IS NULL);
--> statement-breakpoint
-- The app adds partners and records the agreement date and bank account; it never removes a partner. On cars it may
-- only set the owner link (ST-11.2), nothing else (#18: cars are otherwise insert-only for the app).
GRANT SELECT, INSERT ON partner_owner TO sns_app;
--> statement-breakpoint
GRANT UPDATE (agreement_signed_on, bank_account) ON partner_owner TO sns_app;
--> statement-breakpoint
REVOKE DELETE, TRUNCATE ON partner_owner FROM sns_app;
--> statement-breakpoint
GRANT UPDATE (partner_owner_id) ON vehicle TO sns_app;
