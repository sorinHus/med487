import { useState, useEffect } from 'react'
import api from '../api'
import s from '../styles/Programari.module.css'

const AVATAR_COLORS = ['#3a7bd5','#e05c7a','#f5a623','#50c878','#9b59b6','#1abc9c','#e67e22']

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0,2).toUpperCase()
}
function getAvatarColor(name) {
  if (!name) return AVATAR_COLORS[0]
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

function getMondayOf(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}
function addDays(date, n) { const d = new Date(date); d.setDate(d.getDate() + n); return d }
function formatDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
}
function formatOra(dataOra) {
  return new Date(dataOra).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
}

const ZILE_RO = ['Luni', 'Marti', 'Miercuri', 'Joi', 'Vineri', 'Sambata', 'Duminica']
const LUNI_RO = ['ianuarie','februarie','martie','aprilie','mai','iunie','iulie','august','septembrie','octombrie','noiembrie','decembrie']

const STATUS_STYLE = {
  programat: { bg: 'rgba(58,123,213,0.15)',  color: '#60a5fa', label: 'Programat' },
  confirmat: { bg: 'rgba(46,204,143,0.15)',  color: '#34d399', label: 'Confirmat' },
  'in sala': { bg: 'rgba(245,166,35,0.15)',  color: '#fbbf24', label: 'In sala' },
  finalizat: { bg: 'rgba(107,114,128,0.15)', color: '#9ca3af', label: 'Finalizat' },
  anulat:    { bg: 'rgba(239,68,68,0.15)',   color: '#f87171', label: 'Anulat' },
}

function Badge({ status }) {
  const st = STATUS_STYLE[status] || STATUS_STYLE.programat
  return (
    <span className={s.badge} style={{ background: st.bg, color: st.color }}>
      {st.label}
    </span>
  )
}

