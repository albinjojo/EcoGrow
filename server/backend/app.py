"""
Flask signup service for EcoGrow.

Security highlights:
- Passwords arrive in plaintext over HTTPS and are hashed ONLY here with bcrypt.
- No secrets in code; all sourced from environment variables (.env).
- Backend re-validates email + password strength and confirm-match regardless of frontend checks.
- Parameterized queries prevent SQL injection.
- phpMyAdmin is for viewing data only; all logic lives here.
"""

import os
import bcrypt
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from db_connect import get_connection
from validators import validate_email, validate_password

load_dotenv()

def get_cors_origins():
  raw = os.environ.get("CORS_ORIGIN", "*")
  # Allow comma-separated origins, trim whitespace
  return [o.strip() for o in raw.split(",") if o.strip()] or ["*"]


app = Flask(__name__)
CORS(app, origins=get_cors_origins(), supports_credentials=True)


def hash_password(password: str) -> str:
  """Hash a password with bcrypt (backend only)."""
  rounds = int(os.environ.get("BCRYPT_ROUNDS", 12))
  hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds))
  return hashed.decode("utf-8")


def email_exists(conn, email: str) -> bool:
  cur = conn.cursor()
  cur.execute("SELECT 1 FROM users WHERE email=%s LIMIT 1", (email,))
  exists = cur.fetchone() is not None
  cur.close()
  return exists


def insert_user(conn, email: str, password_hash: str):
  cur = conn.cursor()
  cur.execute(
    "INSERT INTO users (email, password_hash, provider, role) VALUES (%s, %s, %s, %s)",
    (email, password_hash, "password", "USER"),
  )
  conn.commit()
  cur.close()


@app.post("/api/signup")
def signup_user():
  data = request.get_json(silent=True) or {}
  email = (data.get("email") or "").strip()
  password = data.get("password") or ""
  confirm = data.get("confirmPassword") or ""

  # Authoritative backend validation
  if not validate_email(email):
    return jsonify({"message": "Invalid email format."}), 400
  if not validate_password(password):
    return jsonify({"message": "Password must be 8+ chars and include upper, lower, number, and special."}), 400
  if password != confirm:
    return jsonify({"message": "Passwords do not match."}), 400

  conn = get_connection()
  try:
    if email_exists(conn, email):
      return jsonify({"message": "Email already registered."}), 409

    pw_hash = hash_password(password)  # Hashing happens here (backend only)
    insert_user(conn, email, pw_hash)   # DB write happens here

    return jsonify({"message": "Signup successful."}), 201
  except Exception:
    # Do not leak internal errors or SQL details
    return jsonify({"message": "Unable to process signup right now."}), 500
  finally:
    conn.close()


@app.get("/health")
def health():
  return jsonify({"status": "ok"})


if __name__ == "__main__":
  app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=bool(int(os.environ.get("FLASK_DEBUG", 0))))
