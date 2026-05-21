import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api'
import { validareCNP } from '../utils/cnp'
import AdresaFields from '../components/AdresaFields'
import s from '../styles/PacientDetalii.module.css'
import { ANALIZE_LABORATOR } from '../data/analizeLabor'
import MedicamentPicker from './MedicamentPicker'

const API_BASE = import.meta.env.VITE_API_URL || 'https://web-production-26811.up.railway.app/api'

/* ─────────────────────────────────────────────
   ICD10Search
───────────────────────────────────────────── */
function ICD10Search({ selectate, onAdd, onRemove, label = 'Diagnostice ICD-10' }) {
  const [query, setQuery]         = useState('')
  const [rezultate, setRezultate] = useState([])
  const [loading, setLoading]     = useState(false)
  const [rect, setRect]           = useState(null)
  const wrapRef                   = useRef(null)

  useEffect(() => {
    if (query.length < 2) { setRezultate([]); setRect(null); return }
    const t = setTimeout(async () => {
      setLoading(true)
      if (wrapRef.current) {
        const r = wrapRef.current.getBoundingClientRect()
        setRect({ top: r.bottom + 4, left: r.left, width: r.width })
      }
      try {
        const res = await api.get('/diagnostice/', { params: { search: query } })
        const lista = Array.isArray(res.data) ? res.data : (res.data.results || [])
        setRezultate(lista.filter(d => !selectate.find(sel => sel.id === d.id)))
      } catch { setRezultate([]) }
      finally { setLoading(false) }
    }, 300)
    return () => clearTimeout(t)
  }, [query, selectate])

  const showDropdown = rect && (rezultate.length > 0 || (loading && query.length >= 2))

  return (
    <div className={s.icd10Wrap}>
      <label className={s.label}>{label}</label>
      {selectate.length > 0 && (
        <div className={s.icd10Tags}>
          {selectate.map((d, i) => (
            <span key={d.id} className={i === 0 ? s.icd10TagPrincipal : s.icd10Tag}>
              {d.cod_icd10} — {d.denumire}
              {i === 0 && <span className={s.icd10PrincipalLabel}>(principal)</span>}
              <button onClick={() => onRemove(d.id)} className={s.btnStergeTag}>×</button>
            </span>
          ))}
        </div>
      )}
      <div className={s.icd10InputWrap} ref={wrapRef}>
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Cauta cod ICD-10 sau denumire..." className={s.input} style={{ marginBottom: 0 }} />
        {showDropdown && (
          <div className={s.icd10Dropdown} style={{ position: 'fixed', top: rect.top, left: rect.left, width: rect.width, zIndex: 9999 }}>
            {loading && <div className={s.icd10Loading}>Se cauta...</div>}
            {!loading && rezultate.map(d => (
              <button key={d.id} onClick={() => { onAdd(d); setQuery(''); setRezultate([]); setRect(null) }} className={s.icd10Btn}>
                <span className={s.icd10Cod}>{d.cod_icd10}</span>{d.denumire}
              </button>
            ))}
            {!loading && rezultate.length === 0 && query.length >= 2 && (
              <div className={s.icd10Empty}>Niciun rezultat găsit.</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   ModalReteta
───────────────────────────────────────────── */
function ModalReteta({ pacientId, medicId, onClose, onSaved, editData = null }) {
  const [form, setForm] = useState(editData ? {
    gratuit: editData.gratuit || 'nu', valabilitate_zile: editData.valabilitate_zile || 30,
    diagnostic: editData.diagnostic || '', cod_diagnostic: editData.cod_diagnostic || '',
    nr_fisa: editData.nr_fisa || '', observatii: editData.observatii || '',
  } : { gratuit: 'nu', valabilitate_zile: 30, diagnostic: '', cod_diagnostic: '', nr_fisa: '', observatii: '' })
  const [diagSelectate, setDiagSelectate] = useState(() => {
    if (editData?.cod_diagnostic && editData?.diagnostic)
      return [{ id: '__init__', cod_icd10: editData.cod_diagnostic, denumire: editData.diagnostic }]
    return []
  })
  const [linii, setLinii] = useState(editData?.linii?.length ? editData.linii.map(l => ({
    nume_medicament: l.nume_medicament || '', concentratie: l.concentratie || '',
    doza_frecventa: l.doza_frecventa || '', durata_zile: l.durata_zile || '',
    cantitate: l.cantitate || 1, observatii: l.observatii || '',
  })) : [{ nume_medicament: '', concentratie: '', doza_frecventa: '', durata_zile: '', cantitate: 1, observatii: '' }])
  const [salvand, setSalvand] = useState(false)
  const [eroare, setEroare]   = useState('')

  const updateLinie = (i, field, value) => setLinii(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l))
  const updateLinieMulti = (i, fields) => setLinii(prev => prev.map((l, idx) => idx === i ? { ...l, ...fields } : l))
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
    const payload = {
      pacient: pacientId, medic: medicId, ...form,
      linii: linii.map((l, i) => ({ ...l, ordine: i, durata_zile: parseInt(l.durata_zile), cantitate: parseInt(l.cantitate) || 1 })),
    }
    try {
      const res = editData
        ? await api.patch(`/retete/${editData.id}/`, payload)
        : await api.post('/retete/', payload)
      onSaved && onSaved(res.data); onClose()
    } catch (err) { setEroare(err.response?.data?.detail || 'Eroare la salvare.') }
    finally { setSalvand(false) }
  }

  return (
    <div className={s.overlay}>
      <div className={`${s.modal} ${s.modalLg}`}>
        <div className={s.modalHeader}>
          <span className={s.modalTitle}>{editData ? 'Editare rețetă' : 'Rețetă nouă'}</span>
          <button onClick={onClose} className={s.btnClose}>✕</button>
        </div>
        <form onSubmit={salveaza} className={s.modalBody}>
          <div className={s.grid3}>
            <div><label className={s.label}>Gratuit / Cu plată</label>
              <select value={form.gratuit} onChange={e => setForm(p => ({ ...p, gratuit: e.target.value }))} className={s.input}>
                <option value="nu">Cu plată</option><option value="da">Gratuit</option>
              </select></div>
            <div><label className={s.label}>Valabilitate (zile)</label>
              <input type="number" min="1" max="90" value={form.valabilitate_zile} onChange={e => setForm(p => ({ ...p, valabilitate_zile: e.target.value }))} className={s.input} /></div>
            <div><label className={s.label}>Nr. fișă</label>
              <input value={form.nr_fisa} onChange={e => setForm(p => ({ ...p, nr_fisa: e.target.value }))} className={s.input} placeholder="optional" /></div>
          </div>
          <ICD10Search
            label="Diagnostic (ICD-10)"
            selectate={diagSelectate}
            onAdd={d => { setDiagSelectate([d]); setForm(p => ({ ...p, diagnostic: d.denumire, cod_diagnostic: d.cod_icd10 })) }}
            onRemove={() => { setDiagSelectate([]); setForm(p => ({ ...p, diagnostic: '', cod_diagnostic: '' })) }}
          />
          <label className={s.label}>Observații</label>
          <textarea value={form.observatii} onChange={e => setForm(p => ({ ...p, observatii: e.target.value }))} className={s.textarea} style={{ height: '55px' }} />
          <div className={s.medicamenteSep}>
            <div className={s.medicamenteHeader}>
              <span className={s.medicamenteLabel}>Medicamente ({linii.length})</span>
              <button type="button" onClick={adaugaLinie} className={s.btnAdaugaMed}>+ Adaugă medicament</button>
            </div>
            {linii.map((linie, i) => (
              <div key={i} className={s.medicamentCard}>
                <div className={s.medicamentCardHeader}>
                  <span className={s.medicamentCardLabel}>Medicament {i + 1}</span>
                  {linii.length > 1 && <button type="button" onClick={() => stergeLinie(i)} className={s.btnStergeMed}>×</button>}
                </div>
                <MedicamentPicker onSelect={sel => updateLinieMulti(i, sel)} />
                <div className={s.grid21}>
                  <div><label className={s.label}>Denumire medicament *</label>
                    <input value={linie.nume_medicament} onChange={e => updateLinie(i, 'nume_medicament', e.target.value)} className={s.input} placeholder="ex: Enalapril" /></div>
                  <div><label className={s.label}>Concentrație / formă</label>
                    <input value={linie.concentratie} onChange={e => updateLinie(i, 'concentratie', e.target.value)} className={s.input} placeholder="ex: 10mg" /></div>
                </div>
                <div className={s.grid211}>
                  <div><label className={s.label}>Doză și frecvență</label>
                    <input value={linie.doza_frecventa} onChange={e => updateLinie(i, 'doza_frecventa', e.target.value)} className={s.input} placeholder="ex: 1cp/zi" /></div>
                  <div><label className={s.label}>Durată (zile)</label>
                    <input type="number" min="1" value={linie.durata_zile} onChange={e => updateLinie(i, 'durata_zile', e.target.value)} className={s.input} placeholder="30" /></div>
                  <div><label className={s.label}>Nr. unități</label>
                    <input type="number" min="1" value={linie.cantitate} onChange={e => updateLinie(i, 'cantitate', e.target.value)} className={s.input} /></div>
                </div>
                <label className={s.label}>Observații medicament</label>
                <input value={linie.observatii} onChange={e => updateLinie(i, 'observatii', e.target.value)} className={s.input} style={{ marginBottom: 0 }} placeholder="optional" />
              </div>
            ))}
          </div>
          {eroare && <div className={s.errMsg}>{eroare}</div>}
          <div className={s.formActions}>
            <button type="button" onClick={onClose} className={s.btnCancel}>Anulează</button>
            <button type="submit" disabled={salvand} className={s.btnSave}>{salvand ? 'Se salvează...' : (editData ? 'Salvează modificările' : 'Salvează rețeta')}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   ModalTrimitere
───────────────────────────────────────────── */
const SPECIALIST_CHOICES = ['cardiologie','neurologie','oftalmologie','ortopedie','dermatologie','ginecologie','urologie','gastroenterologie','endocrinologie','psihiatrie','pneumologie','reumatologie','nefrologie','hematologie','oncologie','chirurgie','ORL','stomatologie','recuperare','analize_laborator','altele']
const SPECIALIST_LABELS = { analize_laborator: 'Analize laborator' }


function ModalTrimitere({ pacientId, medicId, onClose, onSaved, editData = null }) {
  const [form, setForm] = useState(editData ? {
    specialist: editData.specialist || 'cardiologie',
    specialist_custom: editData.specialist_custom || '',
    unitate_medicala: editData.unitate_medicala || '',
    diagnostic: editData.diagnostic || '',
    cod_diagnostic: editData.cod_diagnostic || '',
    investigatii_solicitate: editData.investigatii_solicitate || '',
    prioritate: editData.prioritate || 'normal',
    valabilitate_zile: editData.valabilitate_zile || 30,
    nr_fisa: editData.nr_fisa || '',
    analize_selectate: editData.analize_selectate || [],
    observatii: editData.observatii || '',
  } : { specialist: 'cardiologie', specialist_custom: '', unitate_medicala: '', diagnostic: '', cod_diagnostic: '', investigatii_solicitate: '', prioritate: 'normal', valabilitate_zile: 30, nr_fisa: '', analize_selectate: [], observatii: '' })
  const [salvand, setSalvand] = useState(false)
  const [eroare, setEroare]   = useState('')
  const [cautare, setCautare] = useState('')
  const [diagSelectate, setDiagSelectate] = useState(() => {
    if (editData?.cod_diagnostic && editData?.diagnostic)
      return [{ id: '__init__', cod_icd10: editData.cod_diagnostic, denumire: editData.diagnostic }]
    return []
  })

  const analizeFiltered = useMemo(() => {
    if (!cautare.trim()) return null
    const q = cautare.toLowerCase()
    const results = []
    for (const { categorie, subcategorii } of ANALIZE_LABORATOR)
      for (const { analize } of subcategorii)
        for (const a of analize)
          if (a.denumire.toLowerCase().includes(q) || a.cod.toLowerCase().includes(q))
            results.push({ ...a, categorie })
    return results
  }, [cautare])

  const toggleAnaliza = (denumire, checked) => setForm(p => ({
    ...p,
    analize_selectate: checked ? [...p.analize_selectate, denumire] : p.analize_selectate.filter(x => x !== denumire)
  }))

  const salveaza = async (e) => {
    e.preventDefault(); setSalvand(true); setEroare('')
    try {
      const res = editData
        ? await api.patch(`/trimiteri/${editData.id}/`, { pacient: pacientId, medic: medicId, ...form })
        : await api.post('/trimiteri/', { pacient: pacientId, medic: medicId, ...form })
      onSaved && onSaved(res.data); onClose()
    } catch (err) { setEroare(err.response?.data?.detail || 'Eroare la salvare.') }
    finally { setSalvand(false) }
  }

  return (
    <div className={s.overlay}>
      <div className={`${s.modal} ${s.modalSm}`}>
        <div className={s.modalHeader}>
          <span className={s.modalTitle}>{editData ? 'Editare trimitere' : 'Trimitere nouă'}</span>
          <button onClick={onClose} className={s.btnClose}>✕</button>
        </div>
        <form onSubmit={salveaza} className={s.modalBody}>
          <div className={s.grid2}>
            <div><label className={s.label}>Specialist *</label>
              <select value={form.specialist} onChange={e => { setForm(p => ({ ...p, specialist: e.target.value, analize_selectate: [] })); setCautare('') }} className={s.input} required>
                {SPECIALIST_CHOICES.map(sp => <option key={sp} value={sp}>{SPECIALIST_LABELS[sp] || (sp.charAt(0).toUpperCase() + sp.slice(1))}</option>)}
              </select></div>
            <div><label className={s.label}>Prioritate</label>
              <select value={form.prioritate} onChange={e => setForm(p => ({ ...p, prioritate: e.target.value }))} className={s.input} style={{ color: form.prioritate === 'urgent' ? '#f87171' : 'var(--text-primary)' }}>
                <option value="normal">Normal</option><option value="urgent">Urgent</option>
              </select></div>
          </div>
          {form.specialist === 'altele' && (
            <div><label className={s.label}>Specificați specialitatea</label>
              <input value={form.specialist_custom} onChange={e => setForm(p => ({ ...p, specialist_custom: e.target.value }))} className={s.input} placeholder="ex: Medicina muncii" /></div>
          )}
          {form.specialist === 'analize_laborator' && (
            <div>
              <label className={s.label}>Analize solicitate {form.analize_selectate.length > 0 && <span style={{ color: 'var(--accent-light)' }}>({form.analize_selectate.length} selectate)</span>}</label>
              {form.analize_selectate.length > 0 && (
                <div className={s.analizeSelectate}>
                  {form.analize_selectate.map(a => (
                    <span key={a} className={s.analizeChip}>
                      {a}
                      <span className={s.analizeChipX} onClick={() => toggleAnaliza(a, false)}>×</span>
                    </span>
                  ))}
                </div>
              )}
              <input
                className={s.input}
                placeholder="Caută analiză după denumire sau cod..."
                value={cautare}
                onChange={e => setCautare(e.target.value)}
                style={{ marginBottom: 6 }}
              />
              <div className={s.analizeBox}>
                {analizeFiltered !== null ? (
                  analizeFiltered.length === 0
                    ? <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '8px 0' }}>Nicio analiză găsită.</div>
                    : <div className={s.analizeGrid}>
                        {analizeFiltered.map(a => (
                          <label key={a.denumire} className={s.analizeItem}>
                            <input type="checkbox" checked={form.analize_selectate.includes(a.denumire)} onChange={e => toggleAnaliza(a.denumire, e.target.checked)} />
                            <span>{a.denumire}{a.cod && <span className={s.analizeCod}> · {a.cod}</span>}</span>
                          </label>
                        ))}
                      </div>
                ) : (
                  ANALIZE_LABORATOR.map(({ categorie, subcategorii }) => (
                    <div key={categorie}>
                      <div className={s.analizeCategorie}>{categorie}</div>
                      {subcategorii.map(({ subcategorie, analize }) => (
                        <div key={subcategorie}>
                          <div className={s.analizeSubcategorie}>{subcategorie}</div>
                          <div className={s.analizeGrid}>
                            {analize.map(a => (
                              <label key={a.denumire} className={s.analizeItem}>
                                <input type="checkbox" checked={form.analize_selectate.includes(a.denumire)} onChange={e => toggleAnaliza(a.denumire, e.target.checked)} />
                                <span>{a.denumire}{a.cod && <span className={s.analizeCod}> · {a.cod}</span>}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          <label className={s.label}>Unitate medicală (optional)</label>
          <input value={form.unitate_medicala} onChange={e => setForm(p => ({ ...p, unitate_medicala: e.target.value }))} className={s.input} placeholder="ex: Spitalul Județean Cluj" />
          <ICD10Search
            label="Diagnostic prezumtiv (ICD-10)"
            selectate={diagSelectate}
            onAdd={d => { setDiagSelectate([d]); setForm(p => ({ ...p, diagnostic: d.denumire, cod_diagnostic: d.cod_icd10 })) }}
            onRemove={() => { setDiagSelectate([]); setForm(p => ({ ...p, diagnostic: '', cod_diagnostic: '' })) }}
          />
          <label className={s.label}>Investigații solicitate / Motivul trimiterii</label>
          <textarea value={form.investigatii_solicitate} onChange={e => setForm(p => ({ ...p, investigatii_solicitate: e.target.value }))} className={s.textarea} style={{ height: '80px' }} placeholder="Descrieți investigațiile sau motivul trimiterii..." />
          <div className={s.grid2}>
            <div><label className={s.label}>Valabilitate (zile)</label>
              <input type="number" min="1" max="90" value={form.valabilitate_zile} onChange={e => setForm(p => ({ ...p, valabilitate_zile: e.target.value }))} className={s.input} /></div>
            <div><label className={s.label}>Nr. fișă</label>
              <input value={form.nr_fisa} onChange={e => setForm(p => ({ ...p, nr_fisa: e.target.value }))} className={s.input} placeholder="optional" /></div>
          </div>
          <label className={s.label}>Observații</label>
          <textarea value={form.observatii} onChange={e => setForm(p => ({ ...p, observatii: e.target.value }))} className={s.textarea} style={{ height: '55px' }} />
          {eroare && <div className={s.errMsg}>{eroare}</div>}
          <div className={s.formActions}>
            <button type="button" onClick={onClose} className={s.btnCancel}>Anulează</button>
            <button type="submit" disabled={salvand} className={s.btnSave}>{salvand ? 'Se salvează...' : (editData ? 'Salvează modificările' : 'Salvează trimiterea')}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   ModalConcediu
───────────────────────────────────────────── */
const COD_INDEMNIZATIE_CHOICES = [['01','01 - Boală obișnuită'],['02','02 - Accident de muncă'],['03','03 - Accident în afara muncii'],['04','04 - Boală infectocontagioasă A'],['05','05 - Urgență medico-chirurgicală'],['06','06 - Maternitate'],['07','07 - Îngrijire copil bolnav'],['08','08 - Carantină'],['09','09 - Reducerea timpului de muncă'],['10','10 - Trecere temporară alt loc de muncă'],['11','11 - Boală infectocontagioasă B'],['12','12 - Tuberculoză'],['13','13 - SIDA'],['14','14 - Cancer'],['15','15 - Risc maternal']]
const aziStr = new Date().toISOString().slice(0, 10)
const lunaC  = new Date().getMonth() + 1
const anC    = new Date().getFullYear()

function ModalConcediu({ pacientId, medicId, onClose, onSaved, editData = null }) {
  const [form, setForm] = useState(editData ? {
    serie_numar: editData.serie_numar || '', tip: editData.tip || 'initial',
    serie_initial: editData.serie_initial || '', luna: editData.luna || lunaC, an: editData.an || anC,
    cod_indemnizatie: editData.cod_indemnizatie || '01', data_acordarii: editData.data_acordarii || aziStr,
    nr_zile: editData.nr_zile || 3, de_la: editData.de_la || aziStr, pana_la: editData.pana_la || aziStr,
    cod_diagnostic: editData.cod_diagnostic || '', acut_subacut_cronic: editData.acut_subacut_cronic || 'acut',
    nr_inreg: editData.nr_inreg || '', ambulator_internat: editData.ambulator_internat || 'ambulator',
    nr_conventie: editData.nr_conventie || '', cas: editData.cas || '', observatii: editData.observatii || '',
  } : { serie_numar: '', tip: 'initial', serie_initial: '', luna: lunaC, an: anC, cod_indemnizatie: '01', data_acordarii: aziStr, nr_zile: 3, de_la: aziStr, pana_la: aziStr, cod_diagnostic: '', acut_subacut_cronic: 'acut', nr_inreg: '', ambulator_internat: 'ambulator', nr_conventie: '', cas: '', observatii: '' })
  const [salvand, setSalvand] = useState(false)
  const [eroare, setEroare]   = useState('')

  const salveaza = async (e) => {
    e.preventDefault()
    if (!form.serie_numar.trim()) { setEroare('Seria și numărul sunt obligatorii.'); return }
    setSalvand(true); setEroare('')
    try {
      const res = editData
        ? await api.patch(`/concedii/${editData.id}/`, { pacient: pacientId, medic: medicId, ...form })
        : await api.post('/concedii/', { pacient: pacientId, medic: medicId, ...form })
      onSaved && onSaved(res.data); onClose()
    } catch (err) { setEroare(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Eroare la salvare.') }
    finally { setSalvand(false) }
  }

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className={s.overlay}>
      <div className={`${s.modal} ${s.modalMd}`}>
        <div className={s.modalHeader}>
          <span className={s.modalTitle}>{editData ? 'Editare concediu medical' : 'Concediu medical nou'}</span>
          <button onClick={onClose} className={s.btnClose}>✕</button>
        </div>
        <form onSubmit={salveaza} className={s.modalBody}>
          <div className={s.sectLabel}>Certificat</div>
          <div className={s.grid2}>
            <div><label className={s.label}>Seria și numărul *</label>
              <input value={form.serie_numar} onChange={f('serie_numar')} className={s.input} placeholder="ex: ABCD123456" required /></div>
            <div><label className={s.label}>Tip</label>
              <select value={form.tip} onChange={f('tip')} className={s.input}>
                <option value="initial">Inițial</option><option value="continuare">În continuare</option>
              </select></div>
          </div>
          {form.tip === 'continuare' && (
            <div><label className={s.label}>Seria certificatului inițial</label>
              <input value={form.serie_initial} onChange={f('serie_initial')} className={s.input} /></div>
          )}
          <div className={s.grid12}>
            <div className={s.grid2}>
              <div><label className={s.label}>Luna</label><input type="number" min="1" max="12" value={form.luna} onChange={f('luna')} className={s.input} /></div>
              <div><label className={s.label}>Anul</label><input type="number" min="2020" max="2099" value={form.an} onChange={f('an')} className={s.input} /></div>
            </div>
            <div><label className={s.label}>Cod indemnizație</label>
              <select value={form.cod_indemnizatie} onChange={f('cod_indemnizatie')} className={s.input}>
                {COD_INDEMNIZATIE_CHOICES.map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
              </select></div>
          </div>
          <div className={s.sectLabel}>Perioadă</div>
          <div className={s.grid4}>
            <div><label className={s.label}>Data acordării</label><input type="date" value={form.data_acordarii} onChange={f('data_acordarii')} className={s.input} /></div>
            <div><label className={s.label}>Nr. zile</label><input type="number" min="1" value={form.nr_zile} onChange={f('nr_zile')} className={s.input} /></div>
            <div><label className={s.label}>De la</label><input type="date" value={form.de_la} onChange={f('de_la')} className={s.input} /></div>
            <div><label className={s.label}>Până la</label><input type="date" value={form.pana_la} onChange={f('pana_la')} className={s.input} /></div>
          </div>
          <div className={s.sectLabel}>Diagnostic</div>
          <div className={s.grid2}>
            <div><label className={s.label}>Cod diagnostic</label><input value={form.cod_diagnostic} onChange={f('cod_diagnostic')} className={s.input} placeholder="ex: J06" /></div>
            <div><label className={s.label}>Acut / Subacut / Cronic</label>
              <select value={form.acut_subacut_cronic} onChange={f('acut_subacut_cronic')} className={s.input}>
                <option value="acut">Acut</option><option value="subacut">Subacut</option><option value="cronic">Cronic</option>
              </select></div>
          </div>
          <div className={s.grid2}>
            <div><label className={s.label}>Ambulator / Internat</label>
              <select value={form.ambulator_internat} onChange={f('ambulator_internat')} className={s.input}>
                <option value="ambulator">Ambulator</option><option value="internat">Internat în spital</option>
              </select></div>
            <div><label className={s.label}>Nr. înregistrare (RC/FO)</label><input value={form.nr_inreg} onChange={f('nr_inreg')} className={s.input} placeholder="optional" /></div>
          </div>
          <div className={s.sectLabel}>Unitate</div>
          <div className={s.grid2}>
            <div><label className={s.label}>Nr. convenție CAS</label><input value={form.nr_conventie} onChange={f('nr_conventie')} className={s.input} placeholder="optional" /></div>
            <div><label className={s.label}>CAS</label><input value={form.cas} onChange={f('cas')} className={s.input} placeholder="ex: CAS Cluj" /></div>
          </div>
          <label className={s.label}>Observații</label>
          <textarea value={form.observatii} onChange={f('observatii')} className={s.textarea} style={{ height: '55px' }} />
          {eroare && <div className={s.errMsg}>{eroare}</div>}
          <div className={s.formActions}>
            <button type="button" onClick={onClose} className={s.btnCancel}>Anulează</button>
            <button type="submit" disabled={salvand} className={s.btnSave}>{salvand ? 'Se salvează...' : (editData ? 'Salvează modificările' : 'Salvează concediul')}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
const AVATAR_COLORS = ['#3a7bd5','#e05c7a','#f5a623','#50c878','#9b59b6','#1abc9c','#e67e22']
function getInitials(name) { if (!name) return '?'; return name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0,2).toUpperCase() }
function getAvatarColor(name) { if (!name) return AVATAR_COLORS[0]; let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h); return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length] }

function dataNastereDinCNP(cnp) {
  try {
    if (!cnp || cnp.length !== 13) return '—'
    const c = parseInt(cnp[0]), an2 = parseInt(cnp.slice(1,3)), luna = parseInt(cnp.slice(3,5)), zi = parseInt(cnp.slice(5,7))
    let an
    if (c === 1 || c === 2) an = 1900 + an2
    else if (c === 3 || c === 4) an = 1800 + an2
    else if (c === 5 || c === 6) an = 2000 + an2
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

/* ─────────────────────────────────────────────
   Sectiuni config (SVG icons + accent colors)
───────────────────────────────────────────── */
const SECTIUNI_CFG = {
  consultatii: {
    label: 'Consultații', color: '#3a7bd5',
    ico: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 2v7a3 3 0 006 0V2"/><circle cx="18" cy="17" r="2.5"/><path d="M15.5 17H12a4 4 0 01-4-4V8"/>
    </svg>,
  },
  diagnostice: {
    label: 'Diagnostice', color: '#8b5cf6',
    ico: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2"/><path d="M9 7h6M9 12h6M9 17h4"/>
      <path d="M9 2a2 2 0 004 0"/>
    </svg>,
  },
  retete: {
    label: 'Rețete', color: '#10b981',
    ico: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 5h5.5a3.5 3.5 0 010 7H7V5z"/><path d="M7 12l7 7"/><path d="M14 12l-4 5"/>
    </svg>,
  },
  trimiteri: {
    label: 'Trimiteri', color: '#f59e0b',
    ico: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/>
    </svg>,
  },
  concedii: {
    label: 'Concedii', color: '#ef4444',
    ico: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 9h18M8 2v4M16 2v4M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
    </svg>,
  },
  documente: {
    label: 'Dosar scanat', color: '#14b8a6',
    ico: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7a2 2 0 012-2h4.586a1 1 0 01.707.293L12 7h7a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>
    </svg>,
  },
  alteFisiere: {
    label: 'Alte fișiere', color: '#6b7280',
    ico: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
      <line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/>
    </svg>,
  },
}

function hexToRgba(hex, a) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${a})`
}

/* ─────────────────────────────────────────────
   PacientDetalii
───────────────────────────────────────────── */
export default function PacientDetalii({ pacient, onBack, moduleActive = [] }) {
  const { sectiune } = useParams()
  const navigate     = useNavigate()
  const sectiuneActiva = sectiune || null
  const [consultatii, setConsultatii] = useState([])
  const [retete, setRetete]           = useState([])
  const [trimiteri, setTrimiteri]     = useState([])
  const [concedii, setConcedii]       = useState([])
  const [loadingC, setLoadingC]       = useState(true)
  const [loadingR, setLoadingR]       = useState(true)
  const [loadingT, setLoadingT]       = useState(true)
  const [loadingCo, setLoadingCo]     = useState(true)
  const [status, setStatus]           = useState(pacient.status)
  const [salvandStatus, setSalvandStatus] = useState(false)
  const [editMode, setEditMode]       = useState(false)
  const [formEdit, setFormEdit]       = useState({ ...pacient })
  const [errorsEdit, setErrorsEdit]   = useState({})
  const [salvandEdit, setSalvandEdit] = useState(false)
  const [showConsultatie, setShowConsultatie] = useState(false)
  const [showReteta, setShowReteta]   = useState(false)
  const [showTrimitere, setShowTrimitere] = useState(false)
  const [showConcediu, setShowConcediu]   = useState(false)
  const [editReteta, setEditReteta]       = useState(null)
  const [editTrimitere, setEditTrimitere] = useState(null)
  const [editConcediu, setEditConcediu]   = useState(null)
  const [editConsultatie, setEditConsultatie] = useState(null)
  const [formC, setFormC] = useState({ data_ora: new Date().toISOString().slice(0,16), simptome: '', examen_clinic: '', tratament: '', observatii: '', diagnostice: [] })
  const [diagnosticePacient, setDiagnosticePacient] = useState([])
  const [loadingDP, setLoadingDP] = useState(true)
  const [showDiagForm, setShowDiagForm] = useState(false)
  const [formDiag, setFormDiag] = useState({ tip: 'activ', sursa: 'scrisoare', observatii: '' })
  const [diagPacSelectat, setDiagPacSelectat] = useState([])
  const [salvandDP, setSalvandDP] = useState(false)
  const [salvandC, setSalvandC] = useState(false)
  const [documente, setDocumente] = useState([])
  const [incarcand, setIncarcand] = useState(false)
  const [alteFisiere, setAlteFisiere] = useState([])
  const [incarcandAlt, setIncarcandAlt] = useState(false)

  useEffect(() => { api.get(`/pacienti/${pacient.id}/consultatii/`).then(res => setConsultatii(res.data)).catch(console.error).finally(() => setLoadingC(false)) }, [pacient.id])
  useEffect(() => { api.get('/retete/', { params: { pacient: pacient.id } }).then(res => setRetete(Array.isArray(res.data) ? res.data : (res.data.results || []))).catch(console.error).finally(() => setLoadingR(false)) }, [pacient.id])
  useEffect(() => { api.get('/trimiteri/', { params: { pacient: pacient.id } }).then(res => setTrimiteri(Array.isArray(res.data) ? res.data : (res.data.results || []))).catch(console.error).finally(() => setLoadingT(false)) }, [pacient.id])
  useEffect(() => { api.get('/concedii/', { params: { pacient: pacient.id } }).then(res => setConcedii(Array.isArray(res.data) ? res.data : (res.data.results || []))).catch(console.error).finally(() => setLoadingCo(false)) }, [pacient.id])
  useEffect(() => { api.get('/diagnostice-pacient/', { params: { pacient: pacient.id } }).then(res => setDiagnosticePacient(Array.isArray(res.data) ? res.data : (res.data.results || []))).catch(console.error).finally(() => setLoadingDP(false)) }, [pacient.id])
  useEffect(() => { api.get(`/pacienti/${pacient.id}/documente/`).then(res => {
    const toate = Array.isArray(res.data) ? res.data : []
    setDocumente(toate.filter(d => d.categorie === 'document' || !d.categorie))
    setAlteFisiere(toate.filter(d => d.categorie === 'alt_fisier'))
  }).catch(console.error) }, [pacient.id])

  const incarcaDocument = async (e) => {
    const fisier = e.target.files[0]; if (!fisier) return
    setIncarcand(true)
    try {
      const formData = new FormData()
      formData.append('fisier', fisier); formData.append('nume', fisier.name)
      const res = await api.post(`/pacienti/${pacient.id}/documente/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      setDocumente(prev => [res.data, ...prev])
    } catch { alert('Eroare la încărcarea documentului.') }
    finally { setIncarcand(false); e.target.value = '' }
  }

  const incarcaAltFisier = async (e) => {
    const fisier = e.target.files[0]; if (!fisier) return
    setIncarcandAlt(true)
    try {
      const formData = new FormData()
      formData.append('fisier', fisier)
      formData.append('nume', fisier.name)
      formData.append('categorie', 'alt_fisier')
      const res = await api.post(`/pacienti/${pacient.id}/documente/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      setAlteFisiere(prev => [res.data, ...prev])
    } catch { alert('Eroare la încărcarea fișierului.') }
    finally { setIncarcandAlt(false); e.target.value = '' }
  }

  const stergeAltFisier = async (id) => {
    if (!window.confirm('Ștergi acest fișier?')) return
    try { await api.delete(`/documente/${id}/`); setAlteFisiere(prev => prev.filter(d => d.id !== id)) }
    catch { alert('Eroare la ștergerea fișierului.') }
  }

  const stergeDocument = async (id) => {
    if (!window.confirm('Ștergi acest document?')) return
    try { await api.delete(`/documente/${id}/`); setDocumente(prev => prev.filter(d => d.id !== id)) }
    catch { alert('Eroare la ștergerea documentului.') }
  }

  const schimbaStatus = async (val) => {
    setSalvandStatus(true)
    try { await api.patch(`/pacienti/${pacient.id}/`, { status: val }); setStatus(val); pacient.status = val }
    catch { alert('Eroare la salvarea statusului.') }
    finally { setSalvandStatus(false) }
  }

  const salveazaEdit = async (e) => {
    e.preventDefault()
    if (!validareCNP(formEdit.cnp)) { setErrorsEdit({ cnp: 'CNP invalid.' }); return }
    if (formEdit.cnp !== pacient.cnp && !window.confirm(`Modifici CNP-ul?\nVechi: ${pacient.cnp}\nNou: ${formEdit.cnp}`)) return
    setSalvandEdit(true); setErrorsEdit({})
    try { await api.put(`/pacienti/${pacient.id}/`, { ...formEdit, medic: pacient.medic }); Object.assign(pacient, formEdit); setEditMode(false) }
    catch (err) { setErrorsEdit(err.response?.data || { general: 'Eroare la salvare.' }) }
    finally { setSalvandEdit(false) }
  }

  const salveazaConsultatie = async (e) => {
    e.preventDefault(); setSalvandC(true)
    const emptyFormC = { data_ora: new Date().toISOString().slice(0,16), simptome: '', examen_clinic: '', tratament: '', observatii: '', diagnostice: [] }
    try {
      if (editConsultatie) {
        await api.patch(`/consultatii/${editConsultatie.id}/`, { ...formC, pacient: pacient.id, medic: pacient.medic, diagnostice_ids: formC.diagnostice.map(d => d.id) })
        const res = await api.get(`/pacienti/${pacient.id}/consultatii/`)
        setConsultatii(res.data); setEditConsultatie(null)
      } else {
        await api.post('/consultatii/', { ...formC, pacient: pacient.id, medic: pacient.medic, diagnostice_ids: formC.diagnostice.map(d => d.id) })
        const res = await api.get(`/pacienti/${pacient.id}/consultatii/`)
        setConsultatii(res.data); setShowConsultatie(false)
      }
      setFormC(emptyFormC)
      api.get('/diagnostice-pacient/', { params: { pacient: pacient.id } })
        .then(r => setDiagnosticePacient(Array.isArray(r.data) ? r.data : (r.data.results || [])))
    } catch { alert('Eroare la salvarea consultatiei.') }
    finally { setSalvandC(false) }
  }

  const stergeDiagnosticPacient = async (id) => {
    if (!window.confirm('Ștergi acest diagnostic din dosar?')) return
    try { await api.delete(`/diagnostice-pacient/${id}/`); setDiagnosticePacient(prev => prev.filter(d => d.id !== id)) }
    catch { alert('Eroare la ștergere.') }
  }

  const adaugaDiagnostic = async (e) => {
    e.preventDefault()
    if (!diagPacSelectat.length) { alert('Selectați un diagnostic ICD-10.'); return }
    setSalvandDP(true)
    try {
      const res = await api.post('/diagnostice-pacient/', {
        pacient: pacient.id, medic: pacient.medic,
        diagnostic_id: diagPacSelectat[0].id,
        ...formDiag,
      })
      setDiagnosticePacient(prev => [res.data, ...prev])
      setShowDiagForm(false); setDiagPacSelectat([]); setFormDiag({ tip: 'activ', sursa: 'scrisoare', observatii: '' })
    } catch (err) { alert(err.response?.data?.detail || 'Eroare la adăugare.') }
    finally { setSalvandDP(false) }
  }

  const stergeReteta = async (id) => {
    if (!window.confirm('Ștergi această rețetă? Acțiunea nu poate fi anulată.')) return
    try { await api.delete(`/retete/${id}/`); setRetete(prev => prev.filter(r => r.id !== id)) }
    catch { alert('Eroare la ștergere.') }
  }
  const stergeTrimitere = async (id) => {
    if (!window.confirm('Ștergi această trimitere?')) return
    try { await api.delete(`/trimiteri/${id}/`); setTrimiteri(prev => prev.filter(t => t.id !== id)) }
    catch { alert('Eroare la ștergere.') }
  }
  const stergeConcediu = async (id) => {
    if (!window.confirm('Ștergi acest concediu medical?')) return
    try { await api.delete(`/concedii/${id}/`); setConcedii(prev => prev.filter(c => c.id !== id)) }
    catch { alert('Eroare la ștergere.') }
  }
  const stergeConsultatie = async (id) => {
    if (!window.confirm('Ștergi această consultație? Acțiunea nu poate fi anulată.')) return
    try { await api.delete(`/consultatii/${id}/`); setConsultatii(prev => prev.filter(c => c.id !== id)) }
    catch { alert('Eroare la ștergere.') }
  }
  const deschideEditConsultatie = (c) => {
    setEditConsultatie(c)
    setFormC({ data_ora: c.data_ora?.slice(0,16) || '', simptome: c.simptome || '', examen_clinic: c.examen_clinic || '', tratament: c.tratament || '', observatii: c.observatii || '', diagnostice: c.diagnostice || [] })
    setShowConsultatie(false)
  }

  const adresaDisplay = [pacient.strada, pacient.numar_strada, pacient.localitate, pacient.judet].filter(Boolean).join(', ') || '—'
  const nume = `${pacient.nume} ${pacient.prenume}`
  const statusObj = STATUS_OPTS.find(o => o.value === status) || STATUS_OPTS[0]

  return (
    <div>
      {/* Header */}
      <div className={s.header}>
        <button onClick={sectiuneActiva ? () => navigate(`/app/pacienti/${pacient.id}`) : onBack} className={s.btnBack}>←</button>
        <span className={s.headerNume}>{nume}</span>
        {sectiuneActiva && (
          <>
            <span className={s.headerSep}>/</span>
            <span className={s.headerSectiune} style={{ color: SECTIUNI_CFG[sectiuneActiva].color }}>
              {SECTIUNI_CFG[sectiuneActiva].label}
            </span>
          </>
        )}
        <div className={s.headerSpacer} />
        {!sectiuneActiva && (
          <button onClick={() => setEditMode(!editMode)} className={`${s.btnEdit} ${editMode ? s.btnEditActive : ''}`}>
            {editMode ? 'Anulează' : 'Editează'}
          </button>
        )}
      </div>

      {!sectiuneActiva && (<>

      {/* Edit form */}
      {editMode && (
        <div className={s.editCard}>
          <div className={s.editTitle}>Editare date pacient</div>
          {errorsEdit.general && <div className={s.errMsg}>{errorsEdit.general}</div>}
          <form onSubmit={salveazaEdit}>
            <div className={s.grid2}>
              <div><label className={s.label}>Nume *</label><input value={formEdit.nume} onChange={e => setFormEdit(p => ({ ...p, nume: e.target.value }))} required className={s.input} /></div>
              <div><label className={s.label}>Prenume *</label><input value={formEdit.prenume} onChange={e => setFormEdit(p => ({ ...p, prenume: e.target.value }))} required className={s.input} /></div>
            </div>
            <label className={s.label}>Nume anterior (după schimbare de nume)</label>
            <input value={formEdit.nume_anterior || ''} onChange={e => setFormEdit(p => ({ ...p, nume_anterior: e.target.value }))} placeholder="Lasă gol dacă nu e cazul" className={s.input} />
            <label className={s.label}>CNP *</label>
            <input value={formEdit.cnp} maxLength={13} onChange={e => setFormEdit(p => ({ ...p, cnp: e.target.value }))} required className={s.input} />
            {errorsEdit.cnp && <p className={s.errMsgSmall}>{errorsEdit.cnp}</p>}
            <div className={s.grid2}>
              <div><label className={s.label}>Telefon</label><input value={formEdit.telefon} onChange={e => setFormEdit(p => ({ ...p, telefon: e.target.value }))} className={s.input} /></div>
              <div><label className={s.label}>Email</label><input type="email" value={formEdit.email} onChange={e => setFormEdit(p => ({ ...p, email: e.target.value }))} className={s.input} /></div>
            </div>
            <div className={s.grid2}>
              <div><label className={s.label}>Grup sangvin</label>
                <select value={formEdit.grup_sangvin} onChange={e => setFormEdit(p => ({ ...p, grup_sangvin: e.target.value }))} className={s.input}>
                  <option value="">---</option>
                  {['A+','A-','B+','B-','AB+','AB-','0+','0-'].map(g => <option key={g} value={g}>{g}</option>)}
                </select></div>
              <div><label className={s.label}>Sex</label>
                <select value={formEdit.sex} onChange={e => setFormEdit(p => ({ ...p, sex: e.target.value }))} className={s.input}>
                  <option value="M">Masculin</option><option value="F">Feminin</option>
                </select></div>
            </div>
            <div className={s.editAddressSection}>
              <div className={s.editAddressLabel}>Adresă</div>
              <AdresaFields values={{ judet: formEdit.judet || '', localitate: formEdit.localitate || '', strada: formEdit.strada || '', numar_strada: formEdit.numar_strada || '' }} onChange={(field, value) => setFormEdit(p => ({ ...p, [field]: value }))} />
            </div>
            <label className={s.label}>Alergii</label>
            <textarea value={formEdit.alergii} onChange={e => setFormEdit(p => ({ ...p, alergii: e.target.value }))} className={s.textarea} style={{ height: '60px' }} />
            <div className={s.formActions}>
              <button type="button" onClick={() => setEditMode(false)} className={s.btnCancel}>Anulează</button>
              <button type="submit" disabled={salvandEdit} className={s.btnSave}>{salvandEdit ? 'Se salvează...' : 'Salvează'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Date personale */}
      <div className={s.cardGrid}>
        <div className={s.card}>
          <div className={s.profileTop}>
            <div className={s.avatar} style={{ background: getAvatarColor(nume) }}>{getInitials(nume)}</div>
            <div>
              <div className={s.profileNume}>{nume}</div>
              <div className={s.profileId}>ID: {pacient.id}</div>
            </div>
          </div>
          <p className={s.fieldLabel}>CNP</p><p className={s.fieldValue}>{pacient.cnp}</p>
          {pacient.nume_anterior && (<><p className={s.fieldLabel}>Nume anterior</p><p className={s.fieldValue}>{pacient.nume_anterior}</p></>)}
          <p className={s.fieldLabel}>Data nașterii</p><p className={s.fieldValue}>{dataNastereDinCNP(pacient.cnp)}</p>
          <p className={s.fieldLabel}>Sex</p><p className={s.fieldValue}>{pacient.sex === 'M' ? 'Masculin' : 'Feminin'}</p>
          <p className={s.fieldLabel}>Grup sangvin</p><p className={s.fieldValue}>{pacient.grup_sangvin || '—'}</p>
          <p className={s.fieldLabel}>Status</p>
          <div className={s.statusRow}>
            <select value={status} onChange={e => schimbaStatus(e.target.value)} disabled={salvandStatus}
              className={s.statusSelect} style={{ color: statusObj.color }}>
              {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {salvandStatus && <span className={s.statusSaving}>Se salvează...</span>}
          </div>
        </div>
        <div className={s.card}>
          <div className={s.contactTitle}>Contact</div>
          <p className={s.fieldLabel}>Telefon</p><p className={s.fieldValue}>{pacient.telefon || '—'}</p>
          <p className={s.fieldLabel}>Email</p><p className={s.fieldValue}>{pacient.email || '—'}</p>
          <p className={s.fieldLabel}>Adresă</p><p className={s.fieldValue}>{adresaDisplay}</p>
          <p className={s.fieldLabel}>Alergii</p>
          <p className={pacient.alergii ? s.fieldValueWarning : s.fieldValueDim}>{pacient.alergii || 'Nicio alergie cunoscută'}</p>
        </div>
      </div>

      {/* Grid carduri sectiuni */}
      <div className={s.sectiuniGrid}>
        {[
          { key: 'consultatii', count: consultatii.length,       loading: loadingC  },
          { key: 'diagnostice', count: diagnosticePacient.length, loading: loadingDP },
          ...(moduleActive.includes('retete')    ? [{ key: 'retete',    count: retete.length,    loading: loadingR  }] : []),
          ...(moduleActive.includes('trimiteri') ? [{ key: 'trimiteri', count: trimiteri.length, loading: loadingT  }] : []),
          ...(moduleActive.includes('concedii')  ? [{ key: 'concedii',  count: concedii.length,  loading: loadingCo }] : []),
          { key: 'documente',   count: documente.length,          loading: false     },
          { key: 'alteFisiere', count: alteFisiere.length,        loading: false     },
        ].map(({ key, count, loading }) => {
          const cfg    = SECTIUNI_CFG[key]
          const activ  = sectiuneActiva === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => navigate(sectiuneActiva === key ? `/app/pacienti/${pacient.id}` : `/app/pacienti/${pacient.id}/${key}`)}
              className={`${s.sectiuneCard} ${activ ? s.sectiuneCardActiv : ''}`}
              style={{ '--card-color': cfg.color, background: activ ? hexToRgba(cfg.color, 0.07) : undefined }}
            >
              <div
                className={s.sectiuneIcoWrap}
                style={{ background: hexToRgba(cfg.color, 0.14), color: cfg.color }}
              >
                {cfg.ico}
              </div>
              <div className={s.sectiuneBottom}>
                <span className={s.sectiuneCount}>{loading ? '–' : count}</span>
                <span className={s.sectiuneLabel}>{cfg.label}</span>
              </div>
            </button>
          )
        })}
      </div>

      </>)} {/* end !sectiuneActiva */}

      {/* Sectiune activa */}
      {sectiuneActiva && (<>

      {/* Consultații */}
      {sectiuneActiva === 'consultatii' && (
      <div className={s.section}>
        <div className={s.sectionHeader}>
          <span className={s.sectionTitle}>Istoric consultații ({consultatii.length})</span>
          <button onClick={() => { setShowConsultatie(!showConsultatie); setEditConsultatie(null); setFormC({ data_ora: new Date().toISOString().slice(0,16), simptome: '', examen_clinic: '', tratament: '', observatii: '', diagnostice: [] }) }} className={showConsultatie ? s.btnNouToggle : s.btnNou}>
            {showConsultatie ? 'Anulează' : '+ Consultație nouă'}
          </button>
        </div>
        {(showConsultatie || editConsultatie) && (
          <form onSubmit={salveazaConsultatie} className={s.consultatieForm}>
            {editConsultatie && <div style={{ fontSize: 12, color: 'var(--accent-light)', marginBottom: 10 }}>Editezi consultația din {new Date(editConsultatie.data_ora).toLocaleDateString('ro-RO')}</div>}
            <div className={s.grid2}>
              <div><label className={s.label}>Data și ora *</label>
                <input type="datetime-local" value={formC.data_ora} onChange={e => setFormC(p => ({ ...p, data_ora: e.target.value }))} required className={s.input} /></div>
            </div>
            <label className={s.label}>Simptome</label>
            <textarea value={formC.simptome} onChange={e => setFormC(p => ({ ...p, simptome: e.target.value }))} className={s.textarea} style={{ height: '70px' }} placeholder="Descrie simptomele..." />
            <label className={s.label}>Examen clinic</label>
            <textarea value={formC.examen_clinic} onChange={e => setFormC(p => ({ ...p, examen_clinic: e.target.value }))} className={s.textarea} style={{ height: '70px' }} placeholder="Rezultatele examenului..." />
            <label className={s.label}>Tratament</label>
            <textarea value={formC.tratament} onChange={e => setFormC(p => ({ ...p, tratament: e.target.value }))} className={s.textarea} style={{ height: '70px' }} placeholder="Medicație, doze, durată..." />
            <label className={s.label}>Observații</label>
            <textarea value={formC.observatii} onChange={e => setFormC(p => ({ ...p, observatii: e.target.value }))} className={s.textarea} style={{ height: '60px' }} />
            <ICD10Search
              selectate={formC.diagnostice}
              onAdd={d => setFormC(p => ({ ...p, diagnostice: [...p.diagnostice, d] }))}
              onRemove={id => setFormC(p => ({ ...p, diagnostice: p.diagnostice.filter(d => d.id !== id) }))}
            />
            <div className={s.formActions}>
              <button type="button" onClick={() => { setShowConsultatie(false); setEditConsultatie(null) }} className={s.btnCancel}>Anulează</button>
              <button type="submit" disabled={salvandC} className={s.btnSave}>{salvandC ? 'Se salvează...' : (editConsultatie ? 'Salvează modificările' : 'Salvează consultația')}</button>
            </div>
          </form>
        )}
        {loadingC && <p className={s.loadingText}>Se încarcă...</p>}
        {!loadingC && consultatii.length === 0 && <p className={s.emptyText}>Nicio consultație înregistrată.</p>}
        {!loadingC && consultatii.map(c => (
          <div key={c.id} className={s.consultatieRow}>
            <div className={s.consultatieRowHeader}>
              <span className={s.consultatieData}>
                {new Date(c.data_ora).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <div className={s.consultatieRight}>
                <span className={s.consultatieMedic}>Dr. {c.medic_nume || '—'}</span>
                <div className={s.consultatieBtns}>
                  {moduleActive.includes('retete')    && <button onClick={() => setShowReteta(true)}    className={s.btnReteta}>+ Rețetă</button>}
                  {moduleActive.includes('trimiteri') && <button onClick={() => setShowTrimitere(true)} className={s.btnTrimitere}>+ Trimitere</button>}
                  {moduleActive.includes('concedii')  && <button onClick={() => setShowConcediu(true)}  className={s.btnConcediu}>+ Concediu</button>}
                  <button onClick={() => deschideEditConsultatie(c)} className={s.btnEdit}>Editează</button>
                  <button onClick={() => stergeConsultatie(c.id)} className={s.btnDelete}>Șterge</button>
                </div>
              </div>
            </div>
            {c.simptome  && <p className={s.consultatieLine}><span className={s.consultatieDimLabel}>Simptome: </span>{c.simptome}</p>}
            {c.tratament && <p className={s.consultatieLine}><span className={s.consultatieDimLabel}>Tratament: </span>{c.tratament}</p>}
          </div>
        ))}
      </div>
      )}

      {/* Diagnostice pacient */}
      {sectiuneActiva === 'diagnostice' && (
      <div className={s.section}>
        <div className={s.sectionHeader}>
          <span className={s.sectionTitle}>Diagnostice ({diagnosticePacient.length})</span>
          <button onClick={() => { setShowDiagForm(!showDiagForm); setDiagPacSelectat([]) }} className={showDiagForm ? s.btnNouToggle : s.btnNou}>
            {showDiagForm ? 'Anulează' : '+ Adaugă diagnostic'}
          </button>
        </div>
        {showDiagForm && (
          <form onSubmit={adaugaDiagnostic} className={s.consultatieForm}>
            <ICD10Search
              label="Diagnostic ICD-10 *"
              selectate={diagPacSelectat}
              onAdd={d => setDiagPacSelectat([d])}
              onRemove={() => setDiagPacSelectat([])}
            />
            <div className={s.grid2}>
              <div><label className={s.label}>Tip</label>
                <select value={formDiag.tip} onChange={e => setFormDiag(p => ({ ...p, tip: e.target.value }))} className={s.input}>
                  <option value="activ">Activ</option>
                  <option value="cronic">Cronic</option>
                  <option value="antecedent">Antecedent</option>
                  <option value="rezolvat">Rezolvat</option>
                </select></div>
              <div><label className={s.label}>Sursa</label>
                <select value={formDiag.sursa} onChange={e => setFormDiag(p => ({ ...p, sursa: e.target.value }))} className={s.input}>
                  <option value="consultatie">Consultație</option>
                  <option value="scrisoare">Scrisoare medicală</option>
                  <option value="extern">Document extern</option>
                  <option value="altele">Altele</option>
                </select></div>
            </div>
            <label className={s.label}>Observații</label>
            <textarea value={formDiag.observatii} onChange={e => setFormDiag(p => ({ ...p, observatii: e.target.value }))} className={s.textarea} style={{ height: '50px' }} />
            <div className={s.formActions}>
              <button type="button" onClick={() => { setShowDiagForm(false); setDiagPacSelectat([]) }} className={s.btnCancel}>Anulează</button>
              <button type="submit" disabled={salvandDP} className={s.btnSave}>{salvandDP ? 'Se salvează...' : 'Adaugă diagnostic'}</button>
            </div>
          </form>
        )}
        {loadingDP && <p className={s.loadingText}>Se încarcă...</p>}
        {!loadingDP && diagnosticePacient.length === 0 && <p className={s.emptyText}>Niciun diagnostic înregistrat.</p>}
        {!loadingDP && diagnosticePacient.map(d => (
          <div key={d.id} className={s.listRow}>
            <div>
              <span className={s.listRowNume}>{d.diagnostic_cod}</span>
              <span className={s.listRowDiag}> — {d.diagnostic_denumire}</span>
              {d.tip === 'activ'      && <span className={s.badgeDiagActiv}>Activ</span>}
              {d.tip === 'cronic'     && <span className={s.badgeDiagCronic}>Cronic</span>}
              {d.tip === 'antecedent' && <span className={s.badgeDiagAntecedent}>Antecedent</span>}
              {d.tip === 'rezolvat'   && <span className={s.badgeDiagRezolvat}>Rezolvat</span>}
              <span className={s.diagSursa}>· {{ consultatie: 'consultație', scrisoare: 'scrisoare medicală', extern: 'document extern', altele: 'altele' }[d.sursa] || d.sursa}</span>
              <span className={s.listRowDate}> · {d.data_adaugarii}</span>
            </div>
            <div className={s.rowActions}>
              <button onClick={() => stergeDiagnosticPacient(d.id)} className={s.btnDelete}>Șterge</button>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Rețete */}
      {sectiuneActiva === 'retete' && (
      <div className={s.section}>
        <div className={s.sectionHeader}>
          <span className={s.sectionTitle}>Rețete ({retete.length})</span>
          {moduleActive.includes('retete') && <button onClick={() => setShowReteta(true)} className={s.btnNou}>+ Rețetă nouă</button>}
        </div>
        {loadingR && <p className={s.loadingText}>Se încarcă...</p>}
        {!loadingR && retete.length === 0 && <p className={s.emptyText}>Nicio rețetă înregistrată.</p>}
        {!loadingR && retete.map(r => (
          <div key={r.id} className={s.listRow}>
            <div>
              <span className={s.listRowNume}>{r.numar_reteta}</span>
              <span className={s.listRowDate}>{r.data_emiterii}</span>
              {r.diagnostic && <span className={s.listRowDiag}>— {r.diagnostic}</span>}
              <span className={r.gratuit === 'da' ? s.badgeGratuit : s.badgePlata}>{r.gratuit === 'da' ? 'Gratuit' : 'Cu plată'}</span>
            </div>
            <div className={s.rowActions}>
              <button onClick={() => setEditReteta(r)} className={s.btnEdit}>Editează</button>
              <button onClick={() => stergeReteta(r.id)} className={s.btnDelete}>Șterge</button>
              <a href={`${API_BASE}/retete/${r.id}/print/`} target="_blank" rel="noreferrer" className={s.btnPrint}>🖨️ Print</a>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Trimiteri */}
      {sectiuneActiva === 'trimiteri' && (
      <div className={s.section}>
        <div className={s.sectionHeader}>
          <span className={s.sectionTitle}>Trimiteri ({trimiteri.length})</span>
          {moduleActive.includes('trimiteri') && <button onClick={() => setShowTrimitere(true)} className={s.btnNou}>+ Trimitere nouă</button>}
        </div>
        {loadingT && <p className={s.loadingText}>Se încarcă...</p>}
        {!loadingT && trimiteri.length === 0 && <p className={s.emptyText}>Nicio trimitere înregistrată.</p>}
        {!loadingT && trimiteri.map(t => (
          <div key={t.id} className={s.listRow}>
            <div>
              <span className={s.listRowNume}>{t.numar_trimitere}</span>
              <span className={s.listRowDate}>{t.data_emiterii}</span>
              <span className={s.badgeSpecialist}>{SPECIALIST_LABELS[t.specialist] || (t.specialist.charAt(0).toUpperCase() + t.specialist.replace(/_/g, ' ').slice(1))}</span>
              {t.prioritate === 'urgent' && <span className={s.badgeUrgent}>Urgent</span>}
              {t.diagnostic && <span className={s.listRowDiag}>— {t.diagnostic}</span>}
            </div>
            <div className={s.rowActions}>
              <button onClick={() => setEditTrimitere(t)} className={s.btnEdit}>Editează</button>
              <button onClick={() => stergeTrimitere(t.id)} className={s.btnDelete}>Șterge</button>
              <a href={`${API_BASE}/trimiteri/${t.id}/print/`} target="_blank" rel="noreferrer" className={s.btnPrint}>🖨️ Simplu</a>
              <a href={`${API_BASE}/trimiteri/${t.id}/print/?tip=cnas`} target="_blank" rel="noreferrer" className={s.btnPrint}>🖨️ CNAS</a>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Concedii */}
      {sectiuneActiva === 'concedii' && (
      <div className={s.section}>
        <div className={s.sectionHeader}>
          <span className={s.sectionTitle}>Concedii medicale ({concedii.length})</span>
          {moduleActive.includes('concedii') && <button onClick={() => setShowConcediu(true)} className={s.btnNou}>+ Concediu nou</button>}
        </div>
        {loadingCo && <p className={s.loadingText}>Se încarcă...</p>}
        {!loadingCo && concedii.length === 0 && <p className={s.emptyText}>Niciun concediu înregistrat.</p>}
        {!loadingCo && concedii.map(c => (
          <div key={c.id} className={s.listRow}>
            <div>
              <span className={s.listRowNume}>{c.serie_numar}</span>
              <span className={s.listRowDate}>{LUNI[c.luna]} {c.an}</span>
              <span className={s.badgeConcediu}>{c.nr_zile} zile</span>
              <span className={s.listRowDiag}>{c.de_la} → {c.pana_la}</span>
              {c.cod_diagnostic && <span className={s.listRowDiag}>({c.cod_diagnostic})</span>}
            </div>
            <div className={s.rowActions}>
              <button onClick={() => setEditConcediu(c)} className={s.btnEdit}>Editează</button>
              <button onClick={() => stergeConcediu(c.id)} className={s.btnDelete}>Șterge</button>
              <a href={`${API_BASE}/concedii/${c.id}/print/`} target="_blank" rel="noreferrer" className={s.btnPrint}>🖨️ Print</a>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Dosar scanat */}
      {sectiuneActiva === 'documente' && (
      <div className={s.section}>
        <div className={s.sectionHeader}>
          <span className={s.sectionTitle}>Dosar scanat ({documente.length})</span>
          <label className={s.btnNouLabel}>
            + Adaugă document
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={incarcaDocument} style={{ display: 'none' }} />
          </label>
        </div>
        {incarcand && <p className={s.loadingText}>Se încarcă...</p>}
        {!incarcand && documente.length === 0 && <p className={s.emptyText}>Niciun document înregistrat.</p>}
        {documente.map(d => (
          <div key={d.id} className={s.docRow}>
            <div>
              <a href={d.fisier_url} target="_blank" rel="noreferrer" className={s.docLink}>📄 {d.nume}</a>
              <span className={s.docMeta}>{new Date(d.incarcat_la).toLocaleDateString('ro-RO')} · {Math.round(d.marime / 1024)} KB · {d.incarcat_de}</span>
            </div>
            <button onClick={() => stergeDocument(d.id)} className={s.btnStergeDoc}>×</button>
          </div>
        ))}
      </div>
      )}

      {/* Alte fisiere */}
      {sectiuneActiva === 'alteFisiere' && (
      <div className={s.section}>
        <div className={s.sectionHeader}>
          <span className={s.sectionTitle}>Alte fișiere ({alteFisiere.length})</span>
          <label className={s.btnNouLabel}>
            + Adaugă fișier
            <input type="file" onChange={incarcaAltFisier} style={{ display: 'none' }} />
          </label>
        </div>
        {incarcandAlt && <p className={s.loadingText}>Se încarcă...</p>}
        {!incarcandAlt && alteFisiere.length === 0 && <p className={s.emptyText}>Niciun fișier înregistrat.</p>}
        {alteFisiere.map(d => (
          <div key={d.id} className={s.docRow}>
            <div>
              <a href={d.fisier_url} target="_blank" rel="noreferrer" className={s.docLink}>📎 {d.nume}</a>
              <span className={s.docMeta}>{new Date(d.incarcat_la).toLocaleDateString('ro-RO')} · {Math.round(d.marime / 1024)} KB · {d.incarcat_de}</span>
            </div>
            <button onClick={() => stergeAltFisier(d.id)} className={s.btnStergeDoc}>×</button>
          </div>
        ))}
      </div>
      )}

      </>)} {/* end sectiuneActiva */}

      {showReteta    && <ModalReteta    pacientId={pacient.id} medicId={pacient.medic} onClose={() => setShowReteta(false)}    onSaved={r => setRetete(prev => [r, ...prev])} />}
      {editReteta    && <ModalReteta    pacientId={pacient.id} medicId={pacient.medic} editData={editReteta} onClose={() => setEditReteta(null)} onSaved={r => { setRetete(prev => prev.map(x => x.id === r.id ? r : x)); setEditReteta(null) }} />}
      {showTrimitere && <ModalTrimitere pacientId={pacient.id} medicId={pacient.medic} onClose={() => setShowTrimitere(false)} onSaved={t => setTrimiteri(prev => [t, ...prev])} />}
      {editTrimitere && <ModalTrimitere pacientId={pacient.id} medicId={pacient.medic} editData={editTrimitere} onClose={() => setEditTrimitere(null)} onSaved={t => { setTrimiteri(prev => prev.map(x => x.id === t.id ? t : x)); setEditTrimitere(null) }} />}
      {showConcediu  && <ModalConcediu  pacientId={pacient.id} medicId={pacient.medic} onClose={() => setShowConcediu(false)}  onSaved={c => setConcedii(prev => [c, ...prev])} />}
      {editConcediu  && <ModalConcediu  pacientId={pacient.id} medicId={pacient.medic} editData={editConcediu} onClose={() => setEditConcediu(null)} onSaved={c => { setConcedii(prev => prev.map(x => x.id === c.id ? c : x)); setEditConcediu(null) }} />}
    </div>
  )
}