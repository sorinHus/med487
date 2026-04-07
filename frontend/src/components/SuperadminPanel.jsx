import { useState, useEffect } from 'react'
import api from '../api'
import s from '../styles/SuperadminPanel.module.css'

const TOATE_MODULELE = [
  { key: 'pacienti', label: 'Pacienți' },
  { key: 'consultatii', label: 'Consultații' },
  { key: 'programari', label: 'Programări' },
  { key: 'retete', label: 'Rețete' },
  { key: 'trimiteri', label: 'Trimiteri' },
  { key: 'concedii', label: 'Concedii' },
  { key: 'rapoarte', label: 'Rapoarte' },
  { key: 'cereri-pacienti', label: 'Cereri pacienți' },
]

const ROL_LABELS = { medic: 'Medic', asistent: 'Asistent', superadmin: 'Superadmin', pacient: 'Pacient' }
const emptyForm = { username: '', first_name: '', last_name: '', email: '', rol: 'medic', password: '', telefon: '', parafa: '', cod_medic: '' }

const ACTIUNE_LABELS = {
  login: 'Login', logout: 'Logout',
  creare_pacient: 'Creare pacient', modificare_pacient: 'Modificare pacient', stergere_pacient: 'Ștergere pacient',
  creare_consultatie: 'Creare consultație', creare_reteta: 'Creare rețetă',
  creare_trimitere: 'Creare trimitere', creare_concediu: 'Creare concediu',
  aprobare_cerere: 'Aprobare cerere', respingere_cerere: 'Respingere cerere',
  export_xml: 'Export XML', upload_document: 'Upload document', stergere_document: 'Ștergere document',
  import_pacienti: 'Import pacienți', creare_user: 'Creare utilizator', stergere_user: 'Ștergere utilizator',
}

const ACTIUNE_COLOR = {
  creare_pacient: '#34d399', modificare_pacient: '#60a5fa', stergere_pacient: '#f87171',
  creare_consultatie: '#34d399', creare_reteta: '#34d399', creare_trimitere: '#34d399', creare_concediu: '#34d399',
  aprobare_cerere: '#34d399', respingere_cerere: '#f87171',
  export_xml: '#fbbf24', upload_document: '#a78bfa', stergere_document: '#f87171',
  import_pacienti: '#fbbf24', creare_user: '#34d399', stergere_user: '#f87171',
  login: '#60a5fa', logout: '#9ca3af',
}

function badgeClass(rol) {
  if (rol === 'superadmin') return s.badgeSuperadmin
  if (rol === 'medic')      return s.badgeMedic
  if (rol === 'asistent')   return s.badgeAsistent
  return s.badgePacient
}

