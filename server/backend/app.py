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
from urllib.parse import urlencode
from flask import Flask, jsonify, redirect, request, session
from flask_cors import CORS
from dotenv import load_dotenv
from google_auth_oauthlib.flow import Flow
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from db_connect import get_connection
from validators import validate_email, validate_password

load_dotenv()

# Explicit Google OAuth scopes to avoid scope-mismatch warnings
GOOGLE_SCOPES = [
  "openid",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
]

def get_cors_origins():
  raw = os.environ.get("CORS_ORIGIN", "*")
  # Allow comma-separated origins, trim whitespace
  return [o.strip() for o in raw.split(",") if o.strip()] or ["*"]


app = Flask(__name__)
CORS(app, origins=get_cors_origins(), supports_credentials=True)
app.secret_key = os.environ.get("FLASK_SECRET", "dev-secret-change")
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_SECURE"] = False


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


def upsert_google_user(conn, email: str):
  cur = conn.cursor()
  cur.execute("SELECT id, role FROM users WHERE email=%s", (email,))
  existing = cur.fetchone()
  if existing:
    cur.close()
    return existing
  cur.execute(
    "INSERT INTO users (email, provider, role) VALUES (%s, %s, %s)",
    (email, "google", "USER"),
  )
  conn.commit()
  new_id = cur.lastrowid
  cur.close()
  return (new_id, "USER")


def build_google_flow(state: str | None = None):
  client_id = os.environ.get("GOOGLE_CLIENT_ID")
  client_secret = os.environ.get("GOOGLE_CLIENT_SECRET")
  redirect_uri = os.environ.get("GOOGLE_REDIRECT_URI")
  if not client_id or not client_secret or not redirect_uri:
    raise RuntimeError("Google OAuth env vars missing (GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI)")
  flow = Flow.from_client_config(
    {
      "web": {
        "client_id": client_id,
        "client_secret": client_secret,
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
      }
    },
    scopes=GOOGLE_SCOPES,
    redirect_uri=redirect_uri,
    state=state,
  )
  # state is attached during authorization_url, not at construction
  return flow


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


@app.get("/api/google/start")
def google_start():
  flow = build_google_flow()
  auth_url, state = flow.authorization_url(
    access_type="offline",
    include_granted_scopes="true",  # Google expects a string "true"/"false"
    prompt="select_account",
  )
  session["state"] = state
  return redirect(auth_url)


@app.get("/api/google/callback")
def google_callback():
  state = request.args.get("state") or session.get("state")
  if not state:
    return jsonify({"message": "Missing OAuth state."}), 400

  flow = build_google_flow(state=state)
  flow.fetch_token(authorization_response=request.url)

  id_info = id_token.verify_oauth2_token(
    flow.credentials.id_token,
    google_requests.Request(),
    os.environ.get("GOOGLE_CLIENT_ID"),
  )

  email = id_info.get("email")
  if not email:
    return jsonify({"message": "Google token missing email."}), 400

  conn = get_connection()
  try:
    upsert_google_user(conn, email)
  finally:
    conn.close()

  # Redirect to frontend landing page after successful Google auth
  origin = os.environ.get("CORS_ORIGIN", "http://localhost:5173").split(",")[0].strip()
  target = f"{origin}/welcome"
  return redirect(target)


if __name__ == "__main__":
  app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=bool(int(os.environ.get("FLASK_DEBUG", 0))))
