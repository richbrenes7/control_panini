-- migrate:up

CREATE SCHEMA IF NOT EXISTS supabase_migrations;

CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
  version TEXT PRIMARY KEY,
  name TEXT,
  statements TEXT[]
);

INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
VALUES
  ('20260507050000', 'init_control_panini', ARRAY[]::TEXT[]),
  ('20260507062000', 'add_instagram_and_repeated_stamps', ARRAY[]::TEXT[]),
  ('20260507070000', 'add_user_password_hash', ARRAY[]::TEXT[]),
  ('20260507073000', 'add_public_rls_policies', ARRAY[]::TEXT[])
ON CONFLICT (version) DO NOTHING;

-- migrate:down

DELETE FROM supabase_migrations.schema_migrations
WHERE version IN (
  '20260507050000',
  '20260507062000',
  '20260507070000',
  '20260507073000'
);
