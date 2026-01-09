from flask import Blueprint, jsonify, request, session
from db_connect import get_connection

account_bp = Blueprint("account", __name__, url_prefix="/api/account")


def _current_user():
  user_id = session.get("user_id")
  email = session.get("email")
  role = session.get("role")
  return user_id, email, role


def _profile_row_to_dict(row, fallback_name: str = ""):
  if not row:
    return {"name": fallback_name, "phone": "", "organization": ""}
  name, phone, organization = row
  return {"name": name or fallback_name, "phone": phone or "", "organization": organization or ""}


@account_bp.get("/profile")
def get_profile():
  user_id, email, role = _current_user()
  if not user_id:
    return jsonify({"message": "Unauthorized."}), 401
  fallback_name = (email.split("@")[0] if email and "@" in email else email) or ""

  conn = get_connection()
  try:
    cur = conn.cursor()
    cur.execute("SELECT name, phone, organization FROM user_profiles WHERE user_id=%s LIMIT 1", (user_id,))
    row = cur.fetchone()
    cur.close()
    profile = _profile_row_to_dict(row, fallback_name)
    return jsonify({"email": email, "role": role, "profile": profile}), 200
  finally:
    conn.close()


@account_bp.post("/profile")
def upsert_profile():
  user_id, _, _ = _current_user()
  if not user_id:
    return jsonify({"message": "Unauthorized."}), 401

  data = request.get_json(silent=True) or {}
  name = (data.get("name") or "").strip()
  phone = (data.get("phone") or "").strip()
  organization = (data.get("organization") or "").strip()

  if len(name) > 120 or len(phone) > 40 or len(organization) > 120:
    return jsonify({"message": "One or more fields are too long."}), 400

  conn = get_connection()
  try:
    cur = conn.cursor()
    cur.execute(
      """
      INSERT INTO user_profiles (user_id, name, phone, organization)
      VALUES (%s, %s, %s, %s)
      ON DUPLICATE KEY UPDATE name=VALUES(name), phone=VALUES(phone), organization=VALUES(organization)
      """,
      (user_id, name, phone, organization),
    )
    conn.commit()
    cur.close()
    return jsonify({"message": "Profile saved."}), 200
  except Exception:
    conn.rollback()
    return jsonify({"message": "Unable to save profile."}), 500
  finally:
    conn.close()
