import bcrypt
from datetime import datetime
from db_connect import get_connection

def setup_user():
    conn = get_connection()
    try:
        cur = conn.cursor()
        email = 'jojoalbin21@gmail.com'
        
        cur.execute('SELECT id FROM users WHERE email=%s', (email,))
        if not cur.fetchone():
            h = bcrypt.hashpw('Albin@2004'.encode(), bcrypt.gensalt()).decode()
            cur.execute(
                "INSERT INTO users (email, password_hash, role, provider, created_at) VALUES (%s, %s, %s, %s, %s)",
                (email, h, 'USER', 'password', datetime.now().isoformat())
            )
            conn.commit()
            print("User created")
        else:
            print("User already exists")
    finally:
        conn.close()

if __name__ == '__main__':
    setup_user()
