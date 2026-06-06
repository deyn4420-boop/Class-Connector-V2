"""
Flask REST API for ClassConnect React Frontend
Provides JSON endpoints for all functionality
"""

from flask import Flask, request, jsonify, session
from functools import wraps
import sqlite3, hashlib, random, string, os, sys
from datetime import datetime, date
from typing import Dict, Any, Tuple
from email_utils import overdue_email, event_email, build_html, send_email

# ── Path handling ──
if getattr(sys, 'frozen', False):
    _BUNDLE = sys._MEIPASS
    _DATA = os.path.join(os.path.expanduser('~'), 'ClassConnect')
    os.makedirs(_DATA, exist_ok=True)
else:
    _BUNDLE = os.path.dirname(os.path.abspath(__file__))
    _DATA = _BUNDLE

DATABASE = os.path.join(_DATA, 'classroom.db')

def get_db():
    c = sqlite3.connect(DATABASE)
    c.row_factory = sqlite3.Row
    return c

def hp(p): return hashlib.sha256(p.encode()).hexdigest()

def gen_code(): return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

def api_response(success: bool, data: Any = None, message: str = None) -> Tuple[Dict, int]:
    """Standardized API response"""
    response = {'success': success}
    if data is not None:
        response['data'] = data
    if message:
        response['message'] = message
    return jsonify(response)

def auth_required(role: str = None):
    """Decorator for protected API endpoints"""
    def decorator(f):
        def decorated(*args, **kwargs):
            if 'user_id' not in session:
                return api_response(False, message='Unauthorized'), 401
            if role and session.get('role') != role:
                return api_response(False, message='Forbidden'), 403
            return f(*args, **kwargs)
        decorated.__name__ = f.__name__
        return decorated
    return decorator

# ── Initialize Blueprint ──
from flask import Blueprint
api_bp = Blueprint('api', __name__, url_prefix='/api')

# ── AUTH ENDPOINTS ──────────────────────────────────────

@api_bp.route('/debug_path', methods=['GET'])
def debug_path():
    return jsonify({"database": DATABASE, "frozen": getattr(sys, 'frozen', False)})

@api_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        name = data.get('name', '').strip()
        email = data.get('email', '').strip().lower()
        password = hp(data.get('password', ''))
        role = data.get('role', '').lower()

        if not all([name, email, password, role]) or role not in ['student', 'teacher']:
            return api_response(False, message='Invalid input'), 400

        conn = get_db()

        # Check if email exists
        if conn.execute('SELECT id FROM users WHERE email=?', (email,)).fetchone():
            return api_response(False, message='Email already registered'), 400

        if role == 'teacher':
            staff_id = data.get('staff_id', '').strip().upper()
            if not staff_id or conn.execute('SELECT id FROM users WHERE staff_id=?', (staff_id,)).fetchone():
                return api_response(False, message='Invalid or duplicate staff ID'), 400

            conn.execute('INSERT INTO users(name,staff_id,email,password,role) VALUES(?,?,?,?,?)',
                        (name, staff_id, email, password, role))
            conn.commit()

            uid = conn.execute('SELECT id FROM users WHERE email=?', (email,)).fetchone()['id']
            code = gen_code()
            while conn.execute('SELECT id FROM classes WHERE class_code=?', (code,)).fetchone():
                code = gen_code()

            class_name = data.get('class_name', f"{name}'s Class").strip()
            conn.execute('INSERT INTO classes(name,teacher_id,class_code) VALUES(?,?,?)',
                        (class_name, uid, code))
            conn.commit()

            return api_response(True, data={'class_code': code}, message='Registration successful'), 201

        else:  # student
            usn = data.get('usn', '').strip().upper()
            class_code = data.get('class_code', '').strip().upper()

            if not usn or not class_code:
                return api_response(False, message='USN and class code required'), 400

            if conn.execute('SELECT id FROM users WHERE usn=?', (usn,)).fetchone():
                return api_response(False, message='USN already registered'), 400

            cls = conn.execute('SELECT id FROM classes WHERE class_code=?', (class_code,)).fetchone()
            if not cls:
                return api_response(False, message='Invalid class code'), 400

            conn.execute('INSERT INTO users(name,usn,email,password,role) VALUES(?,?,?,?,?)',
                        (name, usn, email, password, role))
            conn.commit()

            uid = conn.execute('SELECT id FROM users WHERE email=?', (email,)).fetchone()['id']
            conn.execute('INSERT INTO enrollments(student_id,class_id) VALUES(?,?)', (uid, cls['id']))
            conn.commit()

            return api_response(True, message='Registration successful'), 201

    except Exception as e:
        return api_response(False, message=str(e)), 500
    finally:
        conn.close()

@api_bp.route('/login', methods=['POST'])
def login():
    """Login user"""
    try:
        print("LOGIN CALLED")
        data = request.get_json()
        print("DATA:", data)
        email = data.get('email', '').strip().lower()
        password = hp(data.get('password', ''))
        print("EMAIL:", email)

        if not email or not password:
            return api_response(False, message='Email and password required'), 400

        conn = get_db()
        user = conn.execute('SELECT * FROM users WHERE email=? AND password=?',
                           (email, password)).fetchone()
        conn.close()

        if not user:
            return api_response(False, message='Invalid email or password'), 401

        session['user_id'] = user['id']
        session['name'] = user['name']
        session['role'] = user['role']
        session['usn'] = user['usn'] or ''
        session['staff_id'] = user['staff_id'] or ''
        session['email'] = user['email']

        return api_response(True, data={
            'userId': user['id'],
            'name': user['name'],
            'email': user['email'],
            'role': user['role'],
            'usn': user['usn'],
            'staffId': user['staff_id']
        }), 200

    except Exception as e:
        return api_response(False, message=str(e)), 500

