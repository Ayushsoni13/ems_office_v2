import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { StatCard, Avatar, ProgressBar, Spinner, EmptyState } from '../../components/UI'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../../utils/api'
import { useToast } from '../../context/ToastContext'
import { useNavigate } from 'react-router-dom'

function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return <div style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}><div style={{ color: 'var(--text2)' }}>{label}</div>{payload.map((p, i) => <div key={i} style={{ color: p.color }}>{p.name}: <b>{p.value}</b></div>)}</div>
}

// ── MANAGER DASHBOARD ──────────────────────────────────────────────────────────
export function ManagerDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { api.get('/dashboard/manager').then(r => setData(r.data)).finally(() => setLoading(false)) }, [])

  if (loading) return <Layout title="Manager Dashboard"><div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><Spinner size={36} /></div></Layout>
  if (!data) return <Layout title="Manager Dashboard"><EmptyState icon="⚠" title="Failed to load" /></Layout>

  return (
    <Layout title="Manager Dashboard">
      <div className="grid-4" style={{ marginBottom: 20 }}>
        <StatCard icon="👥" value={data.team_size} label="Team Members" />
        <StatCard icon="📋" value={data.total_tasks} label="Tasks Assigned" sub={`${data.in_progress} active`} subColor="var(--accent2)" />
        <StatCard icon="✅" value={`${data.completion_rate}%`} label="Completion Rate" sub={`${data.completed} done`} subColor="var(--green)" />
        <StatCard icon="⚠" value={data.overdue} label="Overdue" subColor="var(--red)" sub={data.overdue > 0 ? 'Action needed' : 'All on track'} />
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-title">Weekly Completions</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.weekly_completions}>
              <XAxis dataKey="day" tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTip />} />
              <Bar dataKey="count" name="Completed" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Team Status</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.member_stats.map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar initials={m.initials} color={m.color} size={30} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{m.name}</div>
                  <ProgressBar value={Math.round(m.completed / Math.max(m.total, 1) * 100)} />
                </div>
                <div style={{ textAlign: 'right', minWidth: 60 }}>
                  <div style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>{m.completed}/{m.total}</div>
                  {m.overdue > 0 && <div style={{ fontSize: 10, color: 'var(--red)' }}>{m.overdue} overdue</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}

// ── ASSIGN TASK ────────────────────────────────────────────────────────────────
export function AssignTask() {
  const toast = useToast()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', department: 'Engineering', deadline: '', est_hours: 4, notes: '', assignee_id: '' })

  useEffect(() => { api.get('/users/').then(r => setUsers(r.data.filter(u => u.role === 'employee'))) }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) { toast('Task title is required', 'error'); return }
    if (!form.assignee_id) { toast('Please select an assignee', 'error'); return }
    if (!form.deadline) { toast('Deadline is required', 'error'); return }
    setSaving(true)
    try {
      await api.post('/tasks/', { ...form, assignee_id: parseInt(form.assignee_id), est_hours: parseFloat(form.est_hours) })
      toast('Task assigned! Employee notified.', 'success')
      navigate('/manager/tasks')
    } catch (err) {
      toast(err.response?.data?.detail || 'Failed to create task', 'error')
    } finally { setSaving(false) }
  }

  return (
    <Layout title="Assign New Task">
      <div style={{ maxWidth: 640 }}>
        <div className="card">
          <form onSubmit={submit}>
            <div className="form-group">
              <label className="form-label">Task Title *</label>
              <input className="form-input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Fix login bug, Write API docs…" />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-input" rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Detailed description of what needs to be done…" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Assign To *</label>
                <select className="form-input" value={form.assignee_id} onChange={e => set('assignee_id', e.target.value)}>
                  <option value="">Select employee…</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name} — {u.department}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority *</label>
                <select className="form-input" value={form.priority} onChange={e => set('priority', e.target.value)}>
                  {['critical','high','medium','low'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Deadline *</label>
                <input className="form-input" type="date" value={form.deadline} min={new Date().toISOString().split('T')[0]} onChange={e => set('deadline', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Estimated Hours</label>
                <input className="form-input" type="number" min={0} step={0.5} value={form.est_hours} onChange={e => set('est_hours', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Department</label>
              <select className="form-input" value={form.department} onChange={e => set('department', e.target.value)}>
                {['Engineering','Design','Product','QA','Marketing','HR','Finance'].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Manager Notes (visible to assignee)</label>
              <textarea className="form-input" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any instructions, context or references…" />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Assigning…' : '✓ Assign Task & Notify'}</button>
              <button type="button" className="btn" onClick={() => navigate('/manager/tasks')}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}
