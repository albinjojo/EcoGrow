"""
One-time admin user bootstrap function for EcoGrow Flask backend.

This module provides a function to insert the first admin user into the users table.
It includes safeguards to prevent duplicate admin insertion.

Usage:
    from bootstrap_admin import bootstrap_first_admin
    from db_connect import get_connection
    
    conn = get_connection()
    result = bootstrap_first_admin(conn)
    print(result)
    conn.close()
"""

import os
import bcrypt
from datetime import datetime, timezone
from db_connect import get_connection


def bootstrap_first_admin(conn):
    """
    heheeeeeeeeeeee
    """
    ADMIN_EMAIL = "admin@gmail.com"
    ADMIN_PASSWORD = "admin@123"
    ADMIN_ROLE = "ADMIN"
    ADMIN_PROVIDER = "password"
    
    try:
        cur = conn.cursor()
        
        # Step 1: Check if an admin already exists
        cur.execute(
            "SELECT id, email FROM users WHERE role=%s LIMIT 1",
            (ADMIN_ROLE,)
        )
        existing_admin = cur.fetchone()
        
        if existing_admin:
            cur.close()
            return {
                "status": "warning",
                "message": f"Admin user already exists: {existing_admin[1]}",
                "admin_id": existing_admin[0]
            }
        
        # Step 2: Hash the password with bcrypt
        rounds = int(os.environ.get("BCRYPT_ROUNDS", 12))
        password_bytes = ADMIN_PASSWORD.encode("utf-8")
        salt = bcrypt.gensalt(rounds)
        password_hash = bcrypt.hashpw(password_bytes, salt).decode("utf-8")
        
        # Step 3: Insert the admin user
        created_at = datetime.now(timezone.utc).isoformat()
        
        cur.execute(
            """
            INSERT INTO users (email, password_hash, provider, role, created_at)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (ADMIN_EMAIL, password_hash, ADMIN_PROVIDER, ADMIN_ROLE, created_at)
        )
        conn.commit()
        admin_id = cur.lastrowid
        
        cur.close()
        
        return {
            "status": "success",
            "message": f"Admin user created successfully",
            "admin_id": admin_id,
            "email": ADMIN_EMAIL,
            "role": ADMIN_ROLE
        }
    
    except Exception as e:
        conn.rollback()
        return {
            "status": "error",
            "message": f"Failed to bootstrap admin user: {str(e)}",
            "error_type": type(e).__name__
        }


if __name__ == "__main__":
    """
    Run this script to bootstrap the first admin user.
    
    Command:
        python bootstrap_admin.py
    """
    print("Bootstrapping first admin user...")
    conn = get_connection()
    try:
        result = bootstrap_first_admin(conn)
        print(f"\n✓ Status: {result['status']}")
        print(f"✓ Message: {result['message']}")
        if 'admin_id' in result:
            print(f"✓ Admin ID: {result['admin_id']}")
        if 'error_type' in result:
            print(f"✗ Error Type: {result['error_type']}")
    finally:
        conn.close()