@api_bp.route('/logout', methods=['POST'])
@auth_required()
def logout():
    """Logout user"""
    session.clear()
    return api_response(True, message='Logged out successfully'), 200

@api_bp.route('/session', methods=['GET'])
@auth_required()
def get_session():
    """Get current session"""
    try:
        conn = get_db()
        user = conn.execute('SELECT * FROM users WHERE id=?', (session['user_id'],)).fetchone()

        if not user:
            session.clear()
            return api_response(False, message='Session expired'), 401

        # Get class ID for students
        class_id = None
        if user['role'] == 'student':
            enrollment = conn.execute('SELECT class_id FROM enrollments WHERE student_id=?',
                                     (user['id'],)).fetchone()
            if enrollment:
                class_id = enrollment['class_id']
        else:
            cls = conn.execute('SELECT id FROM classes WHERE teacher_id=?', (user['id'],)).fetchone()
            if cls:
                class_id = cls['id']

        conn.close()

        return api_response(True, data={
            'userId': user['id'],
            'name': user['name'],
            'email': user['email'],
            'role': user['role'],
            'usn': user['usn'],
            'staffId': user['staff_id'],
            'classId': class_id
        }), 200

    except Exception as e:
        return api_response(False, message=str(e)), 500

# ── STUDENT DASHBOARD ──────────────────────────────────

@api_bp.route('/student/dashboard', methods=['GET'])
@auth_required('student')
def student_dashboard():
    """Get student dashboard data"""
    try:
        conn = get_db()
        user_id = session['user_id']

        # Get class and teacher info
        enrollment = conn.execute(
            'SELECT c.id, c.name, u.name as teacher_name FROM enrollments e JOIN classes c ON e.class_id=c.id JOIN users u ON c.teacher_id=u.id WHERE e.student_id=?',
            (user_id,)
        ).fetchone()

        if not enrollment:
            return api_response(True, data={
                'class': None,
                'stats': {'assignments': 0, 'submissions': 0, 'groups': 0, 'averageGrade': 0},
                'events': [],
                'notifications': []
            }), 200

        class_id = enrollment['id']

        # Get stats
        assignments_count = conn.execute(
            'SELECT COUNT(*) as c FROM assignments WHERE class_id=?', (class_id,)).fetchone()['c']
        submissions_count = conn.execute(
            'SELECT COUNT(*) as c FROM submissions WHERE student_id=?', (user_id,)).fetchone()['c']
        groups_count = conn.execute(
            'SELECT COUNT(*) as c FROM groups WHERE id IN (SELECT group_id FROM group_members WHERE student_id=?)',
            (user_id,)).fetchone()['c']
        avg_grade = conn.execute(
            'SELECT AVG(grade) as avg FROM submissions WHERE student_id=? AND grade IS NOT NULL',
            (user_id,)).fetchone()['avg'] or 0

        # Get events
        events = conn.execute(
            'SELECT title, event_date, event_type FROM events WHERE class_id=? AND event_date>=? ORDER BY event_date ASC LIMIT 5',
            (class_id, date.today().isoformat())
        ).fetchall()

        # Get notifications
        notifications = conn.execute(
            'SELECT message, created_at FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 5',
            (user_id,)
        ).fetchall()

        conn.close()

        return api_response(True, data={
            'class': {'name': enrollment['name'], 'teacher': enrollment['teacher_name']},
            'stats': {
                'assignments': assignments_count,
                'submissions': submissions_count,
                'groups': groups_count,
                'averageGrade': int(avg_grade)
            },
            'events': [dict(e) for e in events],
            'notifications': [dict(n) for n in notifications]
        }), 200

    except Exception as e:
        return api_response(False, message=str(e)), 500

# ── TEACHER DASHBOARD ──────────────────────────────────

