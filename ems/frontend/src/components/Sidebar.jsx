import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Avatar } from './UI'
import { useState, useEffect } from 'react'
import api from '../utils/api'

const NAV = {
  boss: [
    { to: '/boss/dashboard',     icon: '⬡', label: 'Dashboard' },
    { to: '/boss/employees',     icon: '👥', label: 'All Employees' },
    { to: '/boss/tasks',         icon: '✓',  label: 'All Tasks' },
    { to: '/boss/leaderboard',   icon: '🏆', label: 'Leaderboard' },
    { to: '/boss/meetings',      icon: '📅', label: 'Meetings' },
    { to: '/boss/notifications', icon: '🔔', label: 'Notifications' },
  ],
  manager: [
    { to: '/manager/dashboard',     icon: '⬡', label: 'Dashboard' },
    { to: '/manager/tasks',         icon: '✓',  label: 'My Tasks' },
    { to: '/manager/assign',        icon: '+',  label: 'Assign Task' },
    { to: '/manager/team',          icon: '👥', label: 'My Team' },
    { to: '/manager/meetings',      icon: '📅', label: 'Meetings' },
    { to: '/manager/notifications', icon: '🔔', label: 'Notifications' },
  ],
  employee: [
    { to: '/employee/dashboard',     icon: '⬡', label: 'Dashboard' },
    { to: '/employee/tasks',         icon: '✓',  label: 'My Tasks' },
    { to: '/employee/timer',         icon: '⏱',  label: 'Timer' },
    { to: '/employee/meetings',      icon: '📅', label: 'Meetings' },
    { to: '/employee/notifications', icon: '🔔', label: 'Notifications' },
    { to: '/employee/profile',       icon: '👤', label: 'Profile' },
  ],
}

const ROLE_COLOR = { boss: 'purple', manager: 'orange', employee: 'blue' }

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    const fetch = () => api.get('/notifications/count').then(r => setUnread(r.data.unread)).catch(() => {})
    fetch()
    const iv = setInterval(fetch, 30000)
    return () => clearInterval(iv)
  }, [])

  if (!user) return null
  const links = NAV[user.role] || []

  return (
    <div className="sidebar">
      {/* Logo */}
      <div style={{ padding: '18px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: 16, fontFamily: 'JetBrains Mono,monospace' }}>E</div>
          <div className="sidebar-label">
            <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: '-0.3px' }}>EMS Office</div>
            <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1 }}>v2.0</div>
          </div>
        </div>
      </div>

      {/* User chip */}
      <div style={{ padding: '14px 14px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center' }}>
        <Avatar initials={user.initials} color={user.color} size={34} />
        <div className="sidebar-label" style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
          <div style={{ fontSize: 10, color: `var(--${ROLE_COLOR[user.role]})`, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600 }}>{user.role}</div>
        </div>
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {links.map(({ to, icon, label }) => (
          <NavLink key={to} to={to} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 10px', borderRadius: 9, cursor: 'pointer',
            fontSize: 13, fontWeight: 500, transition: 'all .13s',
            background: isActive ? 'var(--accentbg)' : 'transparent',
            color: isActive ? 'var(--accent2)' : 'var(--text2)',
            textDecoration: 'none', position: 'relative',
          })}>
            <span style={{ fontSize: 15, width: 20, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
            <span className="sidebar-label">{label}</span>
            {label === 'Notifications' && unread > 0 && (
              <span style={{ marginLeft: 'auto', background: 'var(--red)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10 }} className="sidebar-label">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
        <button className="btn" style={{ width: '100%', justifyContent: 'center', gap: 8 }}
          onClick={() => { logout(); navigate('/login') }}>
          <span>←</span><span className="sidebar-label">Logout</span>
        </button>
      </div>

      <style>{`
        @media(max-width:700px){.sidebar-label{display:none;}}
      `}</style>
    </div>
  )
}
