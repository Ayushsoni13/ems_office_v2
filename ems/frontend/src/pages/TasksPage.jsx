import { useState, useEffect, useRef } from 'react'
import Layout from '../components/Layout'
import { Avatar, Badge, ProgressBar, Spinner, EmptyState, Modal, Confirm } from '../components/UI'
import api from '../utils/api'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

function TaskDetail({ task, onClose, onUpdated, isManager }) {
  const toast = useToast()
  const { user } = useAuth()
  const [comment, setComment] = useState('')
  const [posting, setPosting] = useState(false)
  const [progress, setProgress] = useState(task.progress)
  const [status, setStatus] = useState(task.status)
  const [saving, setSaving] = useState(false)
  const chatRef = useRef(null)

  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight }, [task.comments])

  const saveProgress = async () => {
    setSaving(true)
    try {
      const updated = await api.patch(`/tasks/${task.id}`, { progress, status })
      toast('Progress updated!', 'success')
      onUpdated(updated.data)
    } catch { toast('Failed to save', 'error') }
    finally { setSaving(false) }
  }

  const postComment = async () => {
    if (!comment.trim()) return
    setPosting(true)
    try {
      const { data } = await api.post(`/tasks/${task.id}/comments`, { body: comment })
      toast('Comment posted', 'success')
      setComment('')
      onUpdated({ ...task, comments: [...task.comments, data] })
    } catch { toast('Failed to post', 'error') }
    finally { setPosting(false) }
  }

  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed'

  return (
    <Modal title={task.title} onClose={onClose} width={580}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <Badge label={task.priority} />
        <Badge label={status} type={isOverdue ? 'overdue' : status} />
        {isOverdue && <Badge label="OVERDUE" type="overdue" />}
        {task.department && <span style={{ fontSize: 11, color: 'var(--text3)', alignSelf: 'center' }}>📁 {task.department}</span>}
        {task.deadline && <span style={{ fontSize: 11, color: isOverdue ? 'var(--red)' : 'var(--text3)', alignSelf: 'center' }}>📅 {new Date(task.deadline).toLocaleDateString()}</span>}
      </div>

      {task.description && <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 16, background: 'var(--bg3)', padding: '10px 14px', borderRadius: 8 }}>{task.description}</p>}

      {task.notes && (
        <div style={{ background: 'var(--amberbg)', border: '1px solid var(--amberborder)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'var(--amber)' }}>
          📝 Manager Notes: {task.notes}
        </div>
      )}

      {/* Assignee + Creator */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, fontSize: 12, color: 'var(--text3)' }}>
        {task.assignee && <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Avatar initials={task.assignee.initials} color={task.assignee.color} size={24} />{task.assignee.name}</div>}
        {task.creator && <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>Assigned by: <strong style={{ color: 'var(--text2)' }}>{task.creator.name}</strong></div>}
        <div>Est: {task.est_hours}h · Logged: {task.actual_hours}h</div>
      </div>

      {/* Progress update */}
      <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: 14, marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600, marginBottom: 10 }}>Update Progress</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <input type="range" min={0} max={100} step={5} value={progress} onChange={e => setProgress(Number(e.target.value))} style={{ flex: 1 }} />
          <span style={{ minWidth: 36, fontSize: 14, fontWeight: 700, color: 'var(--accent2)' }}>{progress}%</span>
        </div>
        <ProgressBar value={progress} />
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <select className="form-input" value={status} onChange={e => setStatus(e.target.value)} style={{ flex: 1, padding: '7px 10px', fontSize: 12 }}>
            {['pending','in_progress','review','completed'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
          <button className="btn btn-primary btn-sm" onClick={saveProgress} disabled={saving}>{saving ? '…' : 'Save'}</button>
        </div>
      </div>

      {/* Comments */}
      <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600, marginBottom: 10 }}>Discussion ({task.comments.length})</div>
      <div ref={chatRef} style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        {task.comments.length === 0 && <div style={{ color: 'var(--text3)', fontSize: 12, textAlign: 'center', padding: '12px 0' }}>No comments yet. Start the conversation.</div>}
        {task.comments.map(c => {
          const mine = c.author?.id === user?.id
          return (
            <div key={c.id} style={{ display: 'flex', gap: 8, flexDirection: mine ? 'row-reverse' : 'row' }}>
              <Avatar initials={c.author?.initials} color={c.author?.color} size={26} />
              <div style={{ maxWidth: '75%' }}>
                <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 3, textAlign: mine ? 'right' : 'left' }}>
                  {c.author?.name} · {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div style={{ background: mine ? 'var(--accentbg)' : 'var(--bg3)', border: `1px solid ${mine ? 'var(--accent3)' : 'var(--border)'}`, borderRadius: 10, padding: '8px 12px', fontSize: 13, lineHeight: 1.5 }}>
                  {c.body}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input className="form-input" value={comment} onChange={e => setComment(e.target.value)} placeholder="Write a comment or update…" onKeyDown={e => e.key === 'Enter' && !e.shiftKey && postComment()} style={{ flex: 1 }} />
        <button className="btn btn-primary btn-sm" onClick={postComment} disabled={posting || !comment.trim()}>{posting ? '…' : '→'}</button>
      </div>
    </Modal>
  )
}

export default function TasksPage({ role }) {
  const toast = useToast()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [filter, setFilter] = useState({ status: '', priority: '' })

  const load = () => {
    const p = new URLSearchParams()
    if (filter.status) p.append('status', filter.status)
    if (filter.priority) p.append('priority', filter.priority)
    setLoading(true)
    api.get(`/tasks/?${p}`).then(r => setTasks(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [filter])

  const handleDelete = async (id) => {
    try {
      await api.delete(`/tasks/${id}`)
      setTasks(ts => ts.filter(t => t.id !== id))
      toast('Task deleted', 'success')
    } catch { toast('Failed to delete', 'error') }
    setDeleting(null)
  }

  const updateTask = (updated) => {
    setTasks(ts => ts.map(t => t.id === updated.id ? updated : t))
    setSelected(updated)
  }

  const isManager = role === 'manager' || user?.role === 'manager' || user?.role === 'boss'
  const isOverdue = t => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'completed'

  return (
    <Layout title={isManager ? 'Assigned Tasks' : 'My Tasks'}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {['', 'pending', 'in_progress', 'review', 'completed'].map(s => (
          <button key={s} className={`btn btn-sm ${filter.status === s ? 'btn-primary' : ''}`} onClick={() => setFilter(f => ({ ...f, status: s }))}>
            {s ? s.replace('_', ' ') : 'All'}
          </button>
        ))}
        <select className="form-input" style={{ width: 130, padding: '6px 10px', fontSize: 12 }} value={filter.priority} onChange={e => setFilter(f => ({ ...f, priority: e.target.value }))}>
          <option value="">All Priority</option>
          {['critical','high','medium','low'].map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        {isManager && (
          <button className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }} onClick={() => navigate('/manager/assign')}>+ Assign Task</button>
        )}
        <span style={{ fontSize: 12, color: 'var(--text3)', marginLeft: isManager ? 0 : 'auto' }}>{tasks.length} tasks</span>
      </div>

      {loading ? <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}><Spinner size={32} /></div>
        : tasks.length === 0 ? <EmptyState icon="📭" title="No tasks" sub="No tasks match the current filters" />
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tasks.map(t => (
              <div key={t.id} onClick={() => setSelected(t)} style={{ background: 'var(--bg2)', border: `1px solid ${isOverdue(t) ? 'var(--redborder)' : 'var(--border)'}`, borderRadius: 12, padding: '14px 16px', cursor: 'pointer', transition: 'border-color .13s, background .13s', display: 'flex', gap: 14, alignItems: 'flex-start' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border3)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = isOverdue(t) ? 'var(--redborder)' : 'var(--border)'}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {t.status === 'completed' && <span style={{ color: 'var(--green)' }}>✓</span>}
                    <span style={{ textDecoration: t.status === 'completed' ? 'line-through' : 'none', color: t.status === 'completed' ? 'var(--text3)' : 'var(--text)' }}>{t.title}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Badge label={t.priority} />
                    <Badge label={t.status} type={isOverdue(t) ? 'overdue' : t.status} />
                    {t.department && <span style={{ fontSize: 11, color: 'var(--text3)' }}>📁 {t.department}</span>}
                    {t.deadline && <span style={{ fontSize: 11, color: isOverdue(t) ? 'var(--red)' : 'var(--text3)' }}>📅 {new Date(t.deadline).toLocaleDateString()}{isOverdue(t) ? ' ⚠' : ''}</span>}
                    {t.assignee && <span style={{ fontSize: 11, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 4 }}><Avatar initials={t.assignee.initials} color={t.assignee.color} size={16} />{t.assignee.name}</span>}
                  </div>
                  {t.notes && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>📝 {t.notes.slice(0, 80)}{t.notes.length > 80 ? '…' : ''}</div>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, minWidth: 100 }}>
                  <div style={{ width: 100 }}><ProgressBar value={t.progress} /></div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{t.progress}%</div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {t.comments.length > 0 && <span style={{ fontSize: 11, color: 'var(--text3)' }}>💬 {t.comments.length}</span>}
                    {isManager && (
                      <button className="btn btn-xs btn-danger" onClick={e => { e.stopPropagation(); setDeleting(t.id) }}>🗑</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      {selected && <TaskDetail task={selected} onClose={() => setSelected(null)} onUpdated={updateTask} isManager={isManager} />}
      {deleting && <Confirm message="Delete this task? This cannot be undone." onConfirm={() => handleDelete(deleting)} onCancel={() => setDeleting(null)} />}
    </Layout>
  )
}
