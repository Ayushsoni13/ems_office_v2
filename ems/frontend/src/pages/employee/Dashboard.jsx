import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { StatCard, ProgressBar, Spinner, EmptyState } from '../../components/UI'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../../utils/api'
import { useAuth } from '../../context/AuthContext'

function Tip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return <div style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}><div style={{ color: 'var(--text2)' }}>{label}</div>{payload.map((p, i) => <div key={i} style={{ color: p.color }}>{p.name}: <b>{p.value}</b></div>)}</div>
}

export default function EmployeeDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get('/dashboard/employee'), api.get('/tasks/?')])
      .then(([d, t]) => { setData(d.data); setTasks(t.data.slice(0, 5)) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Layout title="My Dashboard"><div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><Spinner size={36} /></div></Layout>
  if (!data) return <Layout title="My Dashboard"><EmptyState icon="⚠" title="Failed to load" /></Layout>

  return (
    <Layout title={`Welcome back, ${user?.name?.split(' ')[0]} 👋`}>
      <div className="grid-4" style={{ marginBottom: 20 }}>
        <StatCard icon="📋" value={data.total} label="My Tasks" sub={`${data.in_progress} active`} subColor="var(--accent2)" />
        <StatCard icon="✅" value={data.completed} label="Completed" sub={`${data.completion_rate}% rate`} subColor="var(--green)" />
        <StatCard icon="⏱" value={`${data.hours_logged}h`} label="Hours Logged" sub="This week" />
        <StatCard icon="🎯" value={`${data.on_time_rate}%`} label="On-Time Rate" sub={data.overdue > 0 ? `${data.overdue} overdue` : 'All on track'} subColor={data.overdue > 0 ? 'var(--red)' : 'var(--green)'} />
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-title">Hours Logged — Last 7 Days</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.weekly_hours}>
              <XAxis dataKey="day" tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="hours" name="Hours" fill="var(--green)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="card-title">Task Status Overview</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
            {[
              { label: 'Completed', val: data.completed, total: data.total, color: 'var(--green)' },
              { label: 'In Progress', val: data.in_progress, total: data.total, color: 'var(--accent)' },
              { label: 'Pending', val: data.pending, total: data.total, color: 'var(--amber)' },
              { label: 'Overdue', val: data.overdue, total: data.total, color: 'var(--red)' },
            ].map(({ label, val, total, color }) => (
              <div key={label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>
                  <span>{label}</span><span style={{ color, fontWeight: 600 }}>{val}</span>
                </div>
                <ProgressBar value={Math.round(val / Math.max(total, 1) * 100)} color={color} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent tasks */}
      <div className="card">
        <div className="card-header"><span className="card-title">My Active Tasks</span><a href="/employee/tasks" style={{ fontSize: 12, color: 'var(--accent2)' }}>View all →</a></div>
        {tasks.length === 0 ? <EmptyState icon="🎉" title="All caught up!" sub="No active tasks" /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {tasks.filter(t => t.status !== 'completed').slice(0, 4).map(t => {
              const isOverdue = t.deadline && new Date(t.deadline) < new Date() && t.status !== 'completed'
              return (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{t.title}</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span className={`tag tag-${t.priority}`}>{t.priority}</span>
                      {t.deadline && <span style={{ fontSize: 11, color: isOverdue ? 'var(--red)' : 'var(--text3)' }}>📅 {new Date(t.deadline).toLocaleDateString()}{isOverdue ? ' ⚠' : ''}</span>}
                    </div>
                  </div>
                  <div style={{ minWidth: 120 }}>
                    <ProgressBar value={t.progress} />
                    <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'right', marginTop: 4 }}>{t.progress}%</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}
