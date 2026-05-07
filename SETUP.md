# 🚀 Setup Rápido - Control Panini

## Setup Local en 3 pasos

### Opción 1: Con Docker (Recomendado)

```bash
# 1. Clonar repo
git clone https://github.com/richbrenes7/control_panini.git
cd control_panini

# 2. Levantar servicios
docker-compose up

# 3. Acceder
Frontend: http://localhost:3000
Backend:  http://localhost:5000/api/health
```

### Opción 2: Sin Docker

#### Backend (Terminal 1)
```bash
cd backend
pip install -r requirements.txt
python app.py
```

#### Frontend (Terminal 2)
```bash
cd frontend
npm install
npm start
```

## 🧪 Probar la aplicación

1. Abre http://localhost:3000
2. Crea un usuario (nombre + email)
3. Agrega estampas:
   - Código: `00` (especial inicial)
   - Tipo: `special`
   - Cantidad: `1`
4. Verifica el dashboard con el progreso

## 📡 Variables de Entorno

### Backend - crear `/backend/.env`
```
FLASK_ENV=development
SUPABASE_URL=https://trmulthiyjshlxiqpebu.supabase.co
SUPABASE_KEY=sb_publishable_HfCcv97LN_44odIcm6mS1g_2m5_2z3e
```

### Frontend - ya tiene `/frontend/.env.local`
```
REACT_APP_API_URL=http://localhost:5000/api
```

## 🔄 Verificar que todo funciona

### Backend Health Check
```bash
curl http://localhost:5000/api/health
# Respuesta esperada: {"status":"ok","message":"Control Panini API"}
```

### Frontend
```bash
# Debe abrir sin errores en:
http://localhost:3000
```

## 🛠️ Comandos útiles

### Backend
```bash
cd backend

# Instalar dependencias
pip install -r requirements.txt

# Correr en modo desarrollo
python app.py

# Correr con gunicorn (producción)
gunicorn --bind 0.0.0.0:5000 app:app
```

### Frontend
```bash
cd frontend

# Instalar dependencias
npm install

# Desarrollo
npm start

# Build para producción
npm run build

# Ejecutar tests
npm test
```

### Docker
```bash
# Levantar todo
docker-compose up

# Levantar en background
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener todo
docker-compose down

# Rebuild images
docker-compose up --build
```

## 📝 Estructura del Proyecto

```
control_panini/
├── backend/                 # API Python + Flask
│   ├── app.py              # Aplicación principal
│   ├── requirements.txt     # Dependencias Python
│   ├── Dockerfile          # Configuración Docker
│   ├── Procfile            # Para Render
│   ├── render.yaml         # Configuración Render
│   └── .env.example        # Variables de ejemplo
│
├── frontend/               # React App
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.js
│   ├── public/
│   ├── package.json
│   ├── Dockerfile
│   ├── netlify.toml        # Configuración Netlify
│   ├── .env.local          # Variables locales
│   └── .env.production     # Variables producción
│
├── docker-compose.yml      # Orquestación servicios
├── README.md               # Info del proyecto
└── DEPLOYMENT.md           # Guía de despliegue
```

## 🆘 Problemas Comunes

### Docker: "Port already in use"
```bash
# Encontrar qué proceso usa el puerto
lsof -i :5000          # Backend
lsof -i :3000          # Frontend

# O cambiar puerto en docker-compose.yml
```

### npm install no funciona
```bash
# Limpiar cache
npm cache clean --force

# Reinstalar node_modules
rm -rf node_modules package-lock.json
npm install
```

### Backend no se conecta a Supabase
```bash
# Verificar credenciales en .env
# Comprobar que URL y KEY son correctos
# Revisar que la BD existe en Supabase
```

### CORS error
```bash
# Backend debe estar corriendo
# Verificar que API_URL en frontend apunta a backend correcto
# En desarrollo: http://localhost:5000/api
```

## ✅ Checklist Pre-Producción

- [ ] Backend corre sin errores
- [ ] Frontend carga y se ve bien
- [ ] Puedo crear usuario
- [ ] Puedo agregar estampas
- [ ] Dashboard muestra estadísticas
- [ ] Historial registra cambios
- [ ] Supabase tiene datos

## 📚 Documentación Adicional

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Guía completa de despliegue
- [README.md](./README.md) - Información del proyecto
- Backend: Documentación en código dentro de `app.py`
- Frontend: Componentes documentados en `src/components/`

---

¿Preguntas? Abre un issue en GitHub.
