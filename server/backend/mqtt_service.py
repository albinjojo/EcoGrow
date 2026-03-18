import json
import os
import threading
import time
import traceback
from datetime import datetime, timezone
import paho.mqtt.client as mqtt
from db_connect import get_connection

# Global reference to socketio instance (will be set from app.py)
socketio_instance = None

# In-memory cache for throttling DB writes: { user_id: last_timestamp_utc }
LAST_SAVED = {}

# In-memory cooldown for real-time alert emissions: { metric_key: last_epoch }
_ALERT_EMIT_COOLDOWN = {}
_ALERT_COOLDOWN_SEC = 60  # don't re-emit the same metric alert within 60s

# Global active user ID. We use this to decide which user is associated
# with incoming hardware sensor data, since the raw MQTT streams don't carry web sessions.
# This gets updated dynamically when a user logs into the web app.
ACTIVE_MQTT_USER_ID = 1

def set_active_mqtt_user(user_id):
    """Update the global active user context. This user receives all incoming hardware data."""
    global ACTIVE_MQTT_USER_ID
    ACTIVE_MQTT_USER_ID = int(user_id)
    print(f"[MQTT] Active user context updated to: {ACTIVE_MQTT_USER_ID}")

# Latest sensor snapshot — updated on every MQTT message
LATEST_SENSOR_DATA = {}

def get_latest_sensor_data():
    """Return the most recent sensor values received from MQTT."""
    return LATEST_SENSOR_DATA

def set_socketio(sio):
    global socketio_instance
    socketio_instance = sio

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("[MQTT] Connected to Broker")
        client.subscribe("ecogrow/sensors")
    else:
        print(f"[MQTT] Connection Failed. Return Code: {rc}")

def on_message(client, userdata, msg):
    """
    Process incoming MQTT message:
    1. Parse JSON
    2. Insert to DB (throttled to 1 min)
    3. Emit via SocketIO (live)
    4. Check thresholds and emit new_alerts if out of range
    """
    try:
        payload = msg.payload.decode("utf-8")
        
        data = json.loads(payload)
        
        co2 = float(data.get("co2", 0))
        temp = float(data.get("temp", 0))
        humidity = float(data.get("humidity", 0))
        
        user_id = data.get("user_id", ACTIVE_MQTT_USER_ID)

        # 0. Update in-memory snapshot
        LATEST_SENSOR_DATA["co2"]       = co2
        LATEST_SENSOR_DATA["temp"]      = temp
        LATEST_SENSOR_DATA["humidity"]  = humidity
        LATEST_SENSOR_DATA["timestamp"] = datetime.now().strftime("%H:%M:%S")
        
        # 1. Database Insertion (Throttled)
        save_to_db_throttled(user_id, co2, temp, humidity)
        
        # 2. SocketIO Emission (Real-time)
        if socketio_instance:
            emit_data = {
                "co2": co2,
                "temp": temp,
                "humidity": humidity,
                "timestamp": datetime.now().strftime("%H:%M:%S")
            }
            socketio_instance.emit("sensor_update", emit_data)

            # 3. Real-time alert check
            try:
                from ai_service import _check_alerts, _gemini_suggestion
                sensor_snapshot = {"co2": co2, "temp": temp, "humidity": humidity}
                alerts = _check_alerts(sensor_snapshot, "lettuce", "vegetative")
                if alerts:
                    now = time.time()
                    fresh_alerts = []
                    for alert in alerts:
                        metric = alert.get("metric", "")
                        last = _ALERT_EMIT_COOLDOWN.get(metric, 0)
                        if (now - last) >= _ALERT_COOLDOWN_SEC:
                            alert["suggestion"] = _gemini_suggestion(alert, "lettuce", "vegetative")
                            fresh_alerts.append(alert)
                            _ALERT_EMIT_COOLDOWN[metric] = now
                    if fresh_alerts:
                        socketio_instance.emit("new_alerts", fresh_alerts)
                        print(f"[MQTT] Emitted {len(fresh_alerts)} real-time alert(s) via SocketIO")
            except Exception as alert_err:
                print(f"[MQTT] Alert check error (non-fatal): {alert_err}")
            
    except Exception as e:
        print(f"[MQTT] Error processing message: {e}")

def save_to_db_throttled(user_id, co2, temp, humidity):
    """
    Saves to DB only if 60 seconds have passed since the last save for this user.
    Uses in-memory cache to minimize DB reads.
    """
    global LAST_SAVED
    
    now_utc = datetime.now(timezone.utc)
    
    # 1. Check Memory Cache
    last_time = LAST_SAVED.get(user_id)
    
    # 2. If Cache Miss, Check Database
    if not last_time:
        conn = get_connection()
        try:
            cur = conn.cursor()
            cur.execute(
                "SELECT timestamp_utc FROM sensor_readings WHERE user_id = %s ORDER BY timestamp_utc DESC LIMIT 1",
                (user_id,)
            )
            row = cur.fetchone()
            cur.close()
            conn.close()
            
            if row:
                db_time = row[0]
                if db_time.tzinfo is None:
                    db_time = db_time.replace(tzinfo=timezone.utc)
                last_time = db_time
                LAST_SAVED[user_id] = last_time
        except Exception:
            pass
            
    # 3. Check Interval
    if last_time:
        diff = (now_utc - last_time).total_seconds()
        if diff < 60:
            return
            
    # 4. Insert Data
    conn = get_connection()
    try:
        cur = conn.cursor()
        query = """
            INSERT INTO sensor_readings (user_id, sensor_type, value, timestamp_utc)
            VALUES 
            (%s, 'co2', %s, %s),
            (%s, 'temperature', %s, %s),
            (%s, 'humidity', %s, %s)
        """
        cur.execute(query, (
            user_id, co2, now_utc,
            user_id, temp, now_utc,
            user_id, humidity, now_utc
        ))
        conn.commit()
        cur.close()
        
        LAST_SAVED[user_id] = now_utc
        print(f"[MQTT] Data Saved for User {user_id} (Throttled Insert)")
        
    except Exception as e:
        print(f"[MQTT] DB Error: {e}")
        conn.rollback()
    finally:
        conn.close()

def start_mqtt_client():
    """
    Starts the MQTT client in a non-blocking background thread.
    """
    broker_address = "e940b6ecad9b415cbf9c361f773ed91c.s1.eu.hivemq.cloud"
    port = 8883

    client_id = f"ecogrow_backend_{int(time.time())}"
    client = mqtt.Client(client_id=client_id)

    client.tls_set(ca_certs=None, certfile=None, keyfile=None,
                   cert_reqs=mqtt.ssl.CERT_NONE,
                   tls_version=mqtt.ssl.PROTOCOL_TLSv1_2)
    client.tls_insecure_set(True)

    client.username_pw_set("albinjojo", "Albin@2004")

    client.on_connect = on_connect
    client.on_message = on_message

    try:
        client.connect(broker_address, port, 60)
        client.loop_start()
        print("[MQTT] Service Started")
    except Exception as e:
        print(f"[MQTT] Failed to start: {e}")