@api_bp.route('/teacher/dashboard', methods=['GET'])
@auth_required('teacher')
def teacher_dashboard():
    """Get teacher dashboard data"""
    try:
        conn = get_db()
        user_id = session['user_id']

        # Get class info
        cls = conn.execute('SELECT id, name, class_code FROM classes WHERE teacher_id=?',
                          (user_id,)).fetchone()

        if not cls:
            return api_response(True, data={
                'class': None,
                'stats': {'totalStudents': 0, 'pendingSubmissions': 0, 'averageGrade': 0, 'attendanceRate': 0},
                'recentSubmissions': [],
                'assignments': []
            }), 200

        class_id = cls['id']

        # Get stats
        total_students = conn.execute(
            'SELECT COUNT(*) as c FROM enrollments WHERE class_id=?', (class_id,)).fetchone()['c']
        pending_subs = conn.execute(
            'SELECT COUNT(*) as c FROM submissions WHERE assignment_id IN (SELECT id FROM assignments WHERE class_id=?) AND grade IS NULL',
            (class_id,)).fetchone()['c']
        avg_grade = conn.execute(
            'SELECT AVG(grade) as avg FROM submissions WHERE assignment_id IN (SELECT id FROM assignments WHERE class_id=?) AND grade IS NOT NULL',
            (class_id,)).fetchone()['avg'] or 0

        today = date.today().isoformat()
        attendance_rate = 0
        if total_students > 0:
            present_today = conn.execute(
                "SELECT COUNT(*) as c FROM attendance WHERE class_id=? AND date=? AND status='present'",
                (class_id, today)).fetchone()['c']
            attendance_rate = int((present_today / total_students) * 100)

        # Get recent submissions
        recent_subs = conn.execute(
            'SELECT u.name, a.title, s.submitted_at FROM submissions s JOIN assignments a ON s.assignment_id=a.id JOIN users u ON s.student_id=u.id WHERE a.class_id=? ORDER BY s.submitted_at DESC LIMIT 5',
            (class_id,)
        ).fetchall()

        # Get assignments with submission count
        assignments = conn.execute(
            'SELECT a.id, a.title, (SELECT COUNT(*) FROM enrollments WHERE class_id=a.class_id) as total, (SELECT COUNT(*) FROM submissions WHERE assignment_id=a.id) as submitted FROM assignments a WHERE a.class_id=? ORDER BY a.created_at DESC LIMIT 5',
            (class_id,)
        ).fetchall()

        conn.close()

        return api_response(True, data={
            'class': {
                'name': cls['name'],
                'code': cls['class_code'],
                'studentCount': total_students
            },
            'stats': {
                'totalStudents': total_students,
                'pendingSubmissions': pending_subs,
                'averageGrade': int(avg_grade),
                'attendanceRate': attendance_rate
            },
            'recentSubmissions': [dict(s) for s in recent_subs],
            'assignments': [{'title': dict(a)['title'], 'studentCount': dict(a)['total'], 'submittedCount': dict(a)['submitted']} for a in assignments]
        }), 200

    except Exception as e:
        return api_response(False, message=str(e)), 500

# ── Helpers ──
def get_teacher_class(conn):
    return conn.execute('SELECT * FROM classes WHERE teacher_id=?', (session['user_id'],)).fetchone()

def notify_class(conn, class_id, message):
    students = conn.execute('SELECT student_id FROM enrollments WHERE class_id=?', (class_id,)).fetchall()
    for s in students:
        conn.execute('INSERT INTO notifications(user_id,message) VALUES(?,?)', (s['student_id'], message))

# ── NOTES ENDPOINTS ──────────────────────────────────────

@api_bp.route('/notes', methods=['GET'])
@auth_required()
def get_notes():
    conn = get_db()
    role = session.get('role')
    if role == 'teacher':
        cls = get_teacher_class(conn)
        if not cls:
            conn.close()
            return jsonify({'success': True, 'data': []})
        notes = conn.execute('SELECT * FROM notes WHERE class_id=? ORDER BY created_at DESC', (cls['id'],)).fetchall()
    else:
        notes = conn.execute('''SELECT n.*, u.name as tname FROM notes n
            JOIN classes c ON n.class_id=c.id JOIN enrollments e ON c.id=e.class_id
            JOIN users u ON n.teacher_id=u.id WHERE e.student_id=? ORDER BY n.created_at DESC''',
            (session['user_id'],)).fetchall()
    conn.close()
    return jsonify({'success': True, 'data': [dict(n) for n in notes]})

@api_bp.route('/notes', methods=['POST'])
@auth_required('teacher')
def create_note():
    data = request.get_json() or {}
    title = data.get('title', '').strip()
    content = data.get('content', '').strip()
    if not title or not content:
        return jsonify({'success': False, 'message': 'Title and content required'}), 400
    conn = get_db()
    cls = get_teacher_class(conn)
    if not cls:
        conn.close()
        return jsonify({'success': False, 'message': 'Class not found'}), 404
    conn.execute('INSERT INTO notes(class_id,teacher_id,title,content) VALUES(?,?,?,?)',
                 (cls['id'], session['user_id'], title, content))
    notify_class(conn, cls['id'], f'📄 New note posted: {title}')
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'message': 'Note posted successfully'}), 201

@api_bp.route('/notes/<int:note_id>', methods=['DELETE'])
@auth_required('teacher')
def delete_note(note_id):
    conn = get_db()
    conn.execute('DELETE FROM notes WHERE id=? AND teacher_id=?', (note_id, session['user_id']))
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'message': 'Note deleted successfully'})

# ── ASSIGNMENTS ENDPOINTS ─────────────────────────────────

@api_bp.route('/assignments', methods=['GET'])
@auth_required()
def get_assignments():
    conn = get_db()
    role = session.get('role')
    if role == 'teacher':
        cls = get_teacher_class(conn)
        if not cls:
            conn.close()
            return jsonify({'success': True, 'data': []})
        assignments = conn.execute(
            '''SELECT a.*, (SELECT COUNT(*) FROM submissions WHERE assignment_id=a.id) as subs
               FROM assignments a WHERE a.class_id=? ORDER BY a.deadline ASC''', (cls['id'],)).fetchall()
    else:
        assignments = conn.execute('''
            SELECT a.*, c.name as cname,
                   (SELECT id FROM submissions WHERE assignment_id=a.id AND student_id=?) as submitted
            FROM assignments a JOIN classes c ON a.class_id=c.id
            JOIN enrollments e ON c.id=e.class_id WHERE e.student_id=? ORDER BY a.deadline ASC''',
            (session['user_id'], session['user_id'])).fetchall()
    conn.close()
    return jsonify({'success': True, 'data': [dict(a) for a in assignments]})

