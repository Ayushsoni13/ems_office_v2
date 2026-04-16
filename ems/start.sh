#!/bin/bash
set -e
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║        EMS Office — Starting Up          ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── Backend ────────────────────────────────────────────────────────────────────
echo "📦 Installing backend dependencies..."
cd backend
pip install -r requirements.txt -q

echo "🗄  Seeding database with demo data..."
python seed.py

echo "🚀 Starting backend on http://localhost:8000 ..."
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# ── Frontend ───────────────────────────────────────────────────────────────────
cd ../frontend
echo ""
echo "📦 Installing frontend dependencies..."
npm install --silent

echo "⚡ Starting frontend on http://localhost:5173 ..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  ✅  EMS Office is running!                                  ║"
echo "║                                                              ║"
echo "║  Frontend:  http://localhost:5173                           ║"
echo "║  Backend:   http://localhost:8000                           ║"
echo "║  API Docs:  http://localhost:8000/api/docs                  ║"
echo "║                                                              ║"
echo "║  Demo Logins (password: password123)                        ║"
echo "║  ● Boss:     boss@ems.com                                   ║"
echo "║  ● Manager:  manager@ems.com                                ║"
echo "║  ● Employee: sarah@ems.com / alex@ems.com                   ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "Press Ctrl+C to stop both servers."
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Servers stopped.'" EXIT
wait
