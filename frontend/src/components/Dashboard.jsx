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

const STATUS_STYLE = {
  programat:  { bg: 'rgba(58,123,213,0.15)',  color: '#60a5fa',  label: 'Programat' },
  confirmat:  { bg: 'rgba(46,204,143,0.15)',  color: '#34d399',  label: 'Confirmat' },
  'in sala':  { bg: 'rgba(245,166,35,0.15)',  color: '#fbbf24',  label: 'In sala' },
  finalizat:  { bg: 'rgba(107,114,128,0.15)', color: '#9ca3af',  label: 'Finalizat' },
  anulat:     { bg: 'rgba(239,68,68,0.15)',   color: '#f87171',  label: 'Anulat' },
}

function Badge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.programat
  return (
    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  )
}

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ background: '#161b27', border: '1px solid #1e2535', borderRadius: '12px', padding: '18px 20px' }}>
      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: '28px', fontWeight: '700', color: color || '#f1f5f9', lineHeight: 1 }}>{value ?? '—'}</div>
      {sub && <div style={{ fontSize: '11px', color: '#4b5563', marginTop: '6px' }}>{sub}</div>}
    </div>
  )
}

export default function Dashboard({ onNavigate }) {
  const [stats, setStats]                 = useState({ pacienti: null, programariAzi: null, programariRamase: null })
  const [programariAzi, setProgramariAzi] = useState([])
  const [pacientiRecenti, setPacientiRecenti] = useState([])
  const [searchQuery, setSearchQuery]     = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [loading, setLoading]             = useState(true)

  const azi = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    Promise.all([
      api.get('/pacienti/'),
      api.get('/programari/', { params: { data: azi } }),
      api.get('/pacienti/', { params: { page_size: 5 } }),
    ]).then(([pacientiRes, programariRes, recentiRes]) => {
      const totalPacienti = pacientiRes.data.count ?? (Array.isArray(pacientiRes.data) ? pacientiRes.data.length : 0)
      const prog = Array.isArray(programariRes.data) ? programariRes.data : (programariRes.data.results || [])
      const recenti = Array.isArray(recentiRes.data) ? recentiRes.data.slice(0,5) : (recentiRes.data.results || []).slice(0,5)
      setStats({
        pacienti: totalPacienti,
        programariAzi: prog.length,
        programariRamase: prog.filter(p => ['programat','confirmat'].includes(p.status)).length,
      })
      setProgramariAzi(prog.slice(0, 6))
      setPacientiRecenti(recenti)
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return }
    const timer = setTimeout(async () => {
      setLoadingSearch(true)
      try {
        const res = await api.get('/pacienti/', { params: { search: searchQuery } })
        const list = Array.isArray(res.data) ? res.data : (res.data.results || [])
        setSearchResults(list.slice(0, 5))
      } finally { setLoadingSearch(false) }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const displayPacienti = searchQuery.trim() ? searchResults : pacientiRecenti

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#4b5563' }}>
      Se incarca...
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
        <StatCard label="Pacienti inregistrati" value={stats.pacienti?.toLocaleString('ro-RO')} color="#60a5fa" />
        <StatCard label="Programari azi" value={stats.programariAzi} sub={`${stats.programariRamase} ramase`} color="#fbbf24" />
        <StatCard label="Consultatii luna" value="—" sub="vs luna trecuta" color="#34d399" />
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>

        {/* Programari azi */}
        <div style={{ background: '#161b27', border: '1px solid #1e2535', borderRadius: '12px', padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#e2e8f0' }}>Programari azi</span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button onClick={() => onNavigate('programari')}
                style={{ fontSize: '12px', color: '#3a7bd5', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                Vezi toate
              </button>
              <span style={{ color: '#2a3550' }}>|</span>
              <a href="/programare.html" target="_blank"
                style={{ fontSize: '12px', padding: '4px 10px', background: '#3a7bd5', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', textDecoration: 'none' }}>
               + Programare online
              </a>
            </div>
          </div>

          {programariAzi.length === 0 ? (
            <div style={{ color: '#4b5563', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
              Nicio programare pentru azi
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {programariAzi.map(p => {
                const nume = p.pacient_nume_complet || p.nume_pacient || '—'
                const ora = new Date(p.data_ora).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '12px', color: '#6b7280', width: '36px', flexShrink: 0 }}>{ora}</span>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: getAvatarColor(nume), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700', color: '#fff', flexShrink: 0 }}>
                      {getInitials(nume)}
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nume}</div>
                      {p.motiv && <div style={{ fontSize: '11px', color: '#4b5563', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.motiv}</div>}
                    </div>
                    <Badge status={p.status} />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Acces rapid pacienti */}
        <div style={{ background: '#161b27', border: '1px solid #1e2535', borderRadius: '12px', padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#e2e8f0' }}>Acces rapid pacienti</span>
            <button onClick={() => onNavigate('pacienti')}
              style={{ fontSize: '12px', color: '#3a7bd5', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              Toti pacientii
            </button>
          </div>

          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#4b5563" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}>
              <path d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" stroke="#4b5563" strokeWidth="2" fill="none" strokeLinecap="round"/>
            </svg>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cauta dupa nume sau CNP..."
              style={{ width: '100%', padding: '8px 10px 8px 30px', background: '#0f1117', border: '1px solid #1e2535', borderRadius: '8px', color: '#e2e8f0', fontSize: '12px', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {loadingSearch && <div style={{ color: '#4b5563', fontSize: '12px' }}>Se cauta...</div>}
            {!loadingSearch && displayPacienti.map(p => {
              const nume = `${p.nume} ${p.prenume}`
              const varsta = p.data_nastere ? Math.floor((new Date() - new Date(p.data_nastere)) / 31557600000) : null
              return (
                <div key={p.id}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 8px', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.12s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: getAvatarColor(nume), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: '#fff', flexShrink: 0 }}>
                    {getInitials(nume)}
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nume}</div>
                    <div style={{ fontSize: '11px', color: '#4b5563' }}>
                      CNP: {p.cnp}{varsta !== null ? ` · ${varsta} ani` : ''}
                    </div>
                  </div>
                  {p.grup_sangvin && (
                    <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: 'rgba(58,123,213,0.15)', color: '#60a5fa' }}>
                      {p.grup_sangvin}
                    </span>
                  )}
                </div>
              )
            })}
            {!loadingSearch && displayPacienti.length === 0 && searchQuery.trim() && (
              <div style={{ color: '#4b5563', fontSize: '12px', textAlign: 'center', padding: '12px 0' }}>Niciun rezultat</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
