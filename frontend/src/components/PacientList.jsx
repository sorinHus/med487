import { useState, useEffect, useRef, useMemo } from 'react'
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

function calcVarsta(cnp) {
  try {
    if (!cnp || cnp.length !== 13) return null
    const s = parseInt(cnp[0])
    const an2 = parseInt(cnp.slice(1, 3))
    const luna = parseInt(cnp.slice(3, 5))
    const zi = parseInt(cnp.slice(5, 7))
    let an
    if (s === 1 || s === 2) an = 1900 + an2
    else if (s === 3 || s === 4) an = 1800 + an2
    else if (s === 5 || s === 6) an = 2000 + an2
    else an = 1900 + an2
    const azi = new Date()
    return azi.getFullYear() - an - ((azi.getMonth() + 1 < luna || (azi.getMonth() + 1 === luna && azi.getDate() < zi)) ? 1 : 0)
  } catch { return null }
}

const STATUS_STYLE = {
  activ:      { bg: 'rgba(46,204,143,0.12)',  color: '#34d399' },
  decedat:    { bg: 'rgba(239,68,68,0.12)',   color: '#f87171' },
  transferat: { bg: 'rgba(245,166,35,0.12)',  color: '#fbbf24' },
  inactiv:    { bg: 'rgba(107,114,128,0.12)', color: '#9ca3af' },
}

