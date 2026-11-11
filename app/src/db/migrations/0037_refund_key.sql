ALTER TABLE "refund" ADD COLUMN "idempotency_key" text;--> statement-breakpoint
ALTER TABLE "refund" ADD CONSTRAINT "refund_one_per_key" UNIQUE("idempotency_key");