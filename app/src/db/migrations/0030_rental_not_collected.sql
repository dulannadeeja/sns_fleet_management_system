ALTER TABLE "rental" DROP CONSTRAINT "rental_status";--> statement-breakpoint
ALTER TABLE "rental" ADD CONSTRAINT "rental_status" CHECK (status in ('draft', 'active', 'notCollected'));