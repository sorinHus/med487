import { useEffect, useState } from 'react'

const API = import.meta.env.VITE_API_URL || 'https://web-production-26811.up.railway.app/api'

const STATUS_COLORS = {
  programat:  { bg: 'rgba(37,99,168,0.1)',  color: '#2563a8',  label: 'Programat' },
  confirmat:  { bg: 'rgba(80,200,120,0.1)', color: 'var(--success)', label: 'Confirmat' },
  finalizat:  { bg: 'rgba(113,128,150,0.1)', color: 'var(--text-dim)', label: 'Finalizat' },
  anulat:     { bg: 'rgba(239,68,68,0.1)',  color: 'var(--danger)', label: 'Anulat' },
}

function formatData(dataStr) {
  if (!dataStr) return '—'
  const d = new Date(dataStr)
  return d.toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatOra(dataStr) {
  if (!dataStr) return ''
  const d = new Date(dataStr)
  return d.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
}

export default function PortalPacient({ user, onLogout }) {
  const [date, setDate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('programari')
  const [retetaSelectata, setRetetaSelectata] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('access')
    fetch(`${API}/portal-pacient/`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => { setDate(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const nume = `${user?.first_name || ''} ${user?.last_name || ''}`.trim()

  const tabStyle = (id) => ({
    padding: '0.6rem 1.25rem',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: tab === id ? '600' : '400',
    background: tab === id ? 'var(--accent)' : 'transparent',
    color: tab === id ? 'white' : 'var(--text-muted)',
    transition: 'all .15s',
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* Header */}
      <header style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '0 2rem', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#1a3557', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1rem' }}>✚</div>
          <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '15px' }}>Cabinet Medical</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <a href="/" style={{ fontSize: '13px', color: 'var(--text-dim)', textDecoration: 'none' }}>← Site</a>
          <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{nume}</span>
          <button onClick={() => { if (window.confirm('Ești sigur că vrei să te deconectezi?')) onLogout() }}
            style={{ padding: '6px 14px', borderRadius: '7px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#f87171' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
          >Deconectare</button>
        </div>
      </header>

      {/* Content */}
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Welcome */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '22px', fontWeight: '600', color: 'var(--text-primary)' }}>Bună ziua, {user?.first_name || 'pacient'}!</div>
          <div style={{ fontSize: '14px', color: 'var(--text-dim)', marginTop: '4px' }}>Portalul dumneavoastră medical</div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'var(--bg-card)', padding: '0.4rem', borderRadius: '10px', border: '1px solid var(--border)', width: 'fit-content' }}>
          <button style={tabStyle('programari')} onClick={() => setTab('programari')}>📅 Programări</button>
          <button style={tabStyle('consultatii')} onClick={() => setTab('consultatii')}>🩺 Consultații</button>
          <button style={tabStyle('retete')} onClick={() => setTab('retete')}>💊 Rețete</button>
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-dim)', fontSize: '14px' }}>Se încarcă...</div>
        ) : (
          <>
            {/* PROGRAMARI */}
            {tab === 'programari' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>Programările mele</div>
                  <a href="/programare.html" style={{ padding: '7px 16px', background: 'var(--accent)', color: 'white', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: '500' }}>+ Programare nouă</a>
                </div>
                {!date?.programari?.length ? (
                  <Empty text="Nicio programare înregistrată" />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {date.programari.map(p => {
                      const s = STATUS_COLORS[p.status] || STATUS_COLORS.programat
                      return (
                        <div key={p.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: '500', color: 'var(--text-primary)', fontSize: '15px' }}>{formatData(p.data_ora)} · {formatOra(p.data_ora)}</div>
                            <div style={{ fontSize: '13px', color: 'var(--text-dim)', marginTop: '3px' }}>{p.motiv}</div>
                          </div>
                          <span style={{ padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '500', background: s.bg, color: s.color }}>{s.label}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* CONSULTATII */}
            {tab === 'consultatii' && (
              <div>
                <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>Istoricul consultațiilor</div>
                {!date?.consultatii?.length ? (
                  <Empty text="Nicio consultație înregistrată" />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {date.consultatii.map(c => (
                      <div key={c.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <div style={{ fontWeight: '500', color: 'var(--text-primary)', fontSize: '15px' }}>{formatData(c.data_ora)}</div>
                          <div style={{ fontSize: '13px', color: 'var(--text-dim)' }}>Dr. {c.medic}</div>
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}><span style={{ color: 'var(--text-dim)' }}>Simptome:</span> {c.simptome}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}><span style={{ color: 'var(--text-dim)' }}>Tratament:</span> {c.tratament}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* RETETE */}
            {tab === 'retete' && (
              <div>
                <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>Rețetele mele</div>
                {!date?.retete?.length ? (
                  <Empty text="Nicio rețetă înregistrată" />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {date.retete.map(r => (
                      <div key={r.id} onClick={() => setRetetaSelectata(r)}
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                      >
                        <div style={{ fontWeight: '600', color: 'var(--accent-light)', fontSize: '15px' }}>{r.numar}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-dim)' }}>{formatData(r.data_prescriere)}</div>
                        <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: r.gratuit === 'da' ? 'rgba(52,211,153,0.15)' : 'rgba(107,114,128,0.15)', color: r.gratuit === 'da' ? '#34d399' : 'var(--text-muted)' }}>
                          {r.gratuit === 'da' ? 'Gratuit' : 'Cu plată'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* MODAL RETETA */}
            {retetaSelectata && (
              <div onClick={() => setRetetaSelectata(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', width: '100%', maxWidth: '560px', maxHeight: '85vh', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--bg-card)' }}>
                    <div>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '15px' }}>{retetaSelectata.numar}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>{formatData(retetaSelectata.data_prescriere)}</div>
                    </div>
                    <button onClick={() => setRetetaSelectata(null)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '20px', cursor: 'pointer' }}>✕</button>
                  </div>
                  <div style={{ padding: '20px' }}>
                    {retetaSelectata.diagnostic && (
                      <div style={{ marginBottom: '16px', padding: '10px 14px', background: 'var(--bg-main)', borderRadius: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                        <span style={{ color: 'var(--text-dim)' }}>Diagnostic: </span>{retetaSelectata.diagnostic}
                      </div>
                    )}
                    <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                      Medicamente ({retetaSelectata.linii?.length || 0})
                    </div>
                    {retetaSelectata.linii?.map((l, i) => (
                      <div key={i} style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px', marginBottom: '10px' }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px' }}>{l.nume_medicament} {l.concentratie && `· ${l.concentratie}`}</div>
                        {l.doza_frecventa && <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '3px' }}><span style={{ color: 'var(--text-dim)' }}>Doză: </span>{l.doza_frecventa}</div>}
                        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-dim)', marginTop: '6px' }}>
                          {l.durata_zile && <span>⏱ {l.durata_zile} zile</span>}
                          {l.cantitate && <span>📦 {l.cantitate} cutii</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function Empty({ text }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '3rem', textAlign: 'center', color: 'var(--text-dim)' }}>
      <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📋</div>
      <div style={{ fontSize: '14px' }}>{text}</div>
    </div>
  )
}