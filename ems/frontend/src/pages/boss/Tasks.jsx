import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { Avatar, Badge, ProgressBar, Spinner, EmptyState } from '../../components/UI'
import api from '../../utils/api'

export default function BossTasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ status: '', priority: '', dept: '' })

  const load = () => {
    const p = new URLSearchParams()
    if (filter.status) p.append('status', filter.status)
    if (filter.priority) p.append('priority', filter.priority)
    if (filter.dept) p.append('department', filter.dept)
    api.get(`/tasks/?${p}`).then(r => setTasks(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { setLoading(true); load() }, [filter])

  const depts = [...new Set(tasks.map(t => t.department).filter(Boolean))]

  return (
    <Layout title="All Tasks">
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {['', 'pending', 'in_progress', 'review', 'completed'].map(s => (
          <button key={s} className={`btn btn-sm ${filter.status === s ? 'btn-primary' : ''}`} onClick={() => setFilter(f => ({ ...f, status: s }))}>
            {s ? s.replace('_', ' ') : 'All Status'}
          </button>
        ))}
        <select className="form-input" style={{ width: 140, padding: '6px 10px', fontSize: 12 }} value={filter.priority} onChange={e => setFilter(f => ({ ...f, priority: e.target.value }))}>
          <option value="">All Priority</option>
          {['critical','high','medium','low'].map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className="form-input" style={{ width: 160, padding: '6px 10px', fontSize: 12 }} value={filter.dept} onChange={e => setFilter(f => ({ ...f, dept: e.target.value }))}>
          <option value="">All Departments</option>
          {depts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <div style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text3)', alignSelf: 'center' }}>{tasks.length} tasks</div>
      </div>

      {loading ? <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}><Spinner size={32} /></div>
        : tasks.length === 0 ? <EmptyState icon="📭" title="No tasks found" sub="Try changing filters" />
        : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="tbl">
              <thead><tr><th>Task</th><th>Assignee</th><th>Priority</th><th>Status</th><th>Progress</th><th>Deadline</th><th>Dept</th></tr></thead>
              <tbody>
                {tasks.map(t => {
                  const overdue = t.deadline && new Date(t.deadline) < new Date() && t.status !== 'completed'
                  return (
                    <tr key={t.id}>
                      <td style={{ maxWidth: 240 }}>
                        <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 2 }}>{t.title}</div>
                        {t.notes && <div style={{ fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220 }}>{t.notes}</div>}
                      </td>
                      <td>{t.assignee ? <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Avatar initials={t.assignee.initials} color={t.assignee.color} size={26} /><span style={{ fontSize: 12 }}>{t.assignee.name}</span></div> : <span style={{ color: 'var(--text3)', fontSize: 12 }}>Unassigned</span>}</td>
                      <td><Badge label={t.priority} /></td>
                      <td><Badge label={t.status} type={overdue ? 'overdue' : t.status} /></td>
                      <td style={{ minWidth: 100 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1 }}><ProgressBar value={t.progress} /></div>
                          <span style={{ fontSize: 11, color: 'var(--text3)', minWidth: 28 }}>{t.progress}%</span>
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: overdue ? 'var(--red)' : 'var(--text3)', whiteSpace: 'nowrap' }}>
                        {t.deadline ? new Date(t.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                        {overdue && ' ⚠'}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text3)' }}>{t.department}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
    </Layout>
  )
}
