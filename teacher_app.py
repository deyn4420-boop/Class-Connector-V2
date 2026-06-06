"""
teacher_app.py — ClassConnect Teacher Desktop App
Run with: python teacher_app.py
"""

import sys
import os
import socket
import threading
import time

# Must set before importing Qt
os.environ.setdefault("QTWEBENGINE_CHROMIUM_FLAGS", "--disable-gpu")

from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QLabel, QPushButton, QListWidget, QListWidgetItem, QSplitter,
    QFrame, QSizePolicy, QMessageBox, QSystemTrayIcon, QMenu
)
from PyQt6.QtWebEngineWidgets import QWebEngineView
from PyQt6.QtWebEngineCore import QWebEnginePage
from PyQt6.QtCore import Qt, QTimer, QUrl, pyqtSignal, QThread
from PyQt6.QtGui import QIcon, QFont, QPixmap, QColor

# ── Custom Web Page for Credential Interception ────────────────
class CustomWebPage(QWebEnginePage):
    def __init__(self, parent=None, console_callback=None):
        super().__init__(parent)
        self.console_callback = console_callback

    def javaScriptConsoleMessage(self, level, message, lineNumber, sourceID):
        if self.console_callback:
            self.console_callback(level, message, lineNumber, sourceID)
        super().javaScriptConsoleMessage(level, message, lineNumber, sourceID)

FLASK_PORT = 5000

# ── Helpers ───────────────────────────────────────────────────
def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

# ── Flask runner thread ────────────────────────────────────────
class FlaskThread(QThread):
    ready = pyqtSignal()

    def run(self):
        import app as flask_app
        if not os.path.exists(flask_app.DATABASE):
            flask_app.init_db()
        time.sleep(0.5)
        self.ready.emit()
        flask_app.app.run(host="0.0.0.0", port=FLASK_PORT,
                          debug=False, use_reloader=False)

# ── Bluetooth broadcaster thread ───────────────────────────────
class BroadcastThread(QThread):
    status_changed = pyqtSignal(str, str)   # (method, message)

    def __init__(self, ip, port):
        super().__init__()
        self.ip = ip
        self.port = port
        self._broadcaster = None

    def run(self):
        from bluetooth_manager import ClassroomBroadcaster
        self._broadcaster = ClassroomBroadcaster(self.ip, self.port)
        self._broadcaster.start()
        time.sleep(1)
        self.status_changed.emit(self._broadcaster.method,
                                 f"Broadcasting via {self._broadcaster.method}")
        while self._broadcaster.running:
            time.sleep(1)

    def stop(self):
        if self._broadcaster:
            self._broadcaster.stop()

# ── Stylesheet ─────────────────────────────────────────────────
STYLE = """
* { font-family: 'Segoe UI', 'SF Pro Display', Arial, sans-serif; }

QMainWindow, QWidget { background: #080d17; color: #f1f5f9; }

#sidebar {
    background: #111827;
    border-right: 1px solid #2d3748;
    min-width: 220px;
    max-width: 260px;
}

#brand {
    font-size: 18px;
    font-weight: 800;
    color: #6366f1;
    padding: 4px 0 12px 0;
    letter-spacing: -0.5px;
}

#section_label {
    font-size: 10px;
    font-weight: 700;
    color: #4a5568;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    margin-top: 4px;
}

#status_dot {
    font-size: 22px;
}

#ip_label {
    font-family: 'Consolas', monospace;
    font-size: 13px;
    color: #6366f1;
    background: #1f2937;
    border: 1px solid #2d3748;
    border-radius: 6px;
    padding: 6px 10px;
}

#bt_status {
    font-size: 12px;
    font-weight: 600;
    padding: 4px 0;
}

#student_list {
    background: #1f2937;
    border: 1px solid #2d3748;
    border-radius: 8px;
    color: #f1f5f9;
    font-size: 12px;
}

#student_list::item {
    padding: 7px 10px;
    border-bottom: 1px solid #2d3748;
}

#student_list::item:selected {
    background: #312e81;
}

QPushButton#btn_open {
    background: #6366f1;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 9px;
    font-weight: 700;
    font-size: 13px;
}
QPushButton#btn_open:hover { background: #4f46e5; }

QPushButton#btn_disconnect {
    background: transparent;
    color: #ef4444;
    border: 1px solid #ef4444;
    border-radius: 8px;
    padding: 7px;
    font-weight: 600;
    font-size: 12px;
}
QPushButton#btn_disconnect:hover { background: rgba(239,68,68,0.1); }

QSplitter::handle { background: #2d3748; width: 1px; }

#conn_count {
    font-size: 28px;
    font-weight: 800;
    color: #10b981;
}

#divider {
    background: #2d3748;
    max-height: 1px;
    margin: 4px 0;
}
"""

