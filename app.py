from flask import Flask, jsonify, request, session
import sqlite3, hashlib, random, string, os, sys
from datetime import datetime, date
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
import atexit
from email_utils import overdue_email
from api import init_api

# ── Path handling: works both normally AND inside a .exe ──
if getattr(sys, 'frozen', False):
    # Running as PyInstaller bundle — read-only bundle dir
    _BUNDLE = sys._MEIPASS
    # User data (writable) goes to ~/ClassConnect/
    _DATA   = os.path.join(os.path.expanduser('~'), 'ClassConnect')
    os.makedirs(_DATA, exist_ok=True)
else:
    _BUNDLE = os.path.dirname(os.path.abspath(__file__))
    _DATA   = _BUNDLE

DATABASE = os.path.join(_DATA, 'classroom.db')

app = Flask(__name__,
            static_folder=os.path.join(_BUNDLE, 'dist', 'frontend'),
            static_url_path='',
            template_folder=os.path.join(_BUNDLE, 'dist', 'frontend'))
app.secret_key = 'classconnect_v2_secret_2024'

# Initialize REST API
init_api(app)

# ─── DB ───────────────────────────────────────────────
def get_db():
    c = sqlite3.connect(DATABASE)
    c.row_factory = sqlite3.Row
    return c

def init_db():
    c = get_db()
    with open(os.path.join(_BUNDLE, 'schema.sql')) as f:
        c.executescript(f.read())
    # Safely add columns that may already exist (SQLite has no ADD COLUMN IF NOT EXISTS)
    for stmt in [
        'ALTER TABLE submissions ADD COLUMN has_file INTEGER DEFAULT 0',
        'ALTER TABLE submissions ADD COLUMN grade INTEGER',
        'ALTER TABLE submissions ADD COLUMN feedback TEXT',
        'ALTER TABLE assignments ADD COLUMN allow_file_upload INTEGER DEFAULT 1',
    ]:
        try:
            c.execute(stmt)
        except Exception:
            pass  # Column already exists
    c.commit()
    c.close()

def hp(p): return hashlib.sha256(p.encode()).hexdigest()
def gen_code(): return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

# ─── SCHEDULER: check overdue assignments every hour ──
def check_overdue():
    conn = get_db()
    try:
        now = datetime.now().strftime('%Y-%m-%d %H:%M')
        assignments = conn.execute(
            "SELECT * FROM assignments WHERE deadline <= ?", (now,)).fetchall()
        for a in assignments:
            non_submitters = conn.execute("""
                SELECT u.id, u.name, u.email FROM users u
                JOIN enrollments e ON u.id=e.student_id
                WHERE e.class_id=?
                AND u.id NOT IN (SELECT student_id FROM submissions WHERE assignment_id=?)
            """, (a['class_id'], a['id'])).fetchall()

            cfg = conn.execute("""
                SELECT ec.gmail, ec.app_password FROM email_config ec
                JOIN classes c ON ec.teacher_id=c.teacher_id WHERE c.id=?
            """, (a['class_id'],)).fetchone()

            for s in non_submitters:
                already = conn.execute(
                    "SELECT id FROM overdue_sent WHERE student_id=? AND assignment_id=?",
                    (s['id'], a['id'])).fetchone()
                if already: continue

                # In-app notification
                conn.execute("INSERT INTO notifications(user_id,message) VALUES(?,?)",
                    (s['id'], f'⚠️ OVERDUE: "{a["title"]}" was due {a["deadline"][:16]}. Submit immediately!'))
                conn.execute("INSERT INTO overdue_sent(student_id,assignment_id) VALUES(?,?)",
                    (s['id'], a['id']))

                # Email if configured
                if cfg and s['email']:
                    overdue_email(s['name'], a['title'], a['deadline'][:16],
                                  cfg['gmail'], cfg['app_password'], s['email'])
        conn.commit()
    except Exception as e:
        print(f"[Scheduler Error] {e}")
    finally:
        conn.close()

scheduler = BackgroundScheduler()
scheduler.add_job(func=check_overdue, trigger=IntervalTrigger(hours=1))
scheduler.start()
atexit.register(lambda: scheduler.shutdown())

# ─── React Catch-All Route ────────────────────────────────
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def catch_all(path):
    # If the path starts with api/ (which means it didn't match any registered REST API endpoint), return 404
    if path.startswith('api'):
        return jsonify({'success': False, 'message': 'API route not found'}), 404
    # Otherwise, return the main index.html for React SPA Router to handle
    return app.send_static_file('index.html')

@app.errorhandler(404)
def page_not_found(e):
    if request.path.startswith('/api') or request.path.startswith('api'):
        return jsonify({'success': False, 'message': 'API route not found'}), 404
    return app.send_static_file('index.html')

if __name__ == '__main__':
    if not os.path.exists(DATABASE): init_db()
    app.run(debug=True)
