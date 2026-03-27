import { useState } from 'react'
import api from '../api'
import { validareCNP, parseCNP } from '../utils/cnp'
import AdresaFields from '../components/AdresaFields'

export default function PacientForm({ onSaved, onCancel }) {
  const [form, setForm] = useState({
    cnp: '', nume: '', prenume: '', data_nastere: '',
    sex: 'M', telefon: '', email: '',
    judet: '', localitate: '', strada: '', numar_strada: '',
    grup_sangvin: '', alergii: '', status: 'activ', medic: 1
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const inputStyle = {
    width: '100%', padding: '9px 12px', fontSize: '13px',
    background: '#0f1117', border: '1px solid #1e2535', borderRadius: '8px',
    color: '#e2e8f0', boxSizing: 'border-box', marginBottom: '12px', outline: 'none',
  }
  const labelStyle = { fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }
  const errorStyle = { color: '#f87171', fontSize: '12px', marginTop: '-8px', marginBottom: '10px' }

  const handleChange = e => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (name === 'cnp') {
      if (value.length === 13) {
        if (!validareCNP(value)) {
          setErrors(prev => ({ ...prev, cnp: ['CNP invalid — verificati numarul introdus.'] }))
        } else {
          setErrors(prev => ({ ...prev, cnp: null }))
          const parsed = parseCNP(value)
          if (parsed) setForm(prev => ({ ...prev, ...parsed }))
        }
      } else {
        setErrors(prev => ({ ...prev, cnp: null }))
      }
    }
  }

  const handleAdresaChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!validareCNP(form.cnp)) {
      setErrors({ cnp: ['CNP invalid — verificati numarul introdus.'] })
      return
    }
    setLoading(true)
    setErrors({})
    try {
      await api.post('/pacienti/', form)
      onSaved()
    } catch (err) {
      const data = err.response?.data
      setErrors(data && typeof data === 'object' ? data : { general: 'Eroare la salvare.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '620px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <button onClick={onCancel}
          style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '20px', padding: '0', lineHeight: 1 }}>
          ←
        </button>
        <span style={{ fontSize: '15px', fontWeight: '600', color: '#e2e8f0' }}>Pacient nou</span>
      </div>

      <div style={{ background: '#161b27', border: '1px solid #1e2535', borderRadius: '12px', padding: '24px' }}>
        {errors.general && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '10px 14px', color: '#f87171', fontSize: '13px', marginBottom: '16px' }}>{errors.general}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <div>
              <label style={labelStyle}>Nume *</label>
              <input name="nume" value={form.nume} onChange={handleChange} required
                style={inputStyle} placeholder="ex. Ionescu"
                onFocus={e => e.target.style.borderColor = '#3a7bd5'}
                onBlur={e => e.target.style.borderColor = '#1e2535'} />
            </div>
            <div>
              <label style={labelStyle}>Prenume *</label>
              <input name="prenume" value={form.prenume} onChange={handleChange} required
                style={inputStyle} placeholder="ex. Maria"
                onFocus={e => e.target.style.borderColor = '#3a7bd5'}
                onBlur={e => e.target.style.borderColor = '#1e2535'} />
            </div>
          </div>

          <label style={labelStyle}>CNP *</label>
          <input name="cnp" value={form.cnp} onChange={handleChange} required
            maxLength={13} style={inputStyle} placeholder="13 cifre"
            onFocus={e => e.target.style.borderColor = '#3a7bd5'}
            onBlur={e => e.target.style.borderColor = errors.cnp ? '#f87171' : '#1e2535'} />
          {errors.cnp && <p style={errorStyle}>
            {errors.cnp[0] === 'pacient with this cnp already exists.'
              ? 'Acest CNP este deja inregistrat.'
              : errors.cnp[0]}
          </p>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <div>
              <label style={labelStyle}>Data nasterii *</label>
              <input name="data_nastere" type="date" value={form.data_nastere}
                onChange={handleChange} required style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#3a7bd5'}
                onBlur={e => e.target.style.borderColor = '#1e2535'} />
            </div>
            <div>
              <label style={labelStyle}>Sex *</label>
              <select name="sex" value={form.sex} onChange={handleChange} style={inputStyle}>
                <option value="M">Masculin</option>
                <option value="F">Feminin</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <div>
              <label style={labelStyle}>Telefon</label>
              <input name="telefon" value={form.telefon} onChange={handleChange}
                style={inputStyle} placeholder="07xx xxx xxx"
                onFocus={e => e.target.style.borderColor = '#3a7bd5'}
                onBlur={e => e.target.style.borderColor = '#1e2535'} />
            </div>
            <div>
              <label style={labelStyle}>Grup sangvin</label>
              <select name="grup_sangvin" value={form.grup_sangvin} onChange={handleChange} style={inputStyle}>
                <option value="">---</option>
                {['A+','A-','B+','B-','AB+','AB-','0+','0-'].map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          <label style={labelStyle}>Email</label>
          <input name="email" type="email" value={form.email} onChange={handleChange}
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = '#3a7bd5'}
            onBlur={e => e.target.style.borderColor = '#1e2535'} />

          {/* Adresa — inlocuieste textarea-ul vechi */}
          <div style={{ borderTop: '1px solid #1e2535', paddingTop: '14px', marginTop: '2px', marginBottom: '4px' }}>
            <div style={{ fontSize: '12px', color: '#4b5563', marginBottom: '12px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Adresă</div>
            <AdresaFields
              values={{ judet: form.judet, localitate: form.localitate, strada: form.strada, numar_strada: form.numar_strada }}
              onChange={handleAdresaChange}
              errors={errors}
            />
          </div>

          <label style={labelStyle}>Alergii cunoscute</label>
          <textarea name="alergii" value={form.alergii} onChange={handleChange}
            style={{ ...inputStyle, height: '60px', resize: 'vertical' }}
            onFocus={e => e.target.style.borderColor = '#3a7bd5'}
            onBlur={e => e.target.style.borderColor = '#1e2535'} />

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="button" onClick={onCancel}
              style={{ padding: '9px 20px', fontSize: '13px', cursor: 'pointer', border: '1px solid #1e2535', borderRadius: '8px', background: 'transparent', color: '#9ca3af' }}>
              Anuleaza
            </button>
            <button type="submit" disabled={loading}
              style={{ padding: '9px 20px', fontSize: '13px', cursor: 'pointer', background: '#3a7bd5', color: '#fff', border: 'none', borderRadius: '8px', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Se salveaza...' : 'Salveaza pacient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
