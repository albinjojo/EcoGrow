
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

def set_socketio(sio):
    global socketio_instance
    socketio_instance = sio

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("[MQTT] Connected to Broker")
        # Subscribe to sensors topic
        client.subscribe("ecogrow/sensors")
    else:
        print(f"[MQTT] Connection Failed. Return Code: {rc}")

def on_message(client, userdata, msg):
    """
    Process incoming MQTT message:
    1. Parse JSON
    2. Insert to DB (throttled to 1 min)
    3. Emit via SocketIO (live)
    """
    try:
        payload = msg.payload.decode("utf-8")
        # print(f"[MQTT] Received: {payload}")
        
        data = json.loads(payload)
        
        # Expected keys: co2, temp, humidity
        co2 = float(data.get("co2", 0))
        temp = float(data.get("temp", 0))
        humidity = float(data.get("humidity", 0))
        
        # Default to User ID 1 if not provided in payload
        user_id = data.get("user_id", 1)
        
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
            # Emit to all connected clients
            socketio_instance.emit("sensor_update", emit_data)
            
    except Exception as e:
        print(f"[MQTT] Error processing message: {e}")
        # traceback.print_exc()

def save_to_db_throttled(user_id, co2, temp, humidity):
    """
    Saves to DB only if 60 seconds have passed since the last save for this user.
    Uses in-memory cache to minimize DB reads.
    """
    global LAST_SAVED
    
    now_utc = datetime.now(timezone.utc)
    
    # 1. Check Memory Cache
    last_time = LAST_SAVED.get(user_id)
    
    # 2. If Cache Miss, Check Database (Handle restart case)
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
                # Ensure timezone awareness
                if db_time.tzinfo is None:
                    db_time = db_time.replace(tzinfo=timezone.utc)
                last_time = db_time
                # Update Cache
                LAST_SAVED[user_id] = last_time
        except Exception:
            pass # On error, proceed safely or assume no previous data
            
    # 3. Check Interval
    if last_time:
        diff = (now_utc - last_time).total_seconds()
        # Enforce 60-second interval
        if diff < 60:
            return  # Skip DB insert
            
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
        
        # Update Cache
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
    broker_address = "e66b0f01.ala.asia-southeast1.emqxsl.com"
    port = 8883 # SSL port
    
    # Generate unique ID
    client_id = f"ecogrow_backend_{int(time.time())}"
    client = mqtt.Client(client_id=client_id)
    
    # TLS Settings
    client.tls_set(ca_certs=None, certfile=None, keyfile=None, cert_reqs=mqtt.ssl.CERT_REQUIRED, tls_version=mqtt.ssl.PROTOCOL_TLSv1_2)
    
    # Credentials
    client.username_pw_set("ecogrow", "albin2004")
    
    client.on_connect = on_connect
    client.on_message = on_message
    
    try:
        client.connect(broker_address, port, 60)
        client.loop_start() # Starts a background thread
        print("[MQTT] Service Started")
    except Exception as e:
        print(f"[MQTT] Failed to start: {e}")

