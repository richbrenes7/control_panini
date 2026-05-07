-- migrate:up

ALTER TABLE users ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

UPDATE users
SET instagram = lower(regexp_replace(coalesce(instagram, email, name), '^@', ''))
WHERE instagram IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_instagram_key ON users(instagram);

CREATE TABLE IF NOT EXISTS repeated_stamps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stamp_code TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, stamp_code)
);

CREATE INDEX IF NOT EXISTS idx_repeated_stamps_user_id ON repeated_stamps(user_id);
CREATE INDEX IF NOT EXISTS idx_repeated_stamps_code ON repeated_stamps(stamp_code);

GRANT SELECT, INSERT, UPDATE, DELETE ON repeated_stamps TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO anon, authenticated;

-- migrate:down

DROP TABLE IF EXISTS repeated_stamps;
DROP INDEX IF EXISTS users_instagram_key;
ALTER TABLE users DROP COLUMN IF EXISTS instagram;
