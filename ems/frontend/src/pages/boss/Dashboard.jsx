import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { StatCard, Avatar, ProgressBar, Spinner, EmptyState } from '../../components/UI'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts'
import api from '../../utils/api'

const COLORS = ['#4f8ef7','#34d399','#f97316','#f87171','#a78bfa','#fbbf24']

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
      <div style={{ color: 'var(--text2)', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => <div key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></div>)}
    </div>
  )
}

export default function BossDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard/boss').then(r => setData(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <Layout title="Director Dashboard"><div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><Spinner size={36} /></div></Layout>
  if (!data) return <Layout title="Director Dashboard"><EmptyState icon="⚠" title="Failed to load" sub="Check backend connection" /></Layout>

  const rankColor = r => r === 1 ? '#fbbf24' : r === 2 ? '#94a3b8' : r === 3 ? '#cd7c2f' : 'var(--text3)'

  return (
    <Layout title="Director Dashboard">
      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        <StatCard icon="👥" value={data.total_employees} label="Total Employees" sub={`${data.managers} managers · ${data.employees} staff`} />
        <StatCard icon="📋" value={data.total_tasks} label="Total Tasks" sub={`${data.in_progress} in progress`} subColor="var(--accent2)" />
        <StatCard icon="✅" value={`${data.completion_rate}%`} label="Completion Rate" sub={`${data.completed_tasks} of ${data.total_tasks} done`} subColor="var(--green)" />
        <StatCard icon="⚠" value={data.overdue_tasks} label="Overdue Tasks" sub={data.overdue_tasks > 0 ? 'Needs attention' : 'All on track'} subColor={data.overdue_tasks > 0 ? 'var(--red)' : 'var(--green)'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Weekly completions */}
        <div className="card">
          <div className="card-title">Task Completions — Last 7 Days</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.weekly_completions}>
              <XAxis dataKey="day" tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="count" name="Completed" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Priority Distribution */}
        <div className="card">
          <div className="card-title">Priority Distribution</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={data.priority_dist} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                {data.priority_dist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Department breakdown */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-title">Department Breakdown</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
          {data.dept_breakdown.map(d => {
            const pct = Math.round(d.completed / Math.max(d.total, 1) * 100)
            return (
              <div key={d.dept} style={{ background: 'var(--bg3)', borderRadius: 10, padding: 14, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{d.dept}</div>
                <ProgressBar value={pct} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: 'var(--text3)' }}>
                  <span>{d.completed}/{d.total} tasks</span>
                  <span style={{ color: 'var(--accent2)', fontWeight: 600 }}>{pct}%</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Top performers */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Top Performers</span>
          <a href="/boss/leaderboard" style={{ fontSize: 12, color: 'var(--accent2)' }}>Full Leaderboard →</a>
        </div>
        <table className="tbl">
          <thead><tr><th>#</th><th>Employee</th><th>Department</th><th>Completed</th><th>Score</th></tr></thead>
          <tbody>
            {data.top_performers.map((p, i) => (
              <tr key={p.id}>
                <td><span style={{ fontWeight: 700, color: rankColor(i + 1), fontSize: 14 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</span></td>
                <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar initials={p.initials} color={p.color} size={30} /><span style={{ fontWeight: 500 }}>{p.name}</span></div></td>
                <td><span style={{ color: 'var(--text3)', fontSize: 12 }}>{p.department}</span></td>
                <td><span style={{ color: 'var(--green)', fontWeight: 600 }}>{p.completed}</span><span style={{ color: 'var(--text3)', fontSize: 11 }}>/{p.total}</span></td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <ProgressBar value={p.score} />
                    <span style={{ fontWeight: 700, color: 'var(--accent2)', minWidth: 36, fontSize: 13 }}>{p.score}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}
