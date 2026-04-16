# 🏢 EMS Office — Employee Management System v2.0

A fully dynamic, production-ready Employee Management System with role-based dashboards, task management, real-time notifications, performance analytics, and leaderboards.

---

## 🚀 Quick Start (3 Commands)

```bash
# 1. Clone / unzip the project
cd ems

# 2. Mac/Linux
chmod +x start.sh && ./start.sh

# 3. Windows
start.bat
```

Then open **http://localhost:5173**

---

## 🔐 Demo Login Credentials

| Role     | Email               | Password     | Access                              |
|----------|---------------------|--------------|-------------------------------------|
| Boss     | boss@ems.com        | password123  | Full analytics, all teams, leaderboard |
| Manager  | manager@ems.com     | password123  | Assign tasks, manage team, meetings |
| Manager2 | manager2@ems.com    | password123  | Design team manager                 |
| Employee | sarah@ems.com       | password123  | Tasks, timer, profile               |
| Employee | alex@ems.com        | password123  | Tasks, timer, profile               |
| Employee | maya@ems.com        | password123  | Design tasks                        |
| Employee | raj@ems.com         | password123  | Frontend dev tasks                  |
| Employee | zoe@ems.com         | password123  | QA tasks                            |

---

## 📁 Project Structure

```
ems/
├── backend/                    # Python FastAPI Backend
│   ├── main.py                 # App entry point
│   ├── seed.py                 # Database seeder (demo data)
│   ├── requirements.txt
│   ├── Dockerfile
│   └── app/
│       ├── core/
│       │   ├── database.py     # SQLAlchemy + SQLite setup
│       │   └── security.py     # JWT auth + password hashing
│       ├── models/
│       │   └── models.py       # All DB models (User, Task, Meeting, etc.)
│       └── routers/
│           ├── auth.py         # Login, register, /me
│           ├── users.py        # CRUD, leaderboard, employee-of-year, stats
│           ├── tasks.py        # Full task CRUD + comments + time logging
│           ├── meetings.py     # Schedule, list, delete meetings
│           └── notif_dash.py   # Notifications + role dashboards
│
├── frontend/                   # React + Vite Frontend
│   ├── src/
│   │   ├── App.jsx             # Router with role-based routes
│   │   ├── context/
│   │   │   ├── AuthContext.jsx # JWT auth state
│   │   │   └── ToastContext.jsx# Global toast notifications
│   │   ├── components/
│   │   │   ├── Layout.jsx      # App shell wrapper
│   │   │   ├── Sidebar.jsx     # Role-aware navigation
│   │   │   ├── Topbar.jsx      # Header bar
│   │   │   └── UI.jsx          # Avatar, Badge, Modal, ProgressBar, etc.
│   │   ├── pages/
│   │   │   ├── Login.jsx       # Login with demo quick-select
│   │   │   ├── boss/
│   │   │   │   ├── Dashboard.jsx   # Company-wide analytics + charts
│   │   │   │   ├── Leaderboard.jsx # Employee rankings + EOY winner
│   │   │   │   └── Tasks.jsx       # All tasks across all teams
│   │   │   ├── manager/
│   │   │   │   └── Dashboard.jsx   # Team dashboard + assign task form
│   │   │   ├── employee/
│   │   │   │   ├── Dashboard.jsx   # Personal stats + active tasks
│   │   │   │   └── Timer.jsx       # Start/pause/save task timer
│   │   │   ├── TasksPage.jsx       # Shared tasks list + detail modal
│   │   │   ├── MeetingsPage.jsx    # Schedule + view meetings
│   │   │   ├── NotificationsPage.jsx # Read/filter notifications
│   │   │   └── ProfileTeam.jsx     # Employee profile + manager team view
│   │   ├── utils/api.js        # Axios instance with JWT interceptors
│   │   └── styles/global.css   # Full design system
│   ├── vite.config.js
│   ├── Dockerfile
│   └── nginx.conf
│
├── docker-compose.yml          # One-command Docker deployment
├── start.sh                    # Mac/Linux startup script
└── start.bat                   # Windows startup script
```

---

