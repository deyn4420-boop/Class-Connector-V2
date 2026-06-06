@echo off
title ClassConnect — EXE Builder
color 0A

echo.
echo  ==========================================
echo   ClassConnect — Building .EXE Files
echo  ==========================================
echo.

:: Check Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Python not found. Install from https://python.org
    pause
    exit /b 1
)

echo  [1/4] Installing required packages...
pip install flask apscheduler PyQt6 PyQt6-WebEngine bleak bless pyinstaller --quiet
if errorlevel 1 (
    echo  [ERROR] Failed to install packages.
    pause
    exit /b 1
)

echo  [2/4] Cleaning previous builds...
if exist "dist" rmdir /s /q "dist"
if exist "build" rmdir /s /q "build"

echo  [3/4] Building Teacher App (ClassConnect_Teacher.exe)...
python -m PyInstaller teacher.spec --noconfirm --clean
if errorlevel 1 (
    echo  [ERROR] Teacher build failed.
    pause
    exit /b 1
)

echo  [4/4] Building Student App (ClassConnect_Student.exe)...
python -m PyInstaller student.spec --noconfirm --clean
if errorlevel 1 (
    echo  [ERROR] Student build failed.
    pause
    exit /b 1
)

echo.
echo  ==========================================
echo   BUILD SUCCESSFUL!
echo  ==========================================
echo.
echo  Teacher App:
echo    dist\ClassConnect_Teacher\ClassConnect_Teacher.exe
echo.
echo  Student App:
echo    dist\ClassConnect_Student\ClassConnect_Student.exe
echo.
echo  Share the entire folder (not just the .exe)
echo  to each person — the folder has required files.
echo.
echo  TIP: Zip each dist folder to share easily.
echo  ==========================================
echo.
pause
