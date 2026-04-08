import { useState, useEffect, useCallback } from 'react'
import s from '../styles/MobilApp.module.css'

const API = import.meta.env.VITE_API_URL || 'https://web-production-26811.up.railway.app/api'

const ZILE = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă']
const LUNI = ['ian', 'feb', 'mar', 'apr', 'mai', 'iun', 'iul', 'aug', 'sep', 'oct', 'nov', 'dec']

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDate(d) {
  return `${d.getDate()} ${LUNI[d.getMonth()]} ${d.getFullYear()}`
}

function getOra(data_ora) {
  if (!data_ora) return '--:--'
  const d = new Date(data_ora)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const STATUS_LABELS = {
  programat:  'Programat',
  confirmat:  'Confirmat',
  anulat:     'Anulat',
  finalizat:  'Finalizat',
}

const STATUS_CLASS = {
  programat: s.statusProgramata,
  confirmat: s.statusConfirmata,
  anulat:    s.statusAnulata,
  finalizat: s.statusFinalizata,
}

/* ────────────────────────────────────────────
   LOGIN SCREEN
──────────────────────────────────────────── */
function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr]           = useState('')
  const [loading, setLoading]   = useState(false)

  const handleLogin = async () => {
    setErr('')
    setLoading(true)
    try {
      const res = await fetch(`${API}/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()

      const meRes = await fetch(`${API}/useri/me/`, {
        headers: { Authorization: `Bearer ${data.access}` }
      })
      const me = await meRes.json()
      if (!['medic', 'asistent', 'superadmin'].includes(me.rol)) {
        setErr('Această aplicație este doar pentru personalul medical.')
        setLoading(false)
        return
      }

      localStorage.setItem('mobil_access',  data.access)
      localStorage.setItem('mobil_refresh', data.refresh)
      localStorage.setItem('mobil_user',    JSON.stringify(me))
      onLogin(me)
    } catch {
      setErr('Username sau parolă incorecte.')
    }
    setLoading(false)
  }

  return (
    <div className={s.loginWrap}>
      <div className={s.loginLogo}>🏥 MED487</div>
      <div className={s.loginCard}>
        <div className={s.loginTitle}>Acces personal medical</div>
        <input
          className={s.input}
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          autoCapitalize="none"
          autoCorrect="off"
        />
        <input
          className={s.input}
          type="password"
          placeholder="Parolă"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
        />
        {err && <div className={s.loginErr}>{err}</div>}
        <button className={s.loginBtn} onClick={handleLogin} disabled={loading}>
          {loading ? 'Se conectează...' : 'Intră în cont'}
        </button>
      </div>
      <div className={s.installHint}>
        💡 Pe Android: meniu Chrome → „Adaugă pe ecranul principal"<br />
        Pe iPhone: buton Partajare → „Adaugă pe ecran principal"
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────
   MAIN APP
──────────────────────────────────────────── */
export default function MobilApp() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mobil_user')) } catch { return null }
  })
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [programari, setProgramari]     = useState([])
  const [loading, setLoading]           = useState(false)
  const [updating, setUpdating]         = useState(null)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  const getToken = () => localStorage.getItem('mobil_access')

  const fetchProgramari = useCallback(async (date) => {
    const token = getToken()
    if (!token) return
    setLoading(true)
    try {
      const dateStr = toDateStr(date)
      const res = await fetch(`${API}/programari/?data=${dateStr}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      const list = Array.isArray(data) ? data : data.results || []
      list.sort((a, b) => (a.data_ora || '').localeCompare(b.data_ora || ''))
      setProgramari(list)
    } catch {
      setProgramari([])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (user) fetchProgramari(selectedDate)
  }, [user, selectedDate, fetchProgramari])

  const changeDay = (delta) => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + delta)
    setSelectedDate(d)
  }

  const goToday = () => setSelectedDate(new Date())

  const updateStatus = async (id, status) => {
    const token = getToken()
    if (!token) return
    setUpdating(id)
    try {
      await fetch(`${API}/programari/${id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      })
      setProgramari(prev => prev.map(p => p.id === id ? { ...p, status } : p))
    } catch {
      alert('Eroare la actualizare. Verifică conexiunea.')
    }
    setUpdating(null)
  }

  const handleLogout = () => {
    localStorage.removeItem('mobil_access')
    localStorage.removeItem('mobil_refresh')
    localStorage.removeItem('mobil_user')
    setUser(null)
  }

  if (!user) return <LoginScreen onLogin={setUser} />

  const total     = programari.length
  const confirmate = programari.filter(p => p.status === 'confirmat').length
  const pending    = programari.filter(p => p.status === 'programat').length
  const anulate    = programari.filter(p => p.status === 'anulat').length

  const isToday = toDateStr(selectedDate) === toDateStr(new Date())

  return (
    <div className={s.container}>
      {/* HEADER */}
      <div className={s.header}>
        <div>
          <div className={s.headerTitle}>🏥 MED487</div>
          <div className={s.headerSub}>
            {user.first_name || user.username}
            {user.rol === 'medic' ? ' • Dr.' : ''}
          </div>
        </div>
        <button className={s.logoutBtn} onClick={handleLogout}>Ieșire</button>
      </div>

      {/* NAVIGARE ZILE */}
      <div className={s.dayNav}>
        <button className={s.dayNavBtn} onClick={() => changeDay(-1)}>‹</button>
        <div className={s.dayLabel}>
          <div className={s.dayLabelDate}>
            {isToday ? '📅 Azi, ' : ''}{formatDate(selectedDate)}
          </div>
          <div className={s.dayLabelName}>{ZILE[selectedDate.getDay()]}</div>
        </div>
        <button className={s.dayNavBtn} onClick={() => changeDay(1)}>›</button>
        {!isToday && (
          <button className={s.todayBtn} onClick={goToday}>Azi</button>
        )}
      </div>

      {/* BADGES SUMAR */}
      <div className={s.summary}>
        <div className={`${s.badge} ${s.badgeTotal}`}>
          <div className={s.badgeNum}>{total}</div>
          <div className={s.badgeLabel}>Total</div>
        </div>
        <div className={`${s.badge} ${s.badgeOk}`}>
          <div className={s.badgeNum}>{confirmate}</div>
          <div className={s.badgeLabel}>Confirmate</div>
        </div>
        <div className={`${s.badge} ${s.badgePending}`}>
          <div className={s.badgeNum}>{pending}</div>
          <div className={s.badgeLabel}>În așteptare</div>
        </div>
        <div className={`${s.badge} ${s.badgeCancel}`}>
          <div className={s.badgeNum}>{anulate}</div>
          <div className={s.badgeLabel}>Anulate</div>
        </div>
      </div>

      {/* LISTA */}
      {loading ? (
        <div className={s.loading}>Se încarcă...</div>
      ) : programari.length === 0 ? (
        <div className={s.empty}>
          <div className={s.emptyIcon}>📭</div>
          <div className={s.emptyText}>Nicio programare în această zi</div>
        </div>
      ) : (
        <div className={s.list}>
          {programari.map(p => (
            <div key={p.id} className={s.card}>
              <div className={s.cardTop}>
                <div className={s.timeBlock}>
                  <div className={s.timeText}>{getOra(p.data_ora)}</div>
                  <div className={s.timeSub}>ora</div>
                </div>
                <div className={s.cardInfo}>
                  <div className={s.cardName}>
                    {p.pacient_nume_complet || p.nume_pacient || `Pacient #${p.pacient}`}
                  </div>
                  {p.motiv && <div className={s.cardMotiv}>{p.motiv}</div>}
                </div>
                <div className={`${s.statusBadge} ${STATUS_CLASS[p.status] || ''}`}>
                  {STATUS_LABELS[p.status] || p.status}
                </div>
              </div>

              <div className={s.actions}>
                <button
                  className={`${s.actionBtn} ${s.btnConfirma}`}
                  disabled={['confirmat','finalizat','anulat'].includes(p.status) || updating === p.id}
                  onClick={() => updateStatus(p.id, 'confirmat')}
                >
                  ✓ Confirmă
                </button>
                <button
                  className={`${s.actionBtn} ${s.btnFinalizeaza}`}
                  disabled={['finalizat','anulat'].includes(p.status) || updating === p.id}
                  onClick={() => updateStatus(p.id, 'finalizat')}
                >
                  ✔ Finalizează
                </button>
                <button
                  className={`${s.actionBtn} ${s.btnAnuleaza}`}
                  disabled={['anulat','finalizat'].includes(p.status) || updating === p.id}
                  onClick={() => updateStatus(p.id, 'anulat')}
                >
                  ✕ Anulează
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}