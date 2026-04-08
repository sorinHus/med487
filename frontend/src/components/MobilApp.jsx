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

const STATUS_LABELS = { programat: 'Programat', confirmat: 'Confirmat', anulat: 'Anulat', finalizat: 'Finalizat' }
const STATUS_CLASS  = { programat: s.statusProgramata, confirmat: s.statusConfirmata, anulat: s.statusAnulata, finalizat: s.statusFinalizata }
const ROL_LABEL     = { medic: 'Medic', asistent: 'Asistent', superadmin: 'Superadmin', pacient: 'Pacient' }

async function apiFetch(path, token, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${API}${path}`, { ...opts, headers })
  if (!res.ok) throw new Error(res.status)
  if (res.status === 204) return null
  return res.json()
}

/* ════════════════════════════════════════════
   LOGIN
════════════════════════════════════════════ */
function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr]           = useState('')
  const [loading, setLoading]   = useState(false)

  const handleLogin = async () => {
    setErr(''); setLoading(true)
    try {
      const data = await apiFetch('/token/', null, { method: 'POST', body: JSON.stringify({ username, password }) })
      const me   = await apiFetch('/useri/me/', data.access)
      if (!['medic', 'asistent', 'superadmin'].includes(me.rol)) {
        setErr('Această aplicație este doar pentru personalul medical.')
        setLoading(false); return
      }
      localStorage.setItem('mobil_access',  data.access)
      localStorage.setItem('mobil_refresh', data.refresh)
      localStorage.setItem('mobil_user',    JSON.stringify(me))
      onLogin(me)
    } catch { setErr('Username sau parolă incorecte.') }
    setLoading(false)
  }

  return (
    <div className={s.loginWrap}>
      <div className={s.loginLogo}>🏥 MED487</div>
      <div className={s.loginCard}>
        <div className={s.loginTitle}>Acces personal medical</div>
        <input className={s.input} type="text" placeholder="Username" value={username}
          onChange={e => setUsername(e.target.value)} autoCapitalize="none" autoCorrect="off" />
        <input className={s.input} type="password" placeholder="Parolă" value={password}
          onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
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

/* ════════════════════════════════════════════
   MODAL ADAUGARE PROGRAMARE
════════════════════════════════════════════ */
function ModalAdaugare({ token, user, selectedDate, onClose, onSaved }) {
  const [step, setStep]         = useState('data') // data → slot → form → saving
  const [data, setData]         = useState(selectedDate)
  const [slots, setSlots]       = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [slotSel, setSlotSel]   = useState(null)
  const [nume, setNume]         = useState('')
  const [telefon, setTelefon]   = useState('')
  const [motiv, setMotiv]       = useState('')
  const [saving, setSaving]     = useState(false)
  const [err, setErr]           = useState('')

  const fetchSlots = async (d) => {
    setLoadingSlots(true); setSlots([]); setSlotSel(null)
    try {
      const res = await apiFetch(`/programari/slots_libere/?data=${toDateStr(d)}&medic=${user.id}`, token)
      setSlots(res)
    } catch { setErr('Nu s-au putut încărca sloturile.') }
    setLoadingSlots(false)
    setStep('slot')
  }

  const handleSelectData = () => {
    setErr('')
    fetchSlots(data)
  }

  const handleSelectSlot = (slot) => {
    if (!slot.liber) return
    setSlotSel(slot.ora)
    setStep('form')
  }

  const handleSave = async () => {
    if (!nume.trim()) { setErr('Numele este obligatoriu.'); return }
    setSaving(true); setErr('')
    try {
      const [h, m] = slotSel.split(':')
      const dt = new Date(data)
      dt.setHours(parseInt(h), parseInt(m), 0, 0)
      const data_ora = dt.toISOString()
      await apiFetch('/programari/', token, {
        method: 'POST',
        body: JSON.stringify({
          medic: user.id,
          data_ora,
          nume_pacient: nume.trim(),
          telefon_pacient: telefon.trim(),
          motiv: motiv.trim(),
          durata_min: 20,
          status: 'programat',
        })
      })
      onSaved()
    } catch { setErr('Eroare la salvare. Încearcă din nou.') }
    setSaving(false)
  }

  // Zile din luna curenta pentru selectie rapida
  const azi = new Date()
  const zileRapide = []
  for (let i = 0; i < 14; i++) {
    const d = new Date(azi)
    d.setDate(azi.getDate() + i)
    zileRapide.push(d)
  }

  return (
    <div className={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={s.modal}>
        {/* HEADER MODAL */}
        <div className={s.modalHeader}>
          <div className={s.modalTitle}>
            {step === 'data' && '📅 Selectează data'}
            {step === 'slot' && `🕐 Sloturi — ${formatDate(data)}`}
            {step === 'form' && `✏️ Detalii — ${formatDate(data)} ${slotSel}`}
          </div>
          <button className={s.modalClose} onClick={onClose}>✕</button>
        </div>

        {err && <div className={s.loginErr} style={{ margin: '0 0 12px' }}>{err}</div>}

        {/* STEP 1: DATA */}
        {step === 'data' && (
          <div className={s.modalBody}>
            <div className={s.zileRapide}>
              {zileRapide.map(d => {
                const isSelected = toDateStr(d) === toDateStr(data)
                const isAzi = toDateStr(d) === toDateStr(azi)
                return (
                  <button key={toDateStr(d)}
                    className={`${s.ziRapida} ${isSelected ? s.ziRapidaActive : ''}`}
                    onClick={() => setData(new Date(d))}>
                    <div className={s.ziRapidaNume}>{ZILE[d.getDay()].slice(0, 3)}</div>
                    <div className={s.ziRapidaData}>{d.getDate()} {LUNI[d.getMonth()]}</div>
                    {isAzi && <div className={s.ziRapidaAzi}>azi</div>}
                  </button>
                )
              })}
            </div>
            <button className={s.loginBtn} onClick={handleSelectData}>
              Vezi sloturi disponibile →
            </button>
          </div>
        )}

        {/* STEP 2: SLOT */}
        {step === 'slot' && (
          <div className={s.modalBody}>
            <button className={s.backBtn} onClick={() => setStep('data')}>← Schimbă data</button>
            {loadingSlots ? (
              <div className={s.loading}>Se încarcă sloturile...</div>
            ) : slots.length === 0 ? (
              <div className={s.empty}>
                <div className={s.emptyIcon}>📭</div>
                <div className={s.emptyText}>Nu există sloturi disponibile în această zi</div>
                <button className={s.backBtn} onClick={() => setStep('data')}>← Alege altă dată</button>
              </div>
            ) : (
              <>
                <div className={s.sloturiGrid}>
                  {slots.map(slot => (
                    <button key={slot.ora}
                      className={`${s.slotBtn} ${slot.liber ? s.slotLiber : s.slotOcupat}`}
                      onClick={() => handleSelectSlot(slot)}
                      disabled={!slot.liber}>
                      {slot.ora}
                      {!slot.liber && <div className={s.slotOcupatLabel}>ocupat</div>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* STEP 3: FORM */}
        {step === 'form' && (
          <div className={s.modalBody}>
            <button className={s.backBtn} onClick={() => setStep('slot')}>← Schimbă ora</button>
            <div className={s.slotSel}>
              ✓ {formatDate(data)} la ora <strong>{slotSel}</strong>
            </div>
            <label className={s.formLabel}>Nume pacient *</label>
            <input className={s.input} placeholder="ex: Popescu Ion"
              value={nume} onChange={e => setNume(e.target.value)} />
            <label className={s.formLabel}>Telefon</label>
            <input className={s.input} type="tel" placeholder="07xx xxx xxx"
              value={telefon} onChange={e => setTelefon(e.target.value)} />
            <label className={s.formLabel}>Motiv consultație</label>
            <input className={s.input} placeholder="ex: Control periodic"
              value={motiv} onChange={e => setMotiv(e.target.value)} />
            <button className={s.loginBtn} onClick={handleSave} disabled={saving}>
              {saving ? 'Se salvează...' : '✓ Salvează programarea'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════
   SUPERADMIN — TAB UTILIZATORI
════════════════════════════════════════════ */
function TabUtilizatori({ token }) {
  const [useri, setUseri]     = useState([])
  const [loading, setLoading] = useState(true)
  const mineId = JSON.parse(localStorage.getItem('mobil_user') || '{}').id

  const fetch_ = async () => {
    setLoading(true)
    try { setUseri((await apiFetch('/useri/', token)).results || []) } catch {}
    setLoading(false)
  }

  useEffect(() => { fetch_() }, [])

  const toggleActiv = async (u) => {
    if (u.id === mineId) { alert('Nu poți dezactiva propriul cont.'); return }
    try {
      await apiFetch(`/useri/${u.id}/toggle_activ/`, token, { method: 'POST' })
      setUseri(prev => prev.map(x => x.id === u.id ? { ...x, is_active: !x.is_active } : x))
    } catch { alert('Eroare la actualizare.') }
  }

  const sterge = async (u) => {
    if (u.id === mineId) { alert('Nu poți șterge propriul cont.'); return }
    if (!window.confirm(`Ștergi utilizatorul ${u.username}?`)) return
    try {
      await apiFetch(`/useri/${u.id}/`, token, { method: 'DELETE' })
      setUseri(prev => prev.filter(x => x.id !== u.id))
    } catch { alert('Eroare la ștergere.') }
  }

  if (loading) return <div className={s.loading}>Se încarcă...</div>

  return (
    <div className={s.adminList}>
      {useri.map(u => (
        <div key={u.id} className={s.adminCard}>
          <div className={s.adminCardTop}>
            <div>
              <div className={s.adminName}>{u.last_name} {u.first_name}</div>
              <div className={s.adminSub}>{u.username} · {ROL_LABEL[u.rol] || u.rol}</div>
            </div>
            <span className={u.is_active ? s.badgeActiv : s.badgeInactiv}>
              {u.is_active ? 'Activ' : 'Inactiv'}
            </span>
          </div>
          <div className={s.adminActions}>
            <button className={`${s.adminBtn} ${u.is_active ? s.adminBtnWarn : s.adminBtnOk}`}
              onClick={() => toggleActiv(u)} disabled={u.id === mineId}>
              {u.is_active ? 'Dezactivează' : 'Activează'}
            </button>
            <button className={`${s.adminBtn} ${s.adminBtnDanger}`}
              onClick={() => sterge(u)} disabled={u.id === mineId}>
              Șterge
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ════════════════════════════════════════════
   SUPERADMIN — TAB MODULE
════════════════════════════════════════════ */
const TOATE_MODULELE = ['retete', 'trimiteri', 'concedii', 'rapoarte', 'documente']
const MODUL_LABEL    = { retete: 'Rețete', trimiteri: 'Trimiteri', concedii: 'Concedii medicale', rapoarte: 'Rapoarte', documente: 'Documente' }

function TabModule({ token }) {
  const [useri, setUseri]     = useState([])
  const [module, setModule]   = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [d1, d2] = await Promise.all([
          apiFetch('/useri/?rol=medic', token),
          apiFetch('/useri/?rol=asistent', token),
        ])
        const list = [...(d1.results || []), ...(d2.results || [])]
        setUseri(list)
        const m = {}
        await Promise.all(list.map(async u => {
          try { const r = await apiFetch(`/module/${u.id}/`, token); m[u.id] = r.active || [] }
          catch { m[u.id] = [] }
        }))
        setModule(m)
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  const toggle = async (userId, modul) => {
    const curent = module[userId] || []
    const nou    = curent.includes(modul) ? curent.filter(x => x !== modul) : [...curent, modul]
    setSaving(`${userId}-${modul}`)
    try {
      await apiFetch(`/module/${userId}/`, token, { method: 'PUT', body: JSON.stringify({ active: nou }) })
      setModule(prev => ({ ...prev, [userId]: nou }))
    } catch { alert('Eroare la salvare.') }
    setSaving(null)
  }

  if (loading) return <div className={s.loading}>Se încarcă...</div>

  return (
    <div className={s.adminList}>
      {useri.map(u => (
        <div key={u.id} className={s.adminCard}>
          <div className={s.adminName}>{u.last_name} {u.first_name}</div>
          <div className={s.adminSub}>{u.username}</div>
          <div className={s.moduleGrid}>
            {TOATE_MODULELE.map(m => {
              const activ = (module[u.id] || []).includes(m)
              return (
                <button key={m}
                  className={`${s.moduleBtn} ${activ ? s.moduleBtnOn : s.moduleBtnOff}`}
                  disabled={saving === `${u.id}-${m}`}
                  onClick={() => toggle(u.id, m)}>
                  {activ ? '✓ ' : ''}{MODUL_LABEL[m]}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ════════════════════════════════════════════
   SUPERADMIN — TAB SETARI
════════════════════════════════════════════ */
function TabSetari({ token }) {
  const [cfg, setCfg]         = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [ok, setOk]           = useState(false)

  useEffect(() => {
    apiFetch('/configuratie/', token).then(setCfg).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true); setOk(false)
    try {
      await apiFetch('/configuratie/', token, { method: 'PATCH', body: JSON.stringify({
        denumire_unitate: cfg.denumire_unitate, localitate: cfg.localitate,
        telefon: cfg.telefon, email_contact: cfg.email_contact,
        durata_slot: cfg.durata_slot, max_programari_zi: cfg.max_programari_zi,
        mod_mentenanta: cfg.mod_mentenanta, nr_contract_cas: cfg.nr_contract_cas, cod_cas: cfg.cod_cas,
      })})
      setOk(true); setTimeout(() => setOk(false), 2500)
    } catch { alert('Eroare la salvare.') }
    setSaving(false)
  }

  if (loading || !cfg) return <div className={s.loading}>Se încarcă...</div>

  const field = (label, key, type = 'text') => (
    <div className={s.settingRow}>
      <label className={s.settingLabel}>{label}</label>
      {type === 'checkbox'
        ? <input type="checkbox" checked={!!cfg[key]} onChange={e => setCfg(p => ({ ...p, [key]: e.target.checked }))} />
        : <input className={s.settingInput} type={type} value={cfg[key] || ''}
            onChange={e => setCfg(p => ({ ...p, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))} />
      }
    </div>
  )

  return (
    <div className={s.adminList}>
      <div className={s.adminCard}>
        {field('Denumire unitate', 'denumire_unitate')}
        {field('Localitate', 'localitate')}
        {field('Telefon', 'telefon')}
        {field('Email contact', 'email_contact')}
        {field('Durată slot (min)', 'durata_slot', 'number')}
        {field('Max programări/zi', 'max_programari_zi', 'number')}
        {field('Nr. contract CAS', 'nr_contract_cas')}
        {field('Cod CAS', 'cod_cas')}
        <div className={s.settingRow}>
          <label className={s.settingLabel}>Mod mentenanță</label>
          <input type="checkbox" checked={!!cfg.mod_mentenanta}
            onChange={e => setCfg(p => ({ ...p, mod_mentenanta: e.target.checked }))} />
        </div>
        <button className={s.loginBtn} onClick={save} disabled={saving}>
          {saving ? 'Se salvează...' : ok ? '✓ Salvat!' : 'Salvează'}
        </button>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════
   SUPERADMIN — TAB LOGURI
════════════════════════════════════════════ */
function TabLoguri({ token }) {
  const [loguri, setLoguri]   = useState([])
  const [loading, setLoading] = useState(true)

  const fetch_ = async () => {
    setLoading(true)
    try { setLoguri(await apiFetch('/loguri/', token)) } catch {}
    setLoading(false)
  }

  useEffect(() => { fetch_() }, [])

  if (loading) return <div className={s.loading}>Se încarcă...</div>

  return (
    <div className={s.adminList}>
      <div style={{ textAlign: 'right', marginBottom: 8 }}>
        <button className={s.todayBtn} onClick={fetch_}>↻ Refresh</button>
      </div>
      {loguri.map(l => (
        <div key={l.id} className={s.logCard}>
          <div className={s.logTop}>
            <span className={s.logActiune}>{l.actiune}</span>
            <span className={s.logTime}>{l.timestamp}</span>
          </div>
          <div className={s.logUser}>{l.user} ({l.username})</div>
          {l.descriere && <div className={s.logDesc}>{l.descriere}</div>}
        </div>
      ))}
    </div>
  )
}

/* ════════════════════════════════════════════
   SUPERADMIN PANEL
════════════════════════════════════════════ */
const ADMIN_TABS = [
  { id: 'utilizatori', label: '👥 Utilizatori' },
  { id: 'module',      label: '🧩 Module' },
  { id: 'setari',      label: '⚙️ Setări' },
  { id: 'loguri',      label: '📋 Loguri' },
]

function SuperadminMobil({ token, user, onLogout }) {
  const [tab, setTab] = useState('utilizatori')

  return (
    <div className={s.container}>
      <div className={s.header}>
        <div>
          <div className={s.headerTitle}>🏥 MED487 Admin</div>
          <div className={s.headerSub}>{user.last_name} {user.first_name}</div>
        </div>
        <button className={s.logoutBtn} onClick={onLogout}>Ieșire</button>
      </div>
      <div className={s.adminTabs}>
        {ADMIN_TABS.map(t => (
          <button key={t.id}
            className={`${s.adminTab} ${tab === t.id ? s.adminTabActive : ''}`}
            onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      <div className={s.adminContent}>
        {tab === 'utilizatori' && <TabUtilizatori token={token} />}
        {tab === 'module'      && <TabModule token={token} />}
        {tab === 'setari'      && <TabSetari token={token} />}
        {tab === 'loguri'      && <TabLoguri token={token} />}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════
   MAIN APP
════════════════════════════════════════════ */
export default function MobilApp() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mobil_user')) } catch { return null }
  })
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [programari, setProgramari]     = useState([])
  const [loading, setLoading]           = useState(false)
  const [updating, setUpdating]         = useState(null)
  const [showModal, setShowModal]         = useState(false)
  const [editProgramare, setEditProgramare] = useState(null)

  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {})
  }, [])

  const token = localStorage.getItem('mobil_access')

  const fetchProgramari = useCallback(async (date) => {
    if (!token) return
    setLoading(true)
    try {
      const data = await apiFetch(`/programari/?data=${toDateStr(date)}`, token)
      const list = Array.isArray(data) ? data : data.results || []
      list.sort((a, b) => (a.data_ora || '').localeCompare(b.data_ora || ''))
      setProgramari(list)
    } catch { setProgramari([]) }
    setLoading(false)
  }, [token])

  useEffect(() => {
    if (user && user.rol !== 'superadmin') fetchProgramari(selectedDate)
  }, [user, selectedDate, fetchProgramari])

  const changeDay = delta => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + delta)
    setSelectedDate(d)
  }

  const updateStatus = async (id, status) => {
    if (!token) return
    setUpdating(id)
    try {
      await apiFetch(`/programari/${id}/`, token, { method: 'PATCH', body: JSON.stringify({ status }) })
      setProgramari(prev => prev.map(p => p.id === id ? { ...p, status } : p))
    } catch { alert('Eroare la actualizare. Verifică conexiunea.') }
    setUpdating(null)
  }

  const handleLogout = () => {
    localStorage.removeItem('mobil_access')
    localStorage.removeItem('mobil_refresh')
    localStorage.removeItem('mobil_user')
    setUser(null)
  }

  if (!user) return <LoginScreen onLogin={setUser} />
  if (user.rol === 'superadmin') return <SuperadminMobil token={token} user={user} onLogout={handleLogout} />

  const isToday    = toDateStr(selectedDate) === toDateStr(new Date())
  const total      = programari.length
  const confirmate = programari.filter(p => p.status === 'confirmat').length
  const pending    = programari.filter(p => p.status === 'programat').length
  const anulate    = programari.filter(p => p.status === 'anulat').length

  return (
    <div className={s.container}>
      {/* HEADER */}
      <div className={s.header}>
        <div>
          <div className={s.headerTitle}>🏥 MED487</div>
          <div className={s.headerSub}>
            {user.last_name && user.first_name ? `${user.last_name} ${user.first_name}` : user.username}
            {user.rol === 'medic' ? ' • Dr.' : ''}
          </div>
        </div>
        <button className={s.logoutBtn} onClick={handleLogout}>Ieșire</button>
      </div>

      {/* NAVIGARE ZILE */}
      <div className={s.dayNav}>
        <button className={s.dayNavBtn} onClick={() => changeDay(-1)}>‹</button>
        <div className={s.dayLabel}>
          <div className={s.dayLabelDate}>{isToday ? '📅 Azi, ' : ''}{formatDate(selectedDate)}</div>
          <div className={s.dayLabelName}>{ZILE[selectedDate.getDay()]}</div>
        </div>
        <button className={s.dayNavBtn} onClick={() => changeDay(1)}>›</button>
        {!isToday && <button className={s.todayBtn} onClick={() => setSelectedDate(new Date())}>Azi</button>}
      </div>

      {/* BADGES + BUTON ADAUGARE */}
      <div className={s.summaryRow}>
        <div className={s.summary}>
          <div className={`${s.badge} ${s.badgeTotal}`}><div className={s.badgeNum}>{total}</div><div className={s.badgeLabel}>Total</div></div>
          <div className={`${s.badge} ${s.badgeOk}`}><div className={s.badgeNum}>{confirmate}</div><div className={s.badgeLabel}>Confirmate</div></div>
          <div className={`${s.badge} ${s.badgePending}`}><div className={s.badgeNum}>{pending}</div><div className={s.badgeLabel}>În așteptare</div></div>
          <div className={`${s.badge} ${s.badgeCancel}`}><div className={s.badgeNum}>{anulate}</div><div className={s.badgeLabel}>Anulate</div></div>
        </div>
        <button className={s.addBtn} onClick={() => setShowModal(true)}>+</button>
      </div>

      {/* LISTA */}
      {loading ? (
        <div className={s.loading}>Se încarcă...</div>
      ) : programari.length === 0 ? (
        <div className={s.empty}>
          <div className={s.emptyIcon}>📭</div>
          <div className={s.emptyText}>Nicio programare în această zi</div>
          <button className={s.todayBtn} style={{ marginTop: 12 }} onClick={() => setShowModal(true)}>+ Adaugă programare</button>
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
                  <div className={s.cardName}>{p.pacient_nume_complet || p.nume_pacient || `Pacient #${p.pacient}`}</div>
                  {p.motiv && <div className={s.cardMotiv}>{p.motiv}</div>}
                </div>
                <div className={`${s.statusBadge} ${STATUS_CLASS[p.status] || ''}`}>
                  {STATUS_LABELS[p.status] || p.status}
                </div>
              </div>
              <div className={s.actions}>
                <button className={`${s.actionBtn} ${s.btnConfirma}`}
                  disabled={['confirmat','finalizat','anulat'].includes(p.status) || updating === p.id}
                  onClick={() => updateStatus(p.id, 'confirmat')}>✓ Confirmă</button>
                <button className={`${s.actionBtn} ${s.btnFinalizeaza}`}
                  disabled={['finalizat','anulat'].includes(p.status) || updating === p.id}
                  onClick={() => updateStatus(p.id, 'finalizat')}>✔ Finalizează</button>
                <button className={`${s.actionBtn} ${s.btnAnuleaza}`}
                  disabled={['anulat','finalizat'].includes(p.status) || updating === p.id}
                  onClick={() => updateStatus(p.id, 'anulat')}>✕ Anulează</button>
                <button className={`${s.actionBtn} ${s.btnEdit}`}
                  onClick={() => setEditProgramare(p)}>✎</button>  
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL EDITARE */}
      {editProgramare && (
        <ModalEditareMobil
          token={token}
          user={user}
          programare={editProgramare}
          onClose={() => setEditProgramare(null)}
          onSaved={() => { setEditProgramare(null); fetchProgramari(selectedDate) }}
        />
      )}
      
      {/* MODAL ADAUGARE */}
      {showModal && (
        <ModalAdaugare
          token={token}
          user={user}
          selectedDate={selectedDate}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchProgramari(selectedDate) }}
        />
      )}
    </div>
  )
}