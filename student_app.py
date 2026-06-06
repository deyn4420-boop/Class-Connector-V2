"""
student_app.py — ClassConnect Student Desktop App
Run with: python student_app.py

The app scans for the teacher's Bluetooth/UDP broadcast.
When found  → connects to classroom web interface.
When lost   → auto-disconnects (teacher left the class).
"""

import sys
import os
import threading
import time

os.environ.setdefault("QTWEBENGINE_CHROMIUM_FLAGS", "--disable-gpu")

from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QLabel, QPushButton, QStackedWidget, QFrame, QSizePolicy,
    QGraphicsOpacityEffect, QMessageBox
)
from PyQt6.QtWebEngineWidgets import QWebEngineView
from PyQt6.QtWebEngineCore import QWebEnginePage
from PyQt6.QtCore import (Qt, QTimer, QUrl, QPropertyAnimation,
                          QEasingCurve, pyqtSignal, QThread, QObject)
from PyQt6.QtGui import QFont, QColor

# ── Custom Web Page for Credential Interception ────────────────
class CustomWebPage(QWebEnginePage):
    def __init__(self, parent=None, console_callback=None):
        super().__init__(parent)
        self.console_callback = console_callback

    def javaScriptConsoleMessage(self, level, message, lineNumber, sourceID):
        if self.console_callback:
            self.console_callback(level, message, lineNumber, sourceID)
        super().javaScriptConsoleMessage(level, message, lineNumber, sourceID)

# ── Signals bridge (thread → UI) ──────────────────────────────
class ScanSignals(QObject):
    found = pyqtSignal(str, int)    # ip, port
    lost  = pyqtSignal()

# ── Bluetooth scanner thread ───────────────────────────────────
class ScannerThread(QThread):
    def __init__(self, signals: ScanSignals):
        super().__init__()
        self.signals = signals
        self._scanner = None

    def run(self):
        from bluetooth_manager import ClassroomScanner
        self._scanner = ClassroomScanner(
            on_found=lambda ip, port: self.signals.found.emit(ip, port),
            on_lost=self.signals.lost.emit,
        )
        self._scanner.start()
        while self._scanner.running:
            time.sleep(0.5)

    def stop(self):
        if self._scanner:
            self._scanner.stop()

    @property
    def method(self):
        return self._scanner.method if self._scanner else "—"

# ── Stylesheet ─────────────────────────────────────────────────
STYLE = """
* { font-family: 'Segoe UI', 'SF Pro Display', Arial, sans-serif; }

QMainWindow, QWidget { background: #080d17; color: #f1f5f9; }

#scan_page { background: #080d17; }

#title_big {
    font-size: 32px;
    font-weight: 800;
    color: #6366f1;
    letter-spacing: -1px;
}

#subtitle {
    font-size: 15px;
    color: #9ca3af;
    margin-bottom: 8px;
}

#scan_status {
    font-size: 14px;
    color: #f59e0b;
    font-weight: 600;
    margin-top: 8px;
}

#scan_method {
    font-size: 11px;
    color: #4a5568;
    margin-top: 4px;
}

#dot_row {
    font-size: 26px;
    letter-spacing: 6px;
    color: #6366f1;
}

#found_box {
    background: #111827;
    border: 1px solid #2d3748;
    border-radius: 14px;
    padding: 20px 28px;
    margin-top: 20px;
}

#found_name {
    font-size: 18px;
    font-weight: 700;
    color: #10b981;
}

#found_ip {
    font-family: 'Consolas', monospace;
    font-size: 12px;
    color: #4a5568;
    margin-top: 4px;
}

QPushButton#btn_connect {
    background: #6366f1;
    color: white;
    border: none;
    border-radius: 10px;
    padding: 12px 32px;
    font-size: 15px;
    font-weight: 700;
    margin-top: 12px;
}
QPushButton#btn_connect:hover { background: #4f46e5; }

/* Status bar (connected state) */
#statusbar {
    background: #111827;
    border-top: 1px solid #2d3748;
    padding: 6px 16px;
    max-height: 36px;
}
#sb_bt { color: #10b981; font-size: 12px; font-weight: 600; }
#sb_info { color: #4a5568; font-size: 11px; }

QPushButton#btn_leave {
    background: transparent;
    color: #ef4444;
    border: 1px solid #ef4444;
    border-radius: 6px;
    padding: 4px 12px;
    font-size: 11px;
    font-weight: 600;
}
QPushButton#btn_leave:hover { background: rgba(239,68,68,0.1); }
"""