@api_bp.route('/assignments', methods=['POST'])
@auth_required('teacher')
def create_assignment():
    data = request.get_json() or {}
    title = data.get('title', '').strip()
    description = data.get('description', '').strip()
    subject = data.get('subject', 'General').strip()
    deadline = data.get('deadline', '').strip()
    if not title or not deadline:
        return jsonify({'success': False, 'message': 'Title and deadline required'}), 400
    conn = get_db()
    cls = get_teacher_class(conn)
    if not cls:
        conn.close()
        return jsonify({'success': False, 'message': 'Class not found'}), 404
    conn.execute('INSERT INTO assignments(class_id,teacher_id,title,description,subject,deadline) VALUES(?,?,?,?,?,?)',
                 (cls['id'], session['user_id'], title, description, subject, deadline))
    notify_class(conn, cls['id'], f'📝 New assignment: {title} | Due: {deadline[:16]}')
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'message': 'Assignment created successfully'}), 201

@api_bp.route('/assignments/<int:aid>/submit', methods=['POST'])
@auth_required('student')
def submit_assignment(aid):
    data = request.get_json() or {}
    content = data.get('content', '').strip()
    conn = get_db()
    existing = conn.execute('SELECT id FROM submissions WHERE assignment_id=? AND student_id=?',
                            (aid, session['user_id'])).fetchone()
    if existing:
        conn.close()
        return jsonify({'success': False, 'message': 'Already submitted'}), 400
    conn.execute('INSERT INTO submissions(assignment_id,student_id,content) VALUES(?,?,?)',
                 (aid, session['user_id'], content))
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'message': 'Assignment submitted successfully'}), 201

# ── GROUPS ENDPOINTS ──────────────────────────────────────

@api_bp.route('/groups', methods=['GET'])
@auth_required()
def get_groups():
    conn = get_db()
    role = session.get('role')
    if role == 'teacher':
        cls = get_teacher_class(conn)
        if not cls:
            conn.close()
            return jsonify({'success': True, 'data': []})
        groups_raw = conn.execute('SELECT * FROM groups WHERE class_id=? ORDER BY created_at DESC', (cls['id'],)).fetchall()
        groups = []
        for g in groups_raw:
            mems = conn.execute('SELECT u.id, u.name, u.usn FROM users u JOIN group_members gm ON u.id=gm.student_id WHERE gm.group_id=?', (g['id'],)).fetchall()
            topics = conn.execute('SELECT * FROM topics WHERE group_id=?', (g['id'],)).fetchall()
            groups.append({'g': dict(g), 'members': [dict(m) for m in mems], 'topics': [dict(t) for t in topics]})
    else:
        groups_raw = conn.execute(
            'SELECT g.*, c.name as cname FROM groups g JOIN group_members gm ON g.id=gm.group_id JOIN classes c ON g.class_id=c.id WHERE gm.student_id=?',
            (session['user_id'],)).fetchall()
        groups = []
        for g in groups_raw:
            mems = conn.execute('SELECT u.id, u.name, u.usn FROM users u JOIN group_members gm ON u.id=gm.student_id WHERE gm.group_id=?', (g['id'],)).fetchall()
            topics = conn.execute('SELECT * FROM topics WHERE group_id=?', (g['id'],)).fetchall()
            td = [{'t': dict(t), 'submitted': bool(conn.execute('SELECT id FROM submissions WHERE topic_id=? AND student_id=?', (t['id'], session['user_id'])).fetchone())} for t in topics]
            groups.append({'g': dict(g), 'members': [dict(m) for m in mems], 'topics': td})
    conn.close()
    return jsonify({'success': True, 'data': groups})

@api_bp.route('/groups', methods=['POST'])
@auth_required('teacher')
def create_group():
    data = request.get_json() or {}
    action = data.get('action', 'create_specific')
    conn = get_db()
    cls = get_teacher_class(conn)
    if not cls:
        conn.close()
        return jsonify({'success': False, 'message': 'Class not found'}), 404

    students = conn.execute(
        'SELECT u.id FROM users u JOIN enrollments e ON u.id=e.student_id WHERE e.class_id=?',
        (cls['id'],)).fetchall()
    student_ids = [s['id'] for s in students]

    if action == 'create_random':
        gc = int(data.get('group_count', 2))
        if not student_ids:
            conn.close()
            return jsonify({'success': False, 'message': 'No students enrolled'}), 400
        random.shuffle(student_ids)
        sz, rem = divmod(len(student_ids), gc)
        idx = 0
        for i in range(gc):
            conn.execute('INSERT INTO groups(class_id,name,group_type) VALUES(?,?,?)', (cls['id'], f'Group {i+1}', 'random'))
            conn.commit()
            gid = conn.execute('SELECT last_insert_rowid()').fetchone()[0]
            for _ in range(sz + (1 if i < rem else 0)):
                if idx < len(student_ids):
                    conn.execute('INSERT INTO group_members(group_id,student_id) VALUES(?,?)', (gid, student_ids[idx]))
                    idx += 1
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'message': f'{gc} random groups created'})
    else:
        gname = data.get('name', '').strip()
        members = data.get('members', [])
        if not gname or not members:
            conn.close()
            return jsonify({'success': False, 'message': 'Group name and members required'}), 400
        conn.execute('INSERT INTO groups(class_id,name,group_type) VALUES(?,?,?)', (cls['id'], gname, 'specific'))
        conn.commit()
        gid = conn.execute('SELECT last_insert_rowid()').fetchone()[0]
        for m in members:
            conn.execute('INSERT OR IGNORE INTO group_members(group_id,student_id) VALUES(?,?)', (gid, m))
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'message': f'Group "{gname}" created'})

