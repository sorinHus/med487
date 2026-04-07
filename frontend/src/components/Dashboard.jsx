import { useState, useEffect, useCallback } from 'react'
import api from '../api'
import s from '../styles/Dashboard.module.css'

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
  const st = STATUS_STYLE[status] || STATUS_STYLE.programat
  return (
    <span className={s.badge} style={{ background: st.bg, color: st.color }}>
      {st.label}
    </span>
  )
}

function StatCard({ label, value, sub, color, trend }) {
  const subClass = trend > 0 ? s['statCard__sub--up'] : trend < 0 ? s['statCard__sub--down'] : s['statCard__sub--neutral']
  return (
    <div className={s.statCard}>
      <div className={s.statCard__label}>{label}</div>
      <div className={s.statCard__value} style={{ color: color || 'var(--text-primary)' }}>{value ?? '—'}</div>
      {sub && (
        <div className={`${s.statCard__sub} ${subClass}`}>
          {trend > 0 ? '↑ ' : trend < 0 ? '↓ ' : ''}{sub}
        </div>
      )}
    </div>
  )
}

async function exportRaportExcel(consultatii, totalPeMedic, perioada) {
  const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs')
  const wb = XLSX.utils.book_new()
  const dataC = consultatii.map(c => ({
    'Data':      new Date(c.data_ora).toLocaleDateString('ro-RO'),
    'Ora':       new Date(c.data_ora).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }),
    'Pacient':   c.pacient_nume || '',
    'Medic':     c.medic_nume || '',
    'Simptome':  c.simptome || '',
    'Tratament': c.tratament || '',
  }))
  const ws1 = XLSX.utils.json_to_sheet(dataC)
  ws1['!cols'] = [{ wch: 12 }, { wch: 6 }, { wch: 24 }, { wch: 20 }, { wch: 30 }, { wch: 30 }]
  XLSX.utils.book_append_sheet(wb, ws1, 'Consultatii')
  const dataM = Object.entries(totalPeMedic).map(([medic, total]) => ({ 'Medic': medic, 'Nr. consultatii': total }))
  const ws2 = XLSX.utils.json_to_sheet(dataM)
  ws2['!cols'] = [{ wch: 24 }, { wch: 16 }]
  XLSX.utils.book_append_sheet(wb, ws2, 'Total pe medic')
  XLSX.writeFile(wb, `raport_consultatii_${perioada.de_la}_${perioada.pana_la}.xlsx`)
}

function Row({ label, value }) {
  return (
    <div className={s.row}>
      <span className={s.row__label}>{label}</span>
      <span className={s.row__value}>{value}</span>
    </div>
  )
}

