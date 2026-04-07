import { useState, useEffect, useCallback } from 'react'
import api from '../api'
import s from '../styles/Consultatii.module.css'

function formatData(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function ModalReteta({ pacientId, medicId, consultatieId, onClose, onSaved }) {
  const [form, setForm] = useState({ gratuit: 'nu', valabilitate_zile: 30, diagnostic: '', nr_fisa: '', observatii: '' })
  const [linii, setLinii] = useState([{ nume_medicament: '', concentratie: '', doza_frecventa: '', durata_zile: '', cantitate: 1, observatii: '' }])
  const [salvand, setSalvand] = useState(false)
  const [eroare, setEroare]   = useState('')

  const updateLinie = (i, field, value) => setLinii(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l))
  const adaugaLinie = () => setLinii(prev => [...prev, { nume_medicament: '', concentratie: '', doza_frecventa: '', durata_zile: '', cantitate: 1, observatii: '' }])
  const stergeLinie = (i) => setLinii(prev => prev.filter((_, idx) => idx !== i))

  const salveaza = async (e) => {
    e.preventDefault()
    if (!linii[0]?.nume_medicament.trim()) { setEroare('Adauga cel putin un medicament.'); return }
    setSalvand(true); setEroare('')
    try {
      const payload = {
        pacient: pacientId, medic: medicId,
        ...(consultatieId ? { consultatie: consultatieId } : {}),
        gratuit: form.gratuit, valabilitate_zile: form.valabilitate_zile,
        diagnostic: form.diagnostic, nr_fisa: form.nr_fisa, observatii: form.observatii,
        linii: linii.filter(l => l.nume_medicament.trim()).map((l, i) => ({ ...l, ordine: i })),
      }
      const res = await api.post('/retete/', payload)
      onSaved && onSaved(res.data); onClose()
    } catch (err) { setEroare(err.response?.data?.detail || 'Eroare la salvare.') }
    finally { setSalvand(false) }
  }

  return (
    <div className={s.retetaOverlay}>
      <div className={s.retetaBox}>
        <div className={s.retetaHeader}>
          <span className={s.retetaTitle}>Rețetă nouă</span>
          <button onClick={onClose} className={s.retetaClose}>✕</button>
        </div>
        <form onSubmit={salveaza} className={s.retetaForm}>
          <div className={s.formGrid3}>
            <div>
              <label className={s.formLabel}>Gratuit / Cu plată</label>
              <select value={form.gratuit} onChange={e => setForm(p => ({ ...p, gratuit: e.target.value }))} className={s.formInput}>
                <option value="nu">Cu plată</option>
                <option value="da">Gratuit</option>
              </select>
            </div>
            <div>
              <label className={s.formLabel}>Valabilitate (zile)</label>
              <input type="number" min="1" max="90" value={form.valabilitate_zile} onChange={e => setForm(p => ({ ...p, valabilitate_zile: e.target.value }))} className={s.formInput} />
            </div>
            <div>
              <label className={s.formLabel}>Nr. fișă</label>
              <input value={form.nr_fisa} onChange={e => setForm(p => ({ ...p, nr_fisa: e.target.value }))} className={s.formInput} placeholder="optional" />
            </div>
          </div>
          <label className={s.formLabel}>Diagnostic</label>
          <input value={form.diagnostic} onChange={e => setForm(p => ({ ...p, diagnostic: e.target.value }))} className={s.formInput} placeholder="ex: Hipertensiune arterială esențială" />
          <label className={s.formLabel}>Observații</label>
          <textarea value={form.observatii} onChange={e => setForm(p => ({ ...p, observatii: e.target.value }))} className={s.formTextarea} />
          <div className={s.medSection}>
            <div className={s.medSectionHeader}>
              <span className={s.medSectionTitle}>Medicamente ({linii.length})</span>
              <button type="button" onClick={adaugaLinie} className={s.btnAdaugaMed}>+ Adaugă medicament</button>
            </div>
            {linii.map((linie, i) => (
              <div key={i} className={s.medCard}>
                <div className={s.medCardHeader}>
                  <span className={s.medCardTitle}>Medicament {i + 1}</span>
                  {linii.length > 1 && <button type="button" onClick={() => stergeLinie(i)} className={s.btnStergeMed}>×</button>}
                </div>
                <div className={s.formGrid21}>
                  <div>
                    <label className={s.formLabel}>Denumire medicament *</label>
                    <input value={linie.nume_medicament} onChange={e => updateLinie(i, 'nume_medicament', e.target.value)} className={s.formInput} placeholder="ex: Enalapril" required={i === 0} />
                  </div>
                  <div>
                    <label className={s.formLabel}>Concentrație / formă</label>
                    <input value={linie.concentratie} onChange={e => updateLinie(i, 'concentratie', e.target.value)} className={s.formInput} placeholder="ex: 10mg, comprimate" />
                  </div>
                </div>
                <div className={s.formGrid211}>
                  <div>
                    <label className={s.formLabel}>Doză și frecvență</label>
                    <input value={linie.doza_frecventa} onChange={e => updateLinie(i, 'doza_frecventa', e.target.value)} className={s.formInput} placeholder="ex: 1cp/zi dimineata" />
                  </div>
                  <div>
                    <label className={s.formLabel}>Durată (zile)</label>
                    <input type="number" min="1" value={linie.durata_zile} onChange={e => updateLinie(i, 'durata_zile', e.target.value)} className={s.formInput} placeholder="30" />
                  </div>
                  <div>
                    <label className={s.formLabel}>Cantitate (cutii)</label>
                    <input type="number" min="1" value={linie.cantitate} onChange={e => updateLinie(i, 'cantitate', e.target.value)} className={s.formInput} />
                  </div>
                </div>
                <label className={s.formLabel}>Observații medicament</label>
                <input value={linie.observatii} onChange={e => updateLinie(i, 'observatii', e.target.value)} className={s.formInput} style={{ marginBottom: 0 }} placeholder="optional" />
              </div>
            ))}
          </div>
          {eroare && <div className={s.formError}>{eroare}</div>}
          <div className={s.formActions}>
            <button type="button" onClick={onClose} className={s.btnCancel}>Anulează</button>
            <button type="submit" disabled={salvand} className={s.btnSave}>
              {salvand ? 'Se salvează...' : 'Salvează rețeta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function InfoRow({ label, children }) {
  return (
    <div>
      <p className={s.infoLabel}>{label}</p>
      {children}
    </div>
  )
}

function InfoBlock({ label, text }) {
  return (
    <div>
      <p className={s.infoLabelMb}>{label}</p>
      <p className={s.infoText}>{text}</p>
    </div>
  )
}

function ModalConsultatie({ consultatie: c, onClose, onNavigate }) {
  const [showReteta, setShowReteta] = useState(false)
  return (
    <>
      <div className={s.modalOverlay}>
        <div className={s.modalBox}>
          <div className={s.modalHeader}>
            <span className={s.modalTitle}>Consultație — {formatData(c.data_ora)}</span>
            <button onClick={onClose} className={s.modalClose}>✕</button>
          </div>
          <div className={s.modalBody}>
            <div className={s.modalGrid2}>
              <InfoRow label="Pacient">
                <button onClick={() => { onClose(); onNavigate && onNavigate('pacienti') }}
                  className={s.btnPacient}>
                  {c.pacient_nume || `#${c.pacient}`}
                </button>
              </InfoRow>
              <InfoRow label="Medic">
                <span style={{ color: 'var(--text-primary)', fontSize: '13px' }}>{c.medic_nume || `#${c.medic}`}</span>
              </InfoRow>
            </div>
            {c.simptome      && <InfoBlock label="Simptome"      text={c.simptome} />}
            {c.examen_clinic && <InfoBlock label="Examen clinic" text={c.examen_clinic} />}
            {c.tratament     && <InfoBlock label="Tratament"     text={c.tratament} />}
            {c.observatii    && <InfoBlock label="Observații"    text={c.observatii} />}
            {c.diagnostice?.length > 0 && (
              <div>
                <p className={s.infoLabelMb}>Diagnostice</p>
                <div className={s.diagModalWrap}>
                  {c.diagnostice.map((d, i) => (
                    <span key={i} className={s.diagModalBadge}>
                      {d.cod_icd10 && `${d.cod_icd10} — `}{d.denumire}
                      {d.tip === 'principal' && <span className={s.diagPrincipal}>(principal)</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className={s.modalFooter}>
            <button onClick={() => setShowReteta(true)} className={s.btnReteta}>+ Rețetă nouă</button>
            <button onClick={onClose} className={s.btnClose}>Închide</button>
          </div>
        </div>
      </div>
      {showReteta && <ModalReteta pacientId={c.pacient} medicId={c.medic} consultatieId={c.id} onClose={() => setShowReteta(false)} onSaved={() => setShowReteta(false)} />}
    </>
  )
}

export default function Consultatii({ onNavigate }) {
  const [consultatii, setConsultatii] = useState([])
  const [loading, setLoading]         = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch]           = useState('')
  const [pagina, setPagina]           = useState(1)
  const [total, setTotal]             = useState(0)
  const [selected, setSelected]       = useState(null)
  const PER_PAGE = 20

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPagina(1) }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  const fetchConsultatii = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page: pagina }
      if (search) params.search = search
      const res = await api.get('/consultatii/', { params })
      if (res.data.results) { setConsultatii(res.data.results); setTotal(res.data.count) }
      else { setConsultatii(res.data); setTotal(res.data.length) }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [pagina, search])

  useEffect(() => { fetchConsultatii() }, [fetchConsultatii])

  const totalPagini = Math.ceil(total / PER_PAGE)

  return (
    <div>
      <div className={s.pageHeader}>
        <div className={s.searchWrap}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={s.searchIcon}>
            <circle cx="11" cy="11" r="6" stroke="var(--text-dim)" strokeWidth="2"/>
            <path d="M16 16l4 4" stroke="var(--text-dim)" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Cauta dupa pacient, simptome..."
            className={s.searchInput}
          />
        </div>
        <span className={s.totalLabel}>{total} înregistrări</span>
      </div>

      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th className={`${s.th} ${s['th--narrow']}`}>#</th>
              <th className={s.th}>Data</th>
              <th className={s.th}>Pacient</th>
              <th className={s.th}>Medic</th>
              <th className={s.th}>Simptome</th>
              <th className={s.th}>Diagnostice</th>
              <th className={s.th}>Acțiuni</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan="7" className={s['td--empty']}>Se încarcă...</td></tr>
            )}
            {!loading && consultatii.length === 0 && (
              <tr><td colSpan="7" className={s['td--empty']}>
                {search ? 'Nicio consultație găsită.' : 'Nu există consultații înregistrate.'}
              </td></tr>
            )}
            {!loading && consultatii.map((c, index) => (
              <tr key={c.id} className={s.tr}>
                <td className={s['td--center']}>{index + 1}</td>
                <td className={s['td--nowrap']}>{formatData(c.data_ora)}</td>
                <td className={s.td}>
                  <button onClick={() => onNavigate && onNavigate('pacienti')} className={s.btnPacient}>
                    {c.pacient_nume || `Pacient #${c.pacient}`}
                  </button>
                </td>
                <td className={s.td}>{c.medic_nume || `Medic #${c.medic}`}</td>
                <td className={s['td--ellipsis']}>{c.simptome || '—'}</td>
                <td className={s.td}>
                  {c.diagnostice?.length > 0 ? (
                    <div className={s.diagWrap}>
                      {c.diagnostice.slice(0, 2).map((d, i) => (
                        <span key={i} className={s.diagBadge}>{d.cod_icd10 || d.denumire}</span>
                      ))}
                      {c.diagnostice.length > 2 && <span className={s.diagMore}>+{c.diagnostice.length - 2}</span>}
                    </div>
                  ) : '—'}
                </td>
                <td className={s.td}>
                  <button onClick={() => setSelected(c)} className={s.btnDetalii}>Detalii</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPagini > 1 && (
        <div className={s.pagination}>
          <span>Pagina {pagina} din {totalPagini}</span>
          <div className={s.paginationBtns}>
            <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1} className={s.btnPag}>← Anterior</button>
            <button onClick={() => setPagina(p => Math.min(totalPagini, p + 1))} disabled={pagina === totalPagini} className={s.btnPag}>Următor →</button>
          </div>
        </div>
      )}

      {selected && <ModalConsultatie consultatie={selected} onClose={() => setSelected(null)} onNavigate={onNavigate} />}
    </div>
  )
}