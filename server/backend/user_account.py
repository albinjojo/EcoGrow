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
    return {
      "full_name": fallback_name,
      "phone_number": "",
      "country": "",
      "state_region": ""
    }
  full_name, phone_number, country, state_region = row
  return {
    "full_name": full_name or fallback_name,
    "phone_number": phone_number or "",
    "country": country or "",
    "state_region": state_region or ""
  }


@account_bp.get("/profile")
def get_profile():
  user_id, email, role = _current_user()
  if not user_id:
    return jsonify({"message": "Unauthorized."}), 401
  fallback_name = (email.split("@")[0] if email and "@" in email else email) or ""

  conn = get_connection()
  try:
    cur = conn.cursor()
    cur.execute(
      "SELECT full_name, phone_number, country, state_region FROM user_details WHERE user_id=%s LIMIT 1",
      (user_id,)
    )
    row = cur.fetchone()
    cur.close()
    profile = _profile_row_to_dict(row, fallback_name)
    return jsonify({"id": user_id, "email": email, "role": role, "profile": profile}), 200
  finally:
    conn.close()


@account_bp.post("/profile")
def upsert_profile():
  user_id, _, _ = _current_user()
  if not user_id:
    return jsonify({"message": "Unauthorized."}), 401

  data = request.get_json(silent=True) or {}
  full_name = (data.get("full_name") or "").strip()
  phone_number = (data.get("phone_number") or "").strip()
  country = (data.get("country") or "").strip()
  state_region = (data.get("state_region") or "").strip()

  if len(full_name) > 120 or len(phone_number) > 20 or len(country) > 80 or len(state_region) > 80:
    return jsonify({"message": "One or more fields are too long."}), 400

  conn = get_connection()
  try:
    cur = conn.cursor()
    # Check if a record exists for this user_id to decide between INSERT or UPDATE
    # Although we can use ON DUPLICATE KEY UPDATE if user_id was UNIQUE or PRIMARY key in user_details.
    # Based on schema inspection: user_details_id is PRIMARY. user_id 'should' be unique ideally for 1:1.
    # Let's check if the record exists first for safety or assume 1:1 violation if we insert duplicate.
    # The safest "UPSERT" without a unique constraint on user_id relies on checking existence.
    
    cur.execute("SELECT user_details_id FROM user_details WHERE user_id=%s", (user_id,))
    existing = cur.fetchone()
    
    if existing:
        cur.execute(
            """
            UPDATE user_details 
            SET full_name=%s, phone_number=%s, country=%s, state_region=%s, updated_at=NOW()
            WHERE user_id=%s
            """,
            (full_name, phone_number, country, state_region, user_id)
        )
    else:
        cur.execute(
            """
            INSERT INTO user_details (user_id, full_name, phone_number, country, state_region, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, NOW(), NOW())
            """,
            (user_id, full_name, phone_number, country, state_region)
        )

    conn.commit()
    cur.close()
    return jsonify({"message": "Profile saved."}), 200
  except Exception:
    conn.rollback()
    # It is good practice to log the specific error in production
    import traceback
    traceback.print_exc()
    return jsonify({"message": "Unable to save profile."}), 500
  finally:
    conn.close()
