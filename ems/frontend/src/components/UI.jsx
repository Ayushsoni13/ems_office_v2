import { useEffect } from 'react'

export function Avatar({ name = '', initials, color = 'blue', size = 32 }) {
  const ini = initials || name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
  return (
    <span className={`av av-${color}`} style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {ini}
    </span>
  )
}

export function Badge({ label, type }) {
  return <span className={`tag tag-${type || label?.toLowerCase()}`}>{label}</span>
}

export function ProgressBar({ value = 0, color }) {
  const col = color || (value === 100 ? 'var(--green)' : value > 60 ? 'var(--accent)' : value > 30 ? 'var(--orange)' : 'var(--red)')
  return (
    <div className="pbar">
      <div className="pbar-fill" style={{ width: `${value}%`, background: col }} />
    </div>
  )
}

export function Spinner({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ animation: 'spin 0.8s linear infinite' }}>
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
      <circle cx="12" cy="12" r="10" fill="none" stroke="var(--border3)" strokeWidth="3" />
      <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function Modal({ title, onClose, children, width = 520 }) {
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width }}>
        <div className="modal-title">
          <span>{title}</span>
          <button className="btn btn-sm" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function StatCard({ icon, value, label, sub, subColor }) {
  return (
    <div className="stat">
      <div style={{ fontSize: 22 }}>{icon}</div>
      <div className="stat-val">{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub" style={{ color: subColor || 'var(--text3)' }}>{sub}</div>}
    </div>
  )
}

export function EmptyState({ icon = '📭', title, sub }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text3)' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13 }}>{sub}</div>
    </div>
  )
}

export function Confirm({ message, onConfirm, onCancel }) {
  return (
    <Modal title="Confirm Action" onClose={onCancel} width={380}>
      <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 24, lineHeight: 1.6 }}>{message}</p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button className="btn" onClick={onCancel}>Cancel</button>
        <button className="btn btn-danger" onClick={onConfirm}>Confirm</button>
      </div>
    </Modal>
  )
}