export default function SuperadminPanel({ onLogout }) {
  const [tab, setTab]             = useState('useri')
  const [useri, setUseri]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm]           = useState(emptyForm)
  const [editId, setEditId]       = useState(null)
  const [error, setError]         = useState(null)
  const [saving, setSaving]       = useState(false)
  const [module, setModule]       = useState({})
  const [savingModule, setSavingModule] = useState({})
  const [setari, setSetari]         = useState(null)
  const [savingSetari, setSavingSetari] = useState(false)
  const [setariSaved, setSetariSaved]   = useState(false)
  const [loguri, setLoguri]         = useState([])
  const [loadingLoguri, setLoadingLoguri] = useState(false)
  const [filtruActiune, setFiltruActiune] = useState('')
  const [filtruUser, setFiltruUser]       = useState('')

  const fetchUseri = () => {
    api.get('/useri/').then(res => { setUseri(res.data.results || res.data); setLoading(false) })
  }
  const fetchModule = (userId) => {
    api.get(`/module/${userId}/`).then(res => setModule(prev => ({ ...prev, [userId]: res.data.active })))
  }
  const fetchLoguri = () => {
    setLoadingLoguri(true)
    api.get('/loguri/').then(res => setLoguri(res.data)).catch(() => {}).finally(() => setLoadingLoguri(false))
  }

  useEffect(() => { fetchUseri() }, [])
  useEffect(() => { if (tab === 'setari' && !setari) api.get('/configuratie/1/').then(res => setSetari(res.data)) }, [tab])
  useEffect(() => { if (tab === 'module') useri.filter(u => u.rol === 'medic' || u.rol === 'asistent').forEach(u => fetchModule(u.id)) }, [tab, useri])
  useEffect(() => { if (tab === 'loguri') fetchLoguri() }, [tab])

  const toggleModul = async (userId, modKey) => {
    const current = module[userId] || []
    const updated = current.includes(modKey) ? current.filter(m => m !== modKey) : [...current, modKey]
    setModule(prev => ({ ...prev, [userId]: updated }))
    setSavingModule(prev => ({ ...prev, [userId]: true }))
    await api.put(`/module/${userId}/`, { active: updated })
    setSavingModule(prev => ({ ...prev, [userId]: false }))
  }

  const openAdd = () => { setForm(emptyForm); setEditId(null); setError(null); setShowModal(true) }
  const openEdit = (u) => {
    setForm({ username: u.username, first_name: u.first_name, last_name: u.last_name, email: u.email || '', rol: u.rol, password: '', telefon: u.telefon || '', parafa: u.parafa || '', cod_medic: u.cod_medic || '' })
    setEditId(u.id); setError(null); setShowModal(true)
  }

  const handleSave = async () => {
    setError(null)
    if (!form.username || !form.first_name || !form.last_name || !form.rol) { setError('Completează câmpurile obligatorii: username, nume, prenume, rol.'); return }
    if (!editId && !form.password) { setError('Parola este obligatorie la crearea unui cont nou.'); return }
    setSaving(true)
    try {
      const payload = { ...form }
      if (!payload.password) delete payload.password
      if (editId) await api.patch(`/useri/${editId}/`, payload)
      else await api.post('/useri/', payload)
      setShowModal(false); fetchUseri()
    } catch (e) {
      const data = e.response?.data
      if (data) setError(Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | '))
      else setError('Eroare la salvare.')
    } finally { setSaving(false) }
  }

  const handleToggleActiv = async (u) => { await api.post(`/useri/${u.id}/toggle_activ/`); fetchUseri() }

  const handleDelete = async (u) => {
    if (!window.confirm(`Ești sigur că vrei să ștergi contul lui ${u.first_name} ${u.last_name}? Acțiunea este ireversibilă.`)) return
    try { await api.delete(`/useri/${u.id}/`); fetchUseri() }
    catch { alert('Eroare la ștergere.') }
  }

  const f = (field, val) => setForm(prev => ({ ...prev, [field]: val }))
  const useriMedici = useri.filter(u => u.rol === 'medic' || u.rol === 'asistent')

  const handleSaveSetari = async () => {
    setSavingSetari(true)
    try {
      await api.patch('/configuratie/1/', setari)
      setSetariSaved(true); setTimeout(() => setSetariSaved(false), 2500)
    } catch (err) { console.error('Eroare salvare setari:', err.response?.data || err.message); alert('Eroare la salvare.') }
    finally { setSavingSetari(false) }
  }

  const loguriAfisate = loguri.filter(l => {
    if (filtruActiune && l.actiune !== filtruActiune) return false
    if (filtruUser && !l.username.toLowerCase().includes(filtruUser.toLowerCase()) && !l.user.toLowerCase().includes(filtruUser.toLowerCase())) return false
    return true
  })

  return (
    <div className={s.root}>
      <div className={s.header}>
        <div>
          <div className={s.headerTitle}>⚙️ Panou Administrare</div>
          <div className={s.headerSub}>MED487 — Superadmin</div>
        </div>
        <button className={s.btnLogout} onClick={onLogout}>Deconectare</button>
      </div>

      <div className={s.main}>
        <div className={s.tabs}>
          <button className={`${s.tab} ${tab === 'useri' ? s.tabActive : ''}`} onClick={() => setTab('useri')}>Utilizatori</button>
          <button className={`${s.tab} ${tab === 'module' ? s.tabActive : ''}`} onClick={() => setTab('module')}>Module</button>
          <button className={`${s.tab} ${tab === 'setari' ? s.tabActive : ''}`} onClick={() => setTab('setari')}>Setări globale</button>
          <button className={`${s.tab} ${tab === 'loguri' ? s.tabActive : ''}`} onClick={() => setTab('loguri')}>Loguri activitate</button>
        </div>

        {/* ── Tab: Utilizatori ── */}
        {tab === 'useri' && <>
          <div className={s.topBar}>
            <div className={s.pageTitle}>Utilizatori</div>
            <button className={s.btnAdd} onClick={openAdd}>+ Cont nou</button>
          </div>
          {loading ? <div className={s.loading}>Se încarcă...</div> : (
            <table className={s.table}>
              <thead>
                <tr>
                  <th className={s.th}>#</th>
                  <th className={s.th}>Nume</th>
                  <th className={s.th}>Username</th>
                  <th className={s.th}>Rol</th>
                  <th className={s.th}>Status</th>
                  <th className={s.th}>Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {useri.map((u, i) => (
                  <tr key={u.id}>
                    <td className={s.tdMuted}>{i + 1}</td>
                    <td className={s.td}>{u.first_name} {u.last_name}</td>
                    <td className={s.tdMuted}>{u.username}</td>
                    <td className={s.td}><span className={`${s.badge} ${badgeClass(u.rol)}`}>{ROL_LABELS[u.rol] || u.rol}</span></td>
                    <td className={s.td}><span className={u.is_active ? s.badgeActiv : s.badgeInactiv}>{u.is_active ? 'Activ' : 'Inactiv'}</span></td>
                    <td className={s.td}>
                      <button className={s.btnAction} onClick={() => openEdit(u)}>Editează</button>
                      <button className={s.btnAction} onClick={() => handleToggleActiv(u)}>{u.is_active ? 'Dezactivează' : 'Activează'}</button>
                      <button className={s.btnDelete} onClick={() => handleDelete(u)}>Șterge</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>}

        {/* ── Tab: Setări globale ── */}
        {tab === 'setari' && <>
          <div className={s.topBar}>
            <div className={s.pageTitle}>Setări globale</div>
            <div className={s.topBarRight}>
              {setariSaved && <span className={s.savedMsg}>✓ Salvat</span>}
              <button className={s.btnAdd} onClick={handleSaveSetari} disabled={savingSetari}>{savingSetari ? 'Se salvează...' : 'Salvează'}</button>
            </div>
          </div>
          {!setari ? <div className={s.loading}>Se încarcă...</div> : (
            <div className={s.setariGrid}>
              <div className={s.moduleCard}>
                <div className={s.sectionLabel}>Identitate cabinet</div>
                {[['denumire_unitate','Denumire unitate'],['localitate','Localitate'],['judet','Județ'],['strada','Stradă'],['numar','Număr'],['telefon','Telefon'],['email','Email cabinet'],['cui','CUI']].map(([key, lbl]) => (
                  <div key={key}>
                    <label className={s.label}>{lbl}</label>
                    <input className={s.input} value={setari[key] || ''} onChange={e => setSetari(p => ({ ...p, [key]: e.target.value }))} />
                  </div>
                ))}
                <label className={s.label}>Cod parafă medic</label>
                <input className={s.input} value={setari['cod_parafă'] || ''} onChange={e => setSetari(p => ({ ...p, 'cod_parafă': e.target.value }))} />
              </div>
              <div>
                <div className={s.moduleCard} style={{ marginBottom: '1rem' }}>
                  <div className={s.sectionLabel}>Programări</div>
                  <label className={s.label}>Durată slot (minute)</label>
                  <input className={s.input} type="number" min="5" max="120" value={setari.durata_slot || 30} onChange={e => setSetari(p => ({ ...p, durata_slot: parseInt(e.target.value) }))} />
                  <label className={s.label}>Max programări per zi</label>
                  <input className={s.input} type="number" min="1" max="100" value={setari.max_programari_zi || 20} onChange={e => setSetari(p => ({ ...p, max_programari_zi: parseInt(e.target.value) }))} />
                </div>
                <div className={s.moduleCard} style={{ marginBottom: '1rem' }}>
                  <div className={s.sectionLabel}>Orar cabinet</div>
                  {['luni','marti','miercuri','joi','vineri','sambata','duminica'].map(zi => {
                    const orar = setari.orar_saptamanal || {}
                    const ziConfig = orar[zi] || { activ: false, intervale: [] }
                    const intervale = ziConfig.intervale || []
                    const updateZi = (nou) => setSetari(p => ({ ...p, orar_saptamanal: { ...(p.orar_saptamanal || {}), [zi]: nou } }))
                    const toggleActiv = () => updateZi({ ...ziConfig, activ: !ziConfig.activ })
                    const updateInterval = (idx, camp, val) => updateZi({ ...ziConfig, intervale: intervale.map((iv, i) => i === idx ? { ...iv, [camp]: val } : iv) })
                    const adaugaInterval = () => updateZi({ ...ziConfig, intervale: [...intervale, { start: '08:00', end: '13:00' }] })
                    const stergeInterval = (idx) => updateZi({ ...ziConfig, intervale: intervale.filter((_, i) => i !== idx) })
                    return (
                      <div key={zi} className={s.orarRow}>
                        <div className={s.orarRowHeader}>
                          <div onClick={toggleActiv} className={s.toggleTrack} style={{ background: ziConfig.activ ? 'var(--accent)' : 'var(--border)' }}>
                            <div className={s.toggleThumb} style={{ left: ziConfig.activ ? '18px' : '2px' }} />
                          </div>
                          <span className={s.orarZiLabel} style={{ color: ziConfig.activ ? 'var(--text-primary)' : 'var(--text-dim)' }}>{zi}</span>
                          {ziConfig.activ && <button onClick={adaugaInterval} className={s.btnInterval}>+ interval</button>}
                        </div>
                        {ziConfig.activ && (
                          <div className={s.orarIntervale}>
                            {intervale.map((iv, idx) => (
                              <div key={idx} className={s.intervalRow}>
                                <input type="time" value={iv.start} onChange={e => updateInterval(idx, 'start', e.target.value)} className={`${s.input} ${s.inputTime}`} />
                                <span className={s.intervalSep}>—</span>
                                <input type="time" value={iv.end} onChange={e => updateInterval(idx, 'end', e.target.value)} className={`${s.input} ${s.inputTime}`} />
                                <button onClick={() => stergeInterval(idx)} className={s.btnStergeInterval}>×</button>
                              </div>
                            ))}
                            {intervale.length === 0 && <div className={s.orarEmpty}>Niciun interval — adaugă unul</div>}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                <div className={s.moduleCard}>
                  <div className={s.sectionLabel}>Sistem</div>
                  <label className={s.label}>Email contact support</label>
                  <input className={s.input} value={setari.email_contact || ''} onChange={e => setSetari(p => ({ ...p, email_contact: e.target.value }))} />
                  <label className={s.label}>Mod mentenanță</label>
                  <div className={s.mentenantaRow}>
                    <div onClick={() => setSetari(p => ({ ...p, mod_mentenanta: !p.mod_mentenanta }))} className={s.toggleTrackLarge} style={{ background: setari.mod_mentenanta ? '#ef4444' : 'var(--border)' }}>
                      <div className={s.toggleThumbLarge} style={{ left: setari.mod_mentenanta ? '22px' : '3px' }} />
                    </div>
                    <span className={s.mentenantaLabel} style={{ color: setari.mod_mentenanta ? '#f87171' : 'var(--text-dim)' }}>
                      {setari.mod_mentenanta ? 'Activ — utilizatorii nu pot accesa aplicația' : 'Inactiv'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>}

        {/* ── Tab: Module ── */}
        {tab === 'module' && <>
          <div className={s.topBar}><div className={s.pageTitle}>Module per utilizator</div></div>
          {useriMedici.length === 0 ? (
            <div className={s.emptyState}>Nu există utilizatori de tip medic sau asistent.</div>
          ) : useriMedici.map(u => (
            <div className={s.moduleCard} key={u.id}>
              <div className={s.moduleCardHeader}>
                <div>
                  <div className={s.moduleCardName}>{u.first_name} {u.last_name}</div>
                  <div className={s.moduleCardSub}>{u.username} · <span className={`${s.badge} ${badgeClass(u.rol)}`}>{ROL_LABELS[u.rol]}</span></div>
                </div>
                {savingModule[u.id] && <span className={s.savingText}>Se salvează...</span>}
              </div>
              <div className={s.moduleGrid}>
                {TOATE_MODULELE.map(m => {
                  const active = (module[u.id] || []).includes(m.key)
                  return (
                    <div key={m.key} className={`${s.moduleChip} ${active ? s.moduleChipActive : ''}`} onClick={() => toggleModul(u.id, m.key)}>
                      <span>{active ? '✓' : '○'}</span>
                      <span>{m.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </>}

        {/* ── Tab: Loguri ── */}
        {tab === 'loguri' && <>
          <div className={s.topBar}>
            <div className={s.pageTitle}>Loguri activitate</div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                value={filtruUser}
                onChange={e => setFiltruUser(e.target.value)}
                placeholder="Caută utilizator..."
                className={s.input}
                style={{ marginBottom: 0, width: '180px' }}
              />
              <select value={filtruActiune} onChange={e => setFiltruActiune(e.target.value)} className={s.select} style={{ marginBottom: 0 }}>
                <option value="">Toate acțiunile</option>
                {Object.entries(ACTIUNE_LABELS).map(([val, lbl]) => (
                  <option key={val} value={val}>{lbl}</option>
                ))}
              </select>
              <button onClick={fetchLoguri} className={s.btnAdd}>↻ Refresh</button>
            </div>
          </div>
          {loadingLoguri ? <div className={s.loading}>Se încarcă...</div> : (
            <>
              <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '10px' }}>
                {loguriAfisate.length} înregistrări{filtruActiune || filtruUser ? ' (filtrat)' : ''}
              </div>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th className={s.th}>Data/Ora</th>
                    <th className={s.th}>Utilizator</th>
                    <th className={s.th}>Acțiune</th>
                    <th className={s.th}>Detalii</th>
                    <th className={s.th}>IP</th>
                  </tr>
                </thead>
                <tbody>
                  {loguriAfisate.length === 0 && (
                    <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>Niciun log găsit.</td></tr>
                  )}
                  {loguriAfisate.map(l => (
                    <tr key={l.id}>
                      <td className={s.tdMuted} style={{ whiteSpace: 'nowrap' }}>{l.timestamp}</td>
                      <td className={s.td}>
                        <div style={{ fontWeight: '500', fontSize: '13px' }}>{l.user}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{l.username}</div>
                      </td>
                      <td className={s.td}>
                        <span style={{
                          padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600',
                          background: `${ACTIUNE_COLOR[l.actiune] || '#9ca3af'}20`,
                          color: ACTIUNE_COLOR[l.actiune] || '#9ca3af',
                        }}>
                          {ACTIUNE_LABELS[l.actiune] || l.actiune}
                        </span>
                      </td>
                      <td className={s.tdMuted} style={{ fontSize: '12px', maxWidth: '240px' }}>{l.descriere || '—'}</td>
                      <td className={s.tdMuted} style={{ fontSize: '11px', fontFamily: 'monospace' }}>{l.ip || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </>}
      </div>

      {/* ── Modal utilizator ── */}
      {showModal && (
        <div className={s.overlay} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className={s.modal}>
            <div className={s.modalTitle}>{editId ? 'Editează utilizator' : 'Cont nou'}</div>
            {error && <div className={s.error}>{error}</div>}
            <label className={s.label}>Prenume *</label>
            <input className={s.input} value={form.first_name} onChange={e => f('first_name', e.target.value)} />
            <label className={s.label}>Nume *</label>
            <input className={s.input} value={form.last_name} onChange={e => f('last_name', e.target.value)} />
            <label className={s.label}>Username *</label>
            <input className={s.input} value={form.username} onChange={e => f('username', e.target.value)} />
            <label className={s.label}>Email</label>
            <input className={s.input} value={form.email} onChange={e => f('email', e.target.value)} />
            <label className={s.label}>Rol *</label>
            <select className={s.select} value={form.rol} onChange={e => f('rol', e.target.value)}>
              <option value="medic">Medic</option>
              <option value="asistent">Asistent</option>
              <option value="superadmin">Superadmin</option>
            </select>
            <label className={s.label}>Parolă {editId ? '(lasă gol pentru a păstra)' : '*'}</label>
            <input className={s.input} type="password" value={form.password} onChange={e => f('password', e.target.value)} />
            {(form.rol === 'medic' || form.rol === 'asistent') && <>
              <label className={s.label}>Telefon</label>
              <input className={s.input} value={form.telefon} onChange={e => f('telefon', e.target.value)} />
              <label className={s.label}>Parafă</label>
              <input className={s.input} value={form.parafa} onChange={e => f('parafa', e.target.value)} />
              <label className={s.label}>Cod medic</label>
              <input className={s.input} value={form.cod_medic} onChange={e => f('cod_medic', e.target.value)} />
            </>}
            <div className={s.modalActions}>
              <button className={s.btnCancel} onClick={() => setShowModal(false)}>Anulează</button>
              <button className={s.btnSave} onClick={handleSave} disabled={saving}>{saving ? 'Se salvează...' : 'Salvează'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}