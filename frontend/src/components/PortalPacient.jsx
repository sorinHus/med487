import { useEffect, useState } from 'react'
import api from '../api'
import s from '../styles/PortalPacient.module.css'

const STATUS_COLORS = {
  programat:  { bg: 'rgba(37,99,168,0.1)',   color: '#2563a8',          label: 'Programat' },
  confirmat:  { bg: 'rgba(80,200,120,0.1)',  color: 'var(--success)',   label: 'Confirmat' },
  finalizat:  { bg: 'rgba(113,128,150,0.1)', color: 'var(--text-dim)',  label: 'Finalizat' },
  anulat:     { bg: 'rgba(239,68,68,0.1)',   color: 'var(--danger)',    label: 'Anulat' },
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

function Empty({ text }) {
  return (
    <div className={s.empty}>
      <div className={s.emptyIcon}>📋</div>
      <div className={s.emptyText}>{text}</div>
    </div>
  )
}

export default function PortalPacient({ user, onLogout }) {
  const [date, setDate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('programari')
  const [retetaSelectata, setRetetaSelectata] = useState(null)

  useEffect(() => {
    api.get('/portal-pacient/')
      .then(res => { setDate(res.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const nume = `${user?.first_name || ''} ${user?.last_name || ''}`.trim()

  return (
    <div className={s.root}>

      {/* Header */}
      <header className={s.header}>
        <div className={s.headerLogo}>
          <div className={s.logoIcon}>✚</div>
          <span className={s.logoText}>Cabinet Medical</span>
        </div>
        <div className={s.headerRight}>
          <a href="/" className={s.linkSite}>← Site</a>
          <span className={s.headerUser}>{nume}</span>
          <button
            onClick={() => { if (window.confirm('Ești sigur că vrei să te deconectezi?')) onLogout() }}
            className={s.btnLogout}
          >Deconectare</button>
        </div>
      </header>

      {/* Content */}
      <div className={s.content}>

        {/* Welcome */}
        <div className={s.welcome}>
          <div className={s.welcomeTitle}>Bună ziua, {user?.first_name || 'pacient'}!</div>
          <div className={s.welcomeSub}>Portalul dumneavoastră medical</div>
        </div>

        {/* Tabs */}
        <div className={s.tabs}>
          <button className={`${s.tab} ${tab === 'programari' ? s.tabActive : ''}`} onClick={() => setTab('programari')}>📅 Programări</button>
          <button className={`${s.tab} ${tab === 'consultatii' ? s.tabActive : ''}`} onClick={() => setTab('consultatii')}>🩺 Consultații</button>
          <button className={`${s.tab} ${tab === 'retete' ? s.tabActive : ''}`} onClick={() => setTab('retete')}>💊 Rețete</button>
        </div>

        {loading ? (
          <div className={s.loading}>Se încarcă...</div>
        ) : (
          <>
            {/* PROGRAMARI */}
            {tab === 'programari' && (
              <div>
                <div className={s.sectionHeader}>
                  <div className={s.sectionTitle} style={{ marginBottom: 0 }}>Programările mele</div>
                  <a href="/programare.html" className={s.btnNouaProgramare}>+ Programare nouă</a>
                </div>
                {!date?.programari?.length ? (
                  <Empty text="Nicio programare înregistrată" />
                ) : (
                  <div className={s.cardList}>
                    {date.programari.map(p => {
                      const st = STATUS_COLORS[p.status] || STATUS_COLORS.programat
                      return (
                        <div key={p.id} className={s.programareCard}>
                          <div>
                            <div className={s.programareData}>{formatData(p.data_ora)} · {formatOra(p.data_ora)}</div>
                            <div className={s.programareMotiv}>{p.motiv}</div>
                          </div>
                          <span className={s.statusBadge} style={{ background: st.bg, color: st.color }}>{st.label}</span>
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
                <div className={s.sectionTitle}>Istoricul consultațiilor</div>
                {!date?.consultatii?.length ? (
                  <Empty text="Nicio consultație înregistrată" />
                ) : (
                  <div className={s.cardList}>
                    {date.consultatii.map(c => (
                      <div key={c.id} className={s.consultatieCard}>
                        <div className={s.consultatieHeader}>
                          <div className={s.consultatieData}>{formatData(c.data_ora)}</div>
                          <div className={s.consultatieMedic}>Dr. {c.medic}</div>
                        </div>
                        <div className={s.consultatieRow}><span className={s.label}>Simptome:</span> {c.simptome}</div>
                        <div className={s.consultatieRow}><span className={s.label}>Tratament:</span> {c.tratament}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* RETETE */}
            {tab === 'retete' && (
              <div>
                <div className={s.sectionTitle}>Rețetele mele</div>
                {!date?.retete?.length ? (
                  <Empty text="Nicio rețetă înregistrată" />
                ) : (
                  <div className={s.cardList}>
                    {date.retete.map(r => (
                      <div key={r.id} className={s.retetaCard} onClick={() => setRetetaSelectata(r)}>
                        <div className={s.retetaNumar}>{r.numar}</div>
                        <div className={s.retetaData}>{formatData(r.data_prescriere)}</div>
                        <span className={`${s.retetaBadge} ${r.gratuit === 'da' ? s.retetaGratuit : s.retetaPlata}`}>
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
              <div className={s.overlay} onClick={() => setRetetaSelectata(null)}>
                <div className={s.modal} onClick={e => e.stopPropagation()}>
                  <div className={s.modalHeader}>
                    <div>
                      <div className={s.modalNumar}>{retetaSelectata.numar}</div>
                      <div className={s.modalData}>{formatData(retetaSelectata.data_prescriere)}</div>
                    </div>
                    <button className={s.btnClose} onClick={() => setRetetaSelectata(null)}>✕</button>
                  </div>
                  <div className={s.modalBody}>
                    {retetaSelectata.diagnostic && (
                      <div className={s.diagnostic}>
                        <span className={s.label}>Diagnostic: </span>{retetaSelectata.diagnostic}
                      </div>
                    )}
                    <div className={s.medicamenteTitle}>
                      Medicamente ({retetaSelectata.linii?.length || 0})
                    </div>
                    {retetaSelectata.linii?.map((l, i) => (
                      <div key={i} className={s.medicamentCard}>
                        <div className={s.medicamentNume}>{l.nume_medicament} {l.concentratie && `· ${l.concentratie}`}</div>
                        {l.doza_frecventa && (
                          <div className={s.medicamentDoza}><span className={s.label}>Doză: </span>{l.doza_frecventa}</div>
                        )}
                        <div className={s.medicamentMeta}>
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