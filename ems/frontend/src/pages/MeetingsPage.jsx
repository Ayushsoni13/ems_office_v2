import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { Avatar, Spinner, EmptyState, Modal } from '../components/UI'
import api from '../utils/api'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'

const TYPE_COLORS = { sprint: 'var(--accent)', sync: 'var(--green)', planning: 'var(--orange)', '1on1': 'var(--purple)', allhands: 'var(--amber)', review: 'var(--pink)', general: 'var(--text3)' }

function MeetingModal({ onClose, onCreated }) {
  const toast = useToast()
  const [users, setUsers] = useState([])
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', mtype: 'general', location: '', link: '', scheduled_at: '', duration_min: 60, attendee_ids: [] })

  useEffect(() => { api.get('/users/').then(r => setUsers(r.data)) }, [])
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const toggleAttendee = (id) => setForm(f => ({ ...f, attendee_ids: f.attendee_ids.includes(id) ? f.attendee_ids.filter(x => x !== id) : [...f.attendee_ids, id] }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.scheduled_at) { toast('Title and date/time required', 'error'); return }
    setSaving(true)
    try {
      const { data } = await api.post('/meetings/', { ...form, scheduled_at: new Date(form.scheduled_at).toISOString() })
      toast('Meeting scheduled! Attendees notified.', 'success')
      onCreated(data)
      onClose()
    } catch (err) { toast(err.response?.data?.detail || 'Failed', 'error') }
    finally { setSaving(false) }
  }

  return (
    <Modal title="Schedule Meeting" onClose={onClose}>
      <form onSubmit={submit}>
        <div className="form-group"><label className="form-label">Title *</label><input className="form-input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Sprint Review…" /></div>
        <div className="form-group"><label className="form-label">Description</label><textarea className="form-input" rows={2} value={form.description} onChange={e => set('description', e.target.value)} /></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Type</label>
            <select className="form-input" value={form.mtype} onChange={e => set('mtype', e.target.value)}>
              {['general','sprint','sync','planning','1on1','allhands','review'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Duration (mins)</label><input className="form-input" type="number" value={form.duration_min} onChange={e => set('duration_min', parseInt(e.target.value))} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Date & Time *</label><input className="form-input" type="datetime-local" value={form.scheduled_at} onChange={e => set('scheduled_at', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Location</label><input className="form-input" value={form.location} onChange={e => set('location', e.target.value)} placeholder="Room / Google Meet…" /></div>
        </div>
        <div className="form-group"><label className="form-label">Meet Link</label><input className="form-input" value={form.link} onChange={e => set('link', e.target.value)} placeholder="https://meet.google.com/…" /></div>
        <div className="form-group">
          <label className="form-label">Attendees ({form.attendee_ids.length} selected)</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 140, overflowY: 'auto', background: 'var(--bg3)', borderRadius: 8, padding: 10, border: '1px solid var(--border)' }}>
            {users.map(u => (
              <div key={u.id} onClick={() => toggleAttendee(u.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 6, cursor: 'pointer', background: form.attendee_ids.includes(u.id) ? 'var(--accentbg)' : 'var(--bg4)', border: `1px solid ${form.attendee_ids.includes(u.id) ? 'var(--accent)' : 'var(--border)'}`, fontSize: 12 }}>
                <Avatar initials={u.initials} color={u.color} size={20} />
                {u.name}
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Scheduling…' : '📅 Schedule & Notify'}</button>
        </div>
      </form>
    </Modal>
  )
}

export default function MeetingsPage() {
  const { user } = useAuth()
  const toast = useToast()
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const canCreate = user?.role !== 'employee'
  const now = new Date()

  const load = () => api.get('/meetings/').then(r => setMeetings(r.data)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const deleteMeeting = async (id) => {
    if (!window.confirm('Delete this meeting?')) return
    try { await api.delete(`/meetings/${id}`); setMeetings(m => m.filter(x => x.id !== id)); toast('Meeting deleted', 'success') }
    catch { toast('Failed', 'error') }
  }

  const upcoming = meetings.filter(m => new Date(m.scheduled_at) >= now).sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
  const past = meetings.filter(m => new Date(m.scheduled_at) < now).sort((a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at)).slice(0, 5)

  const MeetCard = ({ m }) => {
    const date = new Date(m.scheduled_at)
    const isSoon = (date - now) < 60 * 60 * 1000
    return (
      <div style={{ background: 'var(--bg2)', border: `1px solid var(--border)`, borderLeft: `3px solid ${TYPE_COLORS[m.mtype] || 'var(--accent)'}`, borderRadius: 12, padding: '16px 18px', display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ textAlign: 'center', minWidth: 56 }}>
          <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'JetBrains Mono,monospace' }}>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            {m.title}
            {isSoon && <span className="tag tag-critical" style={{ fontSize: 9 }}>SOON</span>}
          </div>
          {m.description && <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>{m.description}</div>}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 11, color: 'var(--text3)', marginBottom: 8 }}>
            {m.location && <span>📍 {m.location}</span>}
            <span>⏱ {m.duration_min}min</span>
            <span style={{ color: TYPE_COLORS[m.mtype], fontWeight: 600, textTransform: 'uppercase', fontSize: 10 }}>{m.mtype}</span>
          </div>
          {m.attendees?.length > 0 && (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              {m.attendees.slice(0, 6).map(a => <Avatar key={a.id} initials={a.initials} color={a.color} size={22} />)}
              {m.attendees.length > 6 && <span style={{ fontSize: 11, color: 'var(--text3)' }}>+{m.attendees.length - 6}</span>}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, flexDirection: 'column' }}>
          {m.link && <a href={m.link} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">Join →</a>}
          {canCreate && user?.id === m.creator_id && <button className="btn btn-xs btn-danger" onClick={() => deleteMeeting(m.id)}>🗑</button>}
        </div>
      </div>
    )
  }

  if (loading) return <Layout title="Meetings"><div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><Spinner size={36} /></div></Layout>

  return (
    <Layout title="Meetings">
      {canCreate && (
        <div style={{ marginBottom: 20 }}>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Schedule Meeting</button>
        </div>
      )}
      {upcoming.length === 0 && past.length === 0
        ? <EmptyState icon="📅" title="No meetings" sub="No meetings scheduled" />
        : (
          <>
            {upcoming.length > 0 && <>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 12 }}>Upcoming ({upcoming.length})</div>
              {upcoming.map(m => <MeetCard key={m.id} m={m} />)}
            </>}
            {past.length > 0 && <>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text3)', margin: '20px 0 12px' }}>Recent Past</div>
              {past.map(m => <div key={m.id} style={{ opacity: 0.55 }}><MeetCard m={m} /></div>)}
            </>}
          </>
        )}
      {showModal && <MeetingModal onClose={() => setShowModal(false)} onCreated={m => setMeetings(ms => [m, ...ms])} />}
    </Layout>
  )
}