# ── Main Window ────────────────────────────────────────────────
class TeacherApp(QMainWindow):
    def __init__(self):
        super().__init__()
        self.server_ip = get_local_ip()
        self.setWindowTitle("ClassConnect — Teacher Dashboard")
        self.setMinimumSize(1280, 760)
        self.setStyleSheet(STYLE)

        self._flask_thread = FlaskThread()
        self._bt_thread = BroadcastThread(self.server_ip, FLASK_PORT)
        self._student_refresh_timer = QTimer()

        self._build_ui()
        self._start_services()

    # ── UI ──────────────────────────────────────────────────────
    def _build_ui(self):
        splitter = QSplitter(Qt.Orientation.Horizontal)
        splitter.addWidget(self._build_sidebar())
        splitter.addWidget(self._build_webview())
        splitter.setSizes([240, 1040])
        splitter.setHandleWidth(1)
        self.setCentralWidget(splitter)

    def _build_sidebar(self):
        sidebar = QWidget()
        sidebar.setObjectName("sidebar")
        layout = QVBoxLayout(sidebar)
        layout.setContentsMargins(16, 20, 16, 20)
        layout.setSpacing(10)

        # Brand
        brand = QLabel("ClassConnect")
        brand.setObjectName("brand")
        layout.addWidget(brand)

        role_lbl = QLabel("👩‍🏫  Teacher Mode")
        role_lbl.setStyleSheet("color:#9ca3af;font-size:12px;")
        layout.addWidget(role_lbl)

        layout.addWidget(self._divider())

        # Bluetooth Status
        self._lbl_bt_header = QLabel("BLUETOOTH")
        self._lbl_bt_header.setObjectName("section_label")
        layout.addWidget(self._lbl_bt_header)

        self._lbl_bt_dot = QLabel("📡  Starting…")
        self._lbl_bt_dot.setObjectName("bt_status")
        self._lbl_bt_dot.setStyleSheet("color:#f59e0b;")
        layout.addWidget(self._lbl_bt_dot)

        self._lbl_bt_method = QLabel("Initialising…")
        self._lbl_bt_method.setStyleSheet("color:#4a5568;font-size:11px;")
        layout.addWidget(self._lbl_bt_method)

        layout.addWidget(self._divider())

        # Server IP
        ip_hdr = QLabel("SERVER ADDRESS")
        ip_hdr.setObjectName("section_label")
        layout.addWidget(ip_hdr)

        self._lbl_ip = QLabel(f"{self.server_ip}:{FLASK_PORT}")
        self._lbl_ip.setObjectName("ip_label")
        self._lbl_ip.setWordWrap(True)
        layout.addWidget(self._lbl_ip)

        layout.addWidget(self._divider())

        # Connected Students
        stu_hdr = QLabel("STUDENTS CONNECTED")
        stu_hdr.setObjectName("section_label")
        layout.addWidget(stu_hdr)

        self._lbl_count = QLabel("0")
        self._lbl_count.setObjectName("conn_count")
        layout.addWidget(self._lbl_count)

        self._student_list = QListWidget()
        self._student_list.setObjectName("student_list")
        self._student_list.setMaximumHeight(200)
        layout.addWidget(self._student_list)

        layout.addStretch()
        layout.addWidget(self._divider())

        # Buttons
        btn_reload = QPushButton("🔄  Reload Dashboard")
        btn_reload.setObjectName("btn_open")
        btn_reload.clicked.connect(self._reload_webview)
        layout.addWidget(btn_reload)

        btn_disc = QPushButton("⏹  Close Classroom")
        btn_disc.setObjectName("btn_disconnect")
        btn_disc.clicked.connect(self.close)
        layout.addWidget(btn_disc)

        return sidebar

    def _build_webview(self):
        container = QWidget()
        layout = QVBoxLayout(container)
        layout.setContentsMargins(0, 0, 0, 0)

        # Loading bar
        self._loading_label = QLabel("⏳  Starting Flask server…")
        self._loading_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self._loading_label.setStyleSheet(
            "background:#111827;color:#9ca3af;padding:12px;font-size:13px;"
            "border-bottom:1px solid #2d3748;")
        layout.addWidget(self._loading_label)

        self._webview = QWebEngineView()
        self._webpage = CustomWebPage(self._webview, self._on_console_message)
        self._webview.setPage(self._webpage)
        self._webview.loadFinished.connect(self._on_load_finished)
        layout.addWidget(self._webview)

        return container

    def _divider(self):
        line = QFrame()
        line.setObjectName("divider")
        line.setFrameShape(QFrame.Shape.HLine)
        line.setStyleSheet("background:#2d3748;max-height:1px;margin:4px 0;")
        return line

    # ── Services ────────────────────────────────────────────────
    def _start_services(self):
        self._flask_thread.ready.connect(self._on_flask_ready)
        self._flask_thread.start()

        self._bt_thread.status_changed.connect(self._on_bt_status)
        self._bt_thread.start()

        self._student_refresh_timer.timeout.connect(self._refresh_students)
        self._student_refresh_timer.start(4000)

    def _on_flask_ready(self):
        self._loading_label.hide()
        self._webview.setUrl(QUrl(f"http://localhost:{FLASK_PORT}/login"))

    def _on_bt_status(self, method, msg):
        self._lbl_bt_method.setText(f"Method: {method}")
        if method in ("BLE", "UDP"):
            self._lbl_bt_dot.setText("📡  Broadcasting")
            self._lbl_bt_dot.setStyleSheet("color:#10b981;font-weight:700;")
        else:
            self._lbl_bt_dot.setText("⚠️  Limited")
            self._lbl_bt_dot.setStyleSheet("color:#f59e0b;")

    def _on_load_finished(self, ok):
        if ok:
            self._loading_label.hide()
            url_str = self._webview.url().toString()
            if "/login" in url_str:
                self._inject_saved_logins()

    def _on_console_message(self, level, message, line, source):
        if message.startswith("SAVE_CREDS:"):
            try:
                creds_str = message.split("SAVE_CREDS:")[1]
                import json
                data = json.loads(creds_str)
                login_id = data.get("login_id")
                password = data.get("password")
                if login_id and password:
                    self._save_login(login_id, password)
            except Exception as e:
                print(f"Error handling SAVE_CREDS: {e}")
        elif message.startswith("DELETE_CREDS:"):
            try:
                login_id = message.split("DELETE_CREDS:")[1]
                self._delete_login(login_id)
            except Exception as e:
                print(f"Error handling DELETE_CREDS: {e}")

    def _get_credentials_path(self):
        _DATA = os.path.join(os.path.expanduser('~'), 'ClassConnect')
        os.makedirs(_DATA, exist_ok=True)
        return os.path.join(_DATA, 'saved_logins.json')

    def _load_saved_logins(self):
        path = self._get_credentials_path()
        if os.path.exists(path):
            try:
                import json
                with open(path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception:
                return []
        return []

    def _save_login(self, login_id, password):
        logins = self._load_saved_logins()
        logins = [x for x in logins if x.get('login_id') != login_id]
        logins.append({'login_id': login_id, 'password': password})
        path = self._get_credentials_path()
        try:
            import json
            with open(path, 'w', encoding='utf-8') as f:
                json.dump(logins, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Error saving credentials: {e}")

    def _delete_login(self, login_id):
        logins = self._load_saved_logins()
        logins = [x for x in logins if x.get('login_id') != login_id]
        path = self._get_credentials_path()
        try:
            import json
            with open(path, 'w', encoding='utf-8') as f:
                json.dump(logins, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Error deleting credentials: {e}")

    def _inject_saved_logins(self):
        logins = self._load_saved_logins()
        import json
        logins_json = json.dumps(logins)
        
        js_code = f"""
        (function() {{
            var form = document.querySelector('form');
            if (form && !document.getElementById('remember_me_container')) {{
                var rememberContainer = document.createElement('div');
                rememberContainer.id = 'remember_me_container';
                rememberContainer.className = 'form-group';
                rememberContainer.style.display = 'flex';
                rememberContainer.style.alignItems = 'center';
                rememberContainer.style.gap = '0.5rem';
                rememberContainer.style.marginTop = '0.75rem';
                rememberContainer.style.marginBottom = '0.75rem';

                var checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = 'remember_me';
                checkbox.name = 'remember_me';
                checkbox.style.width = 'auto';
                checkbox.style.margin = '0';
                checkbox.style.cursor = 'pointer';
                checkbox.checked = true;

                var label = document.createElement('label');
                label.htmlFor = 'remember_me';
                label.innerText = 'Remember Me';
                label.style.marginBottom = '0';
                label.style.cursor = 'pointer';
                label.style.fontSize = '0.85rem';
                label.style.textTransform = 'none';
                label.style.letterSpacing = 'normal';

                rememberContainer.appendChild(checkbox);
                rememberContainer.appendChild(label);

                var btn = form.querySelector('button[type="submit"]');
                form.insertBefore(rememberContainer, btn);

                form.addEventListener('submit', function(e) {{
                    var loginId = form.querySelector('input[name="login_id"]').value;
                    var password = form.querySelector('input[name="password"]').value;
                    if (checkbox.checked) {{
                        console.log("SAVE_CREDS:" + JSON.stringify({{
                            login_id: loginId,
                            password: password
                        }}));
                    }}
                }});
            }}

            var savedAccounts = {logins_json};
            if (savedAccounts && savedAccounts.length > 0 && !document.getElementById('saved_accounts_container')) {{
                var card = document.querySelector('.card');
                if (card) {{
                    var container = document.createElement('div');
                    container.id = 'saved_accounts_container';
                    container.style.marginBottom = '1.5rem';
                    container.style.background = 'var(--surface2)';
                    container.style.border = '1px solid var(--border)';
                    container.style.borderRadius = 'var(--radius)';
                    container.style.padding = '1rem';
                    
                    var title = document.createElement('h3');
                    title.innerText = 'Saved Accounts';
                    title.style.fontSize = '0.8rem';
                    title.style.color = 'var(--muted)';
                    title.style.textTransform = 'uppercase';
                    title.style.letterSpacing = '1px';
                    title.style.marginBottom = '0.75rem';
                    container.appendChild(title);

                    var list = document.createElement('div');
                    list.style.display = 'flex';
                    list.style.flexDirection = 'column';
                    list.style.gap = '0.5rem';

                    savedAccounts.forEach(function(acc) {{
                        var item = document.createElement('div');
                        item.style.display = 'flex';
                        item.style.alignItems = 'center';
                        item.style.justifyContent = 'space-between';
                        item.style.background = 'var(--surface)';
                        item.style.border = '1px solid var(--border)';
                        item.style.borderRadius = '8px';
                        item.style.padding = '0.6rem 0.8rem';
                        item.style.cursor = 'pointer';
                        item.style.transition = 'all 0.2s';
                        
                        item.onmouseenter = function() {{
                            item.style.borderColor = 'var(--primary)';
                            item.style.transform = 'translateX(2px)';
                        }};
                        item.onmouseleave = function() {{
                            item.style.borderColor = 'var(--border)';
                            item.style.transform = 'none';
                        }};

                        var details = document.createElement('div');
                        details.style.display = 'flex';
                        details.style.flexDirection = 'column';
                        details.style.flex = '1';
                        details.onclick = function() {{
                            form.querySelector('input[name="login_id"]').value = acc.login_id;
                            form.querySelector('input[name="password"]').value = acc.password;
                            form.querySelector('button[type="submit"]').click();
                        }};

                        var name = document.createElement('span');
                        name.innerText = acc.login_id;
                        name.style.fontSize = '0.9rem';
                        name.style.fontWeight = '600';
                        name.style.color = 'var(--text)';
                        
                        var type = document.createElement('small');
                        type.innerText = 'Click to log in';
                        type.style.color = 'var(--muted)';
                        type.style.fontSize = '0.75rem';

                        details.appendChild(name);
                        details.appendChild(type);
                        item.appendChild(details);

                        var delBtn = document.createElement('button');
                        delBtn.innerText = '✕';
                        delBtn.style.background = 'none';
                        delBtn.style.border = 'none';
                        delBtn.style.color = 'var(--red)';
                        delBtn.style.fontSize = '0.8rem';
                        delBtn.style.cursor = 'pointer';
                        delBtn.style.padding = '0.2rem 0.4rem';
                        delBtn.onclick = function(e) {{
                            e.stopPropagation();
                            console.log("DELETE_CREDS:" + acc.login_id);
                            item.remove();
                            if (list.children.length === 0) {{
                                container.remove();
                            }}
                        }};
                        item.appendChild(delBtn);

                        list.appendChild(item);
                    }});

                    container.appendChild(list);
                    card.parentNode.insertBefore(container, card);
                }}
            }}
        }})();
        """
        self._webview.page().runJavaScript(js_code)

    def _reload_webview(self):
        self._webview.reload()

    def _refresh_students(self):
        """Query Flask DB for active sessions / enrolled students."""
        try:
            import sqlite3
            conn = sqlite3.connect("classroom.db")
            conn.row_factory = sqlite3.Row
            rows = conn.execute(
                "SELECT u.name, u.usn FROM users u WHERE u.role='student' ORDER BY u.name"
            ).fetchall()
            conn.close()

            self._student_list.clear()
            for r in rows:
                item = QListWidgetItem(f"🎓 {r['name']}  ({r['usn'] or '—'})")
                self._student_list.addItem(item)
            self._lbl_count.setText(str(len(rows)))
        except Exception:
            pass

    # ── Close ───────────────────────────────────────────────────
    def closeEvent(self, event):
        reply = QMessageBox.question(
            self, "Close Classroom",
            "Closing will stop the Bluetooth broadcast.\n"
            "All students will be disconnected from the classroom.\n\nContinue?",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No,
            QMessageBox.StandardButton.No
        )
        if reply == QMessageBox.StandardButton.Yes:
            self._bt_thread.stop()
            self._student_refresh_timer.stop()
            event.accept()
        else:
            event.ignore()


# ── Entry point ────────────────────────────────────────────────
if __name__ == "__main__":
    app = QApplication(sys.argv)
    app.setApplicationName("ClassConnect Teacher")
    window = TeacherApp()
    window.show()
    sys.exit(app.exec())
