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
import traceback
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
import bcrypt
import smtplib
from email.message import EmailMessage
from urllib.parse import urlencode
from flask import Flask, jsonify, redirect, request, session
from flask_cors import CORS
from dotenv import load_dotenv
from google_auth_oauthlib.flow import Flow
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from db_connect import get_connection
from user_account import account_bp
from ai_service import ai_bp
from validators import validate_email, validate_password

load_dotenv()

# Explicit Google OAuth scopes to avoid scope-mismatch warnings
GOOGLE_SCOPES = [
  "openid",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
]

def get_cors_origins():
  raw = os.environ.get("CORS_ORIGIN", "http://localhost:5173")
  # Allow comma-separated origins, trim whitespace
  return [o.strip() for o in raw.split(",") if o.strip()] or ["http://localhost:5173"]


app = Flask(__name__)
app.register_blueprint(account_bp)
app.register_blueprint(ai_bp)
CORS(app, origins=get_cors_origins(), supports_credentials=True)
app.secret_key = os.environ.get("FLASK_SECRET", "dev-secret-change")
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_SECURE"] = False
RESET_LINK_DEBUG = bool(int(os.environ.get("RESET_LINK_DEBUG", "0")))
SMTP_HOST = os.environ.get("SMTP_HOST")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "465"))
SMTP_USER = os.environ.get("SMTP_USER")
SMTP_PASS = os.environ.get("SMTP_PASS")
SMTP_FROM = os.environ.get("SMTP_FROM", "no-reply@ecogrow.local")
SMTP_USE_TLS = bool(int(os.environ.get("SMTP_USE_TLS", "0")))


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


def get_user_with_password(conn, email: str):
  """Fetch user id, hash, provider, and role for login."""
  cur = conn.cursor()
  cur.execute(
    "SELECT id, email, password_hash, provider, role FROM users WHERE email=%s LIMIT 1",
    (email,),
  )
  row = cur.fetchone()
  cur.close()
  return row


def get_user_id(conn, email: str):
  """Return user id and provider for a given email, or None."""
  cur = conn.cursor()
  cur.execute("SELECT id, provider FROM users WHERE email=%s LIMIT 1", (email,))
  row = cur.fetchone()
  cur.close()
  return row


def hash_reset_token(raw: str) -> str:
  return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def create_reset_request(conn, user_id: int, ttl_minutes: int = 30) -> str:
  token = secrets.token_urlsafe(32)
  token_hash = hash_reset_token(token)
  now_utc = datetime.now(timezone.utc)
  # Store naive UTC so DB compares apples-to-apples under UTC session time zone
  created_at = now_utc.replace(tzinfo=None)
  expires_at = (now_utc + timedelta(minutes=ttl_minutes)).replace(tzinfo=None)
  cur = conn.cursor()
  cur.execute(
    "INSERT INTO password_resets (user_id, token_hash, created_at, expires_at) VALUES (%s, %s, %s, %s)",
    (user_id, token_hash, created_at, expires_at),
  )
  conn.commit()
  cur.close()
  return token


def send_reset_email(to_email: str, reset_link: str):
  if not SMTP_HOST or not SMTP_USER or not SMTP_PASS:
    raise RuntimeError("SMTP is not configured (SMTP_HOST/USER/PASS)")

  msg = EmailMessage()
  msg["Subject"] = "Reset your EcoGrow password"
  msg["From"] = SMTP_FROM
  msg["To"] = to_email
  msg.set_content(f"Click the link to reset your password: {reset_link}\nIf you did not request this, you can ignore it.")

  if SMTP_USE_TLS:
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as smtp:
      smtp.starttls()
      smtp.login(SMTP_USER, SMTP_PASS)
      smtp.send_message(msg)
  else:
    with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as smtp:
      smtp.login(SMTP_USER, SMTP_PASS)
      smtp.send_message(msg)


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


@app.post("/api/login")
def login_user():
  data = request.get_json(silent=True) or {}
  email = (data.get("email") or "").strip()
  password = data.get("password") or ""

  if not validate_email(email):
    return jsonify({"message": "Invalid email format."}), 400
  if not password:
    return jsonify({"message": "Password is required."}), 400

  conn = get_connection()
  try:
    user_row = get_user_with_password(conn, email)
    if not user_row:
      return jsonify({"message": "Invalid credentials."}), 401

    user_id, _, password_hash, provider, role = user_row
    if provider != "password":
      return jsonify({"message": "Use Google sign-in for this account."}), 400

    if not password_hash:
      return jsonify({"message": "Invalid credentials."}), 401

    if not bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8")):
      return jsonify({"message": "Invalid credentials."}), 401

    session["user_id"] = user_id
    session["email"] = email
    session["role"] = role

    return jsonify({"message": "Login successful.", "role": role}), 200
  except Exception:
    return jsonify({"message": "Unable to process login right now."}), 500
  finally:
    conn.close()


