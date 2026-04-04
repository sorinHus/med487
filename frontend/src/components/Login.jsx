import { useState } from 'react'
import { login } from '../auth'

export default function Login({ onLogin }) {
  const [username, setUsername]         = useState('')
  const [password, setPassword]         = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError]               = useState(null)
  const [loading, setLoading]           = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault(); setLoading(true); setError(null)
    try { await login(username, password); onLogin() }
    catch { setError('Username sau parola incorecta') }
    finally { setLoading(false) }
  }

  const inputStyle = {
    width: '100%', padding: '11px 14px', fontSize: '14px',
    background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '9px',
    color: 'var(--text-primary)', boxSizing: 'border-box', outline: 'none',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ width: '380px', maxWidth: '95vw' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img src="/logo.png" alt="MED487" style={{ height: '60px', objectFit: 'contain' }} />
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '32px' }}>
          <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px' }}>Autentificare</div>
          <div style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '24px' }}>Introduceti credentialele pentru a accesa aplicatia</div>
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '10px 14px', color: '#f87171', fontSize: '13px', marginBottom: '18px' }}>
              {error}
            </div>
          )}
          <form onSubmit={handleLogin}>
            <label style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)}
              placeholder="username (medic)/CNP (pacienti)" style={{ ...inputStyle, marginBottom: '14px' }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
              autoComplete="username" />
            <label style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Parola</label>
            <div style={{ position: 'relative', marginBottom: '22px' }}>
              <input type={showPassword ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                style={{ ...inputStyle, paddingRight: '80px' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
                autoComplete="current-password" />
              <span onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: 'var(--accent)', cursor: 'pointer', userSelect: 'none' }}>
                {showPassword ? 'Ascunde' : 'Arata'}
              </span>
            </div>
            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: '600', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '9px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.8 : 1 }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'var(--accent-hover)' }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'var(--accent)' }}>
              {loading ? 'Se conecteaza...' : 'Intra in cont'}
            </button>
          </form>
        </div>
        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: 'var(--text-dim)' }}>MED487 — Gestiune Medicala</div>
        <div style={{ textAlign: 'center', marginTop: '10px' }}>
          <a href="/" style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'none' }}>← Înapoi la site</a>
        </div>
      </div>
    </div>
  )
}