import os
import requests
from flask import Blueprint, jsonify, request
from mqtt_service import get_latest_sensor_data
from datetime import datetime, timezone, timedelta
from db_connect import get_connection

try:
    import google.generativeai as genai
    _GENAI_AVAILABLE = True
except ImportError:
    _GENAI_AVAILABLE = False

ai_bp = Blueprint('ai_bp', __name__)

MODEL_URL = "http://localhost:5001/predict"

# ── Crop ideal environmental ranges ─────────────────────────────────────────
CROP_IDEAL_RANGES = {
    "tomato":     {"temp": (20, 28), "humidity": (60, 80), "co2": (350, 800)},
    "capsicum":   {"temp": (22, 30), "humidity": (65, 80), "co2": (350, 800)},
    "cucumber":   {"temp": (22, 30), "humidity": (70, 85), "co2": (350, 900)},
    "lettuce":    {"temp": (15, 24), "humidity": (50, 70), "co2": (350, 700)},
    "strawberry": {"temp": (18, 26), "humidity": (60, 80), "co2": (350, 800)},
}

# ── Hardcoded fallback suggestions per metric ───────────────────────────────
_FALLBACK_SUGGESTIONS = {
    "temp_high":     "Activate cooling or increase ventilation to lower temperature.",
    "temp_low":      "Use a heater or reduce ventilation to raise temperature.",
    "humidity_high": "Increase airflow or run dehumidifier to reduce humidity.",
    "humidity_low":  "Mist plants or use a humidifier to raise humidity.",
    "co2_high":      "Open vents or add fans to dilute excess CO₂ buildup.",
    "co2_low":       "Seal greenhouse gaps; add CO₂ enrichment if available.",
}


def _check_alerts(sensor: dict, crop_type: str, crop_stage: str, ranges: dict = None) -> list:
    """
    Compare sensor readings against threshold ranges.
    `ranges` may be pre-fetched from DB; falls back to CROP_IDEAL_RANGES if absent.
    """
    if ranges is None:
        ranges = CROP_IDEAL_RANGES.get(crop_type, CROP_IDEAL_RANGES["lettuce"])
    alerts = []

    checks = [
        ("temp",     float(sensor.get("temp", 0)),     "°C",  "temperature"),
        ("humidity", float(sensor.get("humidity", 0)), "%",   "humidity"),
        ("co2",      float(sensor.get("co2", 0)),      " ppm", "CO₂"),
    ]

    for key, value, unit, label in checks:
        lo, hi = ranges[key]
        if value < lo:
            span = hi - lo
            severity = "critical" if (lo - value) > 0.25 * span else "warning"
            alerts.append({
                "metric":    key,
                "label":     label,
                "value":     value,
                "unit":      unit,
                "ideal_min": lo,
                "ideal_max": hi,
                "direction": "low",
                "severity":  severity,
                "message":   f"{label} {value:.1f}{unit} below ideal ({lo}–{hi}{unit})",
            })
        elif value > hi:
            span = hi - lo
            severity = "critical" if (value - hi) > 0.25 * span else "warning"
            alerts.append({
                "metric":    key,
                "label":     label,
                "value":     value,
                "unit":      unit,
                "ideal_min": lo,
                "ideal_max": hi,
                "direction": "high",
                "severity":  severity,
                "message":   f"{label} {value:.1f}{unit} above ideal ({lo}–{hi}{unit})",
            })

    return alerts


def _gemini_suggestion(alert: dict, crop_type: str, crop_stage: str) -> str:
    """
    Call Gemini API server-side to get a one-line actionable fix.
    Falls back to a hardcoded suggestion if key is absent or call fails.
    """
    fallback_key = f"{alert['metric']}_{alert['direction']}"
    fallback = _FALLBACK_SUGGESTIONS.get(fallback_key, "Check and adjust environmental controls.")

    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key or not _GENAI_AVAILABLE:
        return fallback

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.0-flash")
        prompt = (
            f"My {crop_type} crop (stage: {crop_stage}) has {alert['label']} reading "
            f"of {alert['value']:.1f}{alert['unit']} "
            f"(ideal: {alert['ideal_min']}–{alert['ideal_max']}{alert['unit']}). "
            "Give one short actionable fix in under 20 words."
        )
        response = model.generate_content(prompt)
        text = response.text.strip()
        # Cap at 120 chars to ensure it fits in the toast
        return text[:120] if text else fallback
    except Exception as exc:
        print(f"[AI] Gemini suggestion failed: {exc}")
        return fallback


