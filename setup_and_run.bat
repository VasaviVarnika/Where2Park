@echo off
echo ========================================
echo    Where2Park - Smart Parking Solution
echo ========================================
echo.

echo 1. Installing Python dependencies...
pip install -r requirements.txt

echo.
echo 2. Testing ML Recommender...
python parking_recommender.py

echo.
echo 3. Starting ML API Server (in background)...
start /B python api_server.py

echo.
echo 4. Waiting for API to start...
timeout /t 3 /nobreak > nul

echo.
echo 5. Opening Web Application...
start index.html

echo.
echo ========================================
echo    Setup Complete!
echo ========================================
echo.
echo Web App: Open in browser (index.html)
echo ML API: http://localhost:5000
echo.
echo Features Available:
echo - Real-time parking spots
echo - AI-powered recommendations  
echo - Interactive map
echo - User authentication
echo - Community spot addition
echo.
pause