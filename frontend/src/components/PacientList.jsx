import { useState, useEffect } from 'react'
import api from '../api'
import PacientForm from './PacientForm'
import PacientDetalii from './PacientDetalii'

export default function PacientList({ onLogout }) {
  const [pacienti, setPacienti] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [pacientSelectat, setPacientSelectat] = useState(null)

  useEffect(() => { fetchPacienti() }, [search])

  const fetchPacienti = async () => {
    try {
      setLoading(true)
      const response = await api.get('/pacienti/', {
        params: search ? { search } : {}
      })
      setPacienti(response.data.results || response.data || [])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
      {pacientSelectat ? (
        <PacientDetalii
          pacient={pacientSelectat}
          onBack={() => setPacientSelectat(null)}
        />
      ) : showForm ? (
        <PacientForm
          onSaved={() => { setShowForm(false); fetchPacienti() }}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: '20px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: '500' }}>
              MED487 — Lista pacienti
            </h1>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowForm(true)}
                style={{ padding: '6px 14px', fontSize: '13px', cursor: 'pointer',
                  background: '#185FA5', color: '#fff', border: 'none',
                  borderRadius: '6px' }}>
                + Pacient nou
              </button>
              <button onClick={onLogout}
                style={{ padding: '6px 14px', fontSize: '13px', cursor: 'pointer',
                  border: '1px solid #ddd', borderRadius: '6px', background: '#fff' }}>
                Logout
              </button>
            </div>
          </div>

          <input
            type="text" placeholder="Cauta dupa nume sau CNP..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', fontSize: '14px',
              border: '1px solid #ddd', borderRadius: '6px',
              marginBottom: '16px', boxSizing: 'border-box' }}
          />

          {loading && <p style={{ color: '#888' }}>Se incarca...</p>}
          {!loading && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                  <th style={{ padding: '8px' }}>Nume</th>
                  <th style={{ padding: '8px' }}>CNP</th>
                  <th style={{ padding: '8px' }}>Data nasterii</th>
                  <th style={{ padding: '8px' }}>Telefon</th>
                  <th style={{ padding: '8px' }}>Grup</th>
                  <th style={{ padding: '8px' }}>Consultatii</th>
                </tr>
              </thead>
              <tbody>
                {pacienti.length === 0 && (
                  <tr><td colSpan="6" style={{ padding: '16px', color: '#888' }}>
                    Niciun pacient gasit.
                  </td></tr>
                )}
                {pacienti.map(p => (
                  <tr key={p.id} onClick={() => setPacientSelectat(p)}
                    style={{ borderBottom: '1px solid #eee', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f9f9f9'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={{ padding: '8px', fontWeight: '500' }}>
                      {p.nume} {p.prenume}
                    </td>
                    <td style={{ padding: '8px', fontFamily: 'monospace' }}>{p.cnp}</td>
                    <td style={{ padding: '8px' }}>{p.data_nastere}</td>
                    <td style={{ padding: '8px' }}>{p.telefon}</td>
                    <td style={{ padding: '8px' }}>{p.grup_sangvin}</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      {p.consultatii_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  )
}