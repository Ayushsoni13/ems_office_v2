import { useAuth } from '../context/AuthContext'
import { Avatar } from './UI'

export default function Topbar({ title }) {
  const { user } = useAuth()
  return (
    <div className="topbar">
      <div style={{ flex: 1, fontSize: 16, fontWeight: 700, letterSpacing: '-0.3px' }}>{title}</div>
      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg3)', border: '1px solid var(--border)', padding: '6px 14px 6px 6px', borderRadius: 24 }}>
          <Avatar initials={user.initials} color={user.color} size={28} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{user.name}</div>
            <div style={{ fontSize: 10, color: 'var(--text3)' }}>{user.position}</div>
          </div>
        </div>
      )}
    </div>
  )
}
