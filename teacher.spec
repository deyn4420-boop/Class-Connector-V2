# -*- mode: python ; coding: utf-8 -*-
# teacher.spec  — PyInstaller build spec for ClassConnect Teacher App

import os
from PyInstaller.utils.hooks import collect_data_files, collect_submodules

block_cipher = None

# ── Data files to bundle ─────────────────────────────────────────
added_datas = [
    ('templates',    'templates'),   # Jinja2 HTML templates
    ('dist/frontend', 'dist/frontend'), # React frontend assets
    ('schema.sql',   '.'),           # Database schema
    ('email_utils.py', '.'),         # Email helper (imported by app.py)
    ('app.py',       '.'),           # Flask application
    ('bluetooth_manager.py', '.'),   # Bluetooth logic
]

# ── Hidden imports (modules PyInstaller may miss) ────────────────
hidden = [
    # Flask stack
    'flask', 'flask.templating', 'flask.json', 'jinja2', 'jinja2.ext',
    'werkzeug', 'werkzeug.serving', 'werkzeug.middleware.shared_data',
    'click',
    # Scheduler
    'apscheduler', 'apscheduler.schedulers.background',
    'apscheduler.triggers.interval', 'apscheduler.executors.pool',
    'apscheduler.jobstores.memory',
    # Bluetooth
    'bleak', 'bleak.backends', 'bleak.backends.winrt',
    'bless', 'bless.backends.winrt',
    # Email / stdlib
    'smtplib', 'ssl', 'email', 'email.mime',
    'email.mime.text', 'email.mime.multipart',
    # DB
    'sqlite3',
    # Our modules
    'email_utils', 'app', 'bluetooth_manager',
]

a = Analysis(
    ['teacher_app.py'],
    pathex=['.'],
    binaries=[],
    datas=added_datas,
    hiddenimports=hidden,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['tkinter', 'matplotlib', 'numpy', 'PIL'],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='ClassConnect_Teacher',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,          # ← No black terminal window
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    # icon='assets/icon_teacher.ico',   # Uncomment if you have an icon
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='ClassConnect_Teacher',
)
