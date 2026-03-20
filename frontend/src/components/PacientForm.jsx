import { useState } from 'react'
import api from '../api'
import { validareCNP, parseCNP } from '../utils/cnp'

export default function PacientForm({ onSaved, onCancel }) {
  const [form, setForm] = useState({
    cnp: '', nume: '', prenume: '', data_nastere: '',
    sex: 'M', telefon: '', email: '', adresa: '',
    grup_sangvin: '', alergii: '', status: 'activ', medic: 1
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

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
      if (data && typeof data === 'object') {
        setErrors(data)
      } else {
        setErrors({ general: 'Eroare la salvare. Incercati din nou.' })
      }
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '8px 12px', fontSize: '14px',
    border: '1px solid #ddd', borderRadius: '6px',
    boxSizing: 'border-box', marginBottom: '12px'
  }
  const labelStyle = {
    fontSize: '12px', color: '#888', display: 'block', marginBottom: '4px'
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px',
      border: '1px solid #eee', borderRadius: '12px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '20px' }}>
        Pacient nou
      </h2>
      {errors.general && (
        <p style={{ color: 'red', marginBottom: '12px' }}>{errors.general}</p>
      )}
      {errors.cnp && (
        <p style={{ color: 'red', marginBottom: '12px' }}>
          CNP: {errors.cnp[0] === 'pacient with this cnp already exists.'
            ? 'Acest CNP este deja inregistrat in sistem.'
            : errors.cnp[0]}
        </p>
      )}
      {errors.non_field_errors && (
        <p style={{ color: 'red', marginBottom: '12px' }}>{errors.non_field_errors[0]}</p>
      )}
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <div>
            <label style={labelStyle}>Nume *</label>
            <input name="nume" value={form.nume} onChange={handleChange}
              required style={inputStyle} placeholder="ex. Ionescu"/>
          </div>
          <div>
            <label style={labelStyle}>Prenume *</label>
            <input name="prenume" value={form.prenume} onChange={handleChange}
              required style={inputStyle} placeholder="ex. Maria"/>
          </div>
        </div>

        <label style={labelStyle}>CNP *</label>
        <input name="cnp" value={form.cnp} onChange={handleChange}
          required maxLength={13} style={inputStyle} placeholder="13 cifre"/>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <div>
            <label style={labelStyle}>Data nasterii *</label>
            <input name="data_nastere" type="date" value={form.data_nastere}
              onChange={handleChange} required style={inputStyle}/>
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
              style={inputStyle} placeholder="07xx xxx xxx"/>
          </div>
          <div>
            <label style={labelStyle}>Grup sangvin</label>
            <select name="grup_sangvin" value={form.grup_sangvin}
              onChange={handleChange} style={inputStyle}>
              <option value="">---</option>
              {['A+','A-','B+','B-','AB+','AB-','0+','0-'].map(g =>
                <option key={g} value={g}>{g}</option>
              )}
            </select>
          </div>
        </div>

        <label style={labelStyle}>Status</label>
        <select name="status" value={form.status} onChange={handleChange} style={inputStyle}>
          <option value="activ">Activ</option>
          <option value="decedat">Decedat</option>
          <option value="transferat">Transferat la alt medic</option>
          <option value="inactiv">Inactiv</option>
        </select>

        <label style={labelStyle}>Email</label>
        <input name="email" type="email" value={form.email}
          onChange={handleChange} style={inputStyle}/>

        <label style={labelStyle}>Adresa</label>
        <textarea name="adresa" value={form.adresa} onChange={handleChange}
          style={{ ...inputStyle, height: '70px', resize: 'vertical' }}/>

        <label style={labelStyle}>Alergii cunoscute</label>
        <textarea name="alergii" value={form.alergii} onChange={handleChange}
          style={{ ...inputStyle, height: '60px', resize: 'vertical' }}/>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button type="button" onClick={onCancel}
            style={{ padding: '8px 20px', fontSize: '14px', cursor: 'pointer',
              border: '1px solid #ddd', borderRadius: '6px', background: '#fff' }}>
            Anuleaza
          </button>
          <button type="submit" disabled={loading}
            style={{ padding: '8px 20px', fontSize: '14px', cursor: 'pointer',
              background: '#185FA5', color: '#fff', border: 'none',
              borderRadius: '6px', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Se salveaza...' : 'Salveaza pacient'}
          </button>
        </div>
      </form>
    </div>
  )
}