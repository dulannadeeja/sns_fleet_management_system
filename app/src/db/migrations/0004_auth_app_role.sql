-- The app role (migration 0002) also works the sign-in tables. People are turned off, never deleted (system design 3.1),
-- so it may not delete a person or their password row; sessions and one-time values come and go.
GRANT SELECT, INSERT, UPDATE ON "user", account TO sns_app;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON session, verification TO sns_app;
--> statement-breakpoint
REVOKE DELETE, TRUNCATE ON "user", account FROM sns_app;
