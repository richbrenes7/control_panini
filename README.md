# Control Panini - Gestión de Estampas del Mundial 2026

Aplicación web para llevar control de la colección de estampas del Álbum Panini del Mundial 2026 FIFA.

## 🎯 Características

- ✅ Control de estampas por usuario
- ✅ Clasificación ABC (Especial, Grupal/Escudo, Jugador)
- ✅ Historial completo de cambios
- ✅ Porcentaje de progreso
- ✅ Cálculo de estampas faltantes
- ✅ Gráficos de análisis
- ✅ Múltiples usuarios sin conflictos
- ✅ Almacenamiento persistente

## 🏗️ Arquitectura

```
Frontend (React) → Netlify (GRATIS)
    ↓
Backend API (Python/Flask) → Render (GRATIS)
    ↓
PostgreSQL → Supabase (GRATIS)
```

## 🚀 Despliegue Rápido

### Backend en Render
1. Ir a https://render.com
2. Crear "Web Service"
3. Conectar repo: `richbrenes7/control_panini`
4. Root Directory: `backend`
5. Build Command: `pip install -r requirements.txt`
6. Start Command: `gunicorn --bind 0.0.0.0:5000 app:app`
7. Variables de entorno:
   ```
   SUPABASE_URL=https://trmulthiyjshlxiqpebu.supabase.co
   SUPABASE_KEY=sb_publishable_HfCcv97LN_44odIcm6mS1g_2m5_2z3e
   FLASK_ENV=production
   ```

### Frontend en Netlify
1. Ir a https://netlify.com
2. Conectar repo: `richbrenes7/control_panini`
3. Base Directory: `frontend`
4. Build Command: `npm run build`
5. Publish Directory: `build`
6. Variable de entorno:
   ```
   REACT_APP_API_URL=https://control-panini-api.onrender.com/api
   ```

## 💻 Desarrollo Local

```bash
# Con Docker
docker-compose up

# Sin Docker
# Terminal 1 - Backend
cd backend && pip install -r requirements.txt && python app.py

# Terminal 2 - Frontend
cd frontend && npm install && npm start
```

Frontend: http://localhost:3000
Backend: http://localhost:5000

## 📊 Estructura de Estampas

**Total: 980 estampas**

- 00-08: Especiales iniciales (9)
- 09-19: Especiales finales (11)
- 001-960: Equipos (960) = 48 equipos × 20 estampas
  - Composición por equipo: 1 escudo + 1 foto grupal + 18 jugadores
- CC1-CC14: Coleccionistas (14)

**Categorías ABC:**
- A (Especial): Códigos 00-19 y CC1-CC14
- B (Grupal/Escudo): Escudos y fotos
- C (Jugador): Jugadores