def _status_to_risk_level(status: str) -> str:
    """Map model status labels → frontend display names."""
    return {"optimal": "Low", "warning": "Moderate", "critical": "High"}.get(
        status.lower(), status.capitalize()
    )


def _call_model(temp: float, humidity: float, co2: float,
                crop_type: str, crop_stage: str) -> dict | None:
    """
    POST to the Random-Forest model server (port 5001).

    Payload  → { temperature, humidity, co2, crop_type, crop_stage }
    Response ← { risk_score: 0-1, status: Optimal|Warning|Critical }
    """
    try:
        payload = {
            "temperature": temp,
            "humidity":    humidity,
            "co2":         co2,
            "crop_type":   crop_type,
            "crop_stage":  crop_stage,
        }
        resp = requests.post(MODEL_URL, json=payload, timeout=5)
        resp.raise_for_status()
        return resp.json()
    except Exception as exc:
        print(f"[AI] Model call failed: {exc}")
        return None


def _rule_based(co2: float, temp: float, humidity: float) -> tuple:
    """Fallback rule-based assessment when model is unreachable."""
    if co2 > 1500 or temp > 35 or humidity > 85:
        return (
            "High", 92,
            f"Critical conditions — CO₂ {co2:.0f} ppm, temp {temp:.1f}°C, humidity {humidity:.0f}%. Immediate action required.",
            ["Increase ventilation immediately", "Activate cooling system", "Check irrigation/drainage"],
        )
    elif co2 > 1000 or temp > 30 or humidity > 75:
        return (
            "Moderate", 84,
            f"Elevated readings — CO₂ {co2:.0f} ppm, temp {temp:.1f}°C, humidity {humidity:.0f}%. Monitor and adjust.",
            ["Increase airflow by 15%", "Review irrigation schedules", "Check sensor calibration"],
        )
    else:
        return (
            "Low", 96,
            f"Optimal — CO₂ {co2:.0f} ppm, temp {temp:.1f}°C, humidity {humidity:.0f}%. All readings in safe range.",
            ["Continue current schedule", "Routine visual inspection next week"],
        )


def _recs_for(risk_level: str, crop_type: str) -> list:
    """Action recommendations tailored to risk level."""
    if risk_level == "High":
        return [
            f"Immediately check ventilation for your {crop_type} crop",
            "Reduce CO₂ buildup — open vents or activate fans",
            "Monitor leaf temperature and adjust cooling",
        ]
    elif risk_level == "Moderate":
        return [
            f"Increase airflow around {crop_type} plants",
            "Review irrigation schedule to stabilise humidity",
            "Inspect soil moisture and sensor calibration",
        ]
    else:
        return [
            f"{crop_type.capitalize()} conditions are optimal — maintain current schedule",
            "Routine visual inspection recommended next week",
        ]


