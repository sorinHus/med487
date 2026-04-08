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
const ZILE_SCURT = ['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sa', 'Du']
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

// ── Calendar lunar mini ──────────────────────────────────────────────
function CalendarLunar({ selectedDate, onSelectDate, programariExistente }) {
  const today = new Date(); today.setHours(0,0,0,0)
  const initDate = selectedDate ? new Date(selectedDate + 'T00:00:00') : new Date()
  const [viewYear, setViewYear] = useState(initDate.getFullYear())
  const [viewMonth, setViewMonth] = useState(initDate.getMonth())

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  // Zilele lunii curente
  const firstDay = new Date(viewYear, viewMonth, 1)
  const lastDay = new Date(viewYear, viewMonth + 1, 0)
  // offset: luni=0 ... duminica=6
  const startOffset = (firstDay.getDay() + 6) % 7
  const totalCells = startOffset + lastDay.getDate()
  const rows = Math.ceil(totalCells / 7)

  const cells = []
  for (let i = 0; i < rows * 7; i++) {
    const dayNum = i - startOffset + 1
    if (dayNum < 1 || dayNum > lastDay.getDate()) {
      cells.push(null)
    } else {
      cells.push(dayNum)
    }
  }

  // zilele care au deja programari (din saptamana curenta incarcata)
  const zileOcupate = new Set(
    (programariExistente || []).map(p => p.data_ora.slice(0, 10))
  )

  return (
    <div className={s.calLunar}>
      <div className={s.calLunar__header}>
        <button type="button" className={s.calLunar__navBtn} onClick={prevMonth}>‹</button>
        <span className={s.calLunar__title}>{LUNI_RO[viewMonth]} {viewYear}</span>
        <button type="button" className={s.calLunar__navBtn} onClick={nextMonth}>›</button>
      </div>
      <div className={s.calLunar__grid}>
        {ZILE_SCURT.map(z => (
          <div key={z} className={s.calLunar__ziHeader}>{z}</div>
        ))}
        {cells.map((dayNum, idx) => {
          if (!dayNum) return <div key={idx} className={s.calLunar__cellEmpty} />
          const dateStr = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(dayNum).padStart(2,'0')}`
          const cellDate = new Date(viewYear, viewMonth, dayNum)
          const isPast = cellDate < today
          const isSelected = dateStr === selectedDate
          const isToday = formatDate(today) === dateStr
          const areOcupata = zileOcupate.has(dateStr)

          return (
            <button
              type="button"
              key={idx}
              disabled={isPast}
              onClick={() => !isPast && onSelectDate(dateStr)}
              className={[
                s.calLunar__cell,
                isPast ? s['calLunar__cell--past'] : '',
                isSelected ? s['calLunar__cell--selected'] : '',
                isToday && !isSelected ? s['calLunar__cell--today'] : '',
              ].join(' ')}
              title={dateStr}
            >
              {dayNum}
              {areOcupata && !isPast && (
                <span className={s.calLunar__dot} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Grid sloturi ─────────────────────────────────────────────────────
function GridSloturi({ data, oraSelectata, onSelectOra }) {
  const [sloturi, setSloturi] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!data) return
    setLoading(true)
    setSloturi(null)
    setError(null)
    api.get('/programari/slots_libere/', { params: { data, medic: 1 } })
      .then(res => { setSloturi(res.data); setLoading(false) })
      .catch(() => { setError('Nu s-au putut incarca sloturile.'); setLoading(false) })
  }, [data])

  if (!data) return null
  if (loading) return <div className={s.sloturi__loading}>Se incarca sloturi...</div>
  if (error) return <div className={s.sloturi__error}>{error}</div>
  if (!sloturi || !Array.isArray(sloturi) || sloturi.length === 0) {
    return <div className={s.sloturi__empty}>Nu există sloturi disponibile pentru această zi.</div>
  }

  const toate = sloturi

  return (
    <div className={s.sloturi}>
      <div className={s.sloturi__label}>Sloturi disponibile</div>
      <div className={s.sloturi__grid}>
        {toate.map(({ ora, liber }) => {
          const selected = oraSelectata === ora
          return (
            <button
              type="button"
              key={ora}
              disabled={!liber}
              onClick={() => liber && onSelectOra(ora)}
              className={[
                s.slot,
                liber ? s['slot--liber'] : s['slot--ocupat'],
                selected ? s['slot--selected'] : '',
              ].join(' ')}
              title={liber ? 'Liber — click pentru a selecta' : 'Ocupat'}
            >
              {ora}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Modal adăugare programare ─────────────────────────────────────────
function ModalProgramare({ onClose, onSaved, programariExistente }) {
  const todayStr = formatDate(new Date())
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [selectedOra, setSelectedOra] = useState(null)
  const [form, setForm] = useState({
    durata_min: 20, motiv: '', nume_pacient: '', telefon_pacient: '',
    email_pacient: '', medic: 1, status: 'programat',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleSelectOra = (ora) => {
    setSelectedOra(ora)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedDate || !selectedOra) {
      setError('Selectati o zi si un slot orar.'); return
    }
    setSaving(true); setError(null)
    const data_ora = `${selectedDate}T${selectedOra}`
    try {
      await api.post('/programari/', { ...form, data_ora })
      setSaving(false); onSaved()
    } catch {
      setError('Eroare la salvare. Verificati datele.'); setSaving(false)
    }
  }

  return (
    <div className={s.modalOverlay}>
      <div className={s.modalBox} style={{ maxWidth: 560 }}>
        <div className={s.modalHeader}>
          <span className={s.modalTitle}>Programare noua</span>
          <button onClick={onClose} className={s.modalClose}>×</button>
        </div>
        {error && <div className={s.modalError}>{error}</div>}
        <form onSubmit={handleSubmit}>

          {/* Calendar + sloturi */}
          <label className={s.formLabel}>Selectati ziua *</label>
          <CalendarLunar
            selectedDate={selectedDate}
            onSelectDate={(d) => { setSelectedDate(d); setSelectedOra(null) }}
            programariExistente={programariExistente}
          />

          {selectedDate && (
            <div className={s.selectedDateLabel}>
              Zi selectată: <strong>{selectedDate}</strong>
            </div>
          )}

          <GridSloturi
            data={selectedDate}
            oraSelectata={selectedOra}
            onSelectOra={handleSelectOra}
          />

          {selectedOra && (
            <div className={s.selectedSlotLabel}>
              Ora selectată: <strong>{selectedOra}</strong>
            </div>
          )}

          <div className={s.formGrid2} style={{ marginTop: 16 }}>
            <div>
              <label className={s.formLabel}>Durata (min)</label>
              <select value={form.durata_min} onChange={e => setForm(p => ({ ...p, durata_min: parseInt(e.target.value) }))} className={s.formInput}>
                {[10,15,20,30,45,60].map(d => <option key={d} value={d}>{d} min</option>)}
              </select>
            </div>
            <div>
              <label className={s.formLabel}>Status</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className={s.formInput}>
                <option value="programat">Programat</option>
                <option value="confirmat">Confirmat</option>
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

          <div className={s.formActions}>
            <button type="button" onClick={onClose} className={s.btnCancel}>Anuleaza</button>
            <button type="submit" disabled={saving || !selectedOra} className={s.btnSave}>
              {saving ? 'Se salveaza...' : 'Salveaza'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Rand programare ───────────────────────────────────────────────────
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

// ── Pagina principala ─────────────────────────────────────────────────
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

      {showModal && (
        <ModalProgramare
          key={modalKey}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchProgramari() }}
          programariExistente={programari}
        />
      )}
    </div>
  )
}