async function exportExcel(pacienti) {
  const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs')
  const data = pacienti.map(p => ({
    'Nume': p.nume, 'Prenume': p.prenume, 'CNP': p.cnp,
    'Data nasterii': p.data_nastere || '', 'Varsta': calcVarsta(p.cnp) ?? '—',
    'Sex': p.sex === 'M' ? 'Masculin' : p.sex === 'F' ? 'Feminin' : '',
    'Telefon': p.telefon || '', 'Email': p.email || '',
    'Judet': p.judet || '', 'Localitate': p.localitate || '',
    'Strada': p.strada || '', 'Nr.': p.numar_strada || '',
    'Grup sangvin': p.grup_sangvin || '', 'Alergii': p.alergii || '',
    'Status': p.status || '', 'Data inregistrare': p.data_inregistrare || '',
    'Ultima consultatie': p.ultima_consultatie ? new Date(p.ultima_consultatie).toLocaleDateString('ro-RO') : '',
  }))
  const ws = XLSX.utils.json_to_sheet(data)
  ws['!cols'] = [{ wch: 18 }, { wch: 18 }, { wch: 15 }, { wch: 14 }, { wch: 7 }, { wch: 10 }, { wch: 14 }, { wch: 24 }, { wch: 12 }, { wch: 16 }, { wch: 20 }, { wch: 6 }, { wch: 12 }, { wch: 20 }, { wch: 12 }, { wch: 16 }, { wch: 18 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Pacienti')
  XLSX.writeFile(wb, `pacienti_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

export default function PacientList({ pacientInitial, moduleActive = [] }) {
  const [pacienti, setPacienti]               = useState([])
  const [loading, setLoading]                 = useState(true)
  const [search, setSearch]                   = useState('')
  const [showForm, setShowForm]               = useState(false)
  const [pacientSelectat, setPacientSelectat] = useState(pacientInitial || null)
  const [exportand, setExportand]             = useState(false)
  const [importand, setImportand]             = useState(false)
  const [rezultatImport, setRezultatImport]   = useState(null)
  const fileInputRef = useRef(null)

  // Filtre
  const [filtruStatus, setFiltruStatus] = useState('')
  const [filtruSex, setFiltruSex]       = useState('')
  const [varstaMin, setVarstaMin]       = useState('')
  const [varstaMax, setVarstaMax]       = useState('')

  // Sortare
  const [sortCol, setSortCol]   = useState('nume')
  const [sortDir, setSortDir]   = useState('asc')

  useEffect(() => {
    if (pacientInitial) setPacientSelectat(pacientInitial)
  }, [pacientInitial])

  useEffect(() => {
    const timer = setTimeout(() => fetchPacienti(), search ? 300 : 0)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const fetchPacienti = async () => {
    setLoading(true)
    try {
      const res = await api.get('/pacienti/', { params: search ? { search } : {} })
      setPacienti(Array.isArray(res.data) ? res.data : (res.data.results || []))
    } finally { setLoading(false) }
  }

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  const resetFiltre = () => {
    setFiltruStatus(''); setFiltruSex(''); setVarstaMin(''); setVarstaMax('')
  }

  const filtrateActive = filtruStatus || filtruSex || varstaMin || varstaMax

  const pacientiFiltrati = useMemo(() => {
    let lista = [...pacienti]

    if (filtruStatus) lista = lista.filter(p => p.status === filtruStatus)
    if (filtruSex)    lista = lista.filter(p => p.sex === filtruSex)
    if (varstaMin)    lista = lista.filter(p => (calcVarsta(p.cnp) ?? 0) >= parseInt(varstaMin))
    if (varstaMax)    lista = lista.filter(p => (calcVarsta(p.cnp) ?? 999) <= parseInt(varstaMax))

    lista.sort((a, b) => {
      let va, vb
      if (sortCol === 'nume') {
        va = `${a.nume} ${a.prenume}`.toLowerCase()
        vb = `${b.nume} ${b.prenume}`.toLowerCase()
      } else if (sortCol === 'varsta') {
        va = calcVarsta(a.cnp) ?? -1
        vb = calcVarsta(b.cnp) ?? -1
      } else if (sortCol === 'consultatie') {
        va = a.ultima_consultatie || ''
        vb = b.ultima_consultatie || ''
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })

    return lista
  }, [pacienti, filtruStatus, filtruSex, varstaMin, varstaMax, sortCol, sortDir])

  const handleExport = async () => {
    setExportand(true)
    try {
      let toata = [], page = 1
      while (true) {
        const res = await api.get('/pacienti/', { params: { page, page_size: 200, ...(search ? { search } : {}) } })
        const results = Array.isArray(res.data) ? res.data : (res.data.results || [])
        toata = [...toata, ...results]
        if (!res.data.next) break
        page++
      }
      await exportExcel(toata)
    } catch (err) { console.error('Export error:', err); alert('Eroare la export.') }
    finally { setExportand(false) }
  }

  const handleImport = async (e) => {
    const fisier = e.target.files[0]
    if (!fisier) return
    setImportand(true)
    setRezultatImport(null)
    try {
      const formData = new FormData()
      formData.append('fisier', fisier)
      const res = await api.post('/import-pacienti/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setRezultatImport(res.data)
      fetchPacienti()
    } catch (err) {
      setRezultatImport({ eroare: err.response?.data?.eroare || 'Eroare la import.' })
    } finally {
      setImportand(false)
      e.target.value = ''
    }
  }

  if (pacientSelectat) return (
    <PacientDetalii pacient={pacientSelectat} onBack={() => { setPacientSelectat(null); fetchPacienti() }} moduleActive={moduleActive} />
  )
  if (showForm) return (
    <PacientForm onSaved={() => { setShowForm(false); fetchPacienti() }} onCancel={() => setShowForm(false)} />
  )

  const thStyle = {
    padding: '10px 14px', fontSize: '11px', fontWeight: '600',
    color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em',
    textAlign: 'left', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap',
  }
  const thSortStyle = (col) => ({
    ...thStyle, cursor: 'pointer', userSelect: 'none',
    color: sortCol === col ? 'var(--accent-light)' : 'var(--text-dim)',
  })
  const sageata = (col) => sortCol === col ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ' ↕'

  const selectStyle = { padding: '7px 10px', fontSize: '12px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '7px', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer' }
  const inputFiltruStyle = { padding: '7px 10px', fontSize: '12px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '7px', color: 'var(--text-primary)', outline: 'none', width: '70px' }

  return (
    <div>
      {/* Bara superioara */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '12px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '380px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="6" stroke="var(--text-dim)" strokeWidth="2"/>
            <path d="M16 16l4 4" stroke="var(--text-dim)" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cauta pacient..."
            style={{ width: '100%', padding: '9px 12px 9px 32px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '9px', color: 'var(--text-primary)', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button onClick={handleExport} disabled={exportand || loading}
            style={{ padding: '9px 16px', fontSize: '13px', cursor: exportand ? 'default' : 'pointer', background: 'transparent', color: exportand ? 'var(--text-dim)' : '#34d399', border: '1px solid', borderColor: exportand ? 'var(--border)' : '#34d399', borderRadius: '8px', fontWeight: '500', whiteSpace: 'nowrap', opacity: exportand ? 0.6 : 1 }}
            onMouseEnter={e => { if (!exportand) e.currentTarget.style.background = 'rgba(52,211,153,0.1)' }}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >{exportand ? '⏳ Se exportă...' : '⬇️ Export Excel'}</button>
          <input type="file" accept=".xlsx" ref={fileInputRef} onChange={handleImport} style={{ display: 'none' }} />
          <button onClick={() => fileInputRef.current.click()} disabled={importand}
            style={{ padding: '9px 16px', fontSize: '13px', cursor: importand ? 'default' : 'pointer', background: 'transparent', color: importand ? 'var(--text-dim)' : '#a78bfa', border: '1px solid', borderColor: importand ? 'var(--border)' : '#a78bfa', borderRadius: '8px', fontWeight: '500', whiteSpace: 'nowrap', opacity: importand ? 0.6 : 1 }}
            onMouseEnter={e => { if (!importand) e.currentTarget.style.background = 'rgba(167,139,250,0.1)' }}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >{importand ? '⏳ Se importă...' : '⬆️ Import Excel'}</button>
          <button onClick={() => setShowForm(true)}
            style={{ padding: '9px 18px', fontSize: '13px', cursor: 'pointer', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '500', whiteSpace: 'nowrap' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
          >+ Pacient nou</button>
        </div>
      </div>

      {/* Bara filtre */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: '500' }}>Filtre:</span>
        <select value={filtruStatus} onChange={e => setFiltruStatus(e.target.value)} style={selectStyle}>
          <option value="">Toate statusurile</option>
          <option value="activ">Activ</option>
          <option value="decedat">Decedat</option>
          <option value="transferat">Transferat</option>
          <option value="inactiv">Inactiv</option>
        </select>
        <select value={filtruSex} onChange={e => setFiltruSex(e.target.value)} style={selectStyle}>
          <option value="">Ambele sexe</option>
          <option value="M">Masculin</option>
          <option value="F">Feminin</option>
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Vârstă:</span>
          <input type="number" value={varstaMin} onChange={e => setVarstaMin(e.target.value)} placeholder="min" style={inputFiltruStyle} min="0" max="120" />
          <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>—</span>
          <input type="number" value={varstaMax} onChange={e => setVarstaMax(e.target.value)} placeholder="max" style={inputFiltruStyle} min="0" max="120" />
        </div>
        {filtrateActive && (
          <button onClick={resetFiltre} style={{ padding: '6px 12px', fontSize: '12px', cursor: 'pointer', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: '7px' }}>
            ✕ Reset filtre
          </button>
        )}
      </div>

      {/* Rezultat import */}
      {rezultatImport && (
        <div style={{ marginBottom: '16px', padding: '14px 18px', borderRadius: '10px', background: rezultatImport.eroare ? 'rgba(248,113,113,0.1)' : 'rgba(52,211,153,0.1)', border: `1px solid ${rezultatImport.eroare ? '#f87171' : '#34d399'}`, fontSize: '13px' }}>
          {rezultatImport.eroare ? (
            <span style={{ color: '#f87171' }}>❌ {rezultatImport.eroare}</span>
          ) : (
            <div>
              <span style={{ color: '#34d399', fontWeight: '600' }}>✅ Import finalizat: </span>
              <span style={{ color: 'var(--text-primary)' }}>{rezultatImport.importati} pacienți importați</span>
              {rezultatImport.sarite > 0 && <span style={{ color: 'var(--text-muted)', marginLeft: '10px' }}>({rezultatImport.sarite} CNP-uri existente, sărite)</span>}
              {rezultatImport.erori?.length > 0 && (
                <div style={{ marginTop: '8px', color: '#fbbf24' }}>
                  {rezultatImport.erori.map((e, i) => <div key={i}>⚠️ {e}</div>)}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tabel */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr>
              <th style={{...thStyle, width: '40px'}}>#</th>
              <th style={thSortStyle('nume')} onClick={() => handleSort('nume')}>Pacient{sageata('nume')}</th>
              <th style={thStyle}>CNP</th>
              <th style={thSortStyle('varsta')} onClick={() => handleSort('varsta')}>Vârstă{sageata('varsta')}</th>
              <th style={thStyle}>Telefon</th>
              <th style={thSortStyle('consultatie')} onClick={() => handleSort('consultatie')}>Ultima consultație{sageata('consultatie')}</th>
              <th style={thStyle}>Grup</th>
              <th style={thStyle}>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>Se incarca...</td></tr>
            )}
            {!loading && pacientiFiltrati.length === 0 && (
              <tr><td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
                {search || filtrateActive ? 'Niciun pacient găsit pentru filtrele aplicate.' : 'Nu există pacienți înregistrați.'}
              </td></tr>
            )}
            {!loading && pacientiFiltrati.map((p, index) => {
              const nume = `${p.nume} ${p.prenume}`
              const st = STATUS_STYLE[p.status] || STATUS_STYLE.inactiv
              const v = calcVarsta(p.cnp)
              return (
                <tr key={p.id} onClick={() => setPacientSelectat(p)}
                  style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.12s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 14px', color: 'var(--text-dim)', textAlign: 'center', fontSize: '12px' }}>{index + 1}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: getAvatarColor(nume), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: '#fff', flexShrink: 0 }}>
                        {getInitials(nume)}
                      </div>
                      <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{nume}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-muted)' }}>{p.cnp}</td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>{v ?? '—'}</td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>{p.telefon || '—'}</td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>
                    {p.ultima_consultatie ? new Date(p.ultima_consultatie).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    {p.grup_sangvin
                      ? <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: 'rgba(58,123,213,0.15)', color: '#60a5fa' }}>{p.grup_sangvin}</span>
                      : <span style={{ color: 'var(--text-dim)' }}>—</span>}
                  </td>
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

      {!loading && (
        <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-dim)', textAlign: 'right' }}>
          {pacientiFiltrati.length} din {pacienti.length} pacienți{(search || filtrateActive) ? ' (filtrat)' : ''}
        </div>
      )}
    </div>
  )
}