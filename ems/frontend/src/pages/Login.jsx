import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const DEMOS = [
  { email: 'boss@ems.com',     role: 'boss',     label: 'Director / Boss',  icon: '🏢', desc: 'Full analytics, all teams, company overview' },
  { email: 'manager@ems.com',  role: 'manager',  label: 'Manager',          icon: '👔', desc: 'Assign tasks, manage team, schedule meetings' },
  { email: 'sarah@ems.com',    role: 'employee', label: 'Employee (Sarah)',  icon: '👤', desc: 'View tasks, update progress, log time' },
  { email: 'alex@ems.com',     role: 'employee', label: 'Employee (Alex)',   icon: '👤', desc: 'View tasks, update progress, log time' },
]

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const doLogin = async (e) => {
    e?.preventDefault()
    if (!email || !password) { toast('Please enter email and password', 'error'); return }
    setLoading(true)
    try {
      const user = await login(email, password)
      toast(`Welcome back, ${user.name.split(' ')[0]}!`, 'success')
      navigate(`/${user.role}/dashboard`, { replace: true })
    } catch (err) {
      console.error('Login error:', err)
      toast(err.response?.data?.detail || err.message || 'Login failed', 'error')
    } finally { setLoading(false) }
  }

  const quickLogin = (d) => { setEmail(d.email); setPassword('password123') }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 20 }}>
      <div style={{ width: 420, background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 20, padding: 36 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--accent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 700, color: '#fff', marginBottom: 14 }}>E</div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px' }}>EMS Office</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>Employee Management System</div>
        </div>

        {/* Form */}
        <form onSubmit={doLogin}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: 8 }} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        {/* Quick access */}
        <div style={{ marginTop: 28 }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 }}>Quick Demo Access</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {DEMOS.map(d => (
              <div key={d.email} onClick={() => quickLogin(d)} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                borderRadius: 10, border: `1px solid var(--border)`, cursor: 'pointer',
                transition: 'all .13s', background: email === d.email ? 'var(--accentbg)' : 'var(--bg3)',
                borderColor: email === d.email ? 'var(--accent)' : 'var(--border)',
              }}>
                <span style={{ fontSize: 22 }}>{d.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{d.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{d.desc}</div>
                </div>
                {email === d.email && <span style={{ fontSize: 11, color: 'var(--accent2)', fontWeight: 600 }}>SELECTED</span>}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', marginTop: 14 }}>
            Password for all demo accounts: <strong style={{ color: 'var(--text2)' }}>password123</strong>
          </div>
        </div>
      </div>
    </div>
  )
}
