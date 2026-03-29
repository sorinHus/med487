import { useState, useEffect } from 'react'
import api from '../api'
import { validareCNP } from '../utils/cnp'
import AdresaFields from '../components/AdresaFields'

function ICD10Search({ selectate, onAdd, onRemove, inputStyle, labelStyle }) {
  const [query, setQuery]         = useState('')
  const [rezultate, setRezultate] = useState([])
  const [loading, setLoading]     = useState(false)

  useEffect(() => {
    if (query.length < 2) { setRezultate([]); return }
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await api.get('/diagnostice/', { params: { search: query } })
        const lista = Array.isArray(res.data) ? res.data : (res.data.results || [])
        setRezultate(lista.filter(d => !selectate.find(s => s.id === d.id)))
      } catch { setRezultate([]) }
      finally { setLoading(false) }
    }, 300)
    return () => clearTimeout(t)
  }, [query, selectate])

  return (
    <div style={{ marginBottom: '12px' }}>
      <label style={labelStyle}>Diagnostice ICD-10</label>
      {selectate.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
          {selectate.map((d, i) => (
            <span key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', background: i === 0 ? 'rgba(58,123,213,0.2)' : 'rgba(107,114,128,0.15)', color: i === 0 ? '#60a5fa' : '#9ca3af', border: `1px solid ${i === 0 ? '#3a7bd5' : '#1e2535'}` }}>
              {d.cod_icd10} — {d.denumire}
              {i === 0 && <span style={{ fontSize: '10px', opacity: 0.7 }}>(principal)</span>}
              <button onClick={() => onRemove(d.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '0', fontSize: '14px', lineHeight: 1, opacity: 0.7 }}>×</button>
            </span>
          ))}
        </div>
      )}
      <div style={{ position: 'relative' }}>
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Cauta cod ICD-10 sau denumire..." style={{ ...inputStyle, marginBottom: 0 }} />
        {(rezultate.length > 0 || (loading && query.length >= 2)) && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1a2235', border: '1px solid #1e2535', borderRadius: '8px', zIndex: 10, maxHeight: '200px', overflowY: 'auto', marginTop: '4px' }}>
            {loading && <div style={{ padding: '10px 14px', fontSize: '12px', color: '#4b5563' }}>Se cauta...</div>}
            {!loading && rezultate.map(d => (
              <button key={d.id} onClick={() => { onAdd(d); setQuery(''); setRezultate([]) }}
                style={{ width: '100%', textAlign: 'left', padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid #1e2535', color: '#e2e8f0', fontSize: '13px' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(58,123,213,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                <span style={{ color: '#60a5fa', fontWeight: '600', marginRight: '8px' }}>{d.cod_icd10}</span>{d.denumire}
              </button>
            ))}
            {!loading && rezultate.length === 0 && query.length >= 2 && (
              <div style={{ padding: '10px 14px', fontSize: '12px', color: '#4b5563' }}>Niciun rezultat.</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Modal creare reteta ──────────────────────────────────────────────────────
function ModalReteta({ pacientId, medicId, consultatieId, onClose, onSaved }) {
  const inputStyle = { width: '100%', padding: '8px 12px', fontSize: '13px', background: '#0f1117', border: '1px solid #1e2535', borderRadius: '8px', color: '#e2e8f0', boxSizing: 'border-box', marginBottom: '12px', outline: 'none' }
  const labelStyle = { fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }

  const [form, setForm] = useState({ gratuit: 'nu', valabilitate_zile: 30, diagnostic: '', nr_fisa: '', observatii: '' })
  const [linii, setLinii] = useState([{ nume_medicament: '', concentratie: '', doza_frecventa: '', durata_zile: '', cantitate: 1, observatii: '' }])
  const [salvand, setSalvand] = useState(false)
  const [eroare, setEroare]   = useState('')

  const updateLinie = (i, field, value) => setLinii(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l))
  const adaugaLinie = () => setLinii(prev => [...prev, { nume_medicament: '', concentratie: '', doza_frecventa: '', durata_zile: '', cantitate: 1, observatii: '' }])
  const stergeLinie = (i) => setLinii(prev => prev.filter((_, idx) => idx !== i))

  const salveaza = async (e) => {
    e.preventDefault()
    for (let i = 0; i < linii.length; i++) {
  const l = linii[i]
      if (!l.nume_medicament.trim()) { setEroare(`Medicament ${i+1}: denumirea este obligatorie.`); return }
      if (!l.concentratie.trim()) { setEroare(`Medicament ${i+1}: concentratia este obligatorie.`); return }
      if (!l.doza_frecventa.trim()) { setEroare(`Medicament ${i+1}: doza si frecventa sunt obligatorii.`); return }
      if (!l.durata_zile) { setEroare(`Medicament ${i+1}: durata in zile este obligatorie.`); return }
      if (!l.cantitate) { setEroare(`Medicament ${i+1}: cantitatea este obligatorie.`); return }
}
    setSalvand(true); setEroare('')
    try {
      const res = await api.post('/retete/', {
        pacient: pacientId, medic: medicId,
        ...(consultatieId ? { consultatie: consultatieId } : {}),
        ...form,
        linii: linii.map((l, i) => ({ 
          ...l, 
          ordine: i,
          durata_zile: parseInt(l.durata_zile),
          cantitate: parseInt(l.cantitate) || 1,
      })),
      })
      onSaved && onSaved(res.data)
      onClose()
    } catch (err) { setEroare(err.response?.data?.detail || 'Eroare la salvare.') }
    finally { setSalvand(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: '#161b27', border: '1px solid #1e2535', borderRadius: '16px', width: '100%', maxWidth: '680px', maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #1e2535', position: 'sticky', top: 0, background: '#161b27', zIndex: 1 }}>
          <span style={{ fontWeight: '600', color: '#e2e8f0', fontSize: '15px' }}>Rețetă nouă</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#4b5563', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>
        <form onSubmit={salveaza} style={{ padding: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 16px' }}>
            <div><label style={labelStyle}>Gratuit / Cu plată</label>
              <select value={form.gratuit} onChange={e => setForm(p => ({ ...p, gratuit: e.target.value }))} style={inputStyle}>
                <option value="nu">Cu plată</option><option value="da">Gratuit</option>
              </select></div>
            <div><label style={labelStyle}>Valabilitate (zile)</label>
              <input type="number" min="1" max="90" value={form.valabilitate_zile} onChange={e => setForm(p => ({ ...p, valabilitate_zile: e.target.value }))} style={inputStyle} /></div>
            <div><label style={labelStyle}>Nr. fișă</label>
              <input value={form.nr_fisa} onChange={e => setForm(p => ({ ...p, nr_fisa: e.target.value }))} style={inputStyle} placeholder="optional" /></div>
          </div>
          <label style={labelStyle}>Diagnostic</label>
          <input value={form.diagnostic} onChange={e => setForm(p => ({ ...p, diagnostic: e.target.value }))} style={inputStyle} placeholder="ex: Hipertensiune arterială esențială" />
          <label style={labelStyle}>Observații</label>
          <textarea value={form.observatii} onChange={e => setForm(p => ({ ...p, observatii: e.target.value }))} style={{ ...inputStyle, height: '55px', resize: 'vertical' }} />
          <div style={{ borderTop: '1px solid #1e2535', paddingTop: '14px', marginTop: '4px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Medicamente ({linii.length})</span>
              <button type="button" onClick={adaugaLinie} style={{ padding: '5px 12px', fontSize: '12px', cursor: 'pointer', background: 'rgba(58,123,213,0.15)', color: '#60a5fa', border: '1px solid #3a7bd5', borderRadius: '7px' }}>+ Adaugă medicament</button>
            </div>
            {linii.map((linie, i) => (
              <div key={i} style={{ background: '#0f1117', border: '1px solid #1e2535', borderRadius: '10px', padding: '14px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', color: '#4b5563', fontWeight: '600' }}>Medicament {i + 1}</span>
                  {linii.length > 1 && <button type="button" onClick={() => stergeLinie(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563', fontSize: '16px', lineHeight: 1 }}>×</button>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0 12px' }}>
                  <div><label style={labelStyle}>Denumire medicament *</label>
                    <input value={linie.nume_medicament} onChange={e => updateLinie(i, 'nume_medicament', e.target.value)} style={inputStyle} placeholder="ex: Enalapril" required={i === 0} /></div>
                  <div><label style={labelStyle}>Concentrație / formă</label>
                    <input value={linie.concentratie} onChange={e => updateLinie(i, 'concentratie', e.target.value)} style={inputStyle} placeholder="ex: 10mg" /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0 12px' }}>
                  <div><label style={labelStyle}>Doză și frecvență</label>
                    <input value={linie.doza_frecventa} onChange={e => updateLinie(i, 'doza_frecventa', e.target.value)} style={inputStyle} placeholder="ex: 1cp/zi" /></div>
                  <div><label style={labelStyle}>Durată (zile)</label>
                    <input type="number" min="1" value={linie.durata_zile} onChange={e => updateLinie(i, 'durata_zile', e.target.value)} style={inputStyle} placeholder="30" /></div>
                  <div><label style={labelStyle}>Cantitate (cutii)</label>
                    <input type="number" min="1" value={linie.cantitate} onChange={e => updateLinie(i, 'cantitate', e.target.value)} style={inputStyle} /></div>
                </div>
                <label style={labelStyle}>Observații medicament</label>
                <input value={linie.observatii} onChange={e => updateLinie(i, 'observatii', e.target.value)} style={{ ...inputStyle, marginBottom: 0 }} placeholder="optional" />
              </div>
            ))}
          </div>
          {eroare && <div style={{ color: '#f87171', fontSize: '13px', marginBottom: '12px' }}>{eroare}</div>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 18px', fontSize: '13px', cursor: 'pointer', border: '1px solid #1e2535', borderRadius: '8px', background: 'transparent', color: '#9ca3af' }}>Anulează</button>
            <button type="submit" disabled={salvand} style={{ padding: '8px 18px', fontSize: '13px', cursor: 'pointer', background: '#3a7bd5', color: '#fff', border: 'none', borderRadius: '8px', opacity: salvand ? 0.6 : 1 }}>
              {salvand ? 'Se salvează...' : 'Salvează rețeta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Modal creare trimitere ───────────────────────────────────────────────────
const SPECIALIST_CHOICES = [
  'cardiologie','neurologie','oftalmologie','ortopedie','dermatologie',
  'ginecologie','urologie','gastroenterologie','endocrinologie','psihiatrie',
  'pneumologie','reumatologie','nefrologie','hematologie','oncologie',
  'chirurgie','ORL','stomatologie','recuperare','altele',
]

function ModalTrimitere({ pacientId, medicId, consultatieId, onClose, onSaved }) {
  const inputStyle = { width: '100%', padding: '8px 12px', fontSize: '13px', background: '#0f1117', border: '1px solid #1e2535', borderRadius: '8px', color: '#e2e8f0', boxSizing: 'border-box', marginBottom: '12px', outline: 'none' }
  const labelStyle = { fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }

  const [form, setForm] = useState({
    specialist: 'cardiologie', specialist_custom: '', unitate_medicala: '',
    diagnostic: '', cod_diagnostic: '', investigatii_solicitate: '',
    prioritate: 'normal', valabilitate_zile: 30, nr_fisa: '', observatii: '',
  })
  const [salvand, setSalvand] = useState(false)
  const [eroare, setEroare]   = useState('')

  const salveaza = async (e) => {
    e.preventDefault()
    setSalvand(true); setEroare('')
    try {
      const res = await api.post('/trimiteri/', {
        pacient: pacientId, medic: medicId,
        ...(consultatieId ? { consultatie: consultatieId } : {}),
        ...form,
      })
      onSaved && onSaved(res.data)
      onClose()
    } catch (err) { setEroare(err.response?.data?.detail || 'Eroare la salvare.') }
    finally { setSalvand(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: '#161b27', border: '1px solid #1e2535', borderRadius: '16px', width: '100%', maxWidth: '620px', maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #1e2535', position: 'sticky', top: 0, background: '#161b27', zIndex: 1 }}>
          <span style={{ fontWeight: '600', color: '#e2e8f0', fontSize: '15px' }}>Trimitere nouă</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#4b5563', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>
        <form onSubmit={salveaza} style={{ padding: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <div><label style={labelStyle}>Specialist *</label>
              <select value={form.specialist} onChange={e => setForm(p => ({ ...p, specialist: e.target.value }))} style={inputStyle} required>
                {SPECIALIST_CHOICES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select></div>
            <div><label style={labelStyle}>Prioritate</label>
              <select value={form.prioritate} onChange={e => setForm(p => ({ ...p, prioritate: e.target.value }))} style={{ ...inputStyle, color: form.prioritate === 'urgent' ? '#f87171' : '#e2e8f0' }}>
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
              </select></div>
          </div>
          {form.specialist === 'altele' && (
            <div><label style={labelStyle}>Specificați specialitatea</label>
              <input value={form.specialist_custom} onChange={e => setForm(p => ({ ...p, specialist_custom: e.target.value }))} style={inputStyle} placeholder="ex: Medicina muncii" /></div>
          )}
          <label style={labelStyle}>Unitate medicală (optional)</label>
          <input value={form.unitate_medicala} onChange={e => setForm(p => ({ ...p, unitate_medicala: e.target.value }))} style={inputStyle} placeholder="ex: Spitalul Județean Cluj" />
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0 16px' }}>
            <div><label style={labelStyle}>Diagnostic prezumtiv</label>
              <input value={form.diagnostic} onChange={e => setForm(p => ({ ...p, diagnostic: e.target.value }))} style={inputStyle} placeholder="ex: Insuficiență cardiacă" /></div>
            <div><label style={labelStyle}>Cod ICD-10</label>
              <input value={form.cod_diagnostic} onChange={e => setForm(p => ({ ...p, cod_diagnostic: e.target.value }))} style={inputStyle} placeholder="ex: I50" /></div>
          </div>
          <label style={labelStyle}>Investigații solicitate / Motivul trimiterii</label>
          <textarea value={form.investigatii_solicitate} onChange={e => setForm(p => ({ ...p, investigatii_solicitate: e.target.value }))}
            style={{ ...inputStyle, height: '80px', resize: 'vertical' }} placeholder="Descrieți investigațiile sau motivul trimiterii..." />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <div><label style={labelStyle}>Valabilitate (zile)</label>
              <input type="number" min="1" max="90" value={form.valabilitate_zile} onChange={e => setForm(p => ({ ...p, valabilitate_zile: e.target.value }))} style={inputStyle} /></div>
            <div><label style={labelStyle}>Nr. fișă</label>
              <input value={form.nr_fisa} onChange={e => setForm(p => ({ ...p, nr_fisa: e.target.value }))} style={inputStyle} placeholder="optional" /></div>
          </div>
          <label style={labelStyle}>Observații</label>
          <textarea value={form.observatii} onChange={e => setForm(p => ({ ...p, observatii: e.target.value }))} style={{ ...inputStyle, height: '55px', resize: 'vertical' }} />
          {eroare && <div style={{ color: '#f87171', fontSize: '13px', marginBottom: '12px' }}>{eroare}</div>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 18px', fontSize: '13px', cursor: 'pointer', border: '1px solid #1e2535', borderRadius: '8px', background: 'transparent', color: '#9ca3af' }}>Anulează</button>
            <button type="submit" disabled={salvand} style={{ padding: '8px 18px', fontSize: '13px', cursor: 'pointer', background: '#3a7bd5', color: '#fff', border: 'none', borderRadius: '8px', opacity: salvand ? 0.6 : 1 }}>
              {salvand ? 'Se salvează...' : 'Salvează trimiterea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Modal creare concediu medical ────────────────────────────────────────────
const COD_INDEMNIZATIE_CHOICES = [
  ['01','01 - Boală obișnuită'],
  ['02','02 - Accident de muncă sau boală profesională'],
  ['03','03 - Accident în afara muncii'],
  ['04','04 - Boală infectocontagioasă din grupa A'],
  ['05','05 - Urgență medico-chirurgicală'],
  ['06','06 - Maternitate'],
  ['07','07 - Îngrijire copil bolnav'],
  ['08','08 - Carantină'],
  ['09','09 - Reducerea timpului de muncă'],
  ['10','10 - Trecere temporară în alt loc de muncă'],
  ['11','11 - Boală infectocontagioasă din grupa B'],
  ['12','12 - Tuberculoză'],
  ['13','13 - SIDA'],
  ['14','14 - Cancer'],
  ['15','15 - Risc maternal'],
]

const azi = new Date().toISOString().slice(0, 10)
const lunaC = new Date().getMonth() + 1
const anC   = new Date().getFullYear()

function ModalConcediu({ pacientId, medicId, consultatieId, onClose, onSaved }) {
  const inputStyle = { width: '100%', padding: '8px 12px', fontSize: '13px', background: '#0f1117', border: '1px solid #1e2535', borderRadius: '8px', color: '#e2e8f0', boxSizing: 'border-box', marginBottom: '12px', outline: 'none' }
  const labelStyle = { fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }

  const [form, setForm] = useState({
    serie_numar: '',
    tip: 'initial',
    serie_initial: '',
    luna: lunaC,
    an: anC,
    cod_indemnizatie: '01',
    data_acordarii: azi,
    nr_zile: 3,
    de_la: azi,
    pana_la: azi,
    cod_diagnostic: '',
    acut_subacut_cronic: 'acut',
    nr_inreg: '',
    ambulator_internat: 'ambulator',
    nr_conventie: '',
    cas: '',
    observatii: '',
  })
  const [salvand, setSalvand] = useState(false)
  const [eroare, setEroare]   = useState('')

  const salveaza = async (e) => {
    e.preventDefault()
    if (!form.serie_numar.trim()) { setEroare('Seria și numărul sunt obligatorii.'); return }
    setSalvand(true); setEroare('')
    try {
      const res = await api.post('/concedii/', {
        pacient: pacientId, medic: medicId,
        ...(consultatieId ? { consultatie: consultatieId } : {}),
        ...form,
      })
      onSaved && onSaved(res.data)
      onClose()
    } catch (err) { setEroare(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Eroare la salvare.') }
    finally { setSalvand(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: '#161b27', border: '1px solid #1e2535', borderRadius: '16px', width: '100%', maxWidth: '660px', maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #1e2535', position: 'sticky', top: 0, background: '#161b27', zIndex: 1 }}>
          <span style={{ fontWeight: '600', color: '#e2e8f0', fontSize: '15px' }}>Concediu medical nou</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#4b5563', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>
        <form onSubmit={salveaza} style={{ padding: '20px' }}>

          {/* Identificare certificat */}
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Certificat</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <div><label style={labelStyle}>Seria și numărul *</label>
              <input value={form.serie_numar} onChange={e => setForm(p => ({ ...p, serie_numar: e.target.value }))} style={inputStyle} placeholder="ex: ABCD123456" required /></div>
            <div><label style={labelStyle}>Tip</label>
              <select value={form.tip} onChange={e => setForm(p => ({ ...p, tip: e.target.value }))} style={inputStyle}>
                <option value="initial">Inițial</option>
                <option value="continuare">În continuare</option>
              </select></div>
          </div>
          {form.tip === 'continuare' && (
            <div><label style={labelStyle}>Seria certificatului inițial</label>
              <input value={form.serie_initial} onChange={e => setForm(p => ({ ...p, serie_initial: e.target.value }))} style={inputStyle} placeholder="ex: ABCD000001" /></div>
          )}

          {/* Luna, an, cod indemnizatie */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '0 16px' }}>
            <div><label style={labelStyle}>Luna</label>
              <input type="number" min="1" max="12" value={form.luna} onChange={e => setForm(p => ({ ...p, luna: e.target.value }))} style={inputStyle} /></div>
            <div><label style={labelStyle}>Anul</label>
              <input type="number" min="2020" max="2099" value={form.an} onChange={e => setForm(p => ({ ...p, an: e.target.value }))} style={inputStyle} /></div>
            <div><label style={labelStyle}>Cod indemnizație</label>
              <select value={form.cod_indemnizatie} onChange={e => setForm(p => ({ ...p, cod_indemnizatie: e.target.value }))} style={inputStyle}>
                {COD_INDEMNIZATIE_CHOICES.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
              </select></div>
          </div>

          {/* Perioada */}
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', marginTop: '4px' }}>Perioadă</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0 12px' }}>
            <div><label style={labelStyle}>Data acordării</label>
              <input type="date" value={form.data_acordarii} onChange={e => setForm(p => ({ ...p, data_acordarii: e.target.value }))} style={inputStyle} /></div>
            <div><label style={labelStyle}>Nr. zile</label>
              <input type="number" min="1" value={form.nr_zile} onChange={e => setForm(p => ({ ...p, nr_zile: e.target.value }))} style={inputStyle} /></div>
            <div><label style={labelStyle}>De la</label>
              <input type="date" value={form.de_la} onChange={e => setForm(p => ({ ...p, de_la: e.target.value }))} style={inputStyle} /></div>
            <div><label style={labelStyle}>Până la</label>
              <input type="date" value={form.pana_la} onChange={e => setForm(p => ({ ...p, pana_la: e.target.value }))} style={inputStyle} /></div>
          </div>

          {/* Diagnostic */}
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', marginTop: '4px' }}>Diagnostic</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <div><label style={labelStyle}>Cod diagnostic</label>
              <input value={form.cod_diagnostic} onChange={e => setForm(p => ({ ...p, cod_diagnostic: e.target.value }))} style={inputStyle} placeholder="ex: J06" /></div>
            <div><label style={labelStyle}>Acut / Subacut / Cronic</label>
              <select value={form.acut_subacut_cronic} onChange={e => setForm(p => ({ ...p, acut_subacut_cronic: e.target.value }))} style={inputStyle}>
                <option value="acut">Acut</option>
                <option value="subacut">Subacut</option>
                <option value="cronic">Cronic</option>
              </select></div>
          </div>

          {/* Internare */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <div><label style={labelStyle}>Ambulator / Internat</label>
              <select value={form.ambulator_internat} onChange={e => setForm(p => ({ ...p, ambulator_internat: e.target.value }))} style={inputStyle}>
                <option value="ambulator">Ambulator</option>
                <option value="internat">Internat în spital</option>
              </select></div>
            <div><label style={labelStyle}>Nr. înregistrare (RC/FO)</label>
              <input value={form.nr_inreg} onChange={e => setForm(p => ({ ...p, nr_inreg: e.target.value }))} style={inputStyle} placeholder="optional" /></div>
          </div>

          {/* Unitate */}
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', marginTop: '4px' }}>Unitate</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <div><label style={labelStyle}>Nr. convenție CAS</label>
              <input value={form.nr_conventie} onChange={e => setForm(p => ({ ...p, nr_conventie: e.target.value }))} style={inputStyle} placeholder="optional" /></div>
            <div><label style={labelStyle}>CAS</label>
              <input value={form.cas} onChange={e => setForm(p => ({ ...p, cas: e.target.value }))} style={inputStyle} placeholder="ex: CAS Cluj" /></div>
          </div>

          <label style={labelStyle}>Observații</label>
          <textarea value={form.observatii} onChange={e => setForm(p => ({ ...p, observatii: e.target.value }))} style={{ ...inputStyle, height: '55px', resize: 'vertical' }} />

          {eroare && <div style={{ color: '#f87171', fontSize: '13px', marginBottom: '12px' }}>{eroare}</div>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 18px', fontSize: '13px', cursor: 'pointer', border: '1px solid #1e2535', borderRadius: '8px', background: 'transparent', color: '#9ca3af' }}>Anulează</button>
            <button type="submit" disabled={salvand} style={{ padding: '8px 18px', fontSize: '13px', cursor: 'pointer', background: '#3a7bd5', color: '#fff', border: 'none', borderRadius: '8px', opacity: salvand ? 0.6 : 1 }}>
              {salvand ? 'Se salvează...' : 'Salvează concediul'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────
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

function dataNastereDinCNP(cnp) {
  try {
    if (!cnp || cnp.length !== 13) return '—'
    const s = parseInt(cnp[0])
    const an2 = parseInt(cnp.slice(1, 3))
    const luna = parseInt(cnp.slice(3, 5))
    const zi = parseInt(cnp.slice(5, 7))
    let an
    if (s === 1 || s === 2) an = 1900 + an2
    else if (s === 3 || s === 4) an = 1800 + an2
    else if (s === 5 || s === 6) an = 2000 + an2
    else an = 1900 + an2
    return `${zi.toString().padStart(2,'0')}.${luna.toString().padStart(2,'0')}.${an}`
  } catch { return '—' }
}

const STATUS_OPTS = [
  { value: 'activ',      label: 'Activ',                color: '#34d399' },
  { value: 'decedat',    label: 'Decedat',              color: '#f87171' },
  { value: 'transferat', label: 'Transferat alt medic', color: '#fbbf24' },
  { value: 'inactiv',    label: 'Inactiv',              color: '#9ca3af' },
]

const LUNI = ['','Ian','Feb','Mar','Apr','Mai','Iun','Iul','Aug','Sep','Oct','Nov','Dec']

// ── Component principal ───────────────────────────────────────────────────────
export default function PacientDetalii({ pacient, onBack }) {
  const [consultatii, setConsultatii]       = useState([])
  const [retete, setRetete]                 = useState([])
  const [trimiteri, setTrimiteri]           = useState([])
  const [concedii, setConcedii]             = useState([])
  const [loadingC, setLoadingC]             = useState(true)
  const [loadingR, setLoadingR]             = useState(true)
  const [loadingT, setLoadingT]             = useState(true)
  const [loadingCo, setLoadingCo]           = useState(true)
  const [status, setStatus]                 = useState(pacient.status)
  const [salvandStatus, setSalvandStatus]   = useState(false)
  const [editMode, setEditMode]             = useState(false)
  const [formEdit, setFormEdit]             = useState({ ...pacient })
  const [errorsEdit, setErrorsEdit]         = useState({})
  const [salvandEdit, setSalvandEdit]       = useState(false)
  const [showConsultatie, setShowConsultatie] = useState(false)
  const [showReteta, setShowReteta]         = useState(false)
  const [showTrimitere, setShowTrimitere]   = useState(false)
  const [showConcediu, setShowConcediu]     = useState(false)
  const [formC, setFormC] = useState({
    data_ora: new Date().toISOString().slice(0,16),
    simptome: '', examen_clinic: '', tratament: '', observatii: '', diagnostice: []
  })
  const [salvandC, setSalvandC] = useState(false)

  const inputStyle = { width: '100%', padding: '8px 12px', fontSize: '13px', background: '#0f1117', border: '1px solid #1e2535', borderRadius: '8px', color: '#e2e8f0', boxSizing: 'border-box', marginBottom: '12px', outline: 'none' }
  const labelStyle = { fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }
  const fieldLabel = { fontSize: '16px', color: '#6b7280', marginBottom: '3px' }
  const fieldValue = { fontSize: '18px', fontWeight: '500', color: '#e2e8f0', marginBottom: '16px' }

  useEffect(() => {
    api.get(`/pacienti/${pacient.id}/consultatii/`)
      .then(res => setConsultatii(res.data))
      .catch(console.error)
      .finally(() => setLoadingC(false))
  }, [pacient.id])

  useEffect(() => {
    api.get('/retete/', { params: { pacient: pacient.id } })
      .then(res => setRetete(Array.isArray(res.data) ? res.data : (res.data.results || [])))
      .catch(console.error)
      .finally(() => setLoadingR(false))
  }, [pacient.id])

  useEffect(() => {
    api.get('/trimiteri/', { params: { pacient: pacient.id } })
      .then(res => setTrimiteri(Array.isArray(res.data) ? res.data : (res.data.results || [])))
      .catch(console.error)
      .finally(() => setLoadingT(false))
  }, [pacient.id])

  useEffect(() => {
    api.get('/concedii/', { params: { pacient: pacient.id } })
      .then(res => setConcedii(Array.isArray(res.data) ? res.data : (res.data.results || [])))
      .catch(console.error)
      .finally(() => setLoadingCo(false))
  }, [pacient.id])

  const schimbaStatus = async (val) => {
    setSalvandStatus(true)
    try {
      await api.patch(`/pacienti/${pacient.id}/`, { status: val })
      setStatus(val); pacient.status = val
    } catch { alert('Eroare la salvarea statusului.') }
    finally { setSalvandStatus(false) }
  }

  const salveazaEdit = async (e) => {
    e.preventDefault()
    if (!validareCNP(formEdit.cnp)) { setErrorsEdit({ cnp: 'CNP invalid.' }); return }
    if (formEdit.cnp !== pacient.cnp && !window.confirm(`Modifici CNP-ul?\nVechi: ${pacient.cnp}\nNou: ${formEdit.cnp}`)) return
    setSalvandEdit(true); setErrorsEdit({})
    try {
      await api.put(`/pacienti/${pacient.id}/`, { ...formEdit, medic: pacient.medic })
      Object.assign(pacient, formEdit)
      setEditMode(false)
    } catch (err) { setErrorsEdit(err.response?.data || { general: 'Eroare la salvare.' }) }
    finally { setSalvandEdit(false) }
  }

  const salveazaConsultatie = async (e) => {
    e.preventDefault(); setSalvandC(true)
    try {
      await api.post('/consultatii/', {
        ...formC, pacient: pacient.id, medic: pacient.medic,
        diagnostice_ids: formC.diagnostice.map(d => d.id)
      })
      const res = await api.get(`/pacienti/${pacient.id}/consultatii/`)
      setConsultatii(res.data)
      setShowConsultatie(false)
      setFormC({ data_ora: new Date().toISOString().slice(0,16), simptome: '', examen_clinic: '', tratament: '', observatii: '', diagnostice: [] })
    } catch { alert('Eroare la salvarea consultatiei.') }
    finally { setSalvandC(false) }
  }

  const adresaDisplay = [pacient.strada, pacient.numar_strada, pacient.localitate, pacient.judet].filter(Boolean).join(', ') || '—'
  const nume = `${pacient.nume} ${pacient.prenume}`
  const statusObj = STATUS_OPTS.find(s => s.value === status) || STATUS_OPTS[0]

  return (
    <div>
      {/* Back + actiuni */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '20px', padding: '0', lineHeight: 1 }}>←</button>
        <span style={{ fontSize: '15px', fontWeight: '600', color: '#e2e8f0' }}>{nume}</span>
        <div style={{ flex: 1 }} />
        <button onClick={() => setEditMode(!editMode)}
          style={{ padding: '7px 16px', fontSize: '13px', cursor: 'pointer', background: editMode ? 'transparent' : '#3a7bd5', color: editMode ? '#9ca3af' : '#fff', border: editMode ? '1px solid #1e2535' : 'none', borderRadius: '8px' }}>
          {editMode ? 'Anuleaza' : 'Editeaza'}
        </button>
      </div>

      {/* Edit form */}
      {editMode && (
        <div style={{ background: '#161b27', border: '1px solid #3a7bd5', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#60a5fa', marginBottom: '16px' }}>Editare date pacient</div>
          {errorsEdit.general && <div style={{ color: '#f87171', fontSize: '13px', marginBottom: '12px' }}>{errorsEdit.general}</div>}
          <form onSubmit={salveazaEdit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <div><label style={labelStyle}>Nume *</label>
                <input value={formEdit.nume} onChange={e => setFormEdit(p => ({ ...p, nume: e.target.value }))} required style={inputStyle}/></div>
              <div><label style={labelStyle}>Prenume *</label>
                <input value={formEdit.prenume} onChange={e => setFormEdit(p => ({ ...p, prenume: e.target.value }))} required style={inputStyle}/></div>
            </div>
            <label style={labelStyle}>CNP *</label>
            <input value={formEdit.cnp} maxLength={13} onChange={e => setFormEdit(p => ({ ...p, cnp: e.target.value }))} required style={inputStyle}/>
            {errorsEdit.cnp && <p style={{ color: '#f87171', fontSize: '12px', marginTop: '-8px', marginBottom: '10px' }}>{errorsEdit.cnp}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <div><label style={labelStyle}>Telefon</label>
                <input value={formEdit.telefon} onChange={e => setFormEdit(p => ({ ...p, telefon: e.target.value }))} style={inputStyle}/></div>
              <div><label style={labelStyle}>Email</label>
                <input type="email" value={formEdit.email} onChange={e => setFormEdit(p => ({ ...p, email: e.target.value }))} style={inputStyle}/></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <div><label style={labelStyle}>Grup sangvin</label>
                <select value={formEdit.grup_sangvin} onChange={e => setFormEdit(p => ({ ...p, grup_sangvin: e.target.value }))} style={inputStyle}>
                  <option value="">---</option>
                  {['A+','A-','B+','B-','AB+','AB-','0+','0-'].map(g => <option key={g} value={g}>{g}</option>)}
                </select></div>
              <div><label style={labelStyle}>Sex</label>
                <select value={formEdit.sex} onChange={e => setFormEdit(p => ({ ...p, sex: e.target.value }))} style={inputStyle}>
                  <option value="M">Masculin</option><option value="F">Feminin</option>
                </select></div>
            </div>
            <div style={{ borderTop: '1px solid #1e2535', paddingTop: '14px', marginTop: '2px', marginBottom: '4px' }}>
              <div style={{ fontSize: '12px', color: '#4b5563', marginBottom: '12px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Adresă</div>
              <AdresaFields
                values={{ judet: formEdit.judet || '', localitate: formEdit.localitate || '', strada: formEdit.strada || '', numar_strada: formEdit.numar_strada || '' }}
                onChange={(field, value) => setFormEdit(p => ({ ...p, [field]: value }))}
              />
            </div>
            <label style={labelStyle}>Alergii</label>
            <textarea value={formEdit.alergii} onChange={e => setFormEdit(p => ({ ...p, alergii: e.target.value }))} style={{ ...inputStyle, height: '60px', resize: 'vertical' }}/>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
              <button type="button" onClick={() => setEditMode(false)} style={{ padding: '8px 18px', fontSize: '13px', cursor: 'pointer', border: '1px solid #1e2535', borderRadius: '8px', background: 'transparent', color: '#9ca3af' }}>Anuleaza</button>
              <button type="submit" disabled={salvandEdit} style={{ padding: '8px 18px', fontSize: '13px', cursor: 'pointer', background: '#3a7bd5', color: '#fff', border: 'none', borderRadius: '8px', opacity: salvandEdit ? 0.6 : 1 }}>
                {salvandEdit ? 'Se salveaza...' : 'Salveaza'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Date pacient */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
        <div style={{ background: '#161b27', border: '1px solid #1e2535', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: getAvatarColor(nume), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', color: '#fff', flexShrink: 0 }}>
              {getInitials(nume)}
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '600', color: '#e2e8f0' }}>{nume}</div>
              <div style={{ fontSize: '12px', color: '#4b5563' }}>ID: {pacient.id}</div>
            </div>
          </div>
          <p style={fieldLabel}>CNP</p><p style={fieldValue}>{pacient.cnp}</p>
          <p style={fieldLabel}>Data nasterii</p><p style={fieldValue}>{dataNastereDinCNP(pacient.cnp)}</p>
          <p style={fieldLabel}>Sex</p><p style={fieldValue}>{pacient.sex === 'M' ? 'Masculin' : 'Feminin'}</p>
          <p style={fieldLabel}>Grup sangvin</p><p style={fieldValue}>{pacient.grup_sangvin || '—'}</p>
          <p style={fieldLabel}>Status</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select value={status} onChange={e => schimbaStatus(e.target.value)} disabled={salvandStatus}
              style={{ padding: '5px 10px', fontSize: '12px', borderRadius: '8px', border: '1px solid #1e2535', background: '#0f1117', color: statusObj.color, cursor: 'pointer', outline: 'none' }}>
              {STATUS_OPTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            {salvandStatus && <span style={{ fontSize: '11px', color: '#4b5563' }}>Se salveaza...</span>}
          </div>
        </div>
        <div style={{ background: '#161b27', border: '1px solid #1e2535', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#e2e8f0', marginBottom: '16px' }}>Contact</div>
          <p style={fieldLabel}>Telefon</p><p style={fieldValue}>{pacient.telefon || '—'}</p>
          <p style={fieldLabel}>Email</p><p style={fieldValue}>{pacient.email || '—'}</p>
          <p style={fieldLabel}>Adresă</p><p style={fieldValue}>{adresaDisplay}</p>
          <p style={fieldLabel}>Alergii</p>
          <p style={{ ...fieldValue, color: pacient.alergii ? '#fbbf24' : '#4b5563' }}>{pacient.alergii || 'Nicio alergie cunoscuta'}</p>
        </div>
      </div>

      {/* Retete */}
      <div style={{ background: '#161b27', border: '1px solid #1e2535', borderRadius: '12px', padding: '20px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#e2e8f0' }}>Rețete ({retete.length})</span>
          <button onClick={() => setShowReteta(true)} style={{ padding: '7px 14px', fontSize: '12px', cursor: 'pointer', background: '#3a7bd5', color: '#fff', border: 'none', borderRadius: '8px' }}>
            + Rețetă nouă
          </button>
        </div>
        {loadingR && <p style={{ color: '#4b5563', fontSize: '13px' }}>Se încarcă...</p>}
        {!loadingR && retete.length === 0 && <p style={{ color: '#4b5563', fontSize: '13px' }}>Nicio rețetă înregistrată.</p>}
        {!loadingR && retete.map(r => (
          <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1a2033', paddingBottom: '10px', marginBottom: '10px' }}>
            <div>
              <span style={{ fontWeight: '600', fontSize: '13px', color: '#60a5fa', marginRight: '10px' }}>{r.numar_reteta}</span>
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>{r.data_emiterii}</span>
              {r.diagnostic && <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '10px' }}>— {r.diagnostic}</span>}
              <span style={{ marginLeft: '10px', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: r.gratuit === 'da' ? 'rgba(52,211,153,0.15)' : 'rgba(107,114,128,0.15)', color: r.gratuit === 'da' ? '#34d399' : '#9ca3af' }}>
                {r.gratuit === 'da' ? 'Gratuit' : 'Cu plată'}
              </span>
            </div>
            <a href={`https://web-production-26811.up.railway.app/api/retete/${r.id}/print/`} target="_blank" rel="noreferrer"
              style={{ padding: '5px 12px', borderRadius: '7px', border: '1px solid #1e2535', background: 'transparent', color: '#9ca3af', fontSize: '12px', textDecoration: 'none' }}>
              🖨️ Print
            </a>
          </div>
        ))}
      </div>

      {/* Trimiteri */}
      <div style={{ background: '#161b27', border: '1px solid #1e2535', borderRadius: '12px', padding: '20px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#e2e8f0' }}>Trimiteri ({trimiteri.length})</span>
          <button onClick={() => setShowTrimitere(true)} style={{ padding: '7px 14px', fontSize: '12px', cursor: 'pointer', background: '#3a7bd5', color: '#fff', border: 'none', borderRadius: '8px' }}>
            + Trimitere nouă
          </button>
        </div>
        {loadingT && <p style={{ color: '#4b5563', fontSize: '13px' }}>Se încarcă...</p>}
        {!loadingT && trimiteri.length === 0 && <p style={{ color: '#4b5563', fontSize: '13px' }}>Nicio trimitere înregistrată.</p>}
        {!loadingT && trimiteri.map(t => (
          <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1a2033', paddingBottom: '10px', marginBottom: '10px' }}>
            <div>
              <span style={{ fontWeight: '600', fontSize: '13px', color: '#60a5fa', marginRight: '10px' }}>{t.numar_trimitere}</span>
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>{t.data_emiterii}</span>
              <span style={{ marginLeft: '10px', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: 'rgba(58,123,213,0.15)', color: '#60a5fa' }}>
                {t.specialist.charAt(0).toUpperCase() + t.specialist.slice(1)}
              </span>
              {t.prioritate === 'urgent' && (
                <span style={{ marginLeft: '6px', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: 'rgba(248,113,113,0.15)', color: '#f87171' }}>Urgent</span>
              )}
              {t.diagnostic && <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '10px' }}>— {t.diagnostic}</span>}
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <a href={`https://web-production-26811.up.railway.app/api/trimiteri/${t.id}/print/`} target="_blank" rel="noreferrer"
                style={{ padding: '5px 12px', borderRadius: '7px', border: '1px solid #1e2535', background: 'transparent', color: '#9ca3af', fontSize: '12px', textDecoration: 'none' }}>
                🖨️ Simplu
              </a>
              <a href={`https://web-production-26811.up.railway.app/api/trimiteri/${t.id}/print/?tip=cnas`} target="_blank" rel="noreferrer"
                style={{ padding: '5px 12px', borderRadius: '7px', border: '1px solid #1e2535', background: 'transparent', color: '#9ca3af', fontSize: '12px', textDecoration: 'none' }}>
                🖨️ CNAS
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Concedii medicale */}
      <div style={{ background: '#161b27', border: '1px solid #1e2535', borderRadius: '12px', padding: '20px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#e2e8f0' }}>Concedii medicale ({concedii.length})</span>
          <button onClick={() => setShowConcediu(true)} style={{ padding: '7px 14px', fontSize: '12px', cursor: 'pointer', background: '#3a7bd5', color: '#fff', border: 'none', borderRadius: '8px' }}>
            + Concediu nou
          </button>
        </div>
        {loadingCo && <p style={{ color: '#4b5563', fontSize: '13px' }}>Se încarcă...</p>}
        {!loadingCo && concedii.length === 0 && <p style={{ color: '#4b5563', fontSize: '13px' }}>Niciun concediu înregistrat.</p>}
        {!loadingCo && concedii.map(c => (
          <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1a2033', paddingBottom: '10px', marginBottom: '10px' }}>
            <div>
              <span style={{ fontWeight: '600', fontSize: '13px', color: '#60a5fa', marginRight: '10px' }}>{c.serie_numar}</span>
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>{LUNI[c.luna]} {c.an}</span>
              <span style={{ marginLeft: '10px', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>
                {c.nr_zile} zile
              </span>
              <span style={{ marginLeft: '6px', fontSize: '12px', color: '#6b7280' }}>{c.de_la} → {c.pana_la}</span>
              {c.cod_diagnostic && <span style={{ marginLeft: '8px', fontSize: '12px', color: '#4b5563' }}>({c.cod_diagnostic})</span>}
            </div>
            <a href={`https://web-production-26811.up.railway.app/api/concedii/${c.id}/print/`} target="_blank" rel="noreferrer"
              style={{ padding: '5px 12px', borderRadius: '7px', border: '1px solid #1e2535', background: 'transparent', color: '#9ca3af', fontSize: '12px', textDecoration: 'none' }}>
              🖨️ Print
            </a>
          </div>
        ))}
      </div>

      {/* Consultatii */}
      <div style={{ background: '#161b27', border: '1px solid #1e2535', borderRadius: '12px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#e2e8f0' }}>Istoric consultatii ({consultatii.length})</span>
          <button onClick={() => setShowConsultatie(!showConsultatie)}
            style={{ padding: '7px 14px', fontSize: '12px', cursor: 'pointer', background: showConsultatie ? 'transparent' : '#3a7bd5', color: showConsultatie ? '#9ca3af' : '#fff', border: showConsultatie ? '1px solid #1e2535' : 'none', borderRadius: '8px' }}>
            {showConsultatie ? 'Anuleaza' : '+ Consultatie noua'}
          </button>
        </div>

        {showConsultatie && (
          <form onSubmit={salveazaConsultatie} style={{ borderTop: '1px solid #1e2535', paddingTop: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <div><label style={labelStyle}>Data si ora *</label>
                <input type="datetime-local" value={formC.data_ora} onChange={e => setFormC(p => ({ ...p, data_ora: e.target.value }))} required style={inputStyle}/></div>
            </div>
            <label style={labelStyle}>Simptome</label>
            <textarea value={formC.simptome} onChange={e => setFormC(p => ({ ...p, simptome: e.target.value }))} style={{ ...inputStyle, height: '70px', resize: 'vertical' }} placeholder="Descrie simptomele..."/>
            <label style={labelStyle}>Examen clinic</label>
            <textarea value={formC.examen_clinic} onChange={e => setFormC(p => ({ ...p, examen_clinic: e.target.value }))} style={{ ...inputStyle, height: '70px', resize: 'vertical' }} placeholder="Rezultatele examenului..."/>
            <label style={labelStyle}>Tratament</label>
            <textarea value={formC.tratament} onChange={e => setFormC(p => ({ ...p, tratament: e.target.value }))} style={{ ...inputStyle, height: '70px', resize: 'vertical' }} placeholder="Medicatie, doze, durata..."/>
            <label style={labelStyle}>Observatii</label>
            <textarea value={formC.observatii} onChange={e => setFormC(p => ({ ...p, observatii: e.target.value }))} style={{ ...inputStyle, height: '60px', resize: 'vertical' }}/>
            <ICD10Search
              selectate={formC.diagnostice}
              onAdd={d => setFormC(p => ({ ...p, diagnostice: [...p.diagnostice, d] }))}
              onRemove={id => setFormC(p => ({ ...p, diagnostice: p.diagnostice.filter(d => d.id !== id) }))}
              inputStyle={inputStyle} labelStyle={labelStyle}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
              <button type="button" onClick={() => setShowConsultatie(false)} style={{ padding: '8px 18px', fontSize: '13px', cursor: 'pointer', border: '1px solid #1e2535', borderRadius: '8px', background: 'transparent', color: '#9ca3af' }}>Anuleaza</button>
              <button type="submit" disabled={salvandC} style={{ padding: '8px 18px', fontSize: '13px', cursor: 'pointer', background: '#3a7bd5', color: '#fff', border: 'none', borderRadius: '8px', opacity: salvandC ? 0.6 : 1 }}>
                {salvandC ? 'Se salveaza...' : 'Salveaza consultatia'}
              </button>
            </div>
          </form>
        )}

        {loadingC && <p style={{ color: '#4b5563', fontSize: '13px' }}>Se incarca...</p>}
        {!loadingC && consultatii.length === 0 && <p style={{ color: '#4b5563', fontSize: '13px' }}>Nicio consultatie inregistrata.</p>}
        {!loadingC && consultatii.map(c => (
          <div key={c.id} style={{ borderBottom: '1px solid #1a2033', paddingBottom: '14px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
              <span style={{ fontWeight: '600', fontSize: '13px', color: '#60a5fa' }}>
                {new Date(c.data_ora).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                <span style={{ fontSize: '12px', color: '#4b5563' }}>Dr. {c.medic_nume || '—'}</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => setShowReteta(true)}
                    style={{ padding: '3px 10px', fontSize: '11px', cursor: 'pointer', background: 'rgba(58,123,213,0.1)', color: '#60a5fa', border: '1px solid #3a7bd5', borderRadius: '6px' }}>
                    + Rețetă
                  </button>
                  <button onClick={() => setShowTrimitere(true)}
                    style={{ padding: '3px 10px', fontSize: '11px', cursor: 'pointer', background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid #34d399', borderRadius: '6px' }}>
                    + Trimitere
                  </button>
                  <button onClick={() => setShowConcediu(true)}
                    style={{ padding: '3px 10px', fontSize: '11px', cursor: 'pointer', background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid #fbbf24', borderRadius: '6px' }}>
                    + Concediu
                  </button>
                </div>
              </div>
            </div>
            {c.simptome  && <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '4px' }}><span style={{ color: '#6b7280' }}>Simptome: </span>{c.simptome}</p>}
            {c.tratament && <p style={{ fontSize: '13px', color: '#9ca3af' }}><span style={{ color: '#6b7280' }}>Tratament: </span>{c.tratament}</p>}
          </div>
        ))}
      </div>

      {/* Modals */}
      {showReteta && (
        <ModalReteta
          pacientId={pacient.id} medicId={pacient.medic} consultatieId={null}
          onClose={() => setShowReteta(false)}
          onSaved={r => setRetete(prev => [r, ...prev])}
        />
      )}
      {showTrimitere && (
        <ModalTrimitere
          pacientId={pacient.id} medicId={pacient.medic} consultatieId={null}
          onClose={() => setShowTrimitere(false)}
          onSaved={t => setTrimiteri(prev => [t, ...prev])}
        />
      )}
      {showConcediu && (
        <ModalConcediu
          pacientId={pacient.id} medicId={pacient.medic} consultatieId={null}
          onClose={() => setShowConcediu(false)}
          onSaved={c => setConcedii(prev => [c, ...prev])}
        />
      )}
    </div>
  )
}