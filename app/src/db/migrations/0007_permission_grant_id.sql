ALTER TABLE "permission_grant" DROP CONSTRAINT "permission_grant_user_id_permission_pk";--> statement-breakpoint
ALTER TABLE "permission_grant" ADD COLUMN "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "permission_grant" ADD CONSTRAINT "permission_grant_once" UNIQUE("user_id","permission");