@ai_bp.route('/api/ai/predict', methods=['GET'])
def predict_risk():
    """
    Returns AI risk prediction for live MQTT sensor values.

    Query params (optional):
        crop_type  – e.g. lettuce, tomato, capsicum, cucumber, strawberry  (default: lettuce)
        crop_stage – e.g. vegetative, flowering, fruiting                  (default: vegetative)
    """
    # Crop context from frontend query params
    crop_type  = request.args.get("crop_type",  "lettuce").lower().strip()
    crop_stage = request.args.get("crop_stage", "vegetative").lower().strip()
    user_id    = request.args.get("user_id", 1)

    sensor = get_latest_sensor_data()

    # No MQTT data yet
    if not sensor or not all(k in sensor for k in ("co2", "temp", "humidity")):
        return jsonify({
            "risk_level":       "Unknown",
            "confidence_score": 0,
            "analysis":         "Waiting for live sensor data from MQTT. Ensure sensors are powered on.",
            "recommendations":  ["Check that the MQTT broker is reachable and sensors are publishing."],
            "sensor_snapshot":  sensor,
            "timestamp":        datetime.now(timezone.utc).isoformat(),
            "source":           "no-data",
        }), 200

    co2      = float(sensor["co2"])
    temp     = float(sensor["temp"])
    humidity = float(sensor["humidity"])

    # ── Try ML model first ──────────────────────────────────────────────────
    model_result = _call_model(temp, humidity, co2, crop_type, crop_stage)

    if model_result and "status" in model_result:
        risk_score = float(model_result.get("risk_score", 0))
        risk_level = _status_to_risk_level(model_result["status"])
        confidence = round(risk_score * 100, 1)
        analysis   = (
            f"ML model ({crop_type} · {crop_stage}): {model_result['status']} — "
            f"risk score {confidence}%. CO₂ {co2:.0f} ppm, temp {temp:.1f}°C, humidity {humidity:.0f}%."
        )
        recommendations = _recs_for(risk_level, crop_type)
        source = "ml-model"
    else:
        # ── Rule-based fallback ─────────────────────────────────────────────
        risk_level, confidence, analysis, recommendations = _rule_based(co2, temp, humidity)
        source = "rule-based-fallback"

    # ── Alert engine ─────────────────────────────────────────────────────────
    # Try to fetch thresholds from DB for this user & crop
    db_ranges = _fetch_crop_thresholds_from_db(user_id, crop_type)
    alerts = _check_alerts(sensor, crop_type, crop_stage, ranges=db_ranges)
    for alert in alerts:
        alert["suggestion"] = _gemini_suggestion(alert, crop_type, crop_stage)
    _save_alerts_to_db(alerts, crop_type, crop_stage, user_id)

    return jsonify({
        "risk_level":       risk_level,
        "confidence_score": confidence,
        "analysis":         analysis,
        "recommendations":  recommendations,
        "alerts":           alerts,
        "sensor_snapshot": {
            "co2":       co2,
            "temp":      temp,
            "humidity":  humidity,
            "timestamp": sensor.get("timestamp"),
        },
        "crop_type":  crop_type,
        "crop_stage": crop_stage,
        "timestamp":  datetime.now(timezone.utc).isoformat(),
        "source":     source,
    }), 200