@api_bp.route('/groups/topic', methods=['POST'])
@auth_required('teacher')
def assign_topic():
    data = request.get_json() or {}
    gid = data.get('group_id')
    title = data.get('topic_title', '').strip()
    subject = data.get('subject', 'General').strip()
    desc = data.get('description', '').strip()
    deadline = data.get('deadline', '').strip()

    if not gid or not title:
        return jsonify({'success': False, 'message': 'Group ID and title required'}), 400

    conn = get_db()
    conn.execute('INSERT INTO topics(group_id,title,subject,description,deadline) VALUES(?,?,?,?,?)', (gid, title, subject, desc, deadline))
    mems = conn.execute('SELECT student_id FROM group_members WHERE group_id=?', (gid,)).fetchall()
    grp = conn.execute('SELECT name FROM groups WHERE id=?', (gid,)).fetchone()
    for m in mems:
        conn.execute('INSERT INTO notifications(user_id,message) VALUES(?,?)',
                     (m['student_id'], f'🗂 New topic for {grp["name"]}: {title}'))
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'message': 'Topic assigned successfully'})

@api_bp.route('/groups/submit', methods=['POST'])
@auth_required('student')
def submit_group_topic():
    data = request.get_json() or {}
    tid = data.get('topic_id')
    gid = data.get('group_id')
    content = data.get('content', '').strip()

    if not tid or not gid:
        return jsonify({'success': False, 'message': 'Topic ID and Group ID required'}), 400

    conn = get_db()
    if conn.execute('SELECT id FROM submissions WHERE topic_id=? AND student_id=?', (tid, session['user_id'])).fetchone():
        conn.close()
        return jsonify({'success': False, 'message': 'Already submitted'}), 400
    conn.execute('INSERT INTO submissions(topic_id,group_id,student_id,content) VALUES(?,?,?,?)', (tid, gid, session['user_id'], content))
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'message': 'Topic submitted successfully'})

# ── ATTENDANCE ENDPOINTS ──────────────────────────────────

@api_bp.route('/attendance', methods=['GET'])
@auth_required()
def get_attendance():
    conn = get_db()
    role = session.get('role')
    if role == 'teacher':
        cls = get_teacher_class(conn)
        if not cls:
            conn.close()
            return jsonify({'success': True, 'data': {'students': [], 'existing': {}, 'summary': []}})
        sel_date = request.args.get('date', date.today().isoformat())
        students = conn.execute(
            'SELECT u.id, u.name, u.usn FROM users u JOIN enrollments e ON u.id=e.student_id WHERE e.class_id=? ORDER BY u.name',
            (cls['id'],)).fetchall()
        existing = {}
        for row in conn.execute('SELECT student_id, status FROM attendance WHERE class_id=? AND date=?', (cls['id'], sel_date)).fetchall():
            existing[str(row['student_id'])] = row['status']
        summary = conn.execute('''
            SELECT u.id, u.name, u.usn,
                   SUM(CASE WHEN a.status="present" THEN 1 ELSE 0 END) as present_count,
                   COUNT(a.id) as total_days
            FROM users u
            JOIN enrollments e ON u.id=e.student_id
            LEFT JOIN attendance a ON u.id=a.student_id AND a.class_id=e.class_id
            WHERE e.class_id=?
            GROUP BY u.id ORDER BY u.name''', (cls['id'],)).fetchall()
        conn.close()
        return jsonify({'success': True, 'data': {
            'students': [dict(s) for s in students],
            'existing': existing,
            'summary': [dict(sum_row) for sum_row in summary]
        }})
    else:
        cls = conn.execute('SELECT c.* FROM classes c JOIN enrollments e ON c.id=e.class_id WHERE e.student_id=?', (session['user_id'],)).fetchone()
        records = []
        stats = {'present': 0, 'absent': 0, 'late': 0, 'total': 0, 'pct': 0}
        if cls:
            records = conn.execute('SELECT * FROM attendance WHERE student_id=? AND class_id=? ORDER BY date DESC',
                                   (session['user_id'], cls['id'])).fetchall()
            for r in records:
                stats[r['status']] += 1
                stats['total'] += 1
            if stats['total']:
                stats['pct'] = round((stats['present'] / stats['total']) * 100)
        conn.close()
        return jsonify({'success': True, 'data': {
            'records': [dict(r) for r in records],
            'stats': stats
        }})