function ModalProgramare({ onClose, onSaved }) {
  const [form, setForm] = useState({
    data_ora: new Date().toISOString().slice(0, 16),
    durata_min: 20, motiv: '', nume_pacient: '', telefon_pacient: '',
    email_pacient: '', medic: 1, status: 'programat',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError(null)
    try { await api.post('/programari/', form); setSaving(false); onSaved() }
    // eslint-disable-next-line no-unused-vars
    catch (err) { setError('Eroare la salvare. Verificati datele.'); setSaving(false) }
  }

  return (
    <div className={s.modalOverlay}>
      <div className={s.modalBox}>
        <div className={s.modalHeader}>
          <span className={s.modalTitle}>Programare noua</span>
          <button onClick={onClose} className={s.modalClose}>×</button>
        </div>
        {error && <div className={s.modalError}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className={s.formGrid2}>
            <div>
              <label className={s.formLabel}>Data si ora *</label>
              <input type="datetime-local" value={form.data_ora} onChange={e => setForm(p => ({ ...p, data_ora: e.target.value }))} required className={s.formInput} />
            </div>
            <div>
              <label className={s.formLabel}>Durata (min)</label>
              <select value={form.durata_min} onChange={e => setForm(p => ({ ...p, durata_min: parseInt(e.target.value) }))} className={s.formInput}>
                {[10,15,20,30,45,60].map(d => <option key={d} value={d}>{d} min</option>)}
              </select>
            </div>
          </div>
          <label className={s.formLabel}>Nume pacient *</label>
          <input value={form.nume_pacient} onChange={e => setForm(p => ({ ...p, nume_pacient: e.target.value }))} required placeholder="Nume si prenume" className={s.formInput} />
          <div className={s.formGrid2}>
            <div>
              <label className={s.formLabel}>Telefon</label>
              <input value={form.telefon_pacient} onChange={e => setForm(p => ({ ...p, telefon_pacient: e.target.value }))} placeholder="07xx xxx xxx" className={s.formInput} />
            </div>
            <div>
              <label className={s.formLabel}>Email</label>
              <input type="email" value={form.email_pacient} onChange={e => setForm(p => ({ ...p, email_pacient: e.target.value }))} className={s.formInput} />
            </div>
          </div>
          <label className={s.formLabel}>Motiv consultatie</label>
          <input value={form.motiv} onChange={e => setForm(p => ({ ...p, motiv: e.target.value }))} placeholder="ex. Control periodic, Reinnoire reteta..." className={s.formInput} />
          <label className={s.formLabel}>Status</label>
          <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className={s.formInput}>
            <option value="programat">Programat</option>
            <option value="confirmat">Confirmat</option>
          </select>
          <div className={s.formActions}>
            <button type="button" onClick={onClose} className={s.btnCancel}>Anuleaza</button>
            <button type="submit" disabled={saving} className={s.btnSave}>
              {saving ? 'Se salveaza...' : 'Salveaza'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function RandProgramare({ p, onStatusChange, index }) {
  const nume = p.pacient_nume_complet || p.nume_pacient || '—'
  const ora = formatOra(p.data_ora)

  const handleStatus = async (newStatus) => {
    try { await api.patch(`/programari/${p.id}/`, { status: newStatus }); onStatusChange() }
    catch (err) { console.error(err) }
  }

  return (
    <div className={s.rand}>
      <span className={s.rand__index}>{index + 1}</span>
      <span className={s.rand__ora}>{ora}</span>
      <div className={s.rand__avatar} style={{ background: getAvatarColor(nume) }}>
        {getInitials(nume)}
      </div>
      <div className={s.rand__info}>
        <div className={s.rand__nume}>{nume}</div>
        {p.motiv && <div className={s.rand__motiv}>{p.motiv}</div>}
        {p.telefon_pacient && <div className={s.rand__telefon}>{p.telefon_pacient}</div>}
      </div>
      <div className={s.rand__actions}>
        <Badge status={p.status} />
        {p.status === 'programat' && (
          <button onClick={() => handleStatus('confirmat')} title="Confirma" className={s.btnConfirm}>✓</button>
        )}
        {['programat','confirmat'].includes(p.status) && (
          <button onClick={() => handleStatus('anulat')} title="Anuleaza" className={s.btnAnuleaza}>✕</button>
        )}
        {p.status === 'confirmat' && (
          <button onClick={() => handleStatus('finalizat')} title="Finalizeaza" className={s.btnFinalizeaza}>✔✔</button>
        )}
      </div>
    </div>
  )
}

export default function Programari() {
  const [monday, setMonday] = useState(() => getMondayOf(new Date()))
  const [programari, setProgramari] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalKey, setModalKey] = useState(0)

  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i))

  const saptamanaLabel = () => {
    const start = monday, end = addDays(monday, 6)
    const sm = LUNI_RO[start.getMonth()], em = LUNI_RO[end.getMonth()]
    const sy = start.getFullYear(), ey = end.getFullYear()
    if (sy !== ey) return `${start.getDate()} ${sm} ${sy} — ${end.getDate()} ${em} ${ey}`
    if (sm !== em) return `${start.getDate()} ${sm} — ${end.getDate()} ${em} ${sy}`
    return `${start.getDate()} — ${end.getDate()} ${sm} ${sy}`
  }

  const fetchProgramari = async () => {
    setLoading(true)
    try {
      const res = await api.get('/programari/', { params: { saptamana: formatDate(monday) } })
      setProgramari(Array.isArray(res.data) ? res.data : (res.data.results || []))
    } finally { setLoading(false) }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchProgramari() }, [monday])

  const getProgramariZi = (date) => {
    const dateStr = formatDate(date)
    return programari.filter(p => p.data_ora.slice(0, 10) === dateStr).sort((a, b) => a.data_ora.localeCompare(b.data_ora))
  }

  const aziStr = formatDate(new Date())
  const isToday = (date) => formatDate(date) === aziStr

  return (
    <div>
      <div className={s.pageHeader}>
        <div className={s.pageHeader__left}>
          <button className={s.btnNav} onClick={() => setMonday(m => addDays(m, -7))}>← Prev</button>
          <button className={s.btnNav} onClick={() => setMonday(getMondayOf(new Date()))}>Azi</button>
          <button className={s.btnNav} onClick={() => setMonday(m => addDays(m, 7))}>Next →</button>
          <span className={s.pageHeader__title}>Programari — saptamana {saptamanaLabel()}</span>
        </div>
        <button className={s.btnNou} onClick={() => { setShowModal(true); setModalKey(k => k + 1) }}>
          + Programare noua
        </button>
      </div>

      {loading ? (
        <div className={s.loading}>Se incarca...</div>
      ) : (
        <div className={s.dayList}>
          {days.map((day, idx) => {
            const prog = getProgramariZi(day)
            const today = isToday(day)
            return (
              <div key={idx} className={`${s.dayCard} ${today ? s['dayCard--today'] : ''}`}>
                <div className={`${s.dayHeader} ${today ? s['dayHeader--today'] : ''} ${prog.length > 0 ? s['dayHeader--withRows'] : ''}`}>
                  <div className={s.dayHeader__left}>
                    <span className={`${s.dayHeader__zi} ${today ? s['dayHeader__zi--today'] : ''}`}>{ZILE_RO[idx]}</span>
                    <span className={s.dayHeader__data}>{day.getDate()} {LUNI_RO[day.getMonth()]}</span>
                    {today && <span className={s.dayHeader__aziTag}>Azi</span>}
                  </div>
                  <span className={s.dayHeader__count}>
                    {prog.length > 0 ? `${prog.length} programare${prog.length !== 1 ? 'i' : ''}` : 'Liber'}
                  </span>
                </div>
                {prog.length > 0 && (
                  <div>{prog.map((p, index) => <RandProgramare key={p.id} p={p} onStatusChange={fetchProgramari} index={index} />)}</div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showModal && <ModalProgramare key={modalKey} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); fetchProgramari() }} />}
    </div>
  )
}