import { useState, useEffect, useRef, useMemo } from 'react'
import api from '../api'
import PacientForm from './PacientForm'
import PacientDetalii from './PacientDetalii'
import s from '../styles/PacientList.module.css'

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

const TOATE_COLOANELE = [
  { id: 'pacient',       label: 'Pacient',            sort: 'nume',         fixed: true },
  { id: 'cnp',           label: 'CNP',                sort: null },
  { id: 'varsta',        label: 'Vârstă',             sort: 'varsta' },
  { id: 'sex',           label: 'Sex',                sort: null },
  { id: 'telefon',       label: 'Telefon',            sort: null },
  { id: 'email',         label: 'Email',              sort: null },
  { id: 'localitate',    label: 'Localitate',         sort: null },
  { id: 'grup',          label: 'Grup sangvin',       sort: null },
  { id: 'alergii',       label: 'Alergii',            sort: null },
  { id: 'consultatie',   label: 'Ultima consultație', sort: 'consultatie' },
  { id: 'inregistrat',   label: 'Data înregistrării', sort: 'inregistrat' },
  { id: 'creat_la',      label: 'Data introducerii',  sort: 'creat_la' },
  { id: 'actualizat_la', label: 'Data actualizării',  sort: 'actualizat_la' },
  { id: 'status',        label: 'Status',             sort: null },
]

const COLOANE_DEFAULT = ['pacient', 'cnp', 'varsta', 'telefon', 'consultatie', 'grup', 'status']

