ALTER TABLE "agreement_signed" ADD COLUMN "print_id" uuid;--> statement-breakpoint
ALTER TABLE "agreement_signed" ADD CONSTRAINT "agreement_signed_print_id_agreement_print_id_fk" FOREIGN KEY ("print_id") REFERENCES "public"."agreement_print"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
-- Rentals saved before 0026 got their numbers in table order; number them by when they were saved (#55 review), then
-- continue the sequence after the highest. (Gaps from saves that were refused stay: numbers are never reused.)
UPDATE rental SET number = number + 1000000000;
--> statement-breakpoint
UPDATE rental r SET number = n.rn FROM (SELECT id, row_number() OVER (ORDER BY created_at, id) AS rn FROM rental) n WHERE r.id = n.id;
--> statement-breakpoint
SELECT setval(pg_get_serial_sequence('rental', 'number'), GREATEST((SELECT max(number) FROM rental), 1), (SELECT count(*) FROM rental) > 0);
