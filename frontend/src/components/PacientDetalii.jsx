import { useState, useEffect } from 'react'
import api from '../api'
import { validareCNP } from '../utils/cnp'
import AdresaFields from '../components/AdresaFields'
import s from '../styles/PacientDetalii.module.css'

const API_BASE = import.meta.env.VITE_API_URL || 'https://web-production-26811.up.railway.app/api'

/* ─────────────────────────────────────────────
   ICD10Search
───────────────────────────────────────────── */
function ICD10Search({ selectate, onAdd, onRemove }) {
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
        setRezultate(lista.filter(d => !selectate.find(sel => sel.id === d.id)))
      } catch { setRezultate([]) }
      finally { setLoading(false) }
    }, 300)
    return () => clearTimeout(t)
  }, [query, selectate])

  return (
    <div className={s.icd10Wrap}>
      <label className={s.label}>Diagnostice ICD-10</label>
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
      <div className={s.icd10InputWrap}>
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Cauta cod ICD-10 sau denumire..." className={s.input} style={{ marginBottom: 0 }} />
        {(rezultate.length > 0 || (loading && query.length >= 2)) && (
          <div className={s.icd10Dropdown}>
            {loading && <div className={s.icd10Loading}>Se cauta...</div>}
            {!loading && rezultate.map(d => (
              <button key={d.id} onClick={() => { onAdd(d); setQuery(''); setRezultate([]) }} className={s.icd10Btn}>
                <span className={s.icd10Cod}>{d.cod_icd10}</span>{d.denumire}
              </button>
            ))}
            {!loading && rezultate.length === 0 && query.length >= 2 && (
              <div className={s.icd10Empty}>Niciun rezultat.</div>
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
function ModalReteta({ pacientId, medicId, onClose, onSaved }) {
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
        pacient: pacientId, medic: medicId, ...form,
        linii: linii.map((l, i) => ({ ...l, ordine: i, durata_zile: parseInt(l.durata_zile), cantitate: parseInt(l.cantitate) || 1 })),
      })
      onSaved && onSaved(res.data); onClose()
    } catch (err) { setEroare(err.response?.data?.detail || 'Eroare la salvare.') }
    finally { setSalvand(false) }
  }

  return (
    <div className={s.overlay}>
      <div className={`${s.modal} ${s.modalLg}`}>
        <div className={s.modalHeader}>
          <span className={s.modalTitle}>Rețetă nouă</span>
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
          <label className={s.label}>Diagnostic</label>
          <input value={form.diagnostic} onChange={e => setForm(p => ({ ...p, diagnostic: e.target.value }))} className={s.input} placeholder="ex: Hipertensiune arterială esențială" />
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
                  <div><label className={s.label}>Cantitate (cutii)</label>
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
            <button type="submit" disabled={salvand} className={s.btnSave}>{salvand ? 'Se salvează...' : 'Salvează rețeta'}</button>
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

const ANALIZE_LABORATOR = [
  { categorie: 'Hemogramă', analize: ['Hemoleucogramă completă', 'VSH', 'PCR (Proteina C Reactivă)', 'Frotiu sanguine'] },
  { categorie: 'Biochimie', analize: ['Glicemie a jeun', 'HbA1c', 'Uree', 'Creatinină', 'Acid uric', 'TGO (AST)', 'TGP (ALT)', 'Gama-GT', 'Fosfataza alcalină', 'Bilirubina totală', 'Albumina serică', 'Proteine totale'] },
  { categorie: 'Lipide', analize: ['Colesterol total', 'HDL-colesterol', 'LDL-colesterol', 'Trigliceride'] },
  { categorie: 'Electroliți & Minerale', analize: ['Sodiu (Na+)', 'Potasiu (K+)', 'Clor (Cl-)', 'Calciu seric', 'Magneziu', 'Fosfor'] },
  { categorie: 'Fier & Anemie', analize: ['Fier seric', 'Feritină', 'Saturatia transferinei', 'Vitamina B12', 'Acid folic'] },
  { categorie: 'Hormoni', analize: ['TSH', 'FT4 (Tiroxina liberă)', 'FT3', 'PSA total', 'PSA liber', 'LH', 'FSH', 'Testosteron', 'Estradiol', 'Prolactina', 'Cortizol'] },
  { categorie: 'Coagulare', analize: ['INR / Timp Quick (PT)', 'APTT', 'Fibrinogen', 'D-dimeri', 'Timp de trombină'] },
  { categorie: 'Serologie', analize: ['AgHBs', 'Anticorpi anti-HBs', 'Anti-HCV', 'HIV Ag/Ac', 'VDRL/RPR', 'IgM/IgG Toxoplasma', 'IgM/IgG CMV', 'IgM/IgG Rubeolă'] },
  { categorie: 'Urină & Fecale', analize: ['Sumar de urină', 'Urocultură', 'Microalbuminurie', 'Coprocultură', 'Coproparazitologic'] },
]

function ModalTrimitere({ pacientId, medicId, onClose, onSaved }) {
  const [form, setForm] = useState({ specialist: 'cardiologie', specialist_custom: '', unitate_medicala: '', diagnostic: '', cod_diagnostic: '', investigatii_solicitate: '', prioritate: 'normal', valabilitate_zile: 30, nr_fisa: '', analize_selectate: [], observatii: '' })
  const [salvand, setSalvand] = useState(false)
  const [eroare, setEroare]   = useState('')

  const salveaza = async (e) => {
    e.preventDefault(); setSalvand(true); setEroare('')
    try {
      const res = await api.post('/trimiteri/', { pacient: pacientId, medic: medicId, ...form })
      onSaved && onSaved(res.data); onClose()
    } catch (err) { setEroare(err.response?.data?.detail || 'Eroare la salvare.') }
    finally { setSalvand(false) }
  }

  return (
    <div className={s.overlay}>
      <div className={`${s.modal} ${s.modalSm}`}>
        <div className={s.modalHeader}>
          <span className={s.modalTitle}>Trimitere nouă</span>
          <button onClick={onClose} className={s.btnClose}>✕</button>
        </div>
        <form onSubmit={salveaza} className={s.modalBody}>
          <div className={s.grid2}>
            <div><label className={s.label}>Specialist *</label>
              <select value={form.specialist} onChange={e => setForm(p => ({ ...p, specialist: e.target.value, analize_selectate: [] }))} className={s.input} required>
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
              <label className={s.label}>Analize solicitate</label>
              {form.analize_selectate.length > 0 && (
                <div className={s.analizeSelectate}>
                  {form.analize_selectate.map(a => (
                    <span key={a} className={s.analizeChip}>
                      {a}
                      <span className={s.analizeChipX} onClick={() => setForm(p => ({ ...p, analize_selectate: p.analize_selectate.filter(x => x !== a) }))}>×</span>
                    </span>
                  ))}
                </div>
              )}
              <div className={s.analizeBox}>
                {ANALIZE_LABORATOR.map(({ categorie, analize }) => (
                  <div key={categorie}>
                    <div className={s.analizeCategorie}>{categorie}</div>
                    <div className={s.analizeGrid}>
                      {analize.map(a => (
                        <label key={a} className={s.analizeItem}>
                          <input
                            type="checkbox"
                            checked={form.analize_selectate.includes(a)}
                            onChange={e => setForm(p => ({
                              ...p,
                              analize_selectate: e.target.checked
                                ? [...p.analize_selectate, a]
                                : p.analize_selectate.filter(x => x !== a)
                            }))}
                          />
                          {a}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <label className={s.label}>Unitate medicală (optional)</label>
          <input value={form.unitate_medicala} onChange={e => setForm(p => ({ ...p, unitate_medicala: e.target.value }))} className={s.input} placeholder="ex: Spitalul Județean Cluj" />
          <div className={s.grid21}>
            <div><label className={s.label}>Diagnostic prezumtiv</label>
              <input value={form.diagnostic} onChange={e => setForm(p => ({ ...p, diagnostic: e.target.value }))} className={s.input} placeholder="ex: Insuficiență cardiacă" /></div>
            <div><label className={s.label}>Cod ICD-10</label>
              <input value={form.cod_diagnostic} onChange={e => setForm(p => ({ ...p, cod_diagnostic: e.target.value }))} className={s.input} placeholder="ex: I50" /></div>
          </div>
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
            <button type="submit" disabled={salvand} className={s.btnSave}>{salvand ? 'Se salvează...' : 'Salvează trimiterea'}</button>
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

function ModalConcediu({ pacientId, medicId, onClose, onSaved }) {
  const [form, setForm] = useState({ serie_numar: '', tip: 'initial', serie_initial: '', luna: lunaC, an: anC, cod_indemnizatie: '01', data_acordarii: aziStr, nr_zile: 3, de_la: aziStr, pana_la: aziStr, cod_diagnostic: '', acut_subacut_cronic: 'acut', nr_inreg: '', ambulator_internat: 'ambulator', nr_conventie: '', cas: '', observatii: '' })
  const [salvand, setSalvand] = useState(false)
  const [eroare, setEroare]   = useState('')

  const salveaza = async (e) => {
    e.preventDefault()
    if (!form.serie_numar.trim()) { setEroare('Seria și numărul sunt obligatorii.'); return }
    setSalvand(true); setEroare('')
    try {
      const res = await api.post('/concedii/', { pacient: pacientId, medic: medicId, ...form })
      onSaved && onSaved(res.data); onClose()
    } catch (err) { setEroare(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Eroare la salvare.') }
    finally { setSalvand(false) }
  }

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className={s.overlay}>
      <div className={`${s.modal} ${s.modalMd}`}>
        <div className={s.modalHeader}>
          <span className={s.modalTitle}>Concediu medical nou</span>
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
            <button type="submit" disabled={salvand} className={s.btnSave}>{salvand ? 'Se salvează...' : 'Salvează concediul'}</button>
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
   PacientDetalii
───────────────────────────────────────────── */
export default function PacientDetalii({ pacient, onBack, moduleActive = [] }) {
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
  const [formC, setFormC] = useState({ data_ora: new Date().toISOString().slice(0,16), simptome: '', examen_clinic: '', tratament: '', observatii: '', diagnostice: [] })
  const [salvandC, setSalvandC] = useState(false)
  const [documente, setDocumente] = useState([])
  const [incarcand, setIncarcand] = useState(false)
  const [alteFisiere, setAlteFisiere] = useState([])
  const [incarcandAlt, setIncarcandAlt] = useState(false)

  useEffect(() => { api.get(`/pacienti/${pacient.id}/consultatii/`).then(res => setConsultatii(res.data)).catch(console.error).finally(() => setLoadingC(false)) }, [pacient.id])
  useEffect(() => { api.get('/retete/', { params: { pacient: pacient.id } }).then(res => setRetete(Array.isArray(res.data) ? res.data : (res.data.results || []))).catch(console.error).finally(() => setLoadingR(false)) }, [pacient.id])
  useEffect(() => { api.get('/trimiteri/', { params: { pacient: pacient.id } }).then(res => setTrimiteri(Array.isArray(res.data) ? res.data : (res.data.results || []))).catch(console.error).finally(() => setLoadingT(false)) }, [pacient.id])
  useEffect(() => { api.get('/concedii/', { params: { pacient: pacient.id } }).then(res => setConcedii(Array.isArray(res.data) ? res.data : (res.data.results || []))).catch(console.error).finally(() => setLoadingCo(false)) }, [pacient.id])
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
    try {
      await api.post('/consultatii/', { ...formC, pacient: pacient.id, medic: pacient.medic, diagnostice_ids: formC.diagnostice.map(d => d.id) })
      const res = await api.get(`/pacienti/${pacient.id}/consultatii/`)
      setConsultatii(res.data); setShowConsultatie(false)
      setFormC({ data_ora: new Date().toISOString().slice(0,16), simptome: '', examen_clinic: '', tratament: '', observatii: '', diagnostice: [] })
    } catch { alert('Eroare la salvarea consultatiei.') }
    finally { setSalvandC(false) }
  }

  const adresaDisplay = [pacient.strada, pacient.numar_strada, pacient.localitate, pacient.judet].filter(Boolean).join(', ') || '—'
  const nume = `${pacient.nume} ${pacient.prenume}`
  const statusObj = STATUS_OPTS.find(o => o.value === status) || STATUS_OPTS[0]

  return (
    <div>
      {/* Header */}
      <div className={s.header}>
        <button onClick={onBack} className={s.btnBack}>←</button>
        <span className={s.headerNume}>{nume}</span>
        <div className={s.headerSpacer} />
        <button onClick={() => setEditMode(!editMode)} className={`${s.btnEdit} ${editMode ? s.btnEditActive : ''}`}>
          {editMode ? 'Anulează' : 'Editează'}
        </button>
      </div>

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

      {/* Dosar scanat */}
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

      {/* Alte fisiere */}
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

      {/* Rețete */}
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
            <a href={`${API_BASE}/retete/${r.id}/print/`} target="_blank" rel="noreferrer" className={s.btnPrint}>🖨️ Print</a>
          </div>
        ))}
      </div>
      

      {/* Trimiteri */}
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
              <span className={s.badgeSpecialist}>{t.specialist.charAt(0).toUpperCase() + t.specialist.slice(1)}</span>
              {t.prioritate === 'urgent' && <span className={s.badgeUrgent}>Urgent</span>}
              {t.diagnostic && <span className={s.listRowDiag}>— {t.diagnostic}</span>}
            </div>
            <div className={s.printBtns}>
              <a href={`${API_BASE}/trimiteri/${t.id}/print/`} target="_blank" rel="noreferrer" className={s.btnPrint}>🖨️ Simplu</a>
              <a href={`${API_BASE}/trimiteri/${t.id}/print/?tip=cnas`} target="_blank" rel="noreferrer" className={s.btnPrint}>🖨️ CNAS</a>
            </div>
          </div>
        ))}
      </div>

      {/* Concedii */}
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
            <a href={`${API_BASE}/concedii/${c.id}/print/`} target="_blank" rel="noreferrer" className={s.btnPrint}>🖨️ Print</a>
          </div>
        ))}
      </div>

      {/* Consultații */}
      <div className={s.card}>
        <div className={s.sectionHeader}>
          <span className={s.sectionTitle}>Istoric consultații ({consultatii.length})</span>
          <button onClick={() => setShowConsultatie(!showConsultatie)} className={showConsultatie ? s.btnNouToggle : s.btnNou}>
            {showConsultatie ? 'Anulează' : '+ Consultație nouă'}
          </button>
        </div>

        {showConsultatie && (
          <form onSubmit={salveazaConsultatie} className={s.consultatieForm}>
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
              <button type="button" onClick={() => setShowConsultatie(false)} className={s.btnCancel}>Anulează</button>
              <button type="submit" disabled={salvandC} className={s.btnSave}>{salvandC ? 'Se salvează...' : 'Salvează consultația'}</button>
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
                </div>
              </div>
            </div>
            {c.simptome  && <p className={s.consultatieLine}><span className={s.consultatieDimLabel}>Simptome: </span>{c.simptome}</p>}
            {c.tratament && <p className={s.consultatieLine}><span className={s.consultatieDimLabel}>Tratament: </span>{c.tratament}</p>}
          </div>
        ))}
      </div>

      {showReteta    && <ModalReteta    pacientId={pacient.id} medicId={pacient.medic} onClose={() => setShowReteta(false)}    onSaved={r => setRetete(prev => [r, ...prev])} />}
      {showTrimitere && <ModalTrimitere pacientId={pacient.id} medicId={pacient.medic} onClose={() => setShowTrimitere(false)} onSaved={t => setTrimiteri(prev => [t, ...prev])} />}
      {showConcediu  && <ModalConcediu  pacientId={pacient.id} medicId={pacient.medic} onClose={() => setShowConcediu(false)}  onSaved={c => setConcedii(prev => [c, ...prev])} />}
    </div>
  )
}