def _save_alerts_to_db(alerts: list, crop_type: str, crop_stage: str, user_id):
    """Persist each alert to the crop_alerts table."""
    if not alerts:
        return
    try:
        conn = get_connection()
        cur  = conn.cursor()
        cur.executemany(
            """
            INSERT INTO crop_alerts
              (user_id, metric, value, ideal_min, ideal_max, severity, message, suggestion, crop_type, crop_stage)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            [
                (
                    user_id, a["metric"], a["value"], a["ideal_min"], a["ideal_max"],
                    a["severity"], a["message"], a.get("suggestion", ""),
                    crop_type, crop_stage,
                )
                for a in alerts
            ],
        )
        conn.commit()
        cur.close()
        conn.close()
    except Exception as exc:
        print(f"[AI] Failed to save alerts to DB: {exc}")


def _fetch_crop_thresholds_from_db(user_id, crop_name: str) -> dict | None:
    """
    Look up crop_thresholds by crop_name.
    crop_thresholds table: (id, crop_name, temp_min, temp_max, humidity_min, humidity_max, co2_min, co2_max, ...)
    Returns a dict { 'temp': (min, max), 'humidity': (min, max), 'co2': (min, max) }
    or None if not found (caller falls back to CROP_IDEAL_RANGES).
    """
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(
            """
            SELECT temp_min, temp_max,
                   humidity_min, humidity_max,
                   co2_min, co2_max
            FROM crop_thresholds
            WHERE LOWER(crop_name) = LOWER(%s)
            LIMIT 1
            """,
            (crop_name,)
        )
        row = cur.fetchone()
        cur.close()
        if row:
            return {
                "temp":     (float(row[0]), float(row[1])),
                "humidity": (float(row[2]), float(row[3])),
                "co2":      (float(row[4]), float(row[5])),
            }
    except Exception as exc:
        print(f"[AI] DB threshold lookup failed: {exc}")
    finally:
        if conn:
            conn.close()
    return None


@ai_bp.route('/api/user/crops', methods=['GET'])
def get_user_crops():
    """Return active crops for the given user_id."""
    from flask import session as flask_session
    user_id = request.args.get('user_id') or flask_session.get('user_id')
    if not user_id:
        return jsonify([]), 200
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(
            "SELECT id, name FROM crops WHERE user_id = %s AND status = 'active' ORDER BY name",
            (user_id,)
        )
        rows = cur.fetchall()
        cur.close()
        return jsonify([{"id": r[0], "name": r[1]} for r in rows]), 200
    except Exception as exc:
        print(f"[AI] get_user_crops failed: {exc}")
        return jsonify([]), 200
    finally:
        if conn:
            conn.close()


@ai_bp.route('/api/alerts', methods=['GET'])
def get_alerts():
    """
    Return paginated alert history from crop_alerts.
    Query params:
        limit    – rows per page (default 50)
        offset   – starting row   (default 0)
        severity – optional filter: 'warning' or 'critical'
        user_id  - optional filter by user
    """
    limit    = min(int(request.args.get("limit", 50)), 200)
    offset   = int(request.args.get("offset", 0))
    severity = request.args.get("severity", "").strip().lower()
    user_id  = request.args.get("user_id")
    
    conn = None
    try:
        conn = get_connection()
        cur  = conn.cursor()

        query = """
            SELECT id, metric, value, ideal_min, ideal_max, severity,
                   message, suggestion, crop_type, crop_stage, created_at
            FROM crop_alerts
            WHERE 1=1
        """
        count_query = "SELECT COUNT(*) FROM crop_alerts WHERE 1=1"
        params = []

        if severity in ("warning", "critical"):
            query += " AND LOWER(severity) = %s"
            count_query += " AND LOWER(severity) = %s"
            params.append(severity)
            
        if user_id:
            query += " AND user_id = %s"
            count_query += " AND user_id = %s"
            params.append(user_id)
            
        query += " ORDER BY created_at DESC LIMIT %s OFFSET %s"
        
        cur.execute(query, tuple(params + [limit, offset]))
        rows = cur.fetchall()

        cur.execute(count_query, tuple(params))
        total = cur.fetchone()[0]
        cur.close()

        alerts = [
            {
                "id":         r[0],
                "metric":     r[1],
                "value":      r[2],
                "ideal_min":  r[3],
                "ideal_max":  r[4],
                "severity":   r[5],
                "message":    r[6],
                "suggestion": r[7],
                "crop_type":  r[8],
                "crop_stage": r[9],
                "created_at": r[10].isoformat() + 'Z' if r[10] else None,
            }
            for r in rows
        ]
        return jsonify({"alerts": alerts, "total": total, "limit": limit, "offset": offset}), 200
    except Exception as exc:
        print(f"[AI] Failed to fetch alerts: {exc}")
        return jsonify({"message": "Database error"}), 500
    finally:
        if conn:
            conn.close()


@ai_bp.route('/api/admin/alerts', methods=['GET'])
def get_admin_alerts():
    """
    Return all alerts from crop_alerts joined with users table.
    For admin view — no user_id filter, shows every user's alerts.
    Returns a flat list (not paginated) ordered by created_at DESC.
    Optional query param:
        limit – max rows (default 200)
    """
    limit = min(int(request.args.get("limit", 200)), 500)
    conn = None
    try:
        conn = get_connection()
        cur  = conn.cursor()
        cur.execute(
            """
            SELECT ca.id, ca.user_id, ca.metric, ca.value,
                   ca.ideal_min, ca.ideal_max, ca.severity,
                   ca.message, ca.suggestion, ca.crop_type, ca.crop_stage, ca.created_at,
                   u.email AS user_email
            FROM crop_alerts ca
            LEFT JOIN users u ON u.id = ca.user_id
            ORDER BY ca.created_at DESC
            LIMIT %s
            """,
            (limit,)
        )
        rows = cur.fetchall()
        cur.close()
        alerts = [
            {
                "id":         r[0],
                "user_id":    r[1],
                "metric":     r[2],
                "value":      float(r[3]) if r[3] is not None else None,
                "ideal_min":  float(r[4]) if r[4] is not None else None,
                "ideal_max":  float(r[5]) if r[5] is not None else None,
                "severity":   r[6],
                "message":    r[7],
                "suggestion": r[8],
                "crop_type":  r[9],
                "crop_stage": r[10],
                "created_at": r[11].isoformat() + 'Z' if r[11] else None,
                "user_email": r[12],
                "user_name":  r[12],  # use email as display name
            }
            for r in rows
        ]
        return jsonify(alerts), 200
    except Exception as exc:
        print(f"[AI] Failed to fetch admin alerts: {exc}")
        return jsonify({"message": "Database error"}), 500
    finally:
        if conn:
            conn.close()

@ai_bp.route('/api/analytics/summary', methods=['GET'])
def get_analytics_summary():
    """Returns 24h overview: total alerts, health score, distribution."""
    from flask import session as flask_session
    user_id = request.args.get('user_id') or flask_session.get('user_id') or 1

    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        
        # 1. Total alerts last 24h for this user
        cur.execute(
            "SELECT COUNT(*) FROM crop_alerts WHERE user_id = %s AND created_at >= NOW() - INTERVAL 1 DAY",
            (user_id,)
        )
        total_24h = cur.fetchone()[0]
        
        # 2. Distribution by metric for this user
        cur.execute("""
            SELECT metric, COUNT(*) as count 
            FROM crop_alerts 
            WHERE user_id = %s AND created_at >= NOW() - INTERVAL 1 DAY 
            GROUP BY metric
        """, (user_id,))
        distribution = [{"metric": m, "count": c} for m, c in cur.fetchall()]
        
        # 3. Health Score — based on this user's readings
        cur.execute(
            "SELECT COUNT(*) FROM sensor_readings WHERE user_id = %s AND timestamp_utc >= NOW() - INTERVAL 1 DAY",
            (user_id,)
        )
        total_points = cur.fetchone()[0] or 1
        health_score = max(0, min(100, (1 - (total_24h / total_points)) * 100))
        
        cur.close()
        
        primary_risk = "None"
        if distribution:
            primary_risk = max(distribution, key=lambda x: x["count"])["metric"]

        return jsonify({
            "total_alerts_24h": total_24h,
            "distribution": distribution,
            "health_score": round(health_score, 1),
            "primary_risk": primary_risk.capitalize()
        }), 200
    except Exception as exc:
        print(f"[AI] Analytics Error: {exc}")
        return jsonify({"message": "Analytics error"}), 500
    finally:
        if conn:
            conn.close()


@ai_bp.route('/api/analytics/trends', methods=['GET'])
def get_analytics_trends():
    """Returns hourly averages for the last 24h for CO2, Temp, Humidity."""
    from flask import session as flask_session
    user_id = request.args.get('user_id') or flask_session.get('user_id') or 1

    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT 
                HOUR(timestamp_utc) as hr,
                AVG(CASE WHEN sensor_type = 'temperature' THEN value END) as temp,
                AVG(CASE WHEN sensor_type = 'humidity' THEN value END) as humidity,
                AVG(CASE WHEN sensor_type = 'co2' THEN value END) as co2
            FROM sensor_readings
            WHERE user_id = %s AND timestamp_utc >= NOW() - INTERVAL 1 DAY
            GROUP BY hr
            ORDER BY hr ASC
        """, (user_id,))
        rows = cur.fetchall()
        
        trends = []
        for r in rows:
            trends.append({
                "hour": f"{r[0]:02}:00",
                "temp": round(float(r[1] or 0), 1),
                "humidity": round(float(r[2] or 0), 1),
                "co2": round(float(r[3] or 0), 1)
            })
            
        cur.close()
        return jsonify(trends), 200
    except Exception as exc:
        print(f"[AI] Trends Error: {exc}")
        return jsonify({"message": "Trends error"}), 500
    finally:
        if conn:
            conn.close()
