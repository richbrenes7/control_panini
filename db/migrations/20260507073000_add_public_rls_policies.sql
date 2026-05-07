-- migrate:up

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'allow_public_users_access'
  ) THEN
    CREATE POLICY allow_public_users_access ON users
      FOR ALL TO anon, authenticated
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'stamps' AND policyname = 'allow_public_stamps_access'
  ) THEN
    CREATE POLICY allow_public_stamps_access ON stamps
      FOR ALL TO anon, authenticated
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'history' AND policyname = 'allow_public_history_access'
  ) THEN
    CREATE POLICY allow_public_history_access ON history
      FOR ALL TO anon, authenticated
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'repeated_stamps' AND policyname = 'allow_public_repeated_access'
  ) THEN
    CREATE POLICY allow_public_repeated_access ON repeated_stamps
      FOR ALL TO anon, authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- migrate:down

DROP POLICY IF EXISTS allow_public_users_access ON users;
DROP POLICY IF EXISTS allow_public_stamps_access ON stamps;
DROP POLICY IF EXISTS allow_public_history_access ON history;
DROP POLICY IF EXISTS allow_public_repeated_access ON repeated_stamps;
