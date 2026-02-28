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


def _check_alerts(sensor: dict, crop_type: str, crop_stage: str) -> list:
    """
    Compare sensor readings against CROP_IDEAL_RANGES[crop_type].
    Returns list of alert dicts with metric, value, ideal range, severity, and message.
    """
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
    alerts = _check_alerts(sensor, crop_type, crop_stage)
    for alert in alerts:
        alert["suggestion"] = _gemini_suggestion(alert, crop_type, crop_stage)
    _save_alerts_to_db(alerts, crop_type, crop_stage)

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


def _save_alerts_to_db(alerts: list, crop_type: str, crop_stage: str):
    """Persist each alert to the crop_alerts table."""
    if not alerts:
        return
    try:
        conn = get_connection()
        cur  = conn.cursor()
        cur.executemany(
            """
            INSERT INTO crop_alerts
              (metric, value, ideal_min, ideal_max, severity, message, suggestion, crop_type, crop_stage)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            [
                (
                    a["metric"], a["value"], a["ideal_min"], a["ideal_max"],
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


@ai_bp.route('/api/alerts', methods=['GET'])
def get_alerts():
    """
    Return paginated alert history from crop_alerts.
    Query params:
        limit    – rows per page (default 50)
        offset   – starting row   (default 0)
        severity – optional filter: 'warning' or 'critical'
    """
    limit    = min(int(request.args.get("limit", 50)), 200)
    offset   = int(request.args.get("offset", 0))
    severity = request.args.get("severity", "").strip().lower()
    conn = None
    try:
        conn = get_connection()
        cur  = conn.cursor()

        if severity in ("warning", "critical"):
            cur.execute(
                """
                SELECT id, metric, value, ideal_min, ideal_max, severity,
                       message, suggestion, crop_type, crop_stage, created_at
                FROM crop_alerts
                WHERE LOWER(severity) = %s
                ORDER BY created_at DESC
                LIMIT %s OFFSET %s
                """,
                (severity, limit, offset),
            )
        else:
            cur.execute(
                """
                SELECT id, metric, value, ideal_min, ideal_max, severity,
                       message, suggestion, crop_type, crop_stage, created_at
                FROM crop_alerts
                ORDER BY created_at DESC
                LIMIT %s OFFSET %s
                """,
                (limit, offset),
            )
        rows = cur.fetchall()

        # total count respects severity filter
        if severity in ("warning", "critical"):
            cur.execute("SELECT COUNT(*) FROM crop_alerts WHERE LOWER(severity) = %s", (severity,))
        else:
            cur.execute("SELECT COUNT(*) FROM crop_alerts")
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
                "created_at": r[10].isoformat() if r[10] else None,
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


@ai_bp.route('/api/analytics/summary', methods=['GET'])
def get_analytics_summary():
    """Returns 24h overview: total alerts, health score, distribution."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        
        # 1. Total alerts last 24h
        cur.execute("SELECT COUNT(*) FROM crop_alerts WHERE created_at >= NOW() - INTERVAL 1 DAY")
        total_24h = cur.fetchone()[0]
        
        # 2. Distribution by metric
        cur.execute("""
            SELECT metric, COUNT(*) as count 
            FROM crop_alerts 
            WHERE created_at >= NOW() - INTERVAL 1 DAY 
            GROUP BY metric
        """)
        distribution = [{"metric": m, "count": c} for m, c in cur.fetchall()]
        
        # 3. Health Score (% of time NOT in alert state)
        # We estimate this by (1 - total_alerts / total_data_points)
        cur.execute("SELECT COUNT(*) FROM sensor_readings WHERE timestamp_utc >= NOW() - INTERVAL 1 DAY")
        total_points = cur.fetchone()[0] or 1  # avoid div by zero
        health_score = max(0, min(100, (1 - (total_24h / total_points)) * 100))
        
        cur.close()
        
        # Primary risk is the metric with max count
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
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        
        # We want hourly averages for the last 24 hours
        cur.execute("""
            SELECT 
                HOUR(timestamp_utc) as hr,
                AVG(CASE WHEN sensor_type = 'temperature' THEN value END) as temp,
                AVG(CASE WHEN sensor_type = 'humidity' THEN value END) as humidity,
                AVG(CASE WHEN sensor_type = 'co2' THEN value END) as co2
            FROM sensor_readings
            WHERE timestamp_utc >= NOW() - INTERVAL 1 DAY
            GROUP BY hr
            ORDER BY timestamp_utc ASC
        """)
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
