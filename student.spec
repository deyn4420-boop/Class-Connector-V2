# -*- mode: python ; coding: utf-8 -*-
# student.spec  — PyInstaller build spec for ClassConnect Student App

block_cipher = None

added_datas = [
    ('bluetooth_manager.py', '.'),
]

hidden = [
    'bleak', 'bleak.backends', 'bleak.backends.winrt',
    'bless', 'bless.backends.winrt',
    'bluetooth_manager',
]

a = Analysis(
    ['student_app.py'],
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
    name='ClassConnect_Student',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    # icon='assets/icon_student.ico',
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='ClassConnect_Student',
)
