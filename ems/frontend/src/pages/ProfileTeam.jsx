import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { Avatar, StatCard, ProgressBar, Spinner } from '../components/UI'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

// ── PROFILE ────────────────────────────────────────────────────────────────────
export function ProfilePage() {
  const { user, updateUser } = useAuth()
  const toast = useToast()
  const [stats, setStats] = useState(null)
  const [form, setForm] = useState({ name: user?.name || '', department: user?.department || '', position: user?.position || '' })
  const [saving, setSaving] = useState(false)
  const colors = ['blue','green','orange','purple','pink','teal','amber','red','coral']

  useEffect(() => {
    if (user?.id) api.get(`/users/${user.id}/stats`).then(r => setStats(r.data))
  }, [user?.id])

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data } = await api.put(`/users/${user.id}`, form)
      updateUser(data)
      toast('Profile updated!', 'success')
    } catch { toast('Failed to save', 'error') }
    finally { setSaving(false) }
  }

  return (
    <Layout title="My Profile">
      <div className="grid-2">
        <div className="card">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24, gap: 12 }}>
            <Avatar initials={user?.initials} color={user?.color} size={72} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{user?.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{user?.position} · {user?.department}</div>
              <div style={{ fontSize: 11, color: `var(--${user?.role === 'boss' ? 'purple' : user?.role === 'manager' ? 'orange' : 'accent2'})`, marginTop: 4, textTransform: 'uppercase', fontWeight: 700, letterSpacing: 1 }}>{user?.role}</div>
            </div>
          </div>
          <form onSubmit={save}>
            <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">Department</label><input className="form-input" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">Position</label><input className="form-input" value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} /></div>
            <div className="form-group">
              <label className="form-label">Avatar Color</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {colors.map(c => (
                  <div key={c} onClick={() => { api.put(`/users/${user.id}`, { color: c }); updateUser({ color: c }) }}
                    className={`av av-${c}`} style={{ width: 28, height: 28, fontSize: 12, cursor: 'pointer', border: user?.color === c ? '2px solid var(--accent)' : '2px solid transparent' }}>
                    {user?.initials}
                  </div>
                ))}
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
          </form>
        </div>

        <div>
          {stats && (
            <>
              <div className="grid-2" style={{ marginBottom: 16 }}>
                <StatCard icon="✅" value={stats.completed} label="Completed" />
                <StatCard icon="🎯" value={`${stats.on_time_rate}%`} label="On-Time Rate" subColor="var(--green)" />
                <StatCard icon="⏱" value={`${stats.hours_logged}h`} label="Hours Logged" />
                <StatCard icon="📊" value={`${stats.completion_rate}%`} label="Completion Rate" />
              </div>
              <div className="card">
                <div className="card-title">Weekly Hours</div>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={stats.weekly_hours}>
                    <XAxis dataKey="day" tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="hours" fill="var(--accent)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}

// ── MANAGER TEAM ───────────────────────────────────────────────────────────────
export function TeamPage() {
  const toast = useToast()
  const [users, setUsers] = useState([])
  const [selected, setSelected] = useState(null)
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: 'password123', role: 'employee', department: 'Engineering', position: 'Engineer', color: 'blue' })

  useEffect(() => {
    api.get('/users/').then(r => setUsers(r.data)).finally(() => setLoading(false))
  }, [])

  const loadStats = async (uid) => {
    if (stats[uid]) { setSelected(uid); return }
    const { data } = await api.get(`/users/${uid}/stats`)
    setStats(s => ({ ...s, [uid]: data }))
    setSelected(uid)
  }

  const addUser = async (e) => {
    e.preventDefault()
    try {
      const { data } = await api.post('/users/', form)
      setUsers(u => [...u, data])
      setShowAdd(false)
      toast('Employee added!', 'success')
    } catch (err) { toast(err.response?.data?.detail || 'Failed', 'error') }
  }

  if (loading) return <Layout title="My Team"><div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><Spinner size={36} /></div></Layout>

  const selStats = selected ? stats[selected] : null
  const selUser = users.find(u => u.id === selected)

  return (
    <Layout title="My Team">
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Add Employee</button>
          </div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="tbl">
              <thead><tr><th>Employee</th><th>Department</th><th>Role</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ cursor: 'pointer' }} onClick={() => loadStats(u.id)}>
                    <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar initials={u.initials} color={u.color} size={32} /><div><div style={{ fontWeight: 500 }}>{u.name}</div><div style={{ fontSize: 11, color: 'var(--text3)' }}>{u.email}</div></div></div></td>
                    <td style={{ fontSize: 12, color: 'var(--text3)' }}>{u.department}</td>
                    <td><span style={{ fontSize: 11, color: u.role === 'manager' ? 'var(--orange)' : 'var(--accent2)', fontWeight: 600, textTransform: 'uppercase' }}>{u.role}</span></td>
                    <td><span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: u.is_active ? 'var(--green)' : 'var(--red)', display: 'inline-block' }} />{u.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td><span style={{ fontSize: 11, color: 'var(--accent2)' }}>View →</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats panel */}
        {selStats && selUser && (
          <div style={{ width: 280 }}>
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <Avatar initials={selUser.initials} color={selUser.color} size={40} />
                <div><div style={{ fontWeight: 600 }}>{selUser.name}</div><div style={{ fontSize: 12, color: 'var(--text3)' }}>{selUser.position}</div></div>
              </div>
              {[
                { label: 'Total Tasks', val: selStats.total },
                { label: 'Completed', val: selStats.completed, color: 'var(--green)' },
                { label: 'In Progress', val: selStats.in_progress, color: 'var(--accent2)' },
                { label: 'Overdue', val: selStats.overdue, color: selStats.overdue > 0 ? 'var(--red)' : undefined },
                { label: 'On-Time Rate', val: `${selStats.on_time_rate}%`, color: selStats.on_time_rate >= 80 ? 'var(--green)' : 'var(--amber)' },
                { label: 'Hours Logged', val: `${selStats.hours_logged}h` },
              ].map(({ label, val, color }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                  <span style={{ color: 'var(--text3)' }}>{label}</span>
                  <span style={{ fontWeight: 600, color: color || 'var(--text)' }}>{val}</span>
                </div>
              ))}
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>Completion Rate</div>
                <ProgressBar value={selStats.completion_rate} />
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent2)', marginTop: 6, textAlign: 'right' }}>{selStats.completion_rate}%</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="modal">
            <div className="modal-title">Add Employee <button className="btn btn-sm" onClick={() => setShowAdd(false)}>✕</button></div>
            <form onSubmit={addUser}>
              <div className="form-row"><div className="form-group"><label className="form-label">Name *</label><input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
              <div className="form-group"><label className="form-label">Email *</label><input className="form-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required /></div></div>
              <div className="form-row"><div className="form-group"><label className="form-label">Password</label><input className="form-input" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Department</label><select className="form-input" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}>{['Engineering','Design','Product','QA','Marketing'].map(d => <option key={d}>{d}</option>)}</select></div></div>
              <div className="form-row"><div className="form-group"><label className="form-label">Position</label><input className="form-input" value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Role</label><select className="form-input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}><option value="employee">Employee</option><option value="manager">Manager</option></select></div></div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}
