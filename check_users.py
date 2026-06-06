import sqlite3
import os

db_path = os.path.join(os.path.expanduser('~'), 'ClassConnect', 'classroom.db')
if not os.path.exists(db_path):
    print("Database not found at", db_path)
else:
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute("SELECT id, name, email, role FROM users")
    users = c.fetchall()
    if not users:
        print("No users found in the database.")
    else:
        for u in users:
            print(u)
    conn.close()
