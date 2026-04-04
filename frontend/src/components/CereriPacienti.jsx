import { useEffect, useState } from 'react'

const API = import.meta.env.VITE_API_URL || 'https://web-production-26811.up.railway.app/api'

export default function CereriPacienti() {
  const [cereri, setCereri] = useState([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState(null)

  useEffect(() => { fetchCereri() }, [])

  const fetchCereri = async () => {
  setLoading(true)
  const token = localStorage.getItem('access')
  try {
    const r = await fetch(`${API}/useri/?rol=pacient&aprobat=false`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await r.json()
    console.log('cereri data:', data)
    setCereri(Array.isArray(data) ? data : data.results || [])
  } catch (e) {
    console.log('cereri error:', e)
    setCereri([])
  }
  finally { setLoading(false) }
}

  const actiune = async (pk, tip) => {
    const token = localStorage.getItem('access')
    try {
      const r = await fetch(`${API}/cereri/${pk}/aprobare/`, {
        method: tip === 'aprobare' ? 'POST' : 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (r.ok) {
        setMsg(tip === 'aprobare' ? 'Cont aprobat. Email trimis pacientului.' : 'Cerere respinsă.')
        fetchCereri()
        setTimeout(() => setMsg(null), 3000)
      }
    } catch { setMsg('Eroare. Încearcă din nou.') }
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)' }}>Cereri înregistrare pacienți</div>
        <div style={{ fontSize: '13px', color: 'var(--text-dim)', marginTop: '4px' }}>Aprobați sau respingeți cererile de cont nou</div>
      </div>

      {msg && (
        <div style={{ background: 'rgba(80,200,120,0.1)', border: '1px solid rgba(80,200,120,0.3)', borderRadius: '8px', padding: '10px 14px', color: 'var(--success)', fontSize: '13px', marginBottom: '16px' }}>
          {msg}
        </div>
      )}

      {loading ? (
        <div style={{ color: 'var(--text-dim)', fontSize: '14px' }}>Se încarcă...</div>
      ) : cereri.length === 0 ? (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '3rem', textAlign: 'center', color: 'var(--text-dim)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>✅</div>
          <div style={{ fontSize: '15px' }}>Nicio cerere în așteptare</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {cereri.map(c => (
            <div key={c.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '15px' }}>
                  {c.last_name} {c.first_name}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-dim)', marginTop: '3px' }}>
                  {c.email} {c.telefon ? `· ${c.telefon}` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <button onClick={() => actiune(c.id, 'aprobare')}
                  style={{ padding: '7px 16px', background: 'rgba(80,200,120,0.12)', color: 'var(--success)', border: '1px solid rgba(80,200,120,0.3)', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(80,200,120,0.22)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(80,200,120,0.12)'}
                >✓ Aprobă</button>
                <button onClick={() => actiune(c.id, 'respingere')}
                  style={{ padding: '7px 16px', background: 'rgba(239,68,68,0.08)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.16)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                >✕ Respinge</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}