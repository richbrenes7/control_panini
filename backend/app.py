import os
import uuid
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from supabase import Client, create_client
from datetime import datetime
from functools import wraps
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from werkzeug.security import check_password_hash, generate_password_hash

load_dotenv()

app = Flask(__name__)
cors_origins = [
    origin.strip()
    for origin in os.getenv(
        "FLASK_CORS_ORIGINS",
        "https://control-paniniapp.netlify.app,https://control-panini.netlify.app,http://localhost:3000"
    ).split(",")
    if origin.strip()
]
CORS(app, resources={r"/*": {"origins": cors_origins}}, supports_credentials=False)

@app.after_request
def add_cors_headers(response):
    origin = request.headers.get("Origin")
    if origin in cors_origins:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Vary"] = "Origin"
        response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,PATCH,DELETE,OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    return response

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://trmulthiyjshlxiqpebu.supabase.co").strip()
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "").strip()
AUTH_SECRET_KEY = os.getenv("AUTH_SECRET_KEY", SUPABASE_KEY or "change-me-in-prod")
AUTH_TOKEN_MAX_AGE = int(os.getenv("AUTH_TOKEN_MAX_AGE", "604800"))
supabase: Client | None = None

def get_supabase() -> Client:
    """Create the Supabase client lazily so Gunicorn can boot even if env vars are missing."""
    global supabase
    if supabase is None:
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise RuntimeError("SUPABASE_URL and SUPABASE_KEY must be configured")
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    return supabase

def get_auth_serializer() -> URLSafeTimedSerializer:
    return URLSafeTimedSerializer(AUTH_SECRET_KEY, salt="control-panini-auth")

def create_access_token(user_id: str) -> str:
    return get_auth_serializer().dumps({"user_id": user_id})

def parse_access_token(token: str) -> str:
    payload = get_auth_serializer().loads(token, max_age=AUTH_TOKEN_MAX_AGE)
    return str(payload.get("user_id", "")).strip()

def require_auth(route_handler):
    @wraps(route_handler)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Token requerido"}), 401

        token = auth_header.split(" ", 1)[1].strip()
        if not token:
            return jsonify({"error": "Token inválido"}), 401

        try:
            user_id = parse_access_token(token)
        except (BadSignature, SignatureExpired):
            return jsonify({"error": "Sesión inválida o expirada"}), 401

        if not user_id:
            return jsonify({"error": "Sesión inválida"}), 401

        request.current_user_id = user_id
        return route_handler(*args, **kwargs)

    return wrapper

# Definición de categorías ABC
CATEGORIES = {
    "A": {
        "name": "Especial",
        "ranges": [(0, 8), (9, 19), (901, 914)]  # 00-08, 9-19, CC1-CC14
    },
    "B": {
        "name": "Grupal/Escudo",
        "ranges": []  # Se calcula por equipo
    },
    "C": {
        "name": "Jugador",
        "ranges": []  # Se calcula por equipo
    }
}

COUNTRY_PREFIXES = [
    "MEX", "RSA", "KOR", "CZE", "CAN", "BIH", "QAT", "SUI", "BRA", "MAR",
    "HAI", "SCO", "USA", "PAR", "AUS", "TUR", "GER", "CUW", "CIV", "ECU",
    "NED", "JPN", "SWE", "TUN", "BEL", "EGY", "IRN", "NZL", "ESP", "CPV",
    "KSA", "URU", "FRA", "SEN", "IRQ", "NOR", "ARG", "ALG", "AUT", "JOR",
    "POR", "COD", "UZB", "COL", "ENG", "CRO", "GHA", "PAN"
]

# ======================= RUTAS DE SALUD =======================
@app.route('/', methods=['GET'])
def root():
    return jsonify({"status": "ok", "message": "Control Panini API"}), 200

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "message": "Control Panini API"}), 200

