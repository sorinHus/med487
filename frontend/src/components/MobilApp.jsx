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

const STATUS_LABELS = {
  programata:  'Programată',
  confirmata:  'Confirmată',
  anulata:     'Anulată',
  finalizata:  'Finalizată',
}

const STATUS_CLASS = {
  programata: s.statusProgramata,
  confirmata: s.statusConfirmata,
  anulata:    s.statusAnulata,
  finalizata: s.statusFinalizata,
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

      // Verificam ca e medic/asistent
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
  const [user, setUser]             = useState(() => {
    try { return JSON.parse(localStorage.getItem('mobil_user')) } catch { return null }
  })
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [programari, setProgramari]     = useState([])
  const [loading, setLoading]           = useState(false)
  const [updating, setUpdating]         = useState(null) // id-ul care se updateaza

  // Inregistrare Service Worker
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
      // Sortam dupa ora
      list.sort((a, b) => (a.ora || '').localeCompare(b.ora || ''))
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
      // Actualizam local fara re-fetch
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

  // Statistici
  const total      = programari.length
  const confirmate = programari.filter(p => p.status === 'confirmata').length
  const pending    = programari.filter(p => p.status === 'programata').length
  const anulate    = programari.filter(p => p.status === 'anulata').length

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
        {!isToday
          ? <button className={s.todayBtn} onClick={goToday}>Azi</button>
          : <button className={s.dayNavBtn} onClick={() => changeDay(1)}>›</button>
        }
        {isToday && <button className={s.dayNavBtn} onClick={() => changeDay(1)}>›</button>}
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
                {/* ORA */}
                <div className={s.timeBlock}>
                  <div className={s.timeText}>{p.ora ? p.ora.slice(0, 5) : '--:--'}</div>
                  <div className={s.timeSub}>ora</div>
                </div>
                {/* INFO PACIENT */}
                <div className={s.cardInfo}>
                  <div className={s.cardName}>
                    {p.pacient_nume || p.pacient_name || `Pacient #${p.pacient}`}
                  </div>
                  {p.motiv && <div className={s.cardMotiv}>{p.motiv}</div>}
                </div>
                {/* STATUS BADGE */}
                <div className={`${s.statusBadge} ${STATUS_CLASS[p.status] || ''}`}>
                  {STATUS_LABELS[p.status] || p.status}
                </div>
              </div>

              {/* BUTOANE ACTIUNE */}
              <div className={s.actions}>
                <button
                  className={`${s.actionBtn} ${s.btnConfirma}`}
                  disabled={p.status === 'confirmata' || p.status === 'finalizata' || p.status === 'anulata' || updating === p.id}
                  onClick={() => updateStatus(p.id, 'confirmata')}
                >
                  ✓ Confirmă
                </button>
                <button
                  className={`${s.actionBtn} ${s.btnFinalizeaza}`}
                  disabled={p.status === 'finalizata' || p.status === 'anulata' || updating === p.id}
                  onClick={() => updateStatus(p.id, 'finalizata')}
                >
                  ✔ Finalizează
                </button>
                <button
                  className={`${s.actionBtn} ${s.btnAnuleaza}`}
                  disabled={p.status === 'anulata' || p.status === 'finalizata' || updating === p.id}
                  onClick={() => updateStatus(p.id, 'anulata')}
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