-- Tabla de Usuarios
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  instagram TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de Estampas (Colección del usuario)
CREATE TABLE IF NOT EXISTS stamps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stamp_code TEXT NOT NULL,
  team_id INTEGER,
  type TEXT,
  quantity INTEGER DEFAULT 1,
  date_added TIMESTAMP DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, stamp_code)
);

-- Tabla de Historial (Log de cambios)
CREATE TABLE IF NOT EXISTS history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  stamp_code TEXT,
  quantity INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de Estampas Repetidas para intercambio
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

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_stamps_user_id ON stamps(user_id);
CREATE INDEX IF NOT EXISTS idx_history_user_id ON history(user_id);
CREATE INDEX IF NOT EXISTS idx_stamps_code ON stamps(stamp_code);
CREATE INDEX IF NOT EXISTS idx_repeated_stamps_user_id ON repeated_stamps(user_id);
CREATE INDEX IF NOT EXISTS idx_repeated_stamps_code ON repeated_stamps(stamp_code);
