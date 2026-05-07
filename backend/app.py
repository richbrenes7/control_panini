import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from supabase import Client, create_client
from datetime import datetime

load_dotenv()

app = Flask(__name__)
CORS(app)

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://trmulthiyjshlxiqpebu.supabase.co").strip()
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "").strip()
supabase: Client | None = None

def get_supabase() -> Client:
    """Create the Supabase client lazily so Gunicorn can boot even if env vars are missing."""
    global supabase
    if supabase is None:
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise RuntimeError("SUPABASE_URL and SUPABASE_KEY must be configured")
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    return supabase

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

# ======================= RUTAS DE SALUD =======================
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "message": "Control Panini API"}), 200

# ======================= USUARIO =======================
@app.route('/api/users', methods=['POST'])
def create_user():
    """Crear nuevo usuario"""
    try:
        data = request.json
        user_data = {
            "name": data.get("name"),
            "email": data.get("email"),
            "created_at": datetime.now().isoformat()
        }
        
        response = get_supabase().table("users").insert(user_data).execute()
        return jsonify(response.data), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/users/<user_id>', methods=['GET'])
def get_user(user_id):
    """Obtener datos del usuario y resumen de colección"""
    try:
        user = get_supabase().table("users").select("*").eq("id", user_id).execute().data[0]
        
        # Obtener estadísticas
        stamps = get_supabase().table("stamps").select("*").eq("user_id", user_id).execute().data
        
        total_stamps = len(stamps)
        total_unique = len(set(s['stamp_code'] for s in stamps))
        
        stats = calculate_stats(stamps)
        
        return jsonify({
            "user": user,
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
        data = request.json
        stamp_data = {
            "user_id": data.get("user_id"),
            "stamp_code": data.get("stamp_code"),  # ej: "00", "001", "CC1"
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
        log_action(data.get("user_id"), "ADD", stamp_data["stamp_code"], data.get("quantity", 1))
        
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
        data = request.json
        user_id = data.get("user_id")
        stamp_id = data.get("stamp_id")
        
        get_supabase().table("stamps").delete().eq("id", stamp_id).eq("user_id", user_id).execute()
        
        log_action(user_id, "REMOVE", stamp_id, 1)
        
        return jsonify({"message": "Estampa eliminada"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/stamps/user/<user_id>', methods=['GET'])
def get_user_stamps(user_id):
    """Obtener todas las estampas del usuario"""
    try:
        stamps = get_supabase().table("stamps").select("*").eq("user_id", user_id).execute().data
        return jsonify(stamps), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/stamps/missing/<user_id>', methods=['GET'])
def get_missing_stamps(user_id):
    """Obtener estampas faltantes"""
    try:
        stamps = get_supabase().table("stamps").select("stamp_code").eq("user_id", user_id).execute().data
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
        stamps = get_supabase().table("stamps").select("*").eq("user_id", user_id).execute().data
        stats = calculate_stats(stamps)
        return jsonify(stats), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/history/<user_id>', methods=['GET'])
def get_history(user_id):
    """Obtener historial de cambios"""
    try:
        history = get_supabase().table("history").select("*").eq("user_id", user_id).order("created_at", desc=True).execute().data
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

if __name__ == '__main__':
    app.run(debug=True, port=int(os.getenv("PORT", 5000)))
