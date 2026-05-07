-- migrate:up

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- migrate:down

ALTER TABLE users DROP COLUMN IF EXISTS password_hash;
