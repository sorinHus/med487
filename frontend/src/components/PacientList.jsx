import { useState, useEffect } from 'react'
import api from '../api'
import PacientForm from './PacientForm'
import PacientDetalii from './PacientDetalii'

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

function varsta(dataNastere) {
  if (!dataNastere) return '—'
  return Math.floor((new Date() - new Date(dataNastere)) / 31557600000)
}

const STATUS_STYLE = {
  activ:      { bg: 'rgba(46,204,143,0.12)',  color: '#34d399' },
  decedat:    { bg: 'rgba(239,68,68,0.12)',   color: '#f87171' },
  transferat: { bg: 'rgba(245,166,35,0.12)',  color: '#fbbf24' },
  inactiv:    { bg: 'rgba(107,114,128,0.12)', color: '#9ca3af' },
}

export default function PacientList() {
  const [pacienti, setPacienti]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [showForm, setShowForm]         = useState(false)
  const [pacientSelectat, setPacientSelectat] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => fetchPacienti(), search ? 300 : 0)
    return () => clearTimeout(timer)
  }, [search])

  const fetchPacienti = async () => {
    setLoading(true)
    try {
      const res = await api.get('/pacienti/', { params: search ? { search } : {} })
      setPacienti(Array.isArray(res.data) ? res.data : (res.data.results || []))
    } finally {
      setLoading(false)
    }
  }

  if (pacientSelectat) return (
    <PacientDetalii
      pacient={pacientSelectat}
      onBack={() => { setPacientSelectat(null); fetchPacienti() }}
    />
  )

  if (showForm) return (
    <PacientForm
      onSaved={() => { setShowForm(false); fetchPacienti() }}
      onCancel={() => setShowForm(false)}
    />
  )

  const thStyle = {
    padding: '10px 14px', fontSize: '11px', fontWeight: '600',
    color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em',
    textAlign: 'left', borderBottom: '1px solid #1e2535', whiteSpace: 'nowrap',
  }

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, maxWidth: '380px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="6" stroke="#4b5563" strokeWidth="2"/>
            <path d="M16 16l4 4" stroke="#4b5563" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cauta pacient..."
            style={{ width: '100%', padding: '9px 12px 9px 32px', background: '#161b27', border: '1px solid #1e2535', borderRadius: '9px', color: '#e2e8f0', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }}
            onFocus={e => e.target.style.borderColor = '#3a7bd5'}
            onBlur={e => e.target.style.borderColor = '#1e2535'}
          />
        </div>

        <button onClick={() => setShowForm(true)}
          style={{ padding: '9px 18px', fontSize: '13px', cursor: 'pointer', background: '#3a7bd5', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '500', whiteSpace: 'nowrap', flexShrink: 0 }}
          onMouseEnter={e => e.currentTarget.style.background = '#2d6bc4'}
          onMouseLeave={e => e.currentTarget.style.background = '#3a7bd5'}
        >
          + Pacient nou
        </button>
      </div>

      {/* Table */}
      <div style={{ background: '#161b27', border: '1px solid #1e2535', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr>
              <th style={thStyle}>Pacient</th>
              <th style={thStyle}>CNP</th>
              <th style={thStyle}>Varsta</th>
              <th style={thStyle}>Telefon</th>
              <th style={thStyle}>Ultima consultatie</th>
              <th style={thStyle}>Grup</th>
              <th style={thStyle}>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#4b5563' }}>
                Se incarca...
              </td></tr>
            )}
            {!loading && pacienti.length === 0 && (
              <tr><td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#4b5563' }}>
                {search ? 'Niciun pacient gasit.' : 'Nu exista pacienti inregistrati.'}
              </td></tr>
            )}
            {!loading && pacienti.map(p => {
              const nume = `${p.nume} ${p.prenume}`
              const st = STATUS_STYLE[p.status] || STATUS_STYLE.inactiv
              return (
                <tr key={p.id}
                  onClick={() => setPacientSelectat(p)}
                  style={{ borderBottom: '1px solid #1a2033', cursor: 'pointer', transition: 'background 0.12s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Pacient */}
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: getAvatarColor(nume), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: '#fff', flexShrink: 0 }}>
                        {getInitials(nume)}
                      </div>
                      <span style={{ fontWeight: '500', color: '#e2e8f0' }}>{nume}</span>
                    </div>
                  </td>
                  {/* CNP */}
                  <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '12px', color: '#9ca3af' }}>{p.cnp}</td>
                  {/* Varsta */}
                  <td style={{ padding: '12px 14px', color: '#9ca3af' }}>{varsta(p.data_nastere)}</td>
                  {/* Telefon */}
                  <td style={{ padding: '12px 14px', color: '#9ca3af' }}>{p.telefon || '—'}</td>
                  {/* Ultima consultatie */}
                  <td style={{ padding: '12px 14px', color: '#9ca3af' }}>
                    {p.ultima_consultatie
                      ? new Date(p.ultima_consultatie).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '—'}
                  </td>
                  {/* Grup sangvin */}
                  <td style={{ padding: '12px 14px' }}>
                    {p.grup_sangvin ? (
                      <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: 'rgba(58,123,213,0.15)', color: '#60a5fa' }}>
                        {p.grup_sangvin}
                      </span>
                    ) : <span style={{ color: '#4b5563' }}>—</span>}
                  </td>
                  {/* Status */}
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: st.bg, color: st.color, textTransform: 'capitalize' }}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Count */}
      {!loading && pacienti.length > 0 && (
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#4b5563', textAlign: 'right' }}>
          {pacienti.length} pacient{pacienti.length !== 1 ? 'i' : ''}
        </div>
      )}
    </div>
  )
}