@app.post("/api/forgot-password")
def forgot_password():
  data = request.get_json(silent=True) or {}
  email = (data.get("email") or "").strip()

  if not validate_email(email):
    return jsonify({"message": "If the account exists, a reset link will be emailed."}), 200

  conn = get_connection()
  try:
    user_row = get_user_id(conn, email)
    if not user_row:
      # Avoid revealing account existence
      return jsonify({"message": "If the account exists, a reset link will be emailed."}), 200

    user_id, provider = user_row
    if provider != "password":
      return jsonify({"message": "If the account exists, a reset link will be emailed."}), 200

    token = create_reset_request(conn, user_id)
    frontend_origin = os.environ.get("CORS_ORIGIN", "http://localhost:5173").split(",")[0].strip()
    reset_link = f"{frontend_origin}/reset?token={token}"

    # Send reset email (SMTP must be configured via env vars)
    send_reset_email(email, reset_link)

    response_body = {"message": "If the account exists, a reset link will be emailed."}
    if RESET_LINK_DEBUG:
      response_body["reset_link"] = reset_link

    return jsonify(response_body), 200
  except Exception:
    return jsonify({"message": "Unable to process reset right now."}), 500
  finally:
    conn.close()


@app.post("/api/reset-password")
def reset_password():
  data = request.get_json(silent=True) or {}
  token = (data.get("token") or "").strip()
  password = data.get("password") or ""
  confirm = data.get("confirmPassword") or ""

  if not token:
    return jsonify({"message": "Reset token is required."}), 400
  if password != confirm:
    return jsonify({"message": "Passwords do not match."}), 400
  if not validate_password(password):
    return jsonify({"message": "Password must be 8+ chars and include upper, lower, number, and special."}), 400

  token_hash = hash_reset_token(token)
  conn = get_connection()
  try:
    cur = conn.cursor()
    cur.execute(
      """
      SELECT pr.id, pr.user_id, u.provider
      FROM password_resets pr
      JOIN users u ON u.id = pr.user_id
      WHERE pr.token_hash=%s AND pr.used=0 AND pr.expires_at > UTC_TIMESTAMP()
      LIMIT 1
      """,
      (token_hash,),
    )
    row = cur.fetchone()
    if not row:
      cur.close()
      return jsonify({"message": "Invalid or expired reset link."}), 400

    reset_id, user_id, provider = row
    
    # Close previous cursor to ensure clean state before transaction
    cur.close()

    if provider != "password":
      return jsonify({"message": "Invalid or expired reset link."}), 400

    pw_hash = hash_password(password)

    try:
      # Ends the implicit transaction started by the SELECT query
      conn.commit()
      
      conn.start_transaction()
      # Open new cursor for the transaction updates
      cur = conn.cursor()
      cur.execute("UPDATE users SET password_hash=%s WHERE id=%s", (pw_hash, user_id))
      cur.execute("UPDATE password_resets SET used=1 WHERE id=%s", (reset_id,))
      conn.commit()
      cur.close()

      return jsonify({"message": "Password updated successfully."}), 200
    except Exception:
      conn.rollback()
      with open("server_error.log", "w") as f:
        traceback.print_exc(file=f)
      return jsonify({"message": "Unable to reset password right now."}), 500
  except Exception:
    with open("server_error.log", "w") as f:
      traceback.print_exc(file=f)
    return jsonify({"message": "Unable to reset password right now."}), 500
  finally:
    conn.close()


@app.get("/api/users")
def get_all_users():
  """Fetch all users for admin panel. Requires admin role."""
  # Check if user is authenticated and is admin
  user_id = session.get("user_id")
  user_role = session.get("role")
  
  if not user_id:
    return jsonify({"message": "Unauthorized."}), 401
  
  if user_role != "ADMIN":
    return jsonify({"message": "Forbidden. Admin access required."}), 403
  
  conn = get_connection()
  try:
    cur = conn.cursor()
    cur.execute(
      "SELECT id, email, role, provider, created_at FROM users ORDER BY created_at DESC",
    )
    rows = cur.fetchall()
    cur.close()
    
    users = []
    for row in rows:
      user_id_db, email, role, provider, created_at = row
      users.append({
        "id": user_id_db,
        "email": email,
        "role": role,
        "provider": provider,
        "createdAt": created_at.isoformat() if created_at else None,
        "status": "Active",  # Can be extended with last_login tracking
      })
    
    return jsonify({"users": users, "total": len(users)}), 200
  except Exception as e:
    with open("server_error.log", "w") as f:
      traceback.print_exc(file=f)
    return jsonify({"message": "Unable to fetch users."}), 500
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
    user_id, role = upsert_google_user(conn, email)
    
    # establish session
    session["user_id"] = user_id
    session["email"] = email
    session["role"] = role
  finally:
    conn.close()

  # Redirect to frontend dashboard after successful Google auth
  origin = os.environ.get("CORS_ORIGIN", "http://localhost:5173").split(",")[0].strip()
  target = f"{origin}/dashboard"
  return redirect(target)


if __name__ == "__main__":
  app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=bool(int(os.environ.get("FLASK_DEBUG", 0))))
