CREATE TABLE "package_default" (
	"id" smallint PRIMARY KEY DEFAULT 1 NOT NULL,
	"commission_percent" integer NOT NULL,
	"long_rental_extra" bigint NOT NULL,
	"long_rental_from_day" integer NOT NULL,
	"garage_day_charge" bigint NOT NULL,
	CONSTRAINT "package_default_one_row" CHECK (id = 1)
);
--> statement-breakpoint
CREATE TABLE "starting_package" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"position" integer NOT NULL,
	"daily_rate" bigint NOT NULL,
	"km_per_day" integer NOT NULL,
	"extra_km_rate" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	CONSTRAINT "starting_package_one_per_name" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "starting_package_model" (
	"package_id" uuid NOT NULL,
	"model" text NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "starting_package_model_pk" PRIMARY KEY("package_id","model")
);
--> statement-breakpoint
ALTER TABLE "vehicle" ADD COLUMN "starting_package_id" uuid;--> statement-breakpoint
ALTER TABLE "starting_package" ADD CONSTRAINT "starting_package_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "starting_package_model" ADD CONSTRAINT "starting_package_model_package_id_starting_package_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."starting_package"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "starting_package_model_by_model" ON "starting_package_model" USING btree ("model");--> statement-breakpoint
ALTER TABLE "vehicle" ADD CONSTRAINT "vehicle_starting_package_id_starting_package_id_fk" FOREIGN KEY ("starting_package_id") REFERENCES "public"."starting_package"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
-- One package per name, however it is written (the app also checks under its lock, #21 review).
CREATE UNIQUE INDEX starting_package_name_any_case ON starting_package (lower(name));
--> statement-breakpoint
-- The car limits (system design 4.2), also in the database (#21 review).
ALTER TABLE starting_package ADD CONSTRAINT starting_package_limits CHECK (daily_rate BETWEEN 1 AND 100000 AND km_per_day BETWEEN 1 AND 1000 AND extra_km_rate BETWEEN 0 AND 1000);
--> statement-breakpoint
ALTER TABLE package_default ADD CONSTRAINT package_default_limits CHECK (commission_percent BETWEEN 0 AND 100 AND long_rental_extra BETWEEN 0 AND 100000 AND long_rental_from_day BETWEEN 2 AND 60 AND garage_day_charge BETWEEN 0 AND 100000);
--> statement-breakpoint
-- The starting packages and defaults of system design 4.1 and 4.2 (Confirmed; the extra-km rates are design rates).
INSERT INTO package_default (id, commission_percent, long_rental_extra, long_rental_from_day, garage_day_charge) VALUES (1, 15, 500, 6, 5000);
--> statement-breakpoint
INSERT INTO starting_package (name, position, daily_rate, km_per_day, extra_km_rate) VALUES
  ('Wagon R, Spacia', 1, 4500, 100, 25), ('Every (van)', 2, 5000, 100, 25), ('Alto', 3, 4000, 100, 17), ('Prius, Axio', 4, 6500, 100, 27);
--> statement-breakpoint
INSERT INTO starting_package_model (package_id, model, position)
  SELECT p.id, m.model, m.position FROM starting_package p JOIN (VALUES
    ('Wagon R, Spacia', 'Wagon R', 1), ('Wagon R, Spacia', 'Spacia', 2), ('Every (van)', 'Every', 1), ('Alto', 'Alto', 1),
    ('Prius, Axio', 'Prius', 1), ('Prius, Axio', 'Axio', 2)) AS m(package, model, position) ON m.package = p.name;
--> statement-breakpoint
-- Cars added before #21 started from their model's one package.
UPDATE vehicle v SET starting_package_id = pm.package_id FROM starting_package_model pm WHERE pm.model = v.model AND v.starting_package_id IS NULL;
--> statement-breakpoint
-- The app reads and adds packages and changes their name and rates; it adds models to a package and never removes one;
-- it changes the defaults' values. Nothing is ever deleted. Old values are in the activity log (#21).
GRANT SELECT, INSERT ON starting_package, starting_package_model TO sns_app;
--> statement-breakpoint
GRANT UPDATE (name, daily_rate, km_per_day, extra_km_rate) ON starting_package TO sns_app;
--> statement-breakpoint
GRANT SELECT ON package_default TO sns_app;
--> statement-breakpoint
GRANT UPDATE (commission_percent, long_rental_extra, long_rental_from_day, garage_day_charge) ON package_default TO sns_app;
--> statement-breakpoint
REVOKE DELETE, TRUNCATE ON starting_package, starting_package_model, package_default FROM sns_app;
