import requests
from flask import Blueprint, jsonify, request
from mqtt_service import get_latest_sensor_data
from datetime import datetime, timezone

ai_bp = Blueprint('ai_bp', __name__)

MODEL_URL = "http://localhost:5001/predict"


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

    return jsonify({
        "risk_level":       risk_level,
        "confidence_score": confidence,
        "analysis":         analysis,
        "recommendations":  recommendations,
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