# ======================= USUARIO =======================
@app.route('/api/users', methods=['POST'])
def create_user():
    """Crear nuevo usuario"""
    try:
        data = request.json or {}
        instagram = normalize_instagram(data.get("instagram", ""))
        email = str(data.get("email", "")).strip().lower()
        password = data.get("password", "")
        user_data = {
            "name": data.get("name"),
            "email": email,
            "instagram": instagram,
            "password_hash": generate_password_hash(password),
            "created_at": datetime.now().isoformat()
        }

        if not user_data["name"] or not user_data["instagram"] or not user_data["email"] or not password:
            return jsonify({"error": "Nombre, correo, Instagram y contraseña son requeridos"}), 400
        
        response = get_supabase().table("users").insert(user_data).execute()
        created_user = sanitize_user(response.data[0])
        token = create_access_token(created_user["id"])
        return jsonify({"user": created_user, "token": token}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Iniciar sesión con usuario de Instagram y contraseña"""
    try:
        data = request.json or {}
        instagram = normalize_instagram(data.get("instagram", ""))
        email = str(data.get("email", "")).strip().lower()
        password = data.get("password", "")

        if (not instagram and not email) or not password:
            return jsonify({"error": "Instagram/correo y contraseña son requeridos"}), 400

        users = []
        if instagram:
            users = get_supabase().table("users").select("*").eq("instagram", instagram).execute().data
        if not users and email:
            users = get_supabase().table("users").select("*").eq("email", email).execute().data
        if not users:
            return jsonify({"error": "Usuario o contraseña incorrectos"}), 401

        user = users[0]
        password_hash = user.get("password_hash")
        if not password_hash or not check_password_hash(password_hash, password):
            return jsonify({"error": "Usuario o contraseña incorrectos"}), 401

        clean_user = sanitize_user(user)
        token = create_access_token(clean_user["id"])
        return jsonify({"user": clean_user, "token": token}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/auth/reset-password', methods=['POST'])
def reset_password():
    """Restablecer contraseña validando correo + Instagram."""
    try:
        data = request.json or {}
        email = str(data.get("email", "")).strip().lower()
        instagram = normalize_instagram(data.get("instagram", ""))
        new_password = data.get("new_password", "")

        if not email or not instagram or not new_password:
            return jsonify({"error": "Correo, Instagram y nueva contraseña son requeridos"}), 400

        users = get_supabase().table("users").select("id").eq("email", email).eq("instagram", instagram).execute().data
        if not users:
            return jsonify({"error": "No existe un usuario con ese correo e Instagram"}), 404

        user_id = users[0]["id"]
        get_supabase().table("users").update({
            "password_hash": generate_password_hash(new_password),
            "updated_at": datetime.now().isoformat()
        }).eq("id", user_id).execute()

        return jsonify({"message": "Contraseña actualizada correctamente"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/auth/me', methods=['GET'])
@require_auth
def me():
    """Validar sesión y obtener usuario actual."""
    try:
        user_id = request.current_user_id
        users = get_supabase().table("users").select("*").eq("id", user_id).limit(1).execute().data
        if not users:
            return jsonify({"error": "Usuario no encontrado"}), 404
        return jsonify({"user": sanitize_user(users[0])}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/users/<user_id>', methods=['GET'])
def get_user(user_id):
    """Obtener datos del usuario y resumen de colección"""
    try:
        resolved_user_id = resolve_user_id(user_id)
        if not resolved_user_id:
            return jsonify({"error": "Usuario no encontrado"}), 404

        user = get_supabase().table("users").select("*").eq("id", resolved_user_id).execute().data[0]
        
        # Obtener estadísticas
        stamps = get_supabase().table("stamps").select("*").eq("user_id", resolved_user_id).execute().data
        
        total_stamps = len(stamps)
        total_unique = len(set(s['stamp_code'] for s in stamps))
        
        stats = calculate_stats(stamps)
        
        return jsonify({
            "user": sanitize_user(user),
            "total_collected": total_stamps,
            "unique_stamps": total_unique,
            "stats": stats
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# ======================= ESTAMPAS =======================
@app.route('/api/stamps/add', methods=['POST'])
def add_stamp():
    """Agregar estampa a la colección"""
    try:
        data = request.json or {}
        resolved_user_id = resolve_user_id(data.get("user_id"), create_if_missing=True)
        if not resolved_user_id:
            return jsonify({"error": "Usuario inválido"}), 400

        stamp_code = str(data.get("stamp_code", "")).upper().strip()
        stamp_data = {
            "user_id": resolved_user_id,
            "stamp_code": stamp_code,  # ej: "FWC", "MEX1", "CC1"
            "team_id": data.get("team_id"),  # ej: 1-48 (países)
            "type": data.get("type"),  # "shield", "group", "player"
            "quantity": data.get("quantity", 1),
            "date_added": datetime.now().isoformat(),
            "notes": data.get("notes", "")
        }
        
        # Validar código
        if not validate_stamp_code(stamp_data["stamp_code"]):
            return jsonify({"error": "Código de estampa inválido"}), 400
        
        response = get_supabase().table("stamps").insert(stamp_data).execute()
        
        # Registrar en historial
        log_action(resolved_user_id, "ADD", stamp_data["stamp_code"], data.get("quantity", 1))
        
        return jsonify({
            "message": "Estampa agregada",
            "data": response.data
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/stamps/remove', methods=['DELETE'])
def remove_stamp():
    """Eliminar estampa de la colección"""
    try:
        data = request.json or {}
        user_id = resolve_user_id(data.get("user_id"))
        stamp_id = data.get("stamp_id")

        if not user_id:
            return jsonify({"error": "Usuario inválido"}), 400
        
        get_supabase().table("stamps").delete().eq("id", stamp_id).eq("user_id", user_id).execute()
        
        log_action(user_id, "REMOVE", stamp_id, 1)
        
        return jsonify({"message": "Estampa eliminada"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# ======================= ESTAMPAS REPETIDAS =======================
@app.route('/api/repeated/user/<user_id>', methods=['GET'])
def get_user_repeated_stamps(user_id):
    """Obtener estampas repetidas del usuario"""
    try:
        resolved_user_id = resolve_user_id(user_id)
        if not resolved_user_id:
            return jsonify([]), 200

        repeated = get_supabase().table("repeated_stamps").select("*").eq("user_id", resolved_user_id).order("stamp_code").execute().data
        return jsonify(repeated), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/repeated/add', methods=['POST'])
def add_repeated_stamp():
    """Agregar o actualizar una estampa repetida"""
    try:
        data = request.json or {}
        user_id = resolve_user_id(data.get("user_id"), create_if_missing=True)
        stamp_code = str(data.get("stamp_code", "")).upper().strip()
        quantity = int(data.get("quantity", 1))
        notes = data.get("notes", "")

        if not user_id or not validate_stamp_code(stamp_code):
            return jsonify({"error": "Datos de estampa repetida inválidos"}), 400

        existing = get_supabase().table("repeated_stamps").select("*").eq("user_id", user_id).eq("stamp_code", stamp_code).execute().data

        if existing:
            repeated_id = existing[0]["id"]
            response = get_supabase().table("repeated_stamps").update({
                "quantity": quantity,
                "notes": notes,
                "updated_at": datetime.now().isoformat()
            }).eq("id", repeated_id).execute()
        else:
            response = get_supabase().table("repeated_stamps").insert({
                "user_id": user_id,
                "stamp_code": stamp_code,
                "quantity": quantity,
                "notes": notes,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }).execute()

        log_action(user_id, "REPEATED", stamp_code, quantity)
        return jsonify({"message": "Estampa repetida guardada", "data": response.data}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/repeated/<repeated_id>', methods=['DELETE'])
def remove_repeated_stamp(repeated_id):
    """Eliminar una estampa repetida"""
    try:
        data = request.json or {}
        user_id = data.get("user_id")
        query = get_supabase().table("repeated_stamps").delete().eq("id", repeated_id)
        if user_id:
            resolved_user_id = resolve_user_id(user_id)
            if not resolved_user_id:
                return jsonify({"error": "Usuario inválido"}), 400
            query = query.eq("user_id", resolved_user_id)
        query.execute()
        return jsonify({"message": "Estampa repetida eliminada"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/repeated/matches/<user_id>', methods=['GET'])
def get_exchange_matches(user_id):
    """Encontrar usuarios con intercambios mutuamente útiles"""
    try:
        resolved_user_id = resolve_user_id(user_id)
        if not resolved_user_id:
            return jsonify([]), 200

        db = get_supabase()
        users = db.table("users").select("id,name,instagram").neq("id", resolved_user_id).execute().data
        my_collection = db.table("stamps").select("stamp_code").eq("user_id", resolved_user_id).execute().data
        my_repeated = db.table("repeated_stamps").select("stamp_code,quantity").eq("user_id", resolved_user_id).execute().data
        all_repeated = db.table("repeated_stamps").select("user_id,stamp_code,quantity").neq("user_id", resolved_user_id).execute().data
        all_stamps = db.table("stamps").select("user_id,stamp_code").neq("user_id", resolved_user_id).execute().data

        my_collection_codes = {stamp["stamp_code"] for stamp in my_collection}
        my_repeated_codes = {stamp["stamp_code"] for stamp in my_repeated}
        users_by_id = {user["id"]: user for user in users}
        other_collections = {}
        other_repeated = {}

        for stamp in all_stamps:
            other_collections.setdefault(stamp["user_id"], set()).add(stamp["stamp_code"])

        for stamp in all_repeated:
            other_repeated.setdefault(stamp["user_id"], []).append(stamp)

        matches = []
        for other_user_id, repeated_stamps in other_repeated.items():
            user = users_by_id.get(other_user_id)
            if not user:
                continue

            other_collection_codes = other_collections.get(other_user_id, set())
            can_receive = [
                stamp for stamp in repeated_stamps
                if stamp["stamp_code"] not in my_collection_codes
            ]
            can_give = [
                stamp for stamp in my_repeated
                if stamp["stamp_code"] in my_repeated_codes and stamp["stamp_code"] not in other_collection_codes
            ]

            if can_receive and can_give:
                matches.append({
                    "user": user,
                    "you_can_give": can_give,
                    "you_can_receive": can_receive
                })

        return jsonify(matches), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/stamps/user/<user_id>', methods=['GET'])
def get_user_stamps(user_id):
    """Obtener todas las estampas del usuario"""
    try:
        resolved_user_id = resolve_user_id(user_id)
        if not resolved_user_id:
            return jsonify([]), 200

        stamps = get_supabase().table("stamps").select("*").eq("user_id", resolved_user_id).execute().data
        return jsonify(stamps), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/stamps/missing/<user_id>', methods=['GET'])
def get_missing_stamps(user_id):
    """Obtener estampas faltantes"""
    try:
        resolved_user_id = resolve_user_id(user_id)
        if not resolved_user_id:
            all_codes = generate_all_stamp_codes()
            return jsonify({
                "missing_count": len(all_codes),
                "missing_stamps": all_codes,
                "completion_percent": 0
            }), 200

        stamps = get_supabase().table("stamps").select("stamp_code").eq("user_id", resolved_user_id).execute().data
        collected_codes = set(s['stamp_code'] for s in stamps)
        
        all_codes = generate_all_stamp_codes()
        missing = [code for code in all_codes if code not in collected_codes]
        
        return jsonify({
            "missing_count": len(missing),
            "missing_stamps": missing,
            "completion_percent": (len(collected_codes) / len(all_codes)) * 100
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# ======================= ANÁLISIS =======================
@app.route('/api/stats/<user_id>', methods=['GET'])
def get_stats(user_id):
    """Obtener estadísticas completas"""
    try:
        resolved_user_id = resolve_user_id(user_id)
        if not resolved_user_id:
            return jsonify(calculate_stats([])), 200

        stamps = get_supabase().table("stamps").select("*").eq("user_id", resolved_user_id).execute().data
        stats = calculate_stats(stamps)
        return jsonify(stats), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/history/<user_id>', methods=['GET'])
def get_history(user_id):
    """Obtener historial de cambios"""
    try:
        resolved_user_id = resolve_user_id(user_id)
        if not resolved_user_id:
            return jsonify([]), 200

        history = get_supabase().table("history").select("*").eq("user_id", resolved_user_id).order("created_at", desc=True).execute().data
        return jsonify(history), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# ======================= FUNCIONES AUXILIARES =======================
def validate_stamp_code(code):
    """Validar que el código de estampa sea válido"""
    try:
        # Especiales iniciales: 00-08
        if code.startswith("0") and int(code) <= 8:
            return True
        # Especiales finales: 9-19
        if code.startswith("0") and 9 <= int(code) <= 19:
            return True
        # Coleccionistas: CC1-CC14
        if code.startswith("CC"):
            cc_num = int(code[2:])
            if 1 <= cc_num <= 14:
                return True
        # Equipos: 001-960 (48 equipos * 20 estampas)
        stamp_num = int(code)
        if 1 <= stamp_num <= 960:
            return True
        return False
    except:
        return False

def normalize_instagram(instagram):
    """Normalizar usuario de Instagram sin @ inicial."""
    return str(instagram).strip().lstrip("@").lower()

def is_uuid_value(value):
    """Validar si el valor tiene formato UUID."""
    try:
        uuid.UUID(str(value))
        return True
    except Exception:
        return False

def resolve_user_id(identifier, create_if_missing=False):
    """Resolver un identificador (UUID o Instagram) al UUID real del usuario."""
    if identifier is None:
        return None

    raw_identifier = str(identifier).strip()
    if not raw_identifier:
        return None

    db = get_supabase()

    if is_uuid_value(raw_identifier):
        return raw_identifier

    instagram = normalize_instagram(raw_identifier)
    users = db.table("users").select("id").eq("instagram", instagram).limit(1).execute().data
    if users:
        return users[0]["id"]

    if not create_if_missing:
        return None

    created = db.table("users").insert({
        "name": instagram,
        "instagram": instagram,
        "created_at": datetime.now().isoformat()
    }).execute().data
    if created:
        return created[0]["id"]

    return None

def sanitize_user(user):
    """Remover datos sensibles antes de responder al frontend."""
    clean_user = dict(user)
    clean_user.pop("password_hash", None)
    return clean_user

def generate_all_stamp_codes():
    """Generar lista de todos los códigos de estampas válidos"""
    codes = []
    # Especiales iniciales
    codes.extend([f"{i:02d}" for i in range(9)])
    # Equipos
    codes.extend([f"{i:03d}" for i in range(1, 961)])
    # Especiales finales
    codes.extend([f"{i:02d}" for i in range(9, 20)])
    # Coleccionistas
    codes.extend([f"CC{i}" for i in range(1, 15)])
    return codes

def calculate_stats(stamps):
    """Calcular estadísticas de la colección"""
    if not stamps:
        return {
            "total_collected": 0,
            "unique_stamps": 0,
            "completion_percent": 0,
            "by_category": {"A": 0, "B": 0, "C": 0},
            "by_type": {"special": 0, "shield": 0, "group": 0, "player": 0}
        }
    
    total = len(stamps)
    unique = len(set(s['stamp_code'] for s in stamps))
    all_codes = generate_all_stamp_codes()
    completion = (unique / len(all_codes)) * 100
    
    # Contar por categoría ABC
    by_category = {"A": 0, "B": 0, "C": 0}
    by_type = {"special": 0, "shield": 0, "group": 0, "player": 0}
    
    for stamp in stamps:
        code = stamp['stamp_code']
        stamp_type = stamp.get('type', 'unknown')
        
        # Categorizar
        if is_special(code):
            by_category["A"] += 1
        elif stamp_type in ["shield", "group"]:
            by_category["B"] += 1
        else:
            by_category["C"] += 1
        
        by_type[stamp_type] = by_type.get(stamp_type, 0) + 1
    
    return {
        "total_collected": total,
        "unique_stamps": unique,
        "completion_percent": round(completion, 2),
        "missing_count": len(all_codes) - unique,
        "by_category": by_category,
        "by_type": by_type
    }

def is_special(code):
    """Determinar si una estampa es especial (categoría A)"""
    try:
        if code.startswith("CC"):
            return True
        num = int(code)
        return num <= 19
    except:
        return False

def log_action(user_id, action, stamp_code, quantity):
    """Registrar acción en historial"""
    try:
        log_data = {
            "user_id": user_id,
            "action": action,
            "stamp_code": stamp_code,
            "quantity": quantity,
            "created_at": datetime.now().isoformat()
        }
        get_supabase().table("history").insert(log_data).execute()
    except Exception as e:
        print(f"Error al registrar historial: {e}")

def validate_stamp_code(code):
    """Validar codigos de la planilla Mundial 2026."""
    try:
        normalized_code = str(code).upper().strip()

        if normalized_code in ["FWC", "00"]:
            return True

        if normalized_code.startswith("FWC"):
            fwc_num = int(normalized_code[3:])
            return 1 <= fwc_num <= 19

        if normalized_code.startswith("CC"):
            cc_num = int(normalized_code[2:])
            return 1 <= cc_num <= 14

        for prefix in COUNTRY_PREFIXES:
            if normalized_code.startswith(prefix):
                stamp_num = int(normalized_code[len(prefix):])
                return 1 <= stamp_num <= 20

        stamp_num = int(normalized_code)
        return 1 <= stamp_num <= 960
    except:
        return False

def generate_all_stamp_codes():
    """Generar codigos de la planilla usada por la app."""
    codes = ["FWC", "00"]
    codes.extend([f"FWC{i}" for i in range(1, 20)])
    for prefix in COUNTRY_PREFIXES:
        codes.extend([f"{prefix}{i}" for i in range(1, 21)])
    codes.extend([f"CC{i}" for i in range(1, 15)])
    return codes

def is_special(code):
    """Determinar si una estampa es especial."""
    try:
        normalized_code = str(code).upper().strip()
        return (
            normalized_code in ["FWC", "00"] or
            normalized_code.startswith("FWC") or
            normalized_code.startswith("CC")
        )
    except:
        return False

if __name__ == '__main__':
    app.run(debug=True, port=int(os.getenv("PORT", 5000)))
