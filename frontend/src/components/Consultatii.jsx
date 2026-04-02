import { useState, useEffect, useCallback } from 'react'
import api from '../api'

function formatData(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ro-RO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const thStyle = {
  padding: '10px 14px', fontSize: '11px', fontWeight: '600',
  color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em',
  textAlign: 'left', borderBottom: '1px solid #1e2535', whiteSpace: 'nowrap',
}

const tdStyle = {
  padding: '12px 14px', color: '#9ca3af', fontSize: '13px',
}

// ── Modal creare reteta (identic cu cel din PacientDetalii) ──────────────────
function ModalReteta({ pacientId, medicId, consultatieId, onClose, onSaved }) {
  const inputStyle = { width: '100%', padding: '8px 12px', fontSize: '13px', background: '#0f1117', border: '1px solid #1e2535', borderRadius: '8px', color: '#e2e8f0', boxSizing: 'border-box', marginBottom: '12px', outline: 'none' }
  const labelStyle = { fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }

  const [form, setForm] = useState({
    gratuit: 'nu',
    valabilitate_zile: 30,
    diagnostic: '',
    nr_fisa: '',
    observatii: '',
  })
  const [linii, setLinii] = useState([
    { nume_medicament: '', concentratie: '', doza_frecventa: '', durata_zile: '', cantitate: 1, observatii: '' }
  ])
  const [salvand, setSalvand] = useState(false)
  const [eroare, setEroare]   = useState('')

  const updateLinie = (i, field, value) => {
    setLinii(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l))
  }

  const adaugaLinie = () => {
    setLinii(prev => [...prev, { nume_medicament: '', concentratie: '', doza_frecventa: '', durata_zile: '', cantitate: 1, observatii: '' }])
  }

  const stergeLinie = (i) => {
    setLinii(prev => prev.filter((_, idx) => idx !== i))
  }

  const salveaza = async (e) => {
    e.preventDefault()
    if (!linii[0]?.nume_medicament.trim()) { setEroare('Adauga cel putin un medicament.'); return }
    setSalvand(true); setEroare('')
    try {
      const payload = {
        pacient: pacientId,
        medic: medicId,
        ...(consultatieId ? { consultatie: consultatieId } : {}),
        gratuit: form.gratuit,
        valabilitate_zile: form.valabilitate_zile,
        diagnostic: form.diagnostic,
        nr_fisa: form.nr_fisa,
        observatii: form.observatii,
        linii: linii.filter(l => l.nume_medicament.trim()).map((l, i) => ({ ...l, ordine: i })),
      }
      const res = await api.post('/retete/', payload)
      onSaved && onSaved(res.data)
      onClose()
    } catch (err) {
      setEroare(err.response?.data?.detail || 'Eroare la salvare.')
    } finally {
      setSalvand(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: '#161b27', border: '1px solid #1e2535', borderRadius: '16px', width: '100%', maxWidth: '680px', maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #1e2535', position: 'sticky', top: 0, background: '#161b27', zIndex: 1 }}>
          <span style={{ fontWeight: '600', color: '#e2e8f0', fontSize: '15px' }}>Rețetă nouă</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#4b5563', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>

        <form onSubmit={salveaza} style={{ padding: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 16px' }}>
            <div>
              <label style={labelStyle}>Gratuit / Cu plată</label>
              <select value={form.gratuit} onChange={e => setForm(p => ({ ...p, gratuit: e.target.value }))} style={inputStyle}>
                <option value="nu">Cu plată</option>
                <option value="da">Gratuit</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Valabilitate (zile)</label>
              <input type="number" min="1" max="90" value={form.valabilitate_zile}
                onChange={e => setForm(p => ({ ...p, valabilitate_zile: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Nr. fișă</label>
              <input value={form.nr_fisa} onChange={e => setForm(p => ({ ...p, nr_fisa: e.target.value }))} style={inputStyle} placeholder="optional" />
            </div>
          </div>

          <label style={labelStyle}>Diagnostic</label>
          <input value={form.diagnostic} onChange={e => setForm(p => ({ ...p, diagnostic: e.target.value }))} style={inputStyle} placeholder="ex: Hipertensiune arterială esențială" />

          <label style={labelStyle}>Observații</label>
          <textarea value={form.observatii} onChange={e => setForm(p => ({ ...p, observatii: e.target.value }))} style={{ ...inputStyle, height: '55px', resize: 'vertical' }} />

          <div style={{ borderTop: '1px solid #1e2535', paddingTop: '14px', marginTop: '4px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Medicamente ({linii.length})
              </span>
              <button type="button" onClick={adaugaLinie}
                style={{ padding: '5px 12px', fontSize: '12px', cursor: 'pointer', background: 'rgba(58,123,213,0.15)', color: '#60a5fa', border: '1px solid #3a7bd5', borderRadius: '7px' }}>
                + Adaugă medicament
              </button>
            </div>

            {linii.map((linie, i) => (
              <div key={i} style={{ background: '#0f1117', border: '1px solid #1e2535', borderRadius: '10px', padding: '14px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', color: '#4b5563', fontWeight: '600' }}>Medicament {i + 1}</span>
                  {linii.length > 1 && (
                    <button type="button" onClick={() => stergeLinie(i)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563', fontSize: '16px', lineHeight: 1 }}>×</button>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0 12px' }}>
                  <div>
                    <label style={labelStyle}>Denumire medicament *</label>
                    <input value={linie.nume_medicament} onChange={e => updateLinie(i, 'nume_medicament', e.target.value)}
                      style={inputStyle} placeholder="ex: Enalapril" required={i === 0} />
                  </div>
                  <div>
                    <label style={labelStyle}>Concentrație / formă</label>
                    <input value={linie.concentratie} onChange={e => updateLinie(i, 'concentratie', e.target.value)}
                      style={inputStyle} placeholder="ex: 10mg, comprimate" />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0 12px' }}>
                  <div>
                    <label style={labelStyle}>Doză și frecvență</label>
                    <input value={linie.doza_frecventa} onChange={e => updateLinie(i, 'doza_frecventa', e.target.value)}
                      style={inputStyle} placeholder="ex: 1cp/zi dimineata" />
                  </div>
                  <div>
                    <label style={labelStyle}>Durată (zile)</label>
                    <input type="number" min="1" value={linie.durata_zile} onChange={e => updateLinie(i, 'durata_zile', e.target.value)}
                      style={inputStyle} placeholder="30" />
                  </div>
                  <div>
                    <label style={labelStyle}>Cantitate (cutii)</label>
                    <input type="number" min="1" value={linie.cantitate} onChange={e => updateLinie(i, 'cantitate', e.target.value)}
                      style={inputStyle} />
                  </div>
                </div>
                <label style={labelStyle}>Observații medicament</label>
                <input value={linie.observatii} onChange={e => updateLinie(i, 'observatii', e.target.value)}
                  style={{ ...inputStyle, marginBottom: 0 }} placeholder="optional" />
              </div>
            ))}
          </div>

          {eroare && <div style={{ color: '#f87171', fontSize: '13px', marginBottom: '12px' }}>{eroare}</div>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '4px' }}>
            <button type="button" onClick={onClose}
              style={{ padding: '8px 18px', fontSize: '13px', cursor: 'pointer', border: '1px solid #1e2535', borderRadius: '8px', background: 'transparent', color: '#9ca3af' }}>
              Anulează
            </button>
            <button type="submit" disabled={salvand}
              style={{ padding: '8px 18px', fontSize: '13px', cursor: 'pointer', background: '#3a7bd5', color: '#fff', border: 'none', borderRadius: '8px', opacity: salvand ? 0.6 : 1 }}>
              {salvand ? 'Se salvează...' : 'Salvează rețeta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Component principal ───────────────────────────────────────────────────────
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
      if (res.data.results) {
        setConsultatii(res.data.results)
        setTotal(res.data.count)
      } else {
        setConsultatii(res.data)
        setTotal(res.data.length)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [pagina, search])

  useEffect(() => { fetchConsultatii() }, [fetchConsultatii])

  const totalPagini = Math.ceil(total / PER_PAGE)

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '380px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="6" stroke="#4b5563" strokeWidth="2"/>
            <path d="M16 16l4 4" stroke="#4b5563" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
            placeholder="Cauta dupa pacient, simptome..."
            style={{ width: '100%', padding: '9px 12px 9px 32px', background: '#161b27', border: '1px solid #1e2535', borderRadius: '9px', color: '#e2e8f0', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }}
            onFocus={e => e.target.style.borderColor = '#3a7bd5'}
            onBlur={e => e.target.style.borderColor = '#1e2535'}
          />
        </div>
        <span style={{ fontSize: '12px', color: '#4b5563' }}>{total} înregistrări</span>
      </div>

      {/* Tabel */}
      <div style={{ background: '#161b27', border: '1px solid #1e2535', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr>
              <th style={{...thStyle, width: '40px'}}>#</th>
              <th style={thStyle}>Data</th>
              <th style={thStyle}>Pacient</th>
              <th style={thStyle}>Medic</th>
              <th style={thStyle}>Simptome</th>
              <th style={thStyle}>Diagnostice</th>
              <th style={thStyle}>Acțiuni</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#4b5563' }}>Se încarcă...</td></tr>
            )}
            {!loading && consultatii.length === 0 && (
              <tr><td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#4b5563' }}>
                {search ? 'Nicio consultație găsită.' : 'Nu există consultații înregistrate.'}
              </td></tr>
            )}
            {!loading && consultatii.map((c, index) => (
              <tr key={c.id}
                style={{ borderBottom: '1px solid #1a2033', transition: 'background 0.12s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ ...tdStyle, color: '#4b5563', textAlign: 'center', fontSize: '12px' }}>{index + 1}</td>
                <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{formatData(c.data_ora)}</td>
                <td style={tdStyle}>
                  <button onClick={() => onNavigate && onNavigate('pacienti')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#60a5fa', fontSize: '13px', padding: 0, fontWeight: '500' }}>
                    {c.pacient_nume || `Pacient #${c.pacient}`}
                  </button>
                </td>
                <td style={tdStyle}>{c.medic_nume || `Medic #${c.medic}`}</td>
                <td style={{ ...tdStyle, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.simptome || '—'}
                </td>
                <td style={tdStyle}>
                  {c.diagnostice?.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {c.diagnostice.slice(0, 2).map((d, i) => (
                        <span key={i} style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: 'rgba(58,123,213,0.15)', color: '#60a5fa' }}>
                          {d.cod_icd10 || d.denumire}
                        </span>
                      ))}
                      {c.diagnostice.length > 2 && (
                        <span style={{ fontSize: '11px', color: '#4b5563' }}>+{c.diagnostice.length - 2}</span>
                      )}
                    </div>
                  ) : '—'}
                </td>
                <td style={tdStyle}>
                  <button onClick={() => setSelected(c)}
                    style={{ padding: '5px 12px', borderRadius: '7px', border: '1px solid #1e2535', background: 'transparent', color: '#9ca3af', fontSize: '12px', cursor: 'pointer' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#e2e8f0' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af' }}>
                    Detalii
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginare */}
      {totalPagini > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', fontSize: '12px', color: '#4b5563' }}>
          <span>Pagina {pagina} din {totalPagini}</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1}
              style={{ padding: '6px 14px', borderRadius: '7px', border: '1px solid #1e2535', background: 'transparent', color: pagina === 1 ? '#2d3748' : '#9ca3af', fontSize: '12px', cursor: pagina === 1 ? 'default' : 'pointer' }}>
              ← Anterior
            </button>
            <button onClick={() => setPagina(p => Math.min(totalPagini, p + 1))} disabled={pagina === totalPagini}
              style={{ padding: '6px 14px', borderRadius: '7px', border: '1px solid #1e2535', background: 'transparent', color: pagina === totalPagini ? '#2d3748' : '#9ca3af', fontSize: '12px', cursor: pagina === totalPagini ? 'default' : 'pointer' }}>
              Următor →
            </button>
          </div>
        </div>
      )}

      {/* Modal detalii consultatie */}
      {selected && (
        <ModalConsultatie
          consultatie={selected}
          onClose={() => setSelected(null)}
          onNavigate={onNavigate}
        />
      )}
    </div>
  )
}

function ModalConsultatie({ consultatie: c, onClose, onNavigate }) {
  const [showReteta, setShowReteta] = useState(false)

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
        <div style={{ background: '#161b27', border: '1px solid #1e2535', borderRadius: '16px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #1e2535' }}>
            <span style={{ fontWeight: '600', color: '#e2e8f0', fontSize: '15px' }}>
              Consultație — {formatData(c.data_ora)}
            </span>
            <button onClick={onClose}
              style={{ background: 'none', border: 'none', color: '#4b5563', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}
              onMouseEnter={e => e.currentTarget.style.color = '#e2e8f0'}
              onMouseLeave={e => e.currentTarget.style.color = '#4b5563'}>✕</button>
          </div>

          {/* Body */}
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <InfoRow label="Pacient">
                <button onClick={() => { onClose(); onNavigate && onNavigate('pacienti') }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#60a5fa', fontSize: '13px', padding: 0 }}>
                  {c.pacient_nume || `#${c.pacient}`}
                </button>
              </InfoRow>
              <InfoRow label="Medic">
                <span style={{ color: '#e2e8f0', fontSize: '13px' }}>{c.medic_nume || `#${c.medic}`}</span>
              </InfoRow>
            </div>

            {c.simptome      && <InfoBlock label="Simptome"      text={c.simptome} />}
            {c.examen_clinic && <InfoBlock label="Examen clinic" text={c.examen_clinic} />}
            {c.tratament     && <InfoBlock label="Tratament"     text={c.tratament} />}
            {c.observatii    && <InfoBlock label="Observații"    text={c.observatii} />}

            {c.diagnostice?.length > 0 && (
              <div>
                <p style={{ fontSize: '11px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Diagnostice</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {c.diagnostice.map((d, i) => (
                    <span key={i} style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', background: 'rgba(58,123,213,0.15)', color: '#60a5fa' }}>
                      {d.cod_icd10 && `${d.cod_icd10} — `}{d.denumire}
                      {d.tip === 'principal' && <span style={{ opacity: 0.6, marginLeft: '4px' }}>(principal)</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '14px 20px', borderTop: '1px solid #1e2535', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={() => setShowReteta(true)}
              style={{ padding: '7px 16px', borderRadius: '8px', border: '1px solid #3a7bd5', background: 'rgba(58,123,213,0.1)', color: '#60a5fa', fontSize: '13px', cursor: 'pointer' }}>
              + Rețetă nouă
            </button>
            <button onClick={onClose}
              style={{ padding: '7px 18px', borderRadius: '8px', border: '1px solid #1e2535', background: 'transparent', color: '#9ca3af', fontSize: '13px', cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#e2e8f0' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af' }}>
              Închide
            </button>
          </div>
        </div>
      </div>

      {/* Modal reteta deasupra modalului consultatie */}
      {showReteta && (
        <ModalReteta
          pacientId={c.pacient}
          medicId={c.medic}
          consultatieId={c.id}
          onClose={() => setShowReteta(false)}
          onSaved={() => setShowReteta(false)}
        />
      )}
    </>
  )
}

function InfoRow({ label, children }) {
  return (
    <div>
      <p style={{ fontSize: '11px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{label}</p>
      {children}
    </div>
  )
}

function InfoBlock({ label, text }) {
  return (
    <div>
      <p style={{ fontSize: '11px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>{label}</p>
      <p style={{ fontSize: '13px', color: '#cbd5e1', background: '#0f1117', border: '1px solid #1e2535', borderRadius: '8px', padding: '10px 12px', margin: 0, whiteSpace: 'pre-wrap' }}>{text}</p>
    </div>
  )
}