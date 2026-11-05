-- The app role (migration 0002) on the two-factor plugin's table: rows come and go with the plugin (SNS stores no
-- authenticator secrets; system design 3.1 "Email codes and email reset").
GRANT SELECT, INSERT, UPDATE, DELETE ON two_factor TO sns_app;
