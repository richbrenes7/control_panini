# 📋 GUÍA COMPLETA DE DESPLIEGUE

## Pre-requisitos

✅ Ya configurados:
- Supabase account y BD
- GitHub repo creado
- Código del proyecto completo

## 🔧 PASO 1: Configurar Backend en Render

### 1.1 Crear cuenta en Render (si no tienes)
- Ir a https://render.com
- Sign up con GitHub
- Autorizar acceso al repo

### 1.2 Crear Web Service
1. Click "Create +" → "Web Service"
2. Conectar repositorio `richbrenes7/control_panini`
3. Configurar:
   - **Name**: `control-panini-api`
   - **Environment**: `Python 3`
   - **Region**: Seleccionar la más cercana
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Build Command**: 
     ```
     pip install -r requirements.txt
     ```
   - **Start Command**:
     ```
     gunicorn --bind 0.0.0.0:5000 app:app
     ```
   - **Plan**: `Free`

### 1.3 Agregar Variables de Entorno
En "Environment", agregar:

| Key | Value |
|-----|-------|
| SUPABASE_URL | https://trmulthiyjshlxiqpebu.supabase.co |
| SUPABASE_KEY | sb_publishable_HfCcv97LN_44odIcm6mS1g_2m5_2z3e |
| FLASK_ENV | production |
| FLASK_DEBUG | 0 |

### 1.4 Deploy
- Click "Create Web Service"
- Esperar a que termine el build (~2-5 minutos)
- Cuando diga "Live", copiar URL: `https://control-panini-api.onrender.com`

✅ **Backend Lista**: Comprobar en https://control-panini-api.onrender.com/api/health

---

## 🎨 PASO 2: Configurar Frontend en Netlify

### 2.1 Crear cuenta en Netlify (si no tienes)
- Ir a https://netlify.com
- Sign up con GitHub
- Autorizar acceso

### 2.2 Crear nuevo sitio
1. Click "Add new site" → "Import an existing project"
2. Seleccionar GitHub
3. Seleccionar repositorio: `richbrenes7/control_panini`
4. Configurar:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `build`

### 2.3 Agregar Variables de Entorno
En Site settings → Build & deploy → Environment:

```
REACT_APP_API_URL=https://control-panini-api.onrender.com/api
```

### 2.4 Deploy
- Click "Deploy site"
- Esperar a que termine (~3-5 minutos)
- Cuando diga "Published", obtendrás URL: `https://control-panini.netlify.app`

✅ **Frontend Lista**: Ir a https://control-panini.netlify.app

---

## 🗄️ PASO 3: Configurar Base de Datos en Supabase

### 3.1 Crear tablas (si no existen)

1. Ir a https://supabase.io
2. Iniciar sesión con tu proyecto
3. Ir a SQL Editor
4. Crear nueva query
5. Copiar este script:

```sql
-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de estampas
CREATE TABLE IF NOT EXISTS stamps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stamp_code TEXT NOT NULL,
  team_id INTEGER,
  type TEXT,
  quantity INTEGER DEFAULT 1,
  date_added TIMESTAMP DEFAULT NOW(),
  notes TEXT
);

-- Tabla de historial
CREATE TABLE IF NOT EXISTS history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  stamp_code TEXT NOT NULL,
  quantity INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para mejor rendimiento
CREATE INDEX idx_stamps_user_id ON stamps(user_id);
CREATE INDEX idx_history_user_id ON history(user_id);
```

6. Ejecutar (Click "Run")

### 3.2 Habilitar RLS (Row Level Security) - Opcional pero recomendado

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stamps ENABLE ROW LEVEL SECURITY;
ALTER TABLE history ENABLE ROW LEVEL SECURITY;
```

✅ **Base de Datos Lista**

---

## ✅ PASO 4: Verificar Despliegue

### Checklist Final:

1. **Backend está activo:**
   - [ ] Ir a `https://control-panini-api.onrender.com/api/health`
   - [ ] Debe mostrar: `{"status":"ok",...}`

2. **Frontend está activo:**
   - [ ] Ir a `https://control-panini.netlify.app`
   - [ ] Debe cargar la aplicación

3. **BD está funcionando:**
   - [ ] En Supabase, verificar que existan las 3 tablas
   - [ ] Crear un usuario de prueba desde la app

4. **Conexión end-to-end:**
   - [ ] Crear usuario en la app
   - [ ] Agregar una estampa
   - [ ] Verificar en Supabase que se guardó

---

## 🐛 Troubleshooting

### Error: "Cannot connect to backend"
**Solución:**
- Verificar que Render app está en estado "Live"
- Verificar URL en variables de entorno de Netlify
- Comprobar CORS en backend

### Error: "Database connection failed"
**Solución:**
- Verificar SUPABASE_URL y SUPABASE_KEY
- Comprobar que tablas existen en Supabase
- Ver logs en Render

### Frontend blanco/en blanco
**Solución:**
- Abrir DevTools (F12)
- Ver Console por errores
- Verificar que REACT_APP_API_URL es correcto

### Cambios no aparecen después de hacer git push
**Solución:**
- En Render: Ir a Deployments → Manual Deploy
- En Netlify: Ir a Deploys → Trigger deploy

---

## 📱 Próximos pasos

1. **Personalizar la app:**
   - Cambiar colores/tema en CSS
   - Agregar más equipos a la lista
   - Agregar autenticación real

2. **Optimizar BD:**
   - Agregar más índices
   - Configurar backups automáticos
   - Habilitar full RLS

3. **Mejorar frontend:**
   - Agregar más gráficos
   - Implementar búsqueda avanzada
   - Agregar modo offline

---

## 🆘 Soporte Rápido

| Problema | Link |
|----------|------|
| Docs de Render | https://render.com/docs |
| Docs de Netlify | https://docs.netlify.com |
| Docs de Supabase | https://supabase.com/docs |
| Issues del Proyecto | https://github.com/richbrenes7/control_panini/issues |

---

✅ **¡Listo para producción!**
