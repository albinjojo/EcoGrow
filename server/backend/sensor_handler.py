import re
import traceback
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, session
from db_connect import get_connection

sensor_bp = Blueprint("sensor_bp", __name__)

# Regex pattern for "CO2: <ppm>, T: <°C>, H: <%>"
# Handles potential extra spaces.
SENSOR_DATA_PATTERN = re.compile(r"CO2:\s*([\d.]+),\s*T:\s*([\d.]+),\s*H:\s*([\d.]+)", re.IGNORECASE)

@sensor_bp.post("/api/sensors/ingest")
def ingest_sensor_data():
    """
    Parses and ingests sensor data string.
    Expected format: "CO2: <ppm>, T: <°C>, H: <%>"
    """
    # 1. Authentication Check
    user_id = session.get("user_id")
    if not user_id:
        print("[SensorHandler] Unauthorized access attempt (No Session)")
        return jsonify({"message": "Unauthorized"}), 401

    # 2. Input Parsing
    data = request.get_json(silent=True) or {}
    
    # Check for structured JSON (e.g. from Frontend Relay)
    # Expected keys: 'co2', 'temp'/'temperature', 'humidity'/'hum'
    if 'co2' in data and ('temp' in data or 'temperature' in data):
        try:
            co2_val = float(data.get('co2'))
            temp_val = float(data.get('temp') or data.get('temperature'))
            hum_val = float(data.get('humidity') or data.get('hum') or 0)
            # Skip regex check if we have valid structure
            # Proceed to DB
        except ValueError:
             return jsonify({"message": "Invalid numeric values in JSON."}), 400
    else:
        # Fallback to String Parsing logic
        # tailored key 'message' or 'data' can be used, defaulting to 'message' as common for sensor payloads
        raw_message = data.get("message") or data.get("data")
        
        # Fallback: Check if body is raw text
        if not raw_message:
            raw_body = request.get_data(as_text=True)
            if raw_body and SENSOR_DATA_PATTERN.search(raw_body):
                raw_message = raw_body

        if not raw_message or not isinstance(raw_message, str):
            print("[SensorHandler] Missing 'message'/'data' json field and body does not match pattern.")
            return jsonify({"message": "Missing or invalid sensor data."}), 400

        match = SENSOR_DATA_PATTERN.search(raw_message.strip())
        if not match:
            print(f"[SensorHandler] Invalid Format: {raw_message}")
            return jsonify({"message": "Invalid format. Expected 'CO2: <val>, T: <val>, H: <val>'"}), 400

        try:
            co2_val = float(match.group(1))
            temp_val = float(match.group(2))
            hum_val = float(match.group(3))
        except ValueError:
            return jsonify({"message": "Invalid numeric values detected."}), 400

    conn = get_connection()
    try:
        cur = conn.cursor()

        # 3. Duplicate Check (1-minute window)
        # Check the most recent reading for this user
        cur.execute(
            "SELECT timestamp_utc FROM sensor_readings WHERE user_id = %s ORDER BY timestamp_utc DESC LIMIT 1",
            (user_id,)
        )
        row = cur.fetchone()
        
        if row:
            last_time = row[0]
            # Ensure last_time is timezone-aware UTC for comparison
            if last_time.tzinfo is None:
                last_time = last_time.replace(tzinfo=timezone.utc)
            
            now_utc = datetime.now(timezone.utc)
            
            # Print for debugging
            diff = (now_utc - last_time).total_seconds()
            print(f"[SensorHandler] User: {user_id}, Last: {last_time}, Now: {now_utc}, Diff: {diff}")

            # If last reading is in the future (skew) or strictly within the last 55s
            # We allow if diff < 0 (Future) to let the system self-heal, assuming the previous timestamp was wrong/skewed.
            # OR we block? If we block, they are locked out until time catches up.
            # Better approach: If diff is massive (e.g. > 1 hour) maybe error? 
            # For robustness: If it's just 'too frequent' (0 < diff < 55), block.
            # if diff < 0, we'll log warning but ALLOW it to reset the timeline to 'now'.
            
            if 0 <= diff < 55:
                print("[SensorHandler] Duplicate/Too Frequent - Ignored")
                return jsonify({"message": "Duplicate/Too frequent submission ignored."}), 429
            
            if diff < 0:
                print("[SensorHandler] Warning: Last timestamp was in the future. Allowing insert to correct skew.")

        # 4. Insert Data
        # Use Python timestamp to ensure consistency with the check above
        now_val = datetime.now(timezone.utc)
        
        query = """
            INSERT INTO sensor_readings (user_id, sensor_type, value, timestamp_utc)
            VALUES 
            (%s, 'co2', %s, %s),
            (%s, 'temperature', %s, %s),
            (%s, 'humidity', %s, %s)
        """
        params = (
            user_id, co2_val, now_val,
            user_id, temp_val, now_val,
            user_id, hum_val, now_val
        )
        
        cur.execute(query, params)
        conn.commit()
        print("[SensorHandler] Data Inserted Successfully")
        cur.close()

        return jsonify({"message": "Data ingested successfully."}), 201

    except Exception:
        conn.rollback()
        with open("server_error.log", "a") as f:
            traceback.print_exc(file=f)
        return jsonify({"message": "Internal server error."}), 500
    finally:
        conn.close()
