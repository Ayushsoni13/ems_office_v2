import { useState, useEffect, useRef } from 'react'
import Layout from '../../components/Layout'
import { Spinner } from '../../components/UI'
import api from '../../utils/api'
import { useToast } from '../../context/ToastContext'

export default function TimerPage() {
  const toast = useToast()
  const [tasks, setTasks] = useState([])
  const [selectedTask, setSelectedTask] = useState('')
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [note, setNote] = useState('')
  const [logs, setLogs] = useState([])
  const [saving, setSaving] = useState(false)
  const intervalRef = useRef(null)
  const startRef = useRef(null)

  useEffect(() => {
    api.get('/tasks/?status=in_progress').then(r => setTasks(r.data))
  }, [])

  const fmt = (s) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  const start = () => {
    if (!selectedTask) { toast('Select a task first', 'error'); return }
    setRunning(true)
    startRef.current = Date.now() - elapsed * 1000
    intervalRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000))
    }, 1000)
  }

  const pause = () => {
    setRunning(false)
    clearInterval(intervalRef.current)
  }

  const reset = () => {
    pause()
    setElapsed(0)
    setNote('')
  }

  const saveLog = async () => {
    if (elapsed === 0) { toast('Start timer first', 'error'); return }
    if (!selectedTask) { toast('Select a task', 'error'); return }
    pause()
    setSaving(true)
    try {
      await api.post(`/tasks/${selectedTask}/timelog`, { seconds: elapsed, note })
      const task = tasks.find(t => t.id === parseInt(selectedTask))
      setLogs(l => [{ task: task?.title, seconds: elapsed, note, time: new Date() }, ...l.slice(0, 9)])
      toast(`Logged ${fmt(elapsed)} to "${task?.title}"`, 'success')
      reset()
    } catch { toast('Failed to save log', 'error') }
    finally { setSaving(false) }
  }

  useEffect(() => () => clearInterval(intervalRef.current), [])

  const pct = elapsed > 0 ? Math.min((elapsed / 3600) * 100, 100) : 0
  const circumference = 2 * Math.PI * 54

  return (
    <Layout title="Task Timer">
      <div style={{ maxWidth: 700, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Timer */}
        <div className="card" style={{ textAlign: 'center', padding: 32 }}>
          <div style={{ marginBottom: 20 }}>
            <select className="form-input" value={selectedTask} onChange={e => { if (running) { toast('Pause timer before switching', 'warning'); return } setSelectedTask(e.target.value) }} style={{ fontSize: 13 }}>
              <option value="">Select task…</option>
              {tasks.map(t => <option key={t.id} value={t.id}>{t.title.slice(0, 40)}{t.title.length > 40 ? '…' : ''}</option>)}
            </select>
          </div>

          {/* Circle timer */}
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <svg width={130} height={130} style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={65} cy={65} r={54} fill="none" stroke="var(--bg4)" strokeWidth={8} />
              <circle cx={65} cy={65} r={54} fill="none" stroke={running ? 'var(--accent)' : elapsed > 0 ? 'var(--amber)' : 'var(--border3)'} strokeWidth={8}
                strokeDasharray={circumference} strokeDashoffset={circumference - (pct / 100) * circumference}
                strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s linear' }} />
            </svg>
            <div style={{ position: 'absolute', textAlign: 'center' }}>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 22, fontWeight: 600, letterSpacing: 1 }}>{fmt(elapsed)}</div>
              <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{running ? '● RUNNING' : elapsed > 0 ? '⏸ PAUSED' : '● READY'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
            {!running
              ? <button className="btn btn-primary" onClick={start}>{elapsed > 0 ? '▶ Resume' : '▶ Start'}</button>
              : <button className="btn btn-sm" style={{ borderColor: 'var(--amberborder)', color: 'var(--amber)' }} onClick={pause}>⏸ Pause</button>}
            <button className="btn btn-sm" onClick={reset}>↺ Reset</button>
          </div>

          <input className="form-input" placeholder="Note (optional)…" value={note} onChange={e => setNote(e.target.value)} style={{ marginBottom: 12, fontSize: 12 }} />
          <button className="btn btn-success" style={{ width: '100%', justifyContent: 'center' }} onClick={saveLog} disabled={saving || elapsed === 0}>
            {saving ? 'Saving…' : `💾 Log ${fmt(elapsed)}`}
          </button>
        </div>

        {/* Recent logs */}
        <div className="card">
          <div className="card-title">Recent Time Logs</div>
          {logs.length === 0 ? (
            <div style={{ color: 'var(--text3)', fontSize: 13, textAlign: 'center', paddingTop: 40 }}>No logs yet this session</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {logs.map((l, i) => (
                <div key={i} style={{ background: 'var(--bg3)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{l.task}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)' }}>
                    <span style={{ fontFamily: 'JetBrains Mono,monospace', color: 'var(--green)', fontWeight: 600 }}>{fmt(l.seconds)}</span>
                    <span>{l.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  {l.note && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>{l.note}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
