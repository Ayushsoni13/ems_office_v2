import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'

import Login from './pages/Login'

// Boss
import BossDashboard from './pages/boss/Dashboard'
import { Leaderboard, AllEmployees } from './pages/boss/Leaderboard'
import BossTasks from './pages/boss/Tasks'

// Manager
import { ManagerDashboard, AssignTask } from './pages/manager/Dashboard'

// Employee
import EmployeeDashboard from './pages/employee/Dashboard'
import TimerPage from './pages/employee/Timer'

// Shared
import TasksPage from './pages/TasksPage'
import MeetingsPage from './pages/MeetingsPage'
import NotificationsPage from './pages/NotificationsPage'
import { ProfilePage, TeamPage } from './pages/ProfileTeam'

function Protected({ children, roles }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to={`/${user.role}/dashboard`} replace />
  return children
}

export default function App() {
  const { user } = useAuth()
  return (
    <ToastProvider>
      <Routes>
        <Route path="/login" element={user ? <Navigate to={`/${user.role}/dashboard`} replace /> : <Login />} />
        <Route path="/" element={<Navigate to={user ? `/${user.role}/dashboard` : '/login'} replace />} />

        {/* BOSS */}
        <Route path="/boss/dashboard"    element={<Protected roles={['boss']}><BossDashboard /></Protected>} />
        <Route path="/boss/employees"    element={<Protected roles={['boss']}><AllEmployees /></Protected>} />
        <Route path="/boss/tasks"        element={<Protected roles={['boss']}><BossTasks /></Protected>} />
        <Route path="/boss/leaderboard"  element={<Protected roles={['boss']}><Leaderboard /></Protected>} />
        <Route path="/boss/meetings"     element={<Protected roles={['boss']}><MeetingsPage /></Protected>} />
        <Route path="/boss/notifications"element={<Protected roles={['boss']}><NotificationsPage /></Protected>} />

        {/* MANAGER */}
        <Route path="/manager/dashboard"     element={<Protected roles={['manager']}><ManagerDashboard /></Protected>} />
        <Route path="/manager/tasks"         element={<Protected roles={['manager']}><TasksPage role="manager" /></Protected>} />
        <Route path="/manager/assign"        element={<Protected roles={['manager']}><AssignTask /></Protected>} />
        <Route path="/manager/team"          element={<Protected roles={['manager']}><TeamPage /></Protected>} />
        <Route path="/manager/meetings"      element={<Protected roles={['manager']}><MeetingsPage /></Protected>} />
        <Route path="/manager/notifications" element={<Protected roles={['manager']}><NotificationsPage /></Protected>} />

        {/* EMPLOYEE */}
        <Route path="/employee/dashboard"     element={<Protected roles={['employee']}><EmployeeDashboard /></Protected>} />
        <Route path="/employee/tasks"         element={<Protected roles={['employee']}><TasksPage role="employee" /></Protected>} />
        <Route path="/employee/timer"         element={<Protected roles={['employee']}><TimerPage /></Protected>} />
        <Route path="/employee/meetings"      element={<Protected roles={['employee']}><MeetingsPage /></Protected>} />
        <Route path="/employee/notifications" element={<Protected roles={['employee']}><NotificationsPage /></Protected>} />
        <Route path="/employee/profile"       element={<Protected roles={['employee']}><ProfilePage /></Protected>} />

        <Route path="*" element={<Navigate to={user ? `/${user.role}/dashboard` : '/login'} replace />} />
      </Routes>
    </ToastProvider>
  )
}
