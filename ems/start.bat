@echo off
echo.
echo ╔══════════════════════════════════════════╗
echo ║        EMS Office — Starting Up          ║
echo ╚══════════════════════════════════════════╝
echo.

cd backend
echo Installing backend dependencies...
pip install -r requirements.txt -q

echo Seeding database with demo data...
python seed.py

echo Starting backend on http://localhost:8000 ...
start "EMS Backend" cmd /k "uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

cd ..\frontend
echo Installing frontend dependencies...
call npm install --silent

echo Starting frontend on http://localhost:5173 ...
start "EMS Frontend" cmd /k "npm run dev"

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║  EMS Office is running!                                      ║
echo ║                                                              ║
echo ║  Frontend:  http://localhost:5173                           ║
echo ║  Backend:   http://localhost:8000                           ║
echo ║  API Docs:  http://localhost:8000/api/docs                  ║
echo ║                                                              ║
echo ║  Demo Logins (password: password123)                        ║
echo ║    Boss:     boss@ems.com                                   ║
echo ║    Manager:  manager@ems.com                                ║
echo ║    Employee: sarah@ems.com / alex@ems.com                   ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
pause
