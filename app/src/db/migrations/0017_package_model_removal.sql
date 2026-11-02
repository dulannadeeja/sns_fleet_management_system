-- A model can be taken out of a starting package (system design 4.1; Proposed: Dulan, 2 Nov 2026). The app may remove
-- a package's model row; the change is in the activity log with the models before and after. Packages and the
-- defaults are still never removed.
GRANT DELETE ON starting_package_model TO sns_app;
