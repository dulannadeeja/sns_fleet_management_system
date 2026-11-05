-- The app's database role (TRD › Integrity rules and §13): it may add and read activity-log entries but never change, delete or empty them.
-- NOLOGIN here; the server setup gives it a login and password, and the app connects as it. Migrations run as the table owner.
-- Every later insert-only table repeats the GRANT and REVOKE below in its own migration.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'sns_app') THEN
    CREATE ROLE sns_app NOLOGIN;
  END IF;
END
$$;
--> statement-breakpoint
GRANT USAGE ON SCHEMA public TO sns_app;
--> statement-breakpoint
GRANT SELECT, INSERT ON audit_event TO sns_app;
--> statement-breakpoint
REVOKE UPDATE, DELETE, TRUNCATE ON audit_event FROM sns_app;