@api_bp.route('/attendance', methods=['POST'])
@auth_required('teacher')
def mark_attendance_api():
    data = request.get_json() or {}
    att_date = data.get('date', date.today().isoformat())
    records = data.get('records', {})
    conn = get_db()
    cls = get_teacher_class(conn)
    if not cls:
        conn.close()
        return jsonify({'success': False, 'message': 'Class not found'}), 404
    for sid, status in records.items():
        if status not in ['present', 'absent', 'late']:
            continue
        conn.execute('''INSERT INTO attendance(class_id,student_id,date,status) VALUES(?,?,?,?)
                        ON CONFLICT(student_id,class_id,date) DO UPDATE SET status=excluded.status''',
                     (cls['id'], int(sid), att_date, status))
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'message': f'Attendance saved for {att_date}'})

# ── PROGRESS ENDPOINTS ────────────────────────────────────

@api_bp.route('/progress', methods=['GET'])
@auth_required()
def get_progress():
    conn = get_db()
    role = session.get('role')
    if role == 'teacher':
        cls = get_teacher_class(conn)
        if not cls:
            conn.close()
            return jsonify({'success': True, 'data': []})
        cid = cls['id']
        total_assignments = conn.execute('SELECT COUNT(*) as c FROM assignments WHERE class_id=?', (cid,)).fetchone()['c']
        total_topics = conn.execute('SELECT COUNT(*) as c FROM topics t JOIN groups g ON t.group_id=g.id WHERE g.class_id=?', (cid,)).fetchone()['c']
        total_days = conn.execute('SELECT COUNT(DISTINCT date) as c FROM attendance WHERE class_id=?', (cid,)).fetchone()['c']
        students = conn.execute(
            'SELECT u.id, u.name, u.usn FROM users u JOIN enrollments e ON u.id=e.student_id WHERE e.class_id=? ORDER BY u.name',
            (cid,)).fetchall()
        progress = []
        for s in students:
            subs_a = conn.execute('SELECT COUNT(*) as c FROM submissions WHERE student_id=? AND assignment_id IN (SELECT id FROM assignments WHERE class_id=?)', (s['id'], cid)).fetchone()['c']
            subs_t = conn.execute('SELECT COUNT(*) as c FROM submissions WHERE student_id=? AND topic_id IN (SELECT t.id FROM topics t JOIN groups g ON t.group_id=g.id WHERE g.class_id=?)', (s['id'], cid)).fetchone()['c']
            pres = conn.execute("SELECT COUNT(*) as c FROM attendance WHERE student_id=? AND class_id=? AND status='present'", (s['id'], cid)).fetchone()['c']
            att_pct = round((pres / total_days) * 100) if total_days > 0 else 0
            a_pct = round((subs_a / total_assignments) * 100) if total_assignments > 0 else 0
            t_pct = round((subs_t / total_topics) * 100) if total_topics > 0 else 0
            overall = round((att_pct + a_pct + t_pct) / 3)
            progress.append({
                'name': s['name'], 'usn': s['usn'], 'att': pres, 'att_pct': att_pct,
                'subs_a': subs_a, 'a_pct': a_pct, 'subs_t': subs_t, 't_pct': t_pct, 'overall': overall
            })
        conn.close()
        return jsonify({'success': True, 'data': {
            'progress': progress,
            'totals': {'assignments': total_assignments, 'topics': total_topics, 'days': total_days}
        }})
    else:
        cls = conn.execute('SELECT c.* FROM classes c JOIN enrollments e ON c.id=e.class_id WHERE e.student_id=?', (session['user_id'],)).fetchone()
        if not cls:
            conn.close()
            return jsonify({'success': True, 'data': {}})
        cid = cls['id']
        uid = session['user_id']
        total_a = conn.execute('SELECT COUNT(*) as c FROM assignments WHERE class_id=?', (cid,)).fetchone()['c']
        done_a = conn.execute('SELECT COUNT(*) as c FROM submissions WHERE student_id=? AND assignment_id IN (SELECT id FROM assignments WHERE class_id=?)', (uid, cid)).fetchone()['c']
        total_t = conn.execute('SELECT COUNT(*) as c FROM topics t JOIN groups g ON t.group_id=g.id JOIN group_members gm ON g.id=gm.group_id WHERE g.class_id=? AND gm.student_id=?', (cid, uid)).fetchone()['c']
        done_t = conn.execute('SELECT COUNT(*) as c FROM submissions WHERE student_id=? AND topic_id IN (SELECT t.id FROM topics t JOIN groups g ON t.group_id=g.id JOIN group_members gm ON g.id=gm.group_id WHERE g.class_id=? AND gm.student_id=?)', (uid, cid, uid)).fetchone()['c']
        total_d = conn.execute('SELECT COUNT(DISTINCT date) as c FROM attendance WHERE class_id=?', (cid,)).fetchone()['c']
        pres = conn.execute("SELECT COUNT(*) as c FROM attendance WHERE student_id=? AND class_id=? AND status='present'", (uid, cid)).fetchone()['c']
        att_pct = round((pres / total_d) * 100) if total_d else 0
        a_pct = round((done_a / total_a) * 100) if total_a else 0
        t_pct = round((done_t / total_t) * 100) if total_t else 0
        overall = round((att_pct + a_pct + t_pct) / 3)
        recent_subs = conn.execute('''
            SELECT s.*, a.title as atitle, t.title as ttitle FROM submissions s
            LEFT JOIN assignments a ON s.assignment_id=a.id
            LEFT JOIN topics t ON s.topic_id=t.id
            WHERE s.student_id=? ORDER BY s.submitted_at DESC LIMIT 10''', (uid,)).fetchall()
        conn.close()
        return jsonify({'success': True, 'data': {
            'total_a': total_a, 'done_a': done_a, 'a_pct': a_pct,
            'total_t': total_t, 'done_t': done_t, 't_pct': t_pct,
            'total_d': total_d, 'pres': pres, 'att_pct': att_pct,
            'overall': overall, 'recent_subs': [dict(rs) for rs in recent_subs]
        }})