## 🏗️ Tech Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Backend    | Python 3.12, FastAPI, SQLAlchemy ORM            |
| Database   | SQLite (dev) / PostgreSQL (prod, swap 1 line)   |
| Auth       | JWT (python-jose), bcrypt password hashing      |
| Frontend   | React 18, Vite, React Router v6                 |
| Charts     | Recharts (bar, pie, line charts)                |
| HTTP       | Axios with auto JWT injection + 401 redirect    |
| Deploy     | Docker + Nginx (production)                     |

---

## ✨ Features

### 👔 Boss / Director
- Company-wide analytics dashboard
- Task completion rate across all departments
- Weekly completions bar chart
- Priority distribution pie chart
- Department breakdown with progress bars
- Top 6 performers preview
- **Full leaderboard** with ranking, scores, on-time rate
- **Employee of the Year** winner banner
- View all employees with filters
- View all tasks across all teams

### 👔 Manager
- Team performance dashboard
- Weekly completions chart
- Per-member progress bars
- **Assign tasks** to employees with: title, description, priority, deadline, hours, notes, department
- Manage team roster, add new employees
- View individual employee stats on click
- Schedule meetings with attendee selection
- **Full task CRUD**: edit, delete, update notes, reassign

### 👤 Employee
- Personal dashboard: stats, hours logged, on-time rate
- Task list with full detail modal
- **Update progress** with slider (0–100%)
- **Change task status**: pending → in_progress → review → completed
- **Post comments/updates** — manager gets notified instantly
- **Task timer**: start, pause, resume, save to task
- Join meetings with link
- View & filter notifications (task, meeting, comment, reminder)
- Edit profile, change avatar color

### 🔔 Notifications (All Roles)
- New task assigned
- Progress updates from employee
- Task completed
- Comments on tasks
- Meeting scheduled
- Deadline reminders
- Real-time unread badge counter in sidebar

---

## 🔧 Manual Setup (Without start.sh)

### Backend
```bash
cd backend
pip install -r requirements.txt
python seed.py          # Creates DB + demo data
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev             # Starts on http://localhost:5173
```

### API Documentation
Visit: **http://localhost:8000/api/docs**

---

## 🌐 Production Deployment

### Option 1: Docker (Recommended)
```bash
docker-compose up --build
# App runs on http://localhost:80
```

### Option 2: Deploy to PostgreSQL
In `backend/.env`:
```env
DATABASE_URL=postgresql://user:password@host:5432/ems_db
SECRET_KEY=your-super-secret-key-min-32-chars
```

### Option 3: Build & Serve Together
```bash
cd frontend && npm run build    # Outputs to backend/static/
cd ../backend
uvicorn main:app --host 0.0.0.0 --port 8000
# Both API + frontend served from port 8000
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login, returns JWT |
| POST | /api/auth/register | Register new user |
| GET | /api/auth/me | Current user info |
| GET | /api/users/ | List all users |
| POST | /api/users/ | Create user (manager/boss) |
| GET | /api/users/leaderboard | Full employee rankings |
| GET | /api/users/employee-of-year | EOY winner |
| GET | /api/users/{id}/stats | User performance stats |
| GET | /api/tasks/ | List tasks (role-filtered) |
| POST | /api/tasks/ | Create & assign task |
| PATCH | /api/tasks/{id} | Update task/progress/status |
| DELETE | /api/tasks/{id} | Delete task |
| POST | /api/tasks/{id}/comments | Add comment |
| POST | /api/tasks/{id}/timelog | Log time |
| GET | /api/meetings/ | List meetings |
| POST | /api/meetings/ | Schedule meeting |
| DELETE | /api/meetings/{id} | Delete meeting |
| GET | /api/notifications/ | User notifications |
| PUT | /api/notifications/{id}/read | Mark read |
| PUT | /api/notifications/read-all | Mark all read |
| GET | /api/dashboard/boss | Boss analytics |
| GET | /api/dashboard/manager | Manager analytics |
| GET | /api/dashboard/employee | Employee analytics |

---

## 🎯 Performance Scoring

Employee scores are calculated as:
```
Score = (on_time_rate × 0.55) + (completion_rate × 0.35) + (10 - overdue_count) × 1
```
Capped at 100. Used for leaderboard rankings and Employee of the Year selection.

---

## 📞 Support
- API Docs: http://localhost:8000/api/docs
- All passwords in demo: `password123`
- To reset data: `cd backend && python seed.py`
