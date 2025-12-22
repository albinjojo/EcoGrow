import requests
import mysql.connector
import os
from db_connect import get_connection, create_reset_request, hash_password, insert_user

# Setup
EMAIL = "test_verify@example.com"
PASSWORD = "OldPassword1!"
NEW_PASSWORD = "NewPassword1!"

def setup_db():
    conn = get_connection()
    cur = conn.cursor()
    # Cleanup
    cur.execute("DELETE FROM password_resets WHERE user_id IN (SELECT id FROM users WHERE email=%s)", (EMAIL,))
    cur.execute("DELETE FROM users WHERE email=%s", (EMAIL,))
    conn.commit()
    
    # Create User
    cur.execute("INSERT INTO users (email, password_hash, provider, role) VALUES (%s, %s, %s, %s)", (EMAIL, "hash", "password", "USER"))
    conn.commit()
    user_id = cur.lastrowid
    
    # Create Token
    token = create_reset_request(conn, user_id)
    cur.close()
    conn.close()
    return token

def test_reset(token):
    url = "http://127.0.0.1:5000/api/reset-password"
    payload = {
        "token": token,
        "password": NEW_PASSWORD,
        "confirmPassword": NEW_PASSWORD
    }
    try:
        resp = requests.post(url, json=payload)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text}")
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    print("Setting up test data...")
    try:
        token = setup_db()
        print(f"Token created: {token}")
        print("Sending reset request...")
        test_reset(token)
    except Exception as e:
        print(f"Setup failed: {e}")
