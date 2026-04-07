import { useState } from 'react'
import { login } from '../auth'
import s from '../styles/Login.module.css'

const API = import.meta.env.VITE_API_URL || 'https://web-production-26811.up.railway.app/api'

export default function Login({ onLogin }) {
  const [username, setUsername]         = useState('')
  const [password, setPassword]         = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError]               = useState(null)
  const [loading, setLoading]           = useState(false)
  const [showReset, setShowReset]       = useState(false)
  const [resetEmail, setResetEmail]     = useState('')
  const [resetMsg, setResetMsg]         = useState(null)
  const [resetLoading, setResetLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await login(username, password)
      onLogin()
    } catch {
      setLoading(false)
      setError('Username sau parola incorecta')
      return
    }
    setLoading(false)
  }

  const handleReset = async (e) => {
    e.preventDefault()
    if (!resetEmail) { setResetMsg({ err: true, text: 'Introduceți adresa de email.' }); return }
    setResetLoading(true); setResetMsg(null)
    try {
      await fetch(`${API}/reset-parola/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: resetEmail })
      })
      setResetMsg({ err: false, text: 'Dacă adresa există în sistem, veți primi un email cu parola temporară.' })
    } catch {
      setResetMsg({ err: true, text: 'Eroare. Încearcă din nou.' })
    } finally { setResetLoading(false) }
  }

  return (
    <div className={s.page}>
      <div className={s.wrapper}>
        <div className={s.logoWrap}>
          <img src="/logo.png" alt="MED487" className={s.logo} />
        </div>
        <div className={s.card}>

          {!showReset ? <>
            <div className={s.title}>Autentificare</div>
            <div className={s.subtitle}>Introduceti credentialele pentru a accesa aplicatia</div>
            {error && <div className={s.error}>{error}</div>}
            <form onSubmit={handleLogin}>
              <label className={s.label}>Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                placeholder="username (medic) / CNP (pacienti)"
                className={s.input} autoComplete="username" />
              <label className={s.label}>Parola</label>
              <div className={s.passwordWrap}>
                <input type={showPassword ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                  className={s.inputPassword} autoComplete="current-password" />
                <span onClick={() => setShowPassword(!showPassword)} className={s.showToggle}>
                  {showPassword ? 'Ascunde' : 'Arata'}
                </span>
              </div>
              <div className={s.forgotWrap}>
                <span onClick={() => { setShowReset(true); setError(null) }} className={s.forgotLink}>
                  Am uitat parola
                </span>
              </div>
              <button type="submit" disabled={loading} className={s.btnPrimary}>
                {loading ? 'Se conecteaza...' : 'Intra in cont'}
              </button>
            </form>
          </> : <>
            <div className={s.title}>Resetare parolă</div>
            <div className={s.subtitle}>Introduceți username-ul (sau CNP-ul pentru pacienți). Veți primi parola temporară pe email.</div>
            {resetMsg && (
              <div className={resetMsg.err ? s.msgError : s.msgSuccess}>
                {resetMsg.text}
              </div>
            )}
            <form onSubmit={handleReset}>
              <label className={s.label}>Username / CNP</label>
              <input type="text" value={resetEmail} onChange={e => setResetEmail(e.target.value)}
                placeholder="username sau CNP (pacienți)"
                className={s.inputReset} autoComplete="username" />
              <button type="submit" disabled={resetLoading} className={s.btnPrimary}>
                {resetLoading ? 'Se trimite...' : 'Trimite parola temporară'}
              </button>
            </form>
            <div className={s.backWrap}>
              <span onClick={() => { setShowReset(false); setResetMsg(null) }} className={s.backLink}>
                ← Înapoi la autentificare
              </span>
            </div>
          </>}

        </div>
        <div className={s.footer}>MED487 — Gestiune Medicala</div>
        <a href="/" className={s.footerLink}>← Înapoi la site</a>
      </div>
    </div>
  )
}