# ── Animated dots widget ───────────────────────────────────────
class AnimatedDots(QLabel):
    def __init__(self, parent=None):
        super().__init__("● ● ●", parent)
        self.setObjectName("dot_row")
        self.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self._step = 0
        self._timer = QTimer()
        self._timer.timeout.connect(self._tick)
        self._timer.start(500)

    def _tick(self):
        frames = ["● ○ ○", "● ● ○", "● ● ●", "○ ● ●", "○ ○ ●", "○ ○ ○"]
        self.setText(frames[self._step % len(frames)])
        self._step += 1

    def stop(self):
        self._timer.stop()

# ── Main Window ────────────────────────────────────────────────
class StudentApp(QMainWindow):

    def __init__(self):
        super().__init__()
        self.setWindowTitle("ClassConnect — Student")
        self.setMinimumSize(1100, 700)
        self.setStyleSheet(STYLE)

        self._connected_ip   = None
        self._connected_port = None

        self._signals = ScanSignals()
        self._signals.found.connect(self._on_classroom_found)
        self._signals.lost.connect(self._on_classroom_lost)

        self._scanner_thread = ScannerThread(self._signals)

        self._build_ui()
        self._scanner_thread.start()

    # ── UI ──────────────────────────────────────────────────────
    def _build_ui(self):
        self._stack = QStackedWidget()
        self._stack.addWidget(self._build_scan_page())      # index 0
        self._stack.addWidget(self._build_connected_page()) # index 1
        self.setCentralWidget(self._stack)
        self._stack.setCurrentIndex(0)

    # ── Scanning page ──────────────────────────────────────────
    def _build_scan_page(self):
        page = QWidget()
        page.setObjectName("scan_page")
        layout = QVBoxLayout(page)
        layout.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.setSpacing(8)

        # Antenna icon
        icon = QLabel("📡")
        icon.setAlignment(Qt.AlignmentFlag.AlignCenter)
        icon.setStyleSheet("font-size:64px;margin-bottom:8px;")
        layout.addWidget(icon)

        title = QLabel("ClassConnect")
        title.setObjectName("title_big")
        title.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(title)

        sub = QLabel("Student App")
        sub.setObjectName("subtitle")
        sub.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(sub)

        layout.addSpacing(20)

        self._dots = AnimatedDots()
        layout.addWidget(self._dots)

        self._lbl_scan_status = QLabel("Scanning for classroom…")
        self._lbl_scan_status.setObjectName("scan_status")
        self._lbl_scan_status.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(self._lbl_scan_status)

        self._lbl_scan_method = QLabel("via Bluetooth / Wi-Fi")
        self._lbl_scan_method.setObjectName("scan_method")
        self._lbl_scan_method.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(self._lbl_scan_method)

        # Found box (hidden until classroom appears)
        self._found_box = QWidget()
        self._found_box.setObjectName("found_box")
        self._found_box.hide()
        found_layout = QVBoxLayout(self._found_box)
        found_layout.setAlignment(Qt.AlignmentFlag.AlignCenter)

        self._lbl_found_name = QLabel("📚  Classroom Found!")
        self._lbl_found_name.setObjectName("found_name")
        self._lbl_found_name.setAlignment(Qt.AlignmentFlag.AlignCenter)
        found_layout.addWidget(self._lbl_found_name)

        self._lbl_found_ip = QLabel("")
        self._lbl_found_ip.setObjectName("found_ip")
        self._lbl_found_ip.setAlignment(Qt.AlignmentFlag.AlignCenter)
        found_layout.addWidget(self._lbl_found_ip)

        self._btn_connect = QPushButton("Join Classroom →")
        self._btn_connect.setObjectName("btn_connect")
        self._btn_connect.clicked.connect(self._join_classroom)
        found_layout.addWidget(self._btn_connect,
                               alignment=Qt.AlignmentFlag.AlignCenter)

        layout.addWidget(self._found_box, alignment=Qt.AlignmentFlag.AlignCenter)
        layout.addStretch()

        return page

    # ── Connected page ─────────────────────────────────────────
    def _build_connected_page(self):
        container = QWidget()
        v = QVBoxLayout(container)
        v.setContentsMargins(0, 0, 0, 0)
        v.setSpacing(0)

        self._webview = QWebEngineView()
        self._webpage = CustomWebPage(self._webview, self._on_console_message)
        self._webview.setPage(self._webpage)
        self._webview.loadFinished.connect(self._on_load_finished)
        v.addWidget(self._webview)

        # Status bar
        statusbar = QWidget()
        statusbar.setObjectName("statusbar")
        sb_layout = QHBoxLayout(statusbar)
        sb_layout.setContentsMargins(12, 4, 12, 4)

        self._sb_bt = QLabel("📡  Bluetooth Connected")
        self._sb_bt.setObjectName("sb_bt")
        sb_layout.addWidget(self._sb_bt)

        sb_layout.addStretch()

        self._sb_info = QLabel("")
        self._sb_info.setObjectName("sb_info")
        sb_layout.addWidget(self._sb_info)

        btn_leave = QPushButton("Leave Classroom")
        btn_leave.setObjectName("btn_leave")
        btn_leave.clicked.connect(self._manual_leave)
        sb_layout.addWidget(btn_leave)

        v.addWidget(statusbar)
        return container

    # ── Slots ───────────────────────────────────────────────────
    def _on_classroom_found(self, ip: str, port: int):
        self._connected_ip   = ip
        self._connected_port = port

        self._lbl_scan_status.setText("✅  Classroom detected!")
        self._lbl_scan_status.setStyleSheet("color:#10b981;font-weight:700;font-size:14px;")
        self._lbl_found_ip.setText(f"{ip}:{port}")
        self._found_box.show()

        method = self._scanner_thread.method
        self._lbl_scan_method.setText(f"Connected via {method}")

    def _animate_stack_transition(self, target_index):
        if self._stack.currentIndex() == target_index:
            return
        
        new_widget = self._stack.widget(target_index)
        eff = QGraphicsOpacityEffect(new_widget)
        new_widget.setGraphicsEffect(eff)
        
        self._stack.setCurrentIndex(target_index)
        
        self._anim = QPropertyAnimation(eff, b"opacity")
        self._anim.setDuration(350)
        self._anim.setStartValue(0.0)
        self._anim.setEndValue(1.0)
        self._anim.setEasingCurve(QEasingCurve.Type.InOutQuad)
        self._anim.finished.connect(lambda: new_widget.setGraphicsEffect(None))
        self._anim.start()

    def _join_classroom(self):
        if not self._connected_ip:
            return
        url = f"http://{self._connected_ip}:{self._connected_port}/login"
        self._webview.setUrl(QUrl(url))
        self._sb_info.setText(f"{self._connected_ip}:{self._connected_port}  •  {self._scanner_thread.method}")
        self._animate_stack_transition(1)
        self._dots.stop()

    def _on_classroom_lost(self):
        """Called when teacher's Bluetooth disappears — auto disconnect."""
        self._connected_ip   = None
        self._connected_port = None

        # Log out by loading blank (Flask session remains but UI is gone)
        self._webview.setUrl(QUrl("about:blank"))
        self._animate_stack_transition(0)

        # Reset scan page
        self._dots._timer.start(500)
        self._found_box.hide()
        self._lbl_scan_status.setText("📴  Teacher left the classroom")
        self._lbl_scan_status.setStyleSheet("color:#ef4444;font-weight:700;font-size:14px;")
        self._lbl_scan_method.setText("Scanning for a new session…")

        # After 3 seconds reset to normal scanning state
        QTimer.singleShot(3000, self._reset_scan_ui)

        QMessageBox.information(
            self, "Disconnected",
            "Your teacher has left the classroom.\n"
            "The session has ended. You have been disconnected.",
        )

    def _reset_scan_ui(self):
        self._lbl_scan_status.setText("Scanning for classroom…")
        self._lbl_scan_status.setStyleSheet(
            "color:#f59e0b;font-weight:600;font-size:14px;")
        self._lbl_scan_method.setText(
            f"via {self._scanner_thread.method}")

    def _manual_leave(self):
        reply = QMessageBox.question(
            self, "Leave Classroom",
            "Are you sure you want to leave the classroom?",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No,
        )
        if reply == QMessageBox.StandardButton.Yes:
            self._webview.setUrl(QUrl("about:blank"))
            self._animate_stack_transition(0)
            self._reset_scan_ui()

    def _on_load_finished(self, ok):
        if ok:
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

    def closeEvent(self, event):
        self._scanner_thread.stop()
        event.accept()


# ── Entry point ────────────────────────────────────────────────
if __name__ == "__main__":
    app = QApplication(sys.argv)
    app.setApplicationName("ClassConnect Student")
    window = StudentApp()
    window.show()
    sys.exit(app.exec())
