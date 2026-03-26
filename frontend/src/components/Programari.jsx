import { useState, useEffect } from 'react'
import api from '../api'

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

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function formatDate(date) {
  return date.toISOString().slice(0, 10)
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
  const s = STATUS_STYLE[status] || STATUS_STYLE.programat
  return (
    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  )
}

// ── Modal programare noua ──
function ModalProgramare({ onClose, onSaved, defaultData }) {
  const [form, setForm] = useState({
    data_ora: defaultData?.data_ora || new Date().toISOString().slice(0, 16),
    durata_min: 20,
    motiv: '',
    nume_pacient: '',
    telefon_pacient: '',
    email_pacient: '',
    medic: 1,
    status: 'programat',
    ...defaultData,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const inputStyle = {
    width: '100%', padding: '8px 12px', fontSize: '13px',
    background: '#0f1117', border: '1px solid #1e2535', borderRadius: '8px',
    color: '#e2e8f0', boxSizing: 'border-box', marginBottom: '12px', outline: 'none',
  }
  const labelStyle = { fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }

  const handleSubmit = async (e) => {
  e.preventDefault()
  setSaving(true)
  setError(null)
  try {
    await api.post('/programari/', form)
    setSaving(false)
    onSaved()
  } catch (err) {
    setError('Eroare la salvare. Verificati datele.')
    setSaving(false)
  }
}

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#161b27', border: '1px solid #1e2535', borderRadius: '14px', padding: '24px', width: '460px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <span style={{ fontSize: '15px', fontWeight: '600', color: '#e2e8f0' }}>Programare noua</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '22px', lineHeight: 1, padding: '0 4px' }}>×</button>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '10px 14px', color: '#f87171', fontSize: '13px', marginBottom: '14px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
            <div>
              <label style={labelStyle}>Data si ora *</label>
              <input type="datetime-local" value={form.data_ora}
                onChange={e => setForm(p => ({ ...p, data_ora: e.target.value }))}
                required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Durata (min)</label>
              <select value={form.durata_min}
                onChange={e => setForm(p => ({ ...p, durata_min: parseInt(e.target.value) }))}
                style={inputStyle}>
                {[10, 15, 20, 30, 45, 60].map(d => <option key={d} value={d}>{d} min</option>)}
              </select>
            </div>
          </div>

          <label style={labelStyle}>Nume pacient *</label>
          <input value={form.nume_pacient}
            onChange={e => setForm(p => ({ ...p, nume_pacient: e.target.value }))}
            required placeholder="Nume si prenume" style={inputStyle} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
            <div>
              <label style={labelStyle}>Telefon</label>
              <input value={form.telefon_pacient}
                onChange={e => setForm(p => ({ ...p, telefon_pacient: e.target.value }))}
                placeholder="07xx xxx xxx" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" value={form.email_pacient}
                onChange={e => setForm(p => ({ ...p, email_pacient: e.target.value }))}
                style={inputStyle} />
            </div>
          </div>

          <label style={labelStyle}>Motiv consultatie</label>
          <input value={form.motiv}
            onChange={e => setForm(p => ({ ...p, motiv: e.target.value }))}
            placeholder="ex. Control periodic, Reinnoire reteta..." style={inputStyle} />

          <label style={labelStyle}>Status</label>
          <select value={form.status}
            onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
            style={inputStyle}>
            <option value="programat">Programat</option>
            <option value="confirmat">Confirmat</option>
          </select>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button type="button" onClick={onClose}
              style={{ padding: '9px 20px', fontSize: '13px', cursor: 'pointer', border: '1px solid #1e2535', borderRadius: '8px', background: 'transparent', color: '#9ca3af' }}>
              Anuleaza
            </button>
            <button type="submit" disabled={saving}
              style={{ padding: '9px 20px', fontSize: '13px', cursor: 'pointer', background: '#3a7bd5', color: '#fff', border: 'none', borderRadius: '8px', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Se salveaza...' : 'Salveaza'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Rand programare ──
function RandProgramare({ p, onStatusChange }) {
  const nume = p.pacient_nume_complet || p.nume_pacient || '—'
  const ora = formatOra(p.data_ora)
  const avatarBg = getAvatarColor(nume)
  const initials = getInitials(nume)

  const handleStatus = async (newStatus) => {
    try {
      await api.patch(`/programari/${p.id}/`, { status: newStatus })
      onStatusChange()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderBottom: '1px solid #1a2033', transition: 'background 0.12s' }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* Ora */}
      <span style={{ fontSize: '13px', fontWeight: '600', color: '#60a5fa', width: '42px', flexShrink: 0 }}>{ora}</span>

      {/* Avatar */}
      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: '#fff', flexShrink: 0 }}>
        {initials}
      </div>

      {/* Info */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{ fontSize: '13px', fontWeight: '500', color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nume}</div>
        {p.motiv && <div style={{ fontSize: '11px', color: '#4b5563', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.motiv}</div>}
        {p.telefon_pacient && <div style={{ fontSize: '11px', color: '#4b5563' }}>{p.telefon_pacient}</div>}
      </div>

      {/* Badge + actiuni */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <Badge status={p.status} />
        {/* Actiuni rapide */}
        {p.status === 'programat' && (
          <button onClick={() => handleStatus('confirmat')}
            title="Confirma"
            style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px', border: '1px solid rgba(46,204,143,0.3)', background: 'rgba(46,204,143,0.08)', color: '#34d399', cursor: 'pointer' }}>
            ✓
          </button>
        )}
        {['programat','confirmat'].includes(p.status) && (
          <button onClick={() => handleStatus('anulat')}
            title="Anuleaza"
            style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#f87171', cursor: 'pointer' }}>
            ✕
          </button>
        )}
        {p.status === 'confirmat' && (
          <button onClick={() => handleStatus('finalizat')}
            title="Finalizeaza"
            style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px', border: '1px solid rgba(107,114,128,0.3)', background: 'rgba(107,114,128,0.08)', color: '#9ca3af', cursor: 'pointer' }}>
            ✔✔
          </button>
        )}
      </div>
    </div>
  )
}

// ── Componenta principala ──
export default function Programari() {
  const [monday, setMonday] = useState(() => getMondayOf(new Date()))
  const [programari, setProgramari] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalKey, setModalKey] = useState(0)

  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i))

  const saptamanaLabel = () => {
    const start = monday
    const end = addDays(monday, 6)
    const sm = LUNI_RO[start.getMonth()]
    const em = LUNI_RO[end.getMonth()]
    const sy = start.getFullYear()
    const ey = end.getFullYear()
    if (sy !== ey) return `${start.getDate()} ${sm} ${sy} — ${end.getDate()} ${em} ${ey}`
    if (sm !== em) return `${start.getDate()} ${sm} — ${end.getDate()} ${em} ${sy}`
    return `${start.getDate()} — ${end.getDate()} ${sm} ${sy}`
  }

  const fetchProgramari = async () => {
    setLoading(true)
    try {
      const res = await api.get('/programari/', {
        params: { saptamana: formatDate(monday) }
      })
      const list = Array.isArray(res.data) ? res.data : (res.data.results || [])
      setProgramari(list)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProgramari() }, [monday])

  const prevSaptamana = () => setMonday(m => addDays(m, -7))
  const nextSaptamana = () => setMonday(m => addDays(m, 7))
  const aziSaptamana  = () => setMonday(getMondayOf(new Date()))

  const getProgramariZi = (date) => {
    const dateStr = formatDate(date)
    return programari.filter(p => p.data_ora.slice(0, 10) === dateStr)
      .sort((a, b) => a.data_ora.localeCompare(b.data_ora))
  }

  const aziStr = formatDate(new Date())
  const isToday = (date) => formatDate(date) === aziStr

  const btnNav = (onClick, label) => (
    <button onClick={onClick}
      style={{ padding: '7px 14px', fontSize: '13px', cursor: 'pointer', background: 'transparent', border: '1px solid #1e2535', borderRadius: '8px', color: '#9ca3af', transition: 'all 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#e2e8f0' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af' }}
    >
      {label}
    </button>
  )

  return (
    <div>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {btnNav(prevSaptamana, '← Prev')}
          {btnNav(aziSaptamana, 'Azi')}
          {btnNav(nextSaptamana, 'Next →')}
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#e2e8f0', marginLeft: '6px' }}>
            Programari — saptamana {saptamanaLabel()}
          </span>
        </div>
        <button onClick={() => { setShowModal(true); setModalKey(k => k + 1) }}
          style={{ padding: '9px 18px', fontSize: '13px', cursor: 'pointer', background: '#3a7bd5', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '500' }}
          onMouseEnter={e => e.currentTarget.style.background = '#2d6bc4'}
          onMouseLeave={e => e.currentTarget.style.background = '#3a7bd5'}
        >
          + Programare noua
        </button>
      </div>

      {/* Zile */}
      {loading ? (
        <div style={{ color: '#4b5563', textAlign: 'center', padding: '60px' }}>Se incarca...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {days.map((day, idx) => {
            const prog = getProgramariZi(day)
            const today = isToday(day)
            return (
              <div key={idx} style={{ background: '#161b27', border: `1px solid ${today ? '#3a7bd5' : '#1e2535'}`, borderRadius: '12px', overflow: 'hidden' }}>
                {/* Zi header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: today ? 'rgba(58,123,213,0.1)' : 'rgba(255,255,255,0.02)', borderBottom: prog.length > 0 ? '1px solid #1e2535' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: today ? '#60a5fa' : '#9ca3af', minWidth: '70px' }}>
                      {ZILE_RO[idx]}
                    </span>
                    <span style={{ fontSize: '12px', color: '#4b5563' }}>
                      {day.getDate()} {LUNI_RO[day.getMonth()]}
                    </span>
                    {today && (
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: 'rgba(58,123,213,0.2)', color: '#60a5fa', fontWeight: '600' }}>
                        Azi
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '12px', color: '#4b5563' }}>
                    {prog.length > 0 ? `${prog.length} programare${prog.length !== 1 ? 'i' : ''}` : 'Liber'}
                  </span>
                </div>

                {/* Programarile zilei */}
                {prog.length > 0 && (
                  <div>
                    {prog.map(p => (
                      <RandProgramare key={p.id} p={p} onStatusChange={fetchProgramari} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
  <ModalProgramare
    key={modalKey}
    onClose={() => setShowModal(false)}
    onSaved={() => { setShowModal(false); fetchProgramari() }}
  />
)}
    </div>
  )
}
