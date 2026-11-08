ALTER TABLE "rental" ADD COLUMN "go_ahead_id" uuid;--> statement-breakpoint
ALTER TABLE "rental" ADD CONSTRAINT "rental_go_ahead_id_customer_go_ahead_id_fk" FOREIGN KEY ("go_ahead_id") REFERENCES "public"."customer_go_ahead"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental" ADD CONSTRAINT "rental_one_per_go_ahead" UNIQUE("go_ahead_id");