import sys
sys.path.append('c:/Users/Albin Jojo/Documents/ecogrow/server/backend')
from db_connect import get_connection

def main():
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("DESCRIBE crops")
        rows = cur.fetchall()
        with open('schema.txt', 'w') as f:
            for row in rows:
                f.write(str(row) + "\n")
        cur.close()
    except Exception as e:
        print("Error:", e)
    finally:
        conn.close()

if __name__ == "__main__":
    main()
