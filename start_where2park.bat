@echo off
echo Starting Where2Park - Smart Parking Solution
echo ============================================

echo.
echo 1. Installing Python dependencies...
pip install flask flask-cors pandas scikit-learn numpy

echo.
echo 2. Starting ML API Server...
start "Where2Park API" python api_server.py

echo.
echo 3. Waiting for server to start...
timeout /t 3 /nobreak > nul

echo.
echo 4. Opening Where2Park website...
start "" index.html

echo.
echo ============================================
echo Where2Park is now running!
echo.
echo - Website: index.html (opened in browser)
echo - ML API: http://localhost:5000
echo.
echo Features available:
echo - View all parking spots on interactive map
echo - Get AI-powered recommendations based on your location
echo - Real-time status updates
echo - Book parking spots
echo - Add new parking locations
echo.
echo Press any key to close this window...
pause > nul