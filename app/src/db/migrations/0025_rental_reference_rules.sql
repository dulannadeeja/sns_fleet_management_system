-- #54 review fixes, kept apart from 0024 because 0024 already ran on the shared test-site database (a preview build).
-- The reference person on a rental is the rental's own customer's, and only when one is required.
ALTER TABLE "reference_person" ADD CONSTRAINT "reference_person_of_customer" UNIQUE("customer_id","id");--> statement-breakpoint
ALTER TABLE "rental" ADD CONSTRAINT "rental_reference_of_customer" FOREIGN KEY ("customer_id","reference_person_id") REFERENCES "public"."reference_person"("customer_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental" ADD CONSTRAINT "rental_reference_only_if_required" CHECK (reference_person_id is null or reference_required = true);--> statement-breakpoint
-- No code corrects a reference person yet: the app may not change one.
REVOKE UPDATE ON reference_person FROM sns_app;