function SectiuneRaport({ onNavigate }) {
  const primaZiLuna = new Date()
  primaZiLuna.setDate(1)
  const ultimaZiLuna = new Date(primaZiLuna.getFullYear(), primaZiLuna.getMonth() + 1, 0)

  const [perioada, setPerioada] = useState({
    de_la:   primaZiLuna.toISOString().slice(0, 10),
    pana_la: ultimaZiLuna.toISOString().slice(0, 10),
  })
  const [consultatii, setConsultatii]   = useState([])
  const [totalPeMedic, setTotalPeMedic] = useState({})
  const [loading, setLoading]           = useState(false)
  const [exportand, setExportand]       = useState(false)
  const [cautata, setCautata]           = useState(false)
  const [modalConsultatie, setModalConsultatie] = useState(null)

  const fetchRaport = useCallback(async () => {
    setLoading(true); setCautata(true)
    try {
      let toate = [], page = 1
      while (true) {
        const res = await api.get('/consultatii/', { params: { data_dupa: perioada.de_la, data_inainte: perioada.pana_la, page, page_size: 200 } })
        const results = Array.isArray(res.data) ? res.data : (res.data.results || [])
        toate = [...toate, ...results]
        if (!res.data.next) break
        page++
      }
      setConsultatii(toate)
      const perMedic = {}
      toate.forEach(c => { const medic = c.medic_nume || `Medic #${c.medic}`; perMedic[medic] = (perMedic[medic] || 0) + 1 })
      setTotalPeMedic(perMedic)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [perioada])

  const handleExport = async () => {
    setExportand(true)
    try { await exportRaportExcel(consultatii, totalPeMedic, perioada) }
    catch (err) { console.error(err); alert('Eroare la export.') }
    finally { setExportand(false) }
  }

  return (
    <div className={s.raportCard}>
      <div className={s.raportTitle}>Raport consultații per perioadă</div>
      <div className={s.raportControls}>
        <div>
          <label className={s.raportLabel}>De la</label>
          <input type="date" value={perioada.de_la} onChange={e => setPerioada(p => ({ ...p, de_la: e.target.value }))} className={s.raportInput} />
        </div>
        <div>
          <label className={s.raportLabel}>Până la</label>
          <input type="date" value={perioada.pana_la} onChange={e => setPerioada(p => ({ ...p, pana_la: e.target.value }))} className={s.raportInput} />
        </div>
        <button onClick={fetchRaport} disabled={loading} className={s.btnGenereaza}>
          {loading ? 'Se încarcă...' : '🔍 Generează'}
        </button>
        {cautata && consultatii.length > 0 && (
          <button onClick={handleExport} disabled={exportand} className={s.btnExport}>
            {exportand ? '⏳ Export...' : '⬇️ Export Excel'}
          </button>
        )}
      </div>

      {cautata && !loading && (
        <>
          <div className={s.raportSummary}>
            <div className={s.raportSummaryItem}>
              <div className={s.raportSummaryItem__label}>Total consultații</div>
              <div className={s.raportSummaryItem__value} style={{ color: '#60a5fa' }}>{consultatii.length}</div>
            </div>
            <div className={s.raportSummaryItem}>
              <div className={s.raportSummaryItem__label}>Medici activi</div>
              <div className={s.raportSummaryItem__value} style={{ color: '#34d399' }}>{Object.keys(totalPeMedic).length}</div>
            </div>
            {Object.entries(totalPeMedic).map(([medic, total]) => (
              <div key={medic} className={s.raportSummaryItem}>
                <div className={s.raportSummaryItem__label}>{medic}</div>
                <div className={s.raportSummaryItem__value} style={{ color: '#fbbf24' }}>{total}</div>
              </div>
            ))}
          </div>

          {consultatii.length === 0 ? (
            <div className={s.raportEmpty}>Nicio consultație în perioada selectată.</div>
          ) : (
            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th className={s.th}>Data</th>
                    <th className={s.th}>Pacient</th>
                    <th className={s.th}>Medic</th>
                    <th className={s.th}>Simptome</th>
                  </tr>
                </thead>
                <tbody>
                  {consultatii.map(c => (
                    <tr key={c.id} className={s.tr} onClick={() => setModalConsultatie(c)}>
                      <td className={s['td--data']}>
                        {new Date(c.data_ora).toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </td>
                      <td className={s['td--bold']}>{c.pacient_nume || `#${c.pacient}`}</td>
                      <td className={s['td--muted']}>{c.medic_nume || `#${c.medic}`}</td>
                      <td className={s['td--ellipsis']}>{c.simptome || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {modalConsultatie && (
        <div className={s.modalOverlay} onClick={() => setModalConsultatie(null)}>
          <div className={`${s.modalBox} ${s['modalBox--wide']}`} onClick={e => e.stopPropagation()}>
            <div className={s.modalHeader}>
              <span className={s.modalTitle}>Detalii consultație</span>
              <button onClick={() => setModalConsultatie(null)} className={s.modalClose}>✕</button>
            </div>
            <div className={s.modalInfoBox}>
              <Row label="Pacient" value={modalConsultatie.pacient_nume || '—'} />
              <Row label="Medic"   value={modalConsultatie.medic_nume || '—'} />
              <Row label="Data"    value={new Date(modalConsultatie.data_ora).toLocaleDateString('ro-RO', { day: '2-digit', month: 'long', year: 'numeric' })} />
              <Row label="Ora"     value={new Date(modalConsultatie.data_ora).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })} />
            </div>
            {modalConsultatie.simptome && (
              <div className={s.modalSection}>
                <div className={s.modalSectionLabel}>Simptome</div>
                <div className={s.modalSectionText}>{modalConsultatie.simptome}</div>
              </div>
            )}
            {modalConsultatie.tratament && (
              <div className={s.modalSection}>
                <div className={s.modalSectionLabel}>Tratament</div>
                <div className={s.modalSectionText}>{modalConsultatie.tratament}</div>
              </div>
            )}
            {modalConsultatie.diagnostice?.length > 0 && (
              <div className={s.modalSection}>
                <div className={s.modalSectionLabel}>Diagnostice</div>
                {modalConsultatie.diagnostice.map(d => (
                  <span key={d.id} className={s.diagnosticBadge}>
                    {d.diagnostic.cod_icd10} — {d.diagnostic.denumire}
                  </span>
                ))}
              </div>
            )}
            <button className={s.btnPrimary} onClick={async () => {
              try {
                const res = await api.get(`/pacienti/${modalConsultatie.pacient}/`)
                setModalConsultatie(null)
                onNavigate('pacienti', { pacient: res.data })
              } catch { alert('Eroare la incarcarea fisiei pacientului.') }
            }}>
              Deschide fișă pacient
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Dashboard({ onNavigate }) {
  const [stats, setStats]                     = useState({ pacienti: null, programariAzi: null, programariRamase: null, consultatiiLuna: null, consultatiiLunaTrecuta: null })
  const [programariAzi, setProgramariAzi]     = useState([])
  const [pacientiRecenti, setPacientiRecenti] = useState([])
  const [searchQuery, setSearchQuery]         = useState('')
  const [searchResults, setSearchResults]     = useState([])
  const [loadingSearch, setLoadingSearch]     = useState(false)
  const [loading, setLoading]                 = useState(true)
  const [modalProgramare, setModalProgramare] = useState(null)

  const azi = new Date().toISOString().slice(0, 10)

  const getLunaInterval = (offsetLuni = 0) => {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + offsetLuni)
    const start = d.toISOString().slice(0, 10)
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10)
    return { start, end }
  }

  useEffect(() => {
    const luna = getLunaInterval(0)
    const lunaTrecuta = getLunaInterval(-1)
    Promise.all([
      api.get('/pacienti/'),
      api.get('/programari/', { params: { data: azi } }),
      api.get('/pacienti/', { params: { page_size: 5 } }),
      api.get('/consultatii/', { params: { page: 1, page_size: 1, data_dupa: luna.start, data_inainte: luna.end } }),
      api.get('/consultatii/', { params: { page: 1, page_size: 1, data_dupa: lunaTrecuta.start, data_inainte: lunaTrecuta.end } }),
    ]).then(([pacientiRes, programariRes, recentiRes, consultatiiLunaRes, consultatiiLunaTrecutaRes]) => {
      const totalPacienti = pacientiRes.data.count ?? (Array.isArray(pacientiRes.data) ? pacientiRes.data.length : 0)
      const prog = Array.isArray(programariRes.data) ? programariRes.data : (programariRes.data.results || [])
      const recenti = Array.isArray(recentiRes.data) ? recentiRes.data.slice(0,5) : (recentiRes.data.results || []).slice(0,5)
      const consultatiiLuna = consultatiiLunaRes.data.count ?? (Array.isArray(consultatiiLunaRes.data) ? consultatiiLunaRes.data.length : 0)
      const consultatiiLunaTrecuta = consultatiiLunaTrecutaRes.data.count ?? (Array.isArray(consultatiiLunaTrecutaRes.data) ? consultatiiLunaTrecutaRes.data.length : 0)
      setStats({ pacienti: totalPacienti, programariAzi: prog.length, programariRamase: prog.filter(p => ['programat','confirmat'].includes(p.status)).length, consultatiiLuna, consultatiiLunaTrecuta })
      setProgramariAzi(prog.slice(0, 6))
      setPacientiRecenti(recenti)
    }).finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return }
    const timer = setTimeout(async () => {
      setLoadingSearch(true)
      try {
        const res = await api.get('/pacienti/', { params: { search: searchQuery } })
        setSearchResults((Array.isArray(res.data) ? res.data : (res.data.results || [])).slice(0, 5))
      } finally { setLoadingSearch(false) }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const displayPacienti = searchQuery.trim() ? searchResults : pacientiRecenti
  const trend = stats.consultatiiLunaTrecuta > 0 ? stats.consultatiiLuna - stats.consultatiiLunaTrecuta : null
  const subConsultatii = trend !== null ? `${Math.abs(trend)} față de luna trecută (${stats.consultatiiLunaTrecuta})` : 'luna curentă'

  if (loading) return <div className={s.loading}>Se incarca...</div>

  return (
    <div className={s.root}>
      {/* Stat cards */}
      <div className={s.statGrid}>
        <StatCard label="Pacienti inregistrati" value={stats.pacienti?.toLocaleString('ro-RO')} color="#60a5fa" />
        <StatCard label="Programari azi" value={stats.programariAzi} sub={`${stats.programariRamase} ramase`} color="#fbbf24" />
        <StatCard label="Consultatii luna" value={stats.consultatiiLuna} sub={subConsultatii} trend={trend} color="#34d399" />
      </div>

      <div className={s.twoCol}>
        {/* Programari azi */}
        <div className={s.card}>
          <div className={s.card__header}>
            <span className={s.card__title}>Programari azi</span>
            <div className={s.card__headerActions}>
              <button onClick={() => onNavigate('programari')} className={s.card__linkBtn}>Vezi toate</button>
              <span className={s.card__divider}>|</span>
              <a href="/programare.html" target="_blank" className={s.card__actionLink}>
                + Programare online
              </a>
            </div>
          </div>
          {programariAzi.length === 0 ? (
            <div className={s.card__empty}>Nicio programare pentru azi</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {programariAzi.map(p => {
                const nume = p.pacient_nume_complet || p.nume_pacient || '—'
                const ora = new Date(p.data_ora).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
                return (
                  <div key={p.id} className={s.progRow} onClick={() => setModalProgramare(p)}>
                    <span className={s.progRow__ora}>{ora}</span>
                    <div className={`${s.avatar} ${s['avatar--sm']}`} style={{ background: getAvatarColor(nume) }}>
                      {getInitials(nume)}
                    </div>
                    <div className={s.progRow__info}>
                      <div className={s.progRow__nume}>{nume}</div>
                      {p.motiv && <div className={s.progRow__motiv}>{p.motiv}</div>}
                    </div>
                    <Badge status={p.status} />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Acces rapid pacienti */}
        <div className={s.card}>
          <div className={s.card__header}>
            <span className={s.card__title}>Acces rapid pacienti</span>
            <button onClick={() => onNavigate && onNavigate('pacienti')} className={s.card__linkBtn}>Toti pacientii</button>
          </div>
          <div className={s.searchWrap}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={s.searchIcon}>
              <path d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" stroke="var(--text-dim)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cauta dupa nume sau CNP..."
              className={s.searchInput}
            />
          </div>
          <div className={s.pacientList}>
            {loadingSearch && <div className={s.searchLoading}>Se cauta...</div>}
            {!loadingSearch && displayPacienti.map(p => {
              const nume = `${p.nume} ${p.prenume}`
              const varsta = p.data_nastere ? Math.floor((new Date() - new Date(p.data_nastere)) / 31557600000) : null
              return (
                <div key={p.id} className={s.pacientRow} onClick={() => onNavigate('pacienti', { pacient: p })}>
                  <div className={`${s.avatar} ${s['avatar--md']}`} style={{ background: getAvatarColor(nume) }}>
                    {getInitials(nume)}
                  </div>
                  <div className={s.pacientRow__info}>
                    <div className={s.pacientRow__nume}>{nume}</div>
                    <div className={s.pacientRow__cnp}>CNP: {p.cnp}{varsta !== null ? ` · ${varsta} ani` : ''}</div>
                  </div>
                  {p.grup_sangvin && (
                    <span className={s.grupSangvin}>{p.grup_sangvin}</span>
                  )}
                </div>
              )
            })}
            {!loadingSearch && displayPacienti.length === 0 && searchQuery.trim() && (
              <div className={s.noResults}>Niciun rezultat</div>
            )}
          </div>
        </div>
      </div>

      {/* Modal programare */}
      {modalProgramare && (
        <div className={s.modalOverlay} onClick={() => setModalProgramare(null)}>
          <div className={s.modalBox} onClick={e => e.stopPropagation()}>
            <div className={s.modalHeader}>
              <span className={s.modalTitle}>Detalii programare</span>
              <button onClick={() => setModalProgramare(null)} className={s.modalClose}>✕</button>
            </div>
            <div className={s.modalBody}>
              <div className={s.modalPatientHeader}>
                <div className={`${s.avatar} ${s['avatar--lg']}`} style={{ background: getAvatarColor(modalProgramare.pacient_nume_complet || '') }}>
                  {getInitials(modalProgramare.pacient_nume_complet || '')}
                </div>
                <div>
                  <div className={s.modalPatientName}>{modalProgramare.pacient_nume_complet || '—'}</div>
                  <Badge status={modalProgramare.status} />
                </div>
              </div>
              <div className={s.modalInfoBox}>
                <Row label="Ora"    value={new Date(modalProgramare.data_ora).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })} />
                <Row label="Durata" value={`${modalProgramare.durata_min} min`} />
                {modalProgramare.motiv && <Row label="Motiv" value={modalProgramare.motiv} />}
                {modalProgramare.telefon_pacient && <Row label="Telefon" value={modalProgramare.telefon_pacient} />}
              </div>
            </div>
            <div className={s.modalActions}>
              {modalProgramare.status === 'programat' && (
                <button className={s.btnConfirm} onClick={async () => {
                  await api.patch(`/programari/${modalProgramare.id}/`, { status: 'confirmat' })
                  const updated = { ...modalProgramare, status: 'confirmat' }
                  setModalProgramare(updated)
                  setProgramariAzi(prev => prev.map(p => p.id === updated.id ? updated : p))
                }}>✓ Confirmă</button>
              )}
              {['programat', 'confirmat'].includes(modalProgramare.status) && (
                <button className={s.btnAnuleaza} onClick={async () => {
                  await api.patch(`/programari/${modalProgramare.id}/`, { status: 'anulat' })
                  const updated = { ...modalProgramare, status: 'anulat' }
                  setModalProgramare(updated)
                  setProgramariAzi(prev => prev.map(p => p.id === updated.id ? updated : p))
                }}>✕ Anulează</button>
              )}
              {modalProgramare.status === 'confirmat' && (
                <button className={s.btnFinalizeaza} onClick={async () => {
                  await api.patch(`/programari/${modalProgramare.id}/`, { status: 'finalizat' })
                  const updated = { ...modalProgramare, status: 'finalizat' }
                  setModalProgramare(updated)
                  setProgramariAzi(prev => prev.map(p => p.id === updated.id ? updated : p))
                }}>✔✔ Finalizează</button>
              )}
              {modalProgramare.pacient && (
                <button className={s.btnPrimary} onClick={async () => {
                  try {
                    const res = await api.get(`/pacienti/${modalProgramare.pacient}/`)
                    setModalProgramare(null)
                    onNavigate('pacienti', { pacient: res.data })
                  } catch { alert('Eroare la incarcarea fisiei pacientului.') }
                }}>Deschide fișă pacient</button>
              )}
            </div>
          </div>
        </div>
      )}

      <SectiuneRaport onNavigate={onNavigate} />
    </div>
  )
}