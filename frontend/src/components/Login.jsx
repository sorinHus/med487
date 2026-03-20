import { useState } from 'react'
import { login } from '../auth'

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      await login(username, password)
      onLogin()
    } catch {
      setError('Username sau parola incorecta')
    }
  }

  return (
    <div style={{ maxWidth: '360px', margin: '80px auto', padding: '32px',
      border: '1px solid #eee', borderRadius: '12px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: '500', marginBottom: '24px' }}>
        MED487 — Login
      </h1>
      {error && <p style={{ color: 'red', marginBottom: '12px' }}>{error}</p>}
      <form onSubmit={handleLogin}>
        <input
          type="text" placeholder="Username" value={username}
          onChange={e => setUsername(e.target.value)}
          style={{ width: '100%', padding: '8px 12px', fontSize: '14px',
            border: '1px solid #ddd', borderRadius: '6px',
            marginBottom: '12px', boxSizing: 'border-box' }}
        />
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Parola" value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', fontSize: '14px',
              border: '1px solid #ddd', borderRadius: '6px',
              boxSizing: 'border-box', paddingRight: '80px' }}
          />
          <span
            onClick={() => setShowPassword(!showPassword)}
            style={{ position: 'absolute', right: '12px', top: '50%',
              transform: 'translateY(-50%)', fontSize: '12px',
              color: '#185FA5', cursor: 'pointer', userSelect: 'none' }}>
            {showPassword ? 'Ascunde' : 'Arata'}
          </span>
        </div>
        <button type="submit"
          style={{ width: '100%', padding: '10px', fontSize: '14px',
            background: '#185FA5', color: '#fff', border: 'none',
            borderRadius: '6px', cursor: 'pointer' }}>
          Intra in cont
        </button>
      </form>
    </div>
  )
}