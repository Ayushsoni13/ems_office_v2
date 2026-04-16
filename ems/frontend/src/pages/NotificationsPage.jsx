import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { Spinner, EmptyState } from '../components/UI'
import api from '../utils/api'
import { useToast } from '../context/ToastContext'

const ICONS = { task: '📋', meeting: '📅', comment: '💬', reminder: '⏰', system: '🔔', info: 'ℹ' }

export default function NotificationsPage() {
  const toast = useToast()
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const load = () => api.get('/notifications/').then(r => setNotifs(r.data)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const markRead = async (id) => {
    await api.put(`/notifications/${id}/read`)
    setNotifs(n => n.map(x => x.id === id ? { ...x, is_read: true } : x))
  }

  const markAll = async () => {
    await api.put('/notifications/read-all')
    setNotifs(n => n.map(x => ({ ...x, is_read: true })))
    toast('All marked as read', 'success')
  }

  const filtered = filter === 'all' ? notifs : filter === 'unread' ? notifs.filter(n => !n.is_read) : notifs.filter(n => n.ntype === filter)
  const unreadCount = notifs.filter(n => !n.is_read).length

  if (loading) return <Layout title="Notifications"><div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><Spinner size={36} /></div></Layout>

  return (
    <Layout title="Notifications">
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        {['all', 'unread', 'task', 'meeting', 'comment', 'reminder'].map(f => (
          <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : ''}`} onClick={() => setFilter(f)}>
            {f === 'unread' ? `Unread (${unreadCount})` : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        {unreadCount > 0 && <button className="btn btn-sm" style={{ marginLeft: 'auto' }} onClick={markAll}>Mark all read ✓</button>}
      </div>

      {filtered.length === 0 ? <EmptyState icon="🔕" title="No notifications" sub="You're all caught up!" /> : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {filtered.map((n, i) => (
            <div key={n.id} onClick={() => !n.is_read && markRead(n.id)} style={{
              display: 'flex', gap: 14, padding: '14px 18px', cursor: n.is_read ? 'default' : 'pointer',
              background: n.is_read ? 'transparent' : 'var(--accentbg)',
              borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
              transition: 'background .13s',
            }}>
              <div style={{ fontSize: 22, flexShrink: 0 }}>{ICONS[n.ntype] || ICONS.info}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: n.is_read ? 500 : 700, marginBottom: 3 }}>{n.title}</div>
                {n.body && <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5 }}>{n.body}</div>}
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{new Date(n.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
              </div>
              {!n.is_read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, marginTop: 6 }} />}
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}