# ── EVENTS ENDPOINTS ──────────────────────────────────────

@api_bp.route('/events', methods=['GET'])
@auth_required()
def get_events_api():
    conn = get_db()
    role = session.get('role')
    if role == 'teacher':
        cls = get_teacher_class(conn)
        if not cls:
            conn.close()
            return jsonify({'success': True, 'data': []})
        events = conn.execute('SELECT * FROM events WHERE class_id=? ORDER BY event_date DESC', (cls['id'],)).fetchall()
    else:
        cls = conn.execute('SELECT c.* FROM classes c JOIN enrollments e ON c.id=e.class_id WHERE e.student_id=?', (session['user_id'],)).fetchone()
        events = []
        if cls:
            events = conn.execute('SELECT * FROM events WHERE class_id=? ORDER BY event_date DESC', (cls['id'],)).fetchall()
    conn.close()
    return jsonify({'success': True, 'data': [dict(e) for e in events]})

@api_bp.route('/events', methods=['POST'])
@auth_required('teacher')
def create_event_api():
    data = request.get_json() or {}
    title = data.get('title', '').strip()
    desc = data.get('description', '').strip()
    ev_date = data.get('event_date', '').strip()
    ev_type = data.get('event_type', 'event').strip()
    send_mail = data.get('send_email') == True

    if not title or not ev_date:
        return jsonify({'success': False, 'message': 'Title and event date required'}), 400

    conn = get_db()
    cls = get_teacher_class(conn)
    if not cls:
        conn.close()
        return jsonify({'success': False, 'message': 'Class not found'}), 404

    conn.execute('INSERT INTO events(class_id,teacher_id,title,description,event_date,event_type) VALUES(?,?,?,?,?,?)',
                 (cls['id'], session['user_id'], title, desc, ev_date, ev_type))
    notify_class(conn, cls['id'], f'📅 {ev_type.title()}: {title} on {ev_date}')

    cfg = conn.execute('SELECT * FROM email_config WHERE teacher_id=?', (session['user_id'],)).fetchone()
    email_sent = False
    if send_mail and cfg:
        students = conn.execute(
            'SELECT u.email FROM users u JOIN enrollments e ON u.id=e.student_id WHERE e.class_id=? AND u.email IS NOT NULL',
            (cls['id'],)).fetchall()
        emails = [s['email'] for s in students]
        if emails:
            ok, _ = event_email(emails, title, ev_date, ev_type, desc, cfg['gmail'], cfg['app_password'])
            email_sent = ok

    conn.execute('UPDATE events SET email_sent=? WHERE class_id=? AND title=? AND event_date=?',
                 (1 if email_sent else 0, cls['id'], title, ev_date))
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'message': 'Event created successfully'})

# ── NOTIFICATIONS ENDPOINTS ───────────────────────────────

@api_bp.route('/notifications', methods=['GET'])
@auth_required()
def get_notifications_api():
    conn = get_db()
    notifs = conn.execute('SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 30', (session['user_id'],)).fetchall()
    conn.close()
    return jsonify({'success': True, 'data': [dict(n) for n in notifs]})

@api_bp.route('/notifications/<int:nid>/read', methods=['PUT'])
@auth_required()
def mark_notification_read(nid):
    conn = get_db()
    conn.execute('UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?', (nid, session['user_id']))
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'message': 'Notification marked as read'})

# ── TEACHER SUBMISSIONS ENDPOINTS ──────────────────────────

@api_bp.route('/teacher/submissions', methods=['GET'])
@auth_required('teacher')
def get_teacher_submissions():
    conn = get_db()
    cls = get_teacher_class(conn)
    if not cls:
        conn.close()
        return jsonify({'success': True, 'data': []})
    subs = conn.execute('''
        SELECT s.*, u.name as sname, u.usn,
               a.title as atitle, t.title as ttitle, g.name as gname
        FROM submissions s
        JOIN users u ON s.student_id=u.id
        LEFT JOIN assignments a ON s.assignment_id=a.id
        LEFT JOIN topics t ON s.topic_id=t.id
        LEFT JOIN groups g ON s.group_id=g.id
        WHERE (a.class_id=? OR g.class_id=?)
        ORDER BY s.submitted_at DESC''', (cls['id'], cls['id'])).fetchall()
    conn.close()
    return jsonify({'success': True, 'data': [dict(s) for s in subs]})