function getColoaneSalvate() {
  try {
    const saved = localStorage.getItem('pacientList_coloane')
    if (saved) return JSON.parse(saved)
  } catch {}
  return COLOANE_DEFAULT
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
    'Data introducerii': p.creat_la ? new Date(p.creat_la).toLocaleDateString('ro-RO') : '',
    'Data actualizarii': p.actualizat_la ? new Date(p.actualizat_la).toLocaleDateString('ro-RO') : '',
  }))
  const ws = XLSX.utils.json_to_sheet(data)
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

  const [filtruStatus, setFiltruStatus] = useState('')
  const [filtruSex, setFiltruSex]       = useState('')
  const [varstaMin, setVarstaMin]       = useState('')
  const [varstaMax, setVarstaMax]       = useState('')

  const [sortCol, setSortCol] = useState('nume')
  const [sortDir, setSortDir] = useState('asc')

  const [coloane, setColoane]         = useState(getColoaneSalvate)
  const [showColoane, setShowColoane] = useState(false)
  const colDropRef = useRef(null)

  useEffect(() => {
    if (pacientInitial) setPacientSelectat(pacientInitial)
  }, [pacientInitial])

  useEffect(() => {
    const timer = setTimeout(() => fetchPacienti(), search ? 300 : 0)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  useEffect(() => {
    const handler = (e) => {
      if (colDropRef.current && !colDropRef.current.contains(e.target)) setShowColoane(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const fetchPacienti = async () => {
    setLoading(true)
    try {
      const res = await api.get('/pacienti/', { params: search ? { search } : {} })
      setPacienti(Array.isArray(res.data) ? res.data : (res.data.results || []))
    } finally { setLoading(false) }
  }

  const handleSort = (col) => {
    if (!col) return
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  const resetFiltre = () => { setFiltruStatus(''); setFiltruSex(''); setVarstaMin(''); setVarstaMax('') }
  const filtrateActive = filtruStatus || filtruSex || varstaMin || varstaMax

  const toggleColoana = (id) => {
    if (id === 'pacient') return
    const noi = coloane.includes(id) ? coloane.filter(c => c !== id) : [...coloane, id]
    setColoane(noi)
    localStorage.setItem('pacientList_coloane', JSON.stringify(noi))
  }

  const coloaneVizibile = TOATE_COLOANELE.filter(c => coloane.includes(c.id))

  const pacientiFiltrati = useMemo(() => {
    let lista = [...pacienti]
    if (filtruStatus) lista = lista.filter(p => p.status === filtruStatus)
    if (filtruSex)    lista = lista.filter(p => p.sex === filtruSex)
    if (varstaMin)    lista = lista.filter(p => (calcVarsta(p.cnp) ?? 0) >= parseInt(varstaMin))
    if (varstaMax)    lista = lista.filter(p => (calcVarsta(p.cnp) ?? 999) <= parseInt(varstaMax))
    lista.sort((a, b) => {
      let va, vb
      if (sortCol === 'nume')               { va = `${a.nume} ${a.prenume}`.toLowerCase(); vb = `${b.nume} ${b.prenume}`.toLowerCase() }
      else if (sortCol === 'varsta')        { va = calcVarsta(a.cnp) ?? -1; vb = calcVarsta(b.cnp) ?? -1 }
      else if (sortCol === 'consultatie')   { va = a.ultima_consultatie || ''; vb = b.ultima_consultatie || '' }
      else if (sortCol === 'inregistrat')   { va = a.data_inregistrare || ''; vb = b.data_inregistrare || '' }
      else if (sortCol === 'creat_la')      { va = a.creat_la || ''; vb = b.creat_la || '' }
      else if (sortCol === 'actualizat_la') { va = a.actualizat_la || ''; vb = b.actualizat_la || '' }
      else { va = ''; vb = '' }
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
    setImportand(true); setRezultatImport(null)
    try {
      const formData = new FormData()
      formData.append('fisier', fisier)
      const res = await api.post('/import-pacienti/', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      setRezultatImport(res.data); fetchPacienti()
    } catch (err) {
      setRezultatImport({ eroare: err.response?.data?.eroare || 'Eroare la import.' })
    } finally { setImportand(false); e.target.value = '' }
  }

  if (pacientSelectat) return (
    <PacientDetalii pacient={pacientSelectat} onBack={() => { setPacientSelectat(null); fetchPacienti() }} moduleActive={moduleActive} />
  )
  if (showForm) return (
    <PacientForm onSaved={() => { setShowForm(false); fetchPacienti() }} onCancel={() => setShowForm(false)} />
  )

  const sageata = (col) => col ? (sortCol === col ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ' ↕') : ''

  const renderCelula = (col, p) => {
    const fmt = (d) => d ? new Date(d).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
    switch (col.id) {
      case 'pacient': return (
        <div className={s.avatarWrap}>
          <div className={s.avatar} style={{ background: getAvatarColor(`${p.nume} ${p.prenume}`) }}>
            {getInitials(`${p.nume} ${p.prenume}`)}
          </div>
          <span className={s.pacientName}>{p.nume} {p.prenume}</span>
        </div>
      )
      case 'cnp':          return <span className={s.cnp}>{p.cnp}</span>
      case 'varsta':       return <span className={s.muted}>{calcVarsta(p.cnp) ?? '—'}</span>
      case 'sex':          return <span className={s.muted}>{p.sex === 'M' ? 'Masculin' : p.sex === 'F' ? 'Feminin' : '—'}</span>
      case 'telefon':      return <span className={s.muted}>{p.telefon || '—'}</span>
      case 'email':        return <span className={s.mutedSm}>{p.email || '—'}</span>
      case 'localitate':   return <span className={s.muted}>{p.localitate || '—'}</span>
      case 'grup':         return p.grup_sangvin
        ? <span className={s.grupBadge}>{p.grup_sangvin}</span>
        : <span className={s.dim}>—</span>
      case 'alergii':      return <span className={p.alergii ? s.alergiiText : s.dim}>{p.alergii || '—'}</span>
      case 'consultatie':  return <span className={s.muted}>{fmt(p.ultima_consultatie)}</span>
      case 'inregistrat':  return <span className={s.muted}>{p.data_inregistrare || '—'}</span>
      case 'creat_la':     return <span className={s.muted}>{fmt(p.creat_la)}</span>
      case 'actualizat_la':return <span className={s.muted}>{fmt(p.actualizat_la)}</span>
      case 'status': {
        const st = STATUS_STYLE[p.status] || STATUS_STYLE.inactiv
        return <span className={s.statusBadge} style={{ background: st.bg, color: st.color }}>{p.status}</span>
      }
      default: return null
    }
  }

  return (
    <div>
      {/* Bara superioara */}
      <div className={s.topBar}>
        <div className={s.searchWrap}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={s.searchIcon}>
            <circle cx="11" cy="11" r="6" stroke="var(--text-dim)" strokeWidth="2"/>
            <path d="M16 16l4 4" stroke="var(--text-dim)" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cauta pacient..."
            className={s.searchInput}
          />
        </div>
        <div className={s.actions}>
          <button onClick={handleExport} disabled={exportand || loading} className={s.btnExport}>
            {exportand ? '⏳ Se exportă...' : '⬇️ Export Excel'}
          </button>
          <input type="file" accept=".xlsx" ref={fileInputRef} onChange={handleImport} style={{ display: 'none' }} />
          <button onClick={() => fileInputRef.current.click()} disabled={importand} className={s.btnImport}>
            {importand ? '⏳ Se importă...' : '⬆️ Import Excel'}
          </button>
          <button onClick={() => setShowForm(true)} className={s.btnNou}>+ Pacient nou</button>
        </div>
      </div>

      {/* Bara filtre + coloane */}
      <div className={s.filtreBar}>
        <span className={s.filtreLabel}>Filtre:</span>
        <select value={filtruStatus} onChange={e => setFiltruStatus(e.target.value)} className={s.select}>
          <option value="">Toate statusurile</option>
          <option value="activ">Activ</option>
          <option value="decedat">Decedat</option>
          <option value="transferat">Transferat</option>
          <option value="inactiv">Inactiv</option>
        </select>
        <select value={filtruSex} onChange={e => setFiltruSex(e.target.value)} className={s.select}>
          <option value="">Ambele sexe</option>
          <option value="M">Masculin</option>
          <option value="F">Feminin</option>
        </select>
        <div className={s.varstaWrap}>
          <span className={s.varstaLabel}>Vârstă:</span>
          <input type="number" value={varstaMin} onChange={e => setVarstaMin(e.target.value)} placeholder="min" className={s.inputVarsta} min="0" max="120" />
          <span className={s.varstaLabel}>—</span>
          <input type="number" value={varstaMax} onChange={e => setVarstaMax(e.target.value)} placeholder="max" className={s.inputVarsta} min="0" max="120" />
        </div>
        {filtrateActive && (
          <button onClick={resetFiltre} className={s.btnResetFiltre}>✕ Reset filtre</button>
        )}
        <div className={s.coloaneDrop} ref={colDropRef}>
          <button onClick={() => setShowColoane(v => !v)} className={`${s.btnColoane} ${showColoane ? s.btnColoaneActive : ''}`}>
            ⚙ Coloane
          </button>
          {showColoane && (
            <div className={s.coloaneMenu}>
              <div className={s.coloaneMenuTitle}>Coloane vizibile</div>
              {TOATE_COLOANELE.map(c => (
                <label
                  key={c.id}
                  className={`${s.coloanaRow} ${c.fixed ? s.coloanaRowFixed : ''}`}
                >
                  <input type="checkbox" checked={coloane.includes(c.id)} onChange={() => toggleColoana(c.id)} disabled={c.fixed} style={{ cursor: c.fixed ? 'default' : 'pointer' }} />
                  <span className={s.coloanaLabel}>{c.label}</span>
                  {c.fixed && <span className={s.coloanaFixTag}>fix</span>}
                </label>
              ))}
              <div className={s.coloaneReset}>
                <button onClick={() => { setColoane(COLOANE_DEFAULT); localStorage.setItem('pacientList_coloane', JSON.stringify(COLOANE_DEFAULT)) }} className={s.btnColoaneReset}>
                  Reset implicit
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rezultat import */}
      {rezultatImport && (
        <div className={rezultatImport.eroare ? s.importError : s.importSuccess}>
          {rezultatImport.eroare ? (
            <span className={s.importErrorText}>❌ {rezultatImport.eroare}</span>
          ) : (
            <div>
              <span className={s.importSuccessText}>✅ Import finalizat: </span>
              <span style={{ color: 'var(--text-primary)' }}>{rezultatImport.importati} pacienți importați</span>
              {rezultatImport.sarite > 0 && <span className={s.importMuted}>({rezultatImport.sarite} CNP-uri existente, sărite)</span>}
              {rezultatImport.erori?.length > 0 && (
                <div className={s.importWarnings}>
                  {rezultatImport.erori.map((e, i) => <div key={i}>⚠️ {e}</div>)}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tabel */}
      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th className={s.th} style={{ width: '40px' }}>#</th>
              {coloaneVizibile.map(col => (
                <th
                  key={col.id}
                  className={`${s.th} ${col.sort ? s.thSortable : ''} ${sortCol === col.sort ? s.thSortActive : ''}`}
                  onClick={() => handleSort(col.sort)}
                >
                  {col.label}{sageata(col.sort)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={coloaneVizibile.length + 1} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>Se încarcă...</td></tr>
            )}
            {!loading && pacientiFiltrati.length === 0 && (
              <tr><td colSpan={coloaneVizibile.length + 1} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
                {search || filtrateActive ? 'Niciun pacient găsit pentru filtrele aplicate.' : 'Nu există pacienți înregistrați.'}
              </td></tr>
            )}
            {!loading && pacientiFiltrati.map((p, index) => (
              <tr key={p.id} className={s.tr} onClick={() => setPacientSelectat(p)}>
                <td className={s.tdIndex}>{index + 1}</td>
                {coloaneVizibile.map(col => (
                  <td key={col.id} className={s.td}>
                    {renderCelula(col, p)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!loading && (
        <div className={s.footer}>
          {pacientiFiltrati.length} din {pacienti.length} pacienți{(search || filtrateActive) ? ' (filtrat)' : ''}
        </div>
      )}
    </div>
  )
}