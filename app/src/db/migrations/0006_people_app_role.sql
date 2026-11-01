-- The app role (migration 0002) on permission grants: a grant is a row, and removing a permission deletes it.
-- Every grant and removal is also written to the insert-only activity log in the same transaction (system design 3.2).
GRANT SELECT, INSERT, DELETE ON permission_grant TO sns_app;
--> statement-breakpoint
REVOKE UPDATE, TRUNCATE ON permission_grant FROM sns_app;
