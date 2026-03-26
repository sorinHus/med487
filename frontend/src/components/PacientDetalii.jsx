import { useState, useEffect } from 'react'
import api from '../api'
import { validareCNP } from '../utils/cnp'

function ICD10Search({ selectate, onAdd, onRemove, inputStyle, labelStyle }) {
  const [query, setQuery]       = useState('')
  const [rezultate, setRezultate] = useState([])
  const [loading, setLoading]   = useState(false)

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

      {/* Diagnostice selectate */}
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

      {/* Input cautare */}
      <div style={{ position: 'relative' }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Cauta cod ICD-10 sau denumire..."
          style={{ ...inputStyle, marginBottom: 0 }}
        />
        {/* Dropdown rezultate */}
        {(rezultate.length > 0 || (loading && query.length >= 2)) && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1a2235', border: '1px solid #1e2535', borderRadius: '8px', zIndex: 10, maxHeight: '200px', overflowY: 'auto', marginTop: '4px' }}>
            {loading && <div style={{ padding: '10px 14px', fontSize: '12px', color: '#4b5563' }}>Se cauta...</div>}
            {!loading && rezultate.map(d => (
              <button key={d.id}
                onClick={() => { onAdd(d); setQuery(''); setRezultate([]) }}
                style={{ width: '100%', textAlign: 'left', padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid #1e2535', color: '#e2e8f0', fontSize: '13px' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(58,123,213,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <span style={{ color: '#60a5fa', fontWeight: '600', marginRight: '8px' }}>{d.cod_icd10}</span>
                {d.denumire}
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

const STATUS_OPTS = [
  { value: 'activ',      label: 'Activ',                color: '#34d399' },
  { value: 'decedat',    label: 'Decedat',              color: '#f87171' },
  { value: 'transferat', label: 'Transferat alt medic', color: '#fbbf24' },
  { value: 'inactiv',    label: 'Inactiv',              color: '#9ca3af' },
]

export default function PacientDetalii({ pacient, onBack }) {
  const [consultatii, setConsultatii]   = useState([])
  const [loading, setLoading]           = useState(true)
  const [status, setStatus]             = useState(pacient.status)
  const [salvandStatus, setSalvandStatus] = useState(false)
  const [editMode, setEditMode]         = useState(false)
  const [formEdit, setFormEdit]         = useState({ ...pacient })
  const [errorsEdit, setErrorsEdit]     = useState({})
  const [salvandEdit, setSalvandEdit]   = useState(false)
  const [showConsultatie, setShowConsultatie] = useState(false)
  const [formC, setFormC] = useState({
  data_ora: new Date().toISOString().slice(0,16),
  simptome: '', examen_clinic: '', tratament: '', observatii: '',
  diagnostice: []   // <-- adaugat
})
const [salvandC, setSalvandC]         = useState(false)

  const inputStyle = { width: '100%', padding: '8px 12px', fontSize: '13px', background: '#0f1117', border: '1px solid #1e2535', borderRadius: '8px', color: '#e2e8f0', boxSizing: 'border-box', marginBottom: '12px', outline: 'none' }
  const labelStyle = { fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }
  const fieldLabel = { fontSize: '16px', color: '#6b7280', marginBottom: '3px' }
const fieldValue = { fontSize: '18px', fontWeight: '500', color: '#e2e8f0', marginBottom: '16px' }

  useEffect(() => {
    api.get(`/pacienti/${pacient.id}/consultatii/`)
      .then(res => setConsultatii(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [pacient.id])

  const schimbaStatus = async (val) => {
    setSalvandStatus(true)
    try {
      await api.patch(`/pacienti/${pacient.id}/`, { status: val })
      setStatus(val)
      pacient.status = val
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

  // salveazaConsultatie — trimite diagnostice_ids
const salveazaConsultatie = async (e) => {
  e.preventDefault(); setSalvandC(true)
  try {
    await api.post('/consultatii/', {
      ...formC,
      pacient: pacient.id,
      medic: pacient.medic,
      diagnostice_ids: formC.diagnostice.map(d => d.id)  // <-- adaugat
    })
    const res = await api.get(`/pacienti/${pacient.id}/consultatii/`)
    setConsultatii(res.data)
    setShowConsultatie(false)
    setFormC({ data_ora: new Date().toISOString().slice(0,16), simptome: '', examen_clinic: '', tratament: '', observatii: '', diagnostice: [] })
  } catch { alert('Eroare la salvarea consultatiei.') }
  finally { setSalvandC(false) }
}

  const nume = `${pacient.nume} ${pacient.prenume}`
  const statusObj = STATUS_OPTS.find(s => s.value === status) || STATUS_OPTS[0]


  
  return (
    <div>
      {/* Back + actiuni */}

<ICD10Search
  selectate={formC.diagnostice}
  onAdd={d => setFormC(p => ({ ...p, diagnostice: [...p.diagnostice, d] }))}
  onRemove={id => setFormC(p => ({ ...p, diagnostice: p.diagnostice.filter(d => d.id !== id) }))}
  inputStyle={inputStyle}
  labelStyle={labelStyle}
/>
<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}></div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <button onClick={onBack}
          style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '20px', padding: '0', lineHeight: 1 }}>
          ←
        </button>
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
            <label style={labelStyle}>Adresa</label>
            <textarea value={formEdit.adresa} onChange={e => setFormEdit(p => ({ ...p, adresa: e.target.value }))} style={{ ...inputStyle, height: '60px', resize: 'vertical' }}/>
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
        {/* Date personale */}
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
          <p style={fieldLabel}>Data nasterii</p><p style={fieldValue}>{pacient.data_nastere}</p>
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

        {/* Contact */}
        <div style={{ background: '#161b27', border: '1px solid #1e2535', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#e2e8f0', marginBottom: '16px' }}>Contact</div>
          <p style={fieldLabel}>Telefon</p><p style={fieldValue}>{pacient.telefon || '—'}</p>
          <p style={fieldLabel}>Email</p><p style={fieldValue}>{pacient.email || '—'}</p>
          <p style={fieldLabel}>Adresa</p><p style={fieldValue}>{pacient.adresa || '—'}</p>
          <p style={fieldLabel}>Alergii</p>
          <p style={{ ...fieldValue, color: pacient.alergii ? '#fbbf24' : '#4b5563' }}>{pacient.alergii || 'Nicio alergie cunoscuta'}</p>
        </div>
      </div>

      {/* Consultatii */}
      <div style={{ background: '#161b27', border: '1px solid #1e2535', borderRadius: '12px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#e2e8f0' }}>
            Istoric consultatii ({consultatii.length})
          </span>
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
            inputStyle={inputStyle}
            labelStyle={labelStyle}
            />
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
              <button type="button" onClick={() => setShowConsultatie(false)} style={{ padding: '8px 18px', fontSize: '13px', cursor: 'pointer', border: '1px solid #1e2535', borderRadius: '8px', background: 'transparent', color: '#9ca3af' }}>Anuleaza</button>
              <button type="submit" disabled={salvandC} style={{ padding: '8px 18px', fontSize: '13px', cursor: 'pointer', background: '#3a7bd5', color: '#fff', border: 'none', borderRadius: '8px', opacity: salvandC ? 0.6 : 1 }}>
                {salvandC ? 'Se salveaza...' : 'Salveaza consultatia'}
              </button>
            </div>
          </form>
        )}

        {loading && <p style={{ color: '#4b5563', fontSize: '13px' }}>Se incarca...</p>}
        {!loading && consultatii.length === 0 && <p style={{ color: '#4b5563', fontSize: '13px' }}>Nicio consultatie inregistrata.</p>}
        {!loading && consultatii.map(c => (
          <div key={c.id} style={{ borderBottom: '1px solid #1a2033', paddingBottom: '14px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontWeight: '600', fontSize: '13px', color: '#60a5fa' }}>
                {new Date(c.data_ora).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <span style={{ fontSize: '12px', color: '#4b5563' }}>Dr. {c.medic_nume}</span>
            </div>
            {c.simptome && <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '4px' }}><span style={{ color: '#6b7280' }}>Simptome: </span>{c.simptome}</p>}
            {c.tratament && <p style={{ fontSize: '13px', color: '#9ca3af' }}><span style={{ color: '#6b7280' }}>Tratament: </span>{c.tratament}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