@api_bp.route('/submissions/<int:submission_id>/grade', methods=['PUT'])
@auth_required('teacher')
def grade_submission_api(submission_id):
    data = request.get_json() or {}
    grade = data.get('grade')
    feedback = data.get('feedback', '')
    if grade is None:
        return jsonify({'success': False, 'message': 'Grade is required'}), 400
    conn = get_db()
    conn.execute('UPDATE submissions SET grade=?, feedback=? WHERE id=?', (grade, feedback, submission_id))
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'message': 'Submission graded successfully'})

# ── SETTINGS ENDPOINTS ────────────────────────────────────

@api_bp.route('/settings', methods=['GET'])
@auth_required('teacher')
def get_settings_api():
    conn = get_db()
    cfg = conn.execute('SELECT gmail FROM email_config WHERE teacher_id=?', (session['user_id'],)).fetchone()
    conn.close()
    return jsonify({'success': True, 'data': {'gmail': cfg['gmail'] if cfg else ''}})

@api_bp.route('/settings', methods=['PUT'])
@auth_required('teacher')
def update_settings_api():
    data = request.get_json() or {}
    gmail = data.get('gmail', '').strip()
    apw = data.get('app_password', '').strip()
    if not gmail or not apw:
        return jsonify({'success': False, 'message': 'Gmail and App Password required'}), 400
    conn = get_db()
    from email_utils import send_email, build_html
    ok, err = send_email(gmail, 'ClassConnect — Gmail Connected ✅',
        build_html('Gmail Connected!', '<p>Your Gmail is now connected to ClassConnect. Automated emails will be sent from this address.</p>'),
        gmail, apw)
    if ok:
        conn.execute('''INSERT INTO email_config(teacher_id,gmail,app_password) VALUES(?,?,?)
                        ON CONFLICT(teacher_id) DO UPDATE SET gmail=excluded.gmail, app_password=excluded.app_password''',
                     (session['user_id'], gmail, apw))
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'message': 'Gmail connected! Test email sent.'})
    else:
        conn.close()
        return jsonify({'success': False, 'message': f'Connection failed: {err}'}), 400

# ── FILE UPLOADS/DOWNLOADS ENDPOINTS ──────────────────────

UPLOAD_FOLDER = os.path.join(_DATA, 'uploads')
ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx', 'png', 'jpg', 'jpeg', 'gif', 'zip', 'rar'}
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25MB
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def secure_filename_custom(filename):
    import uuid
    ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else 'bin'
    return f"{uuid.uuid4().hex}.{ext}"

@api_bp.route('/upload/submission/<int:sub_id>', methods=['POST'])
@auth_required('student')
def upload_submission_file_api(sub_id):
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'No file provided'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'message': 'No file selected'}), 400
    if not allowed_file(file.filename):
        return jsonify({'success': False, 'message': 'File type not allowed'}), 400
    
    file.seek(0, 2)
    size = file.tell()
    if size > MAX_FILE_SIZE:
        return jsonify({'success': False, 'message': f'File too large (max {MAX_FILE_SIZE/(1024*1024):.0f}MB)'}), 400
    file.seek(0)

    conn = get_db()
    sub = conn.execute('SELECT * FROM submissions WHERE id=?', (sub_id,)).fetchone()
    if not sub or sub['student_id'] != session.get('user_id'):
        conn.close()
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    try:
        stored_name = secure_filename_custom(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, stored_name)
        file.save(filepath)
        
        conn.execute('''INSERT INTO file_uploads(submission_id, uploader_id, original_filename, stored_filename, file_size, file_type)
                       VALUES(?, ?, ?, ?, ?, ?)''',
                    (sub_id, session['user_id'], file.filename, stored_name, 
                     size, file.content_type or 'application/octet-stream'))
        conn.execute('UPDATE submissions SET has_file=1 WHERE id=?', (sub_id,))
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'filename': file.filename})
    except Exception as e:
        conn.close()
        return jsonify({'success': False, 'message': str(e)}), 500

@api_bp.route('/download/<int:file_id>', methods=['GET'])
@auth_required()
def download_file_api(file_id):
    conn = get_db()
    file_rec = conn.execute('SELECT * FROM file_uploads WHERE id=?', (file_id,)).fetchone()
    if not file_rec:
        conn.close()
        return jsonify({'success': False, 'message': 'File not found'}), 404
    
    sub = None
    if file_rec['submission_id']:
        sub = conn.execute('SELECT * FROM submissions WHERE id=?', (file_rec['submission_id'],)).fetchone()
    
    authorized = False
    if session.get('role') == 'student' and file_rec['uploader_id'] == session.get('user_id'):
        authorized = True
    elif session.get('role') == 'teacher':
        if sub and file_rec['submission_id']:
            a = conn.execute('SELECT * FROM assignments WHERE id=?', (sub['assignment_id'],)).fetchone()
            if a and a['teacher_id'] == session.get('user_id'):
                authorized = True
    
    if not authorized:
        conn.close()
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    filepath = os.path.join(UPLOAD_FOLDER, file_rec['stored_filename'])
    if not os.path.exists(filepath):
        conn.close()
        return jsonify({'success': False, 'message': 'File not found on disk'}), 404
    
    conn.close()
    from flask import send_file
    return send_file(filepath, as_attachment=True, download_name=file_rec['original_filename'])

# Register blueprint to app
def init_api(app: Flask):
    """Initialize API blueprint with Flask app"""
    app.register_blueprint(api_bp)
