import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { Avatar, ProgressBar, Spinner, EmptyState, StatCard, Badge } from '../../components/UI'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'
import api from '../../utils/api'

// ── LEADERBOARD ────────────────────────────────────────────────────────────────
export function Leaderboard() {
  const [board, setBoard] = useState([])
  const [eoy, setEoy] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get('/users/leaderboard'), api.get('/users/employee-of-year')])
      .then(([b, e]) => { setBoard(b.data); setEoy(e.data) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Layout title="Leaderboard 🏆"><div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><Spinner size={36} /></div></Layout>

  const medal = r => r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : `#${r}`
  const rankBg = r => r === 1 ? 'linear-gradient(135deg,#3d2e00,#2a1d00)' : r === 2 ? 'linear-gradient(135deg,#1e2030,#141824)' : r === 3 ? 'linear-gradient(135deg,#2a1800,#1e1200)' : 'var(--bg3)'

  return (
    <Layout title="Leaderboard 🏆">
      {/* Employee of the Year */}
      {eoy && (
        <div style={{ background: 'linear-gradient(135deg,var(--amberbg),var(--bg3))', border: '1px solid var(--amberborder)', borderRadius: 16, padding: 24, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ fontSize: 48 }}>🏆</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, marginBottom: 4 }}>Employee of the Year {new Date().getFullYear()}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar initials={eoy.initials} color={eoy.color} size={44} />
              <div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{eoy.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text3)' }}>{eoy.department} · {eoy.completed_tasks} tasks completed · Score: {eoy.score}</div>
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--amber)' }}>{eoy.score}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>Performance Score</div>
          </div>
        </div>
      )}

      {/* Top 3 podium */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
        {board.slice(0, 3).map(p => (
          <div key={p.id} style={{ background: rankBg(p.rank), border: '1px solid var(--border2)', borderRadius: 14, padding: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>{medal(p.rank)}</div>
            <Avatar initials={p.initials} color={p.color} size={48} />
            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 10 }}>{p.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 12 }}>{p.department}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11 }}>
              <div style={{ background: 'var(--bg4)', borderRadius: 6, padding: '6px 4px' }}>
                <div style={{ color: 'var(--green)', fontWeight: 700, fontSize: 16 }}>{p.completed}</div>
                <div style={{ color: 'var(--text3)' }}>Completed</div>
              </div>
              <div style={{ background: 'var(--bg4)', borderRadius: 6, padding: '6px 4px' }}>
                <div style={{ color: 'var(--accent2)', fontWeight: 700, fontSize: 16 }}>{p.on_time_rate}%</div>
                <div style={{ color: 'var(--text3)' }}>On-Time</div>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <ProgressBar value={p.score} />
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--amber)', marginTop: 6 }}>Score: {p.score}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Full table */}
      <div className="card">
        <div className="card-title">Full Rankings</div>
        <table className="tbl">
          <thead><tr><th>Rank</th><th>Employee</th><th>Dept</th><th>Total</th><th>Done</th><th>Overdue</th><th>On-Time%</th><th>Hours</th><th>Score</th></tr></thead>
          <tbody>
            {board.map(p => (
              <tr key={p.id}>
                <td style={{ fontWeight: 700, color: p.rank <= 3 ? 'var(--amber)' : 'var(--text3)' }}>{medal(p.rank)}</td>
                <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar initials={p.initials} color={p.color} size={28} /><span style={{ fontWeight: 500 }}>{p.name}</span></div></td>
                <td style={{ color: 'var(--text3)', fontSize: 12 }}>{p.department}</td>
                <td>{p.total_tasks}</td>
                <td><span style={{ color: 'var(--green)', fontWeight: 600 }}>{p.completed}</span></td>
                <td><span style={{ color: p.overdue > 0 ? 'var(--red)' : 'var(--text3)' }}>{p.overdue}</span></td>
                <td><span style={{ color: p.on_time_rate >= 80 ? 'var(--green)' : p.on_time_rate >= 50 ? 'var(--amber)' : 'var(--red)', fontWeight: 600 }}>{p.on_time_rate}%</span></td>
                <td style={{ color: 'var(--text2)' }}>{p.hours_logged}h</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 60 }}><ProgressBar value={p.score} /></div>
                    <span style={{ fontWeight: 700, color: 'var(--accent2)' }}>{p.score}</span>
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

// ── ALL EMPLOYEES ──────────────────────────────────────────────────────────────
export function AllEmployees() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    api.get('/users/').then(r => setUsers(r.data)).finally(() => setLoading(false))
  }, [])

  const filtered = users.filter(u => u.name.toLowerCase().includes(filter.toLowerCase()) || u.department.toLowerCase().includes(filter.toLowerCase()))

  if (loading) return <Layout title="All Employees"><div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><Spinner size={36} /></div></Layout>

  return (
    <Layout title="All Employees">
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <input className="form-input" placeholder="Search by name or department…" value={filter} onChange={e => setFilter(e.target.value)} style={{ maxWidth: 300 }} />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: 'var(--text3)' }}>
          {filtered.length} of {users.length} employees
        </div>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="tbl">
          <thead><tr><th>Employee</th><th>Role</th><th>Department</th><th>Position</th><th>Status</th><th>Joined</th></tr></thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id}>
                <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar initials={u.initials} color={u.color} size={34} /><div><div style={{ fontWeight: 500 }}>{u.name}</div><div style={{ fontSize: 11, color: 'var(--text3)' }}>{u.email}</div></div></div></td>
                <td><Badge label={u.role} type={u.role === 'manager' ? 'high' : u.role === 'boss' ? 'critical' : 'medium'} /></td>
                <td style={{ color: 'var(--text2)', fontSize: 12 }}>{u.department}</td>
                <td style={{ color: 'var(--text3)', fontSize: 12 }}>{u.position}</td>
                <td><span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: u.is_active ? 'var(--green)' : 'var(--red)', display: 'inline-block' }} />{u.is_active ? 'Active' : 'Inactive'}</span></td>
                <td style={{ color: 'var(--text3)', fontSize: 12 }}>{u.joined ? new Date(u.joined).toLocaleDateString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}
