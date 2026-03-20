import { useState, useEffect } from 'react'
import api from '../api'
import { validareCNP } from '../utils/cnp'

export default function PacientDetalii({ pacient, onBack }) {
  const [consultatii, setConsultatii] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState(pacient.status)
  const [salvandStatus, setSalvandStatus] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [formEdit, setFormEdit] = useState({ ...pacient })
  const [errorsEdit, setErrorsEdit] = useState({})
  const [salvandEdit, setSalvandEdit] = useState(false)
  const [showConsultatie, setShowConsultatie] = useState(false)
  const [formConsultatie, setFormConsultatie] = useState({
    data_ora: new Date().toISOString().slice(0, 16),
    simptome: '', examen_clinic: '', tratament: '', observatii: ''
  })
  const [salvandConsultatie, setSalvandConsultatie] = useState(false)

  useEffect(() => {
    api.get(`/pacienti/${pacient.id}/consultatii/`)
      .then(res => setConsultatii(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [pacient.id])

  const labelStyle = { fontSize: '12px', color: '#888', marginBottom: '2px' }
  const valueStyle = { fontSize: '14px', fontWeight: '500', marginBottom: '12px' }
  const inputStyle = {
    width: '100%', padding: '8px 12px', fontSize: '14px',
    border: '1px solid #ddd', borderRadius: '6px',
    boxSizing: 'border-box', marginBottom: '12px'
  }

  const schimbaStatus = async (nouStatus) => {
    setSalvandStatus(true)
    try {
      await api.patch(`/pacienti/${pacient.id}/`, { status: nouStatus })
      setStatus(nouStatus)
      pacient.status = nouStatus
    } catch {
      alert('Eroare la salvarea statusului.')
    } finally {
      setSalvandStatus(false)
    }
  }

  const salveazaEdit = async (e) => {
    e.preventDefault()
    if (!validareCNP(formEdit.cnp)) {
      setErrorsEdit({ cnp: 'CNP invalid — verificati numarul introdus.' })
      return
    }
    if (formEdit.cnp !== pacient.cnp) {
      const confirmat = window.confirm(
        `Esti sigur ca vrei sa modifici CNP-ul?\n\nVechi: ${pacient.cnp}\nNou: ${formEdit.cnp}`
      )
      if (!confirmat) return
    }
    setSalvandEdit(true)
    setErrorsEdit({})
    try {
      await api.put(`/pacienti/${pacient.id}/`, { ...formEdit, medic: pacient.medic })
      Object.assign(pacient, formEdit)
      setEditMode(false)
    } catch (err) {
      const data = err.response?.data
      setErrorsEdit(data || { general: 'Eroare la salvare.' })
    } finally {
      setSalvandEdit(false)
    }
  }

  const salveazaConsultatie = async (e) => {
    e.preventDefault()
    setSalvandConsultatie(true)
    try {
      await api.post('/consultatii/', {
        ...formConsultatie,
        pacient: pacient.id,
        medic: pacient.medic
      })
      const res = await api.get(`/pacienti/${pacient.id}/consultatii/`)
      setConsultatii(res.data)
      setShowConsultatie(false)
      setFormConsultatie({
        data_ora: new Date().toISOString().slice(0, 16),
        simptome: '', examen_clinic: '', tratament: '', observatii: ''
      })
    } catch (err) {
      alert('Eroare la salvarea consultatiei.')
      console.error(err.response?.data)
    } finally {
      setSalvandConsultatie(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button onClick={onBack}
          style={{ padding: '6px 14px', fontSize: '13px', cursor: 'pointer',
            border: '1px solid #ddd', borderRadius: '6px', background: '#fff' }}>
          ← Inapoi la lista
        </button>
        <button onClick={() => setEditMode(!editMode)}
          style={{ padding: '6px 14px', fontSize: '13px', cursor: 'pointer',
            background: editMode ? '#fff' : '#185FA5',
            color: editMode ? '#333' : '#fff',
            border: '1px solid #ddd', borderRadius: '6px' }}>
          {editMode ? 'Anuleaza editarea' : 'Editeaza pacient'}
        </button>
      </div>

      {editMode && (
        <div style={{ border: '1px solid #185FA5', borderRadius: '12px',
          padding: '20px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '16px' }}>
            Editare date pacient
          </h2>
          {errorsEdit.general && <p style={{ color: 'red', marginBottom: '12px' }}>{errorsEdit.general}</p>}
          <form onSubmit={salveazaEdit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <div>
                <label style={labelStyle}>Nume *</label>
                <input value={formEdit.nume}
                  onChange={e => setFormEdit(p => ({ ...p, nume: e.target.value }))}
                  required style={inputStyle}/>
              </div>
              <div>
                <label style={labelStyle}>Prenume *</label>
                <input value={formEdit.prenume}
                  onChange={e => setFormEdit(p => ({ ...p, prenume: e.target.value }))}
                  required style={inputStyle}/>
              </div>
            </div>
            <label style={labelStyle}>CNP *</label>
            <input value={formEdit.cnp} maxLength={13}
              onChange={e => setFormEdit(p => ({ ...p, cnp: e.target.value }))}
              required style={inputStyle}/>
            {errorsEdit.cnp && <p style={{ color: 'red', fontSize: '13px',
              marginBottom: '8px' }}>{errorsEdit.cnp}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <div>
                <label style={labelStyle}>Telefon</label>
                <input value={formEdit.telefon}
                  onChange={e => setFormEdit(p => ({ ...p, telefon: e.target.value }))}
                  style={inputStyle}/>
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input type="email" value={formEdit.email}
                  onChange={e => setFormEdit(p => ({ ...p, email: e.target.value }))}
                  style={inputStyle}/>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <div>
                <label style={labelStyle}>Grup sangvin</label>
                <select value={formEdit.grup_sangvin}
                  onChange={e => setFormEdit(p => ({ ...p, grup_sangvin: e.target.value }))}
                  style={inputStyle}>
                  <option value="">---</option>
                  {['A+','A-','B+','B-','AB+','AB-','0+','0-'].map(g =>
                    <option key={g} value={g}>{g}</option>
                  )}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Sex</label>
                <select value={formEdit.sex}
                  onChange={e => setFormEdit(p => ({ ...p, sex: e.target.value }))}
                  style={inputStyle}>
                  <option value="M">Masculin</option>
                  <option value="F">Feminin</option>
                </select>
              </div>
            </div>
            <label style={labelStyle}>Adresa</label>
            <textarea value={formEdit.adresa}
              onChange={e => setFormEdit(p => ({ ...p, adresa: e.target.value }))}
              style={{ ...inputStyle, height: '60px', resize: 'vertical' }}/>
            <label style={labelStyle}>Alergii</label>
            <textarea value={formEdit.alergii}
              onChange={e => setFormEdit(p => ({ ...p, alergii: e.target.value }))}
              style={{ ...inputStyle, height: '60px', resize: 'vertical' }}/>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
              <button type="button" onClick={() => setEditMode(false)}
                style={{ padding: '8px 20px', fontSize: '14px', cursor: 'pointer',
                  border: '1px solid #ddd', borderRadius: '6px', background: '#fff' }}>
                Anuleaza
              </button>
              <button type="submit" disabled={salvandEdit}
                style={{ padding: '8px 20px', fontSize: '14px', cursor: 'pointer',
                  background: '#185FA5', color: '#fff', border: 'none',
                  borderRadius: '6px', opacity: salvandEdit ? 0.6 : 1 }}>
                {salvandEdit ? 'Se salveaza...' : 'Salveaza modificarile'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px',
        marginBottom: '24px' }}>
        <div style={{ border: '1px solid #eee', borderRadius: '12px', padding: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '16px' }}>
            {pacient.nume} {pacient.prenume}
          </h2>
          <p style={labelStyle}>CNP</p>
          <p style={valueStyle}>{pacient.cnp}</p>
          <p style={labelStyle}>Data nasterii</p>
          <p style={valueStyle}>{pacient.data_nastere}</p>
          <p style={labelStyle}>Sex</p>
          <p style={valueStyle}>{pacient.sex === 'M' ? 'Masculin' : 'Feminin'}</p>
          <p style={labelStyle}>Grup sangvin</p>
          <p style={valueStyle}>{pacient.grup_sangvin || '—'}</p>
          <p style={labelStyle}>Status</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <select value={status} onChange={e => schimbaStatus(e.target.value)}
              disabled={salvandStatus}
              style={{ padding: '4px 8px', fontSize: '13px', borderRadius: '6px',
                border: '1px solid #ddd', cursor: 'pointer',
                color: status === 'activ' ? 'green' :
                       status === 'decedat' ? 'red' : '#888' }}>
              <option value="activ">Activ</option>
              <option value="decedat">Decedat</option>
              <option value="transferat">Transferat la alt medic</option>
              <option value="inactiv">Inactiv</option>
            </select>
            {salvandStatus && <span style={{ fontSize: '12px', color: '#888' }}>Se salveaza...</span>}
          </div>
        </div>

        <div style={{ border: '1px solid #eee', borderRadius: '12px', padding: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '16px' }}>
            Contact
          </h2>
          <p style={labelStyle}>Telefon</p>
          <p style={valueStyle}>{pacient.telefon || '—'}</p>
          <p style={labelStyle}>Email</p>
          <p style={valueStyle}>{pacient.email || '—'}</p>
          <p style={labelStyle}>Adresa</p>
          <p style={valueStyle}>{pacient.adresa || '—'}</p>
          <p style={labelStyle}>Alergii</p>
          <p style={valueStyle}>{pacient.alergii || '—'}</p>
        </div>
      </div>

      <div style={{ border: '1px solid #eee', borderRadius: '12px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '500' }}>
            Istoric consultatii ({consultatii.length})
          </h2>
          <button onClick={() => setShowConsultatie(!showConsultatie)}
            style={{ padding: '6px 14px', fontSize: '13px', cursor: 'pointer',
              background: showConsultatie ? '#fff' : '#185FA5',
              color: showConsultatie ? '#333' : '#fff',
              border: '1px solid #ddd', borderRadius: '6px' }}>
            {showConsultatie ? 'Anuleaza' : '+ Consultatie noua'}
          </button>
        </div>

        {showConsultatie && (
          <form onSubmit={salveazaConsultatie}
            style={{ borderTop: '1px solid #eee', paddingTop: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <div>
                <label style={labelStyle}>Data si ora *</label>
                <input type="datetime-local" value={formConsultatie.data_ora}
                  onChange={e => setFormConsultatie(p => ({ ...p, data_ora: e.target.value }))}
                  required style={inputStyle}/>
              </div>
            </div>
            <label style={labelStyle}>Simptome</label>
            <textarea value={formConsultatie.simptome}
              onChange={e => setFormConsultatie(p => ({ ...p, simptome: e.target.value }))}
              style={{ ...inputStyle, height: '70px', resize: 'vertical' }}
              placeholder="Descrie simptomele pacientului..."/>
            <label style={labelStyle}>Examen clinic</label>
            <textarea value={formConsultatie.examen_clinic}
              onChange={e => setFormConsultatie(p => ({ ...p, examen_clinic: e.target.value }))}
              style={{ ...inputStyle, height: '70px', resize: 'vertical' }}
              placeholder="Rezultatele examenului clinic..."/>
            <label style={labelStyle}>Tratament</label>
            <textarea value={formConsultatie.tratament}
              onChange={e => setFormConsultatie(p => ({ ...p, tratament: e.target.value }))}
              style={{ ...inputStyle, height: '70px', resize: 'vertical' }}
              placeholder="Medicatie, doze, durata..."/>
            <label style={labelStyle}>Observatii</label>
            <textarea value={formConsultatie.observatii}
              onChange={e => setFormConsultatie(p => ({ ...p, observatii: e.target.value }))}
              style={{ ...inputStyle, height: '60px', resize: 'vertical' }}
              placeholder="Observatii suplimentare..."/>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" onClick={() => setShowConsultatie(false)}
                style={{ padding: '8px 20px', fontSize: '14px', cursor: 'pointer',
                  border: '1px solid #ddd', borderRadius: '6px', background: '#fff' }}>
                Anuleaza
              </button>
              <button type="submit" disabled={salvandConsultatie}
                style={{ padding: '8px 20px', fontSize: '14px', cursor: 'pointer',
                  background: '#185FA5', color: '#fff', border: 'none',
                  borderRadius: '6px', opacity: salvandConsultatie ? 0.6 : 1 }}>
                {salvandConsultatie ? 'Se salveaza...' : 'Salveaza consultatia'}
              </button>
            </div>
          </form>
        )}

        {loading && <p style={{ color: '#888' }}>Se incarca...</p>}
        {!loading && consultatii.length === 0 && (
          <p style={{ color: '#888' }}>Nicio consultatie inregistrata.</p>
        )}
        {!loading && consultatii.map(c => (
          <div key={c.id} style={{ borderBottom: '1px solid #eee',
            paddingBottom: '12px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between',
              marginBottom: '6px' }}>
              <span style={{ fontWeight: '500', fontSize: '14px' }}>
                {new Date(c.data_ora).toLocaleDateString('ro-RO')}
              </span>
              <span style={{ fontSize: '12px', color: '#888' }}>
                Dr. {c.medic_nume}
              </span>
            </div>
            {c.simptome && <p style={{ fontSize: '13px', color: '#555',
              marginBottom: '4px' }}><b>Simptome:</b> {c.simptome}</p>}
            {c.tratament && <p style={{ fontSize: '13px', color: '#555' }}>
              <b>Tratament:</b> {c.tratament}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}