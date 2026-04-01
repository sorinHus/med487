import { useState, useEffect } from 'react'
import api from '../api'

const s = {
  root: { minHeight: '100vh', background: '#0f1117', color: '#e2e8f0', fontFamily: "'DM Sans', system-ui, sans-serif" },
  header: { background: '#161b27', borderBottom: '1px solid #1e2535', padding: '0 2rem', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: '1.1rem', fontWeight: '600', color: '#e2e8f0' },
  headerSub: { fontSize: '0.75rem', color: '#4b5563', marginTop: '2px' },
  btnLogout: { background: 'transparent', border: '1px solid #1e2535', color: '#9ca3af', padding: '0.4rem 1rem', borderRadius: '7px', cursor: 'pointer', fontSize: '0.82rem' },
  main: { padding: '2rem', maxWidth: '1100px', margin: '0 auto' },
  tabs: { display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid #1e2535', paddingBottom: '0' },
  tab: (active) => ({ padding: '0.6rem 1.25rem', fontSize: '0.88rem', fontWeight: '500', cursor: 'pointer', border: 'none', background: 'transparent', color: active ? '#60a5fa' : '#4b5563', borderBottom: active ? '2px solid #60a5fa' : '2px solid transparent', marginBottom: '-1px', transition: 'color .2s' }),
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  pageTitle: { fontSize: '1.1rem', fontWeight: '600', color: '#e2e8f0' },
  btnAdd: { background: '#3a7bd5', color: 'white', border: 'none', padding: '0.55rem 1.25rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: '500' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#161b27', borderRadius: '12px', overflow: 'hidden', border: '1px solid #1e2535' },
  th: { padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: '1px solid #1e2535', background: '#161b27' },
  td: { padding: '0.85rem 1rem', fontSize: '0.88rem', borderBottom: '1px solid #1e2535', color: '#e2e8f0' },
  tdMuted: { padding: '0.85rem 1rem', fontSize: '0.88rem', borderBottom: '1px solid #1e2535', color: '#9ca3af' },
  badge: (rol) => ({
    display: 'inline-block', padding: '0.2rem 0.65rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: '500',
    background: rol === 'superadmin' ? 'rgba(251,191,36,0.15)' : rol === 'medic' ? 'rgba(58,123,213,0.15)' : rol === 'asistent' ? 'rgba(16,185,129,0.15)' : 'rgba(156,163,175,0.15)',
    color: rol === 'superadmin' ? '#fbbf24' : rol === 'medic' ? '#60a5fa' : rol === 'asistent' ? '#34d399' : '#9ca3af',
  }),
  badgeActiv: { display: 'inline-block', padding: '0.2rem 0.65rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: '500', background: 'rgba(16,185,129,0.15)', color: '#34d399' },
  badgeInactiv: { display: 'inline-block', padding: '0.2rem 0.65rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: '500', background: 'rgba(239,68,68,0.1)', color: '#f87171' },
  btnAction: { background: 'transparent', border: '1px solid #1e2535', color: '#9ca3af', padding: '0.3rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', marginRight: '0.4rem' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#161b27', border: '1px solid #1e2535', borderRadius: '14px', padding: '2rem', width: '460px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' },
  modalTitle: { fontSize: '1.05rem', fontWeight: '600', color: '#e2e8f0', marginBottom: '1.5rem' },
  label: { fontSize: '0.78rem', color: '#6b7280', display: 'block', marginBottom: '5px' },
  input: { width: '100%', padding: '9px 12px', fontSize: '0.88rem', background: '#0f1117', border: '1px solid #1e2535', borderRadius: '8px', color: '#e2e8f0', outline: 'none', marginBottom: '1rem', boxSizing: 'border-box' },
  select: { width: '100%', padding: '9px 12px', fontSize: '0.88rem', background: '#0f1117', border: '1px solid #1e2535', borderRadius: '8px', color: '#e2e8f0', outline: 'none', marginBottom: '1rem', boxSizing: 'border-box' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' },
  btnCancel: { background: 'transparent', border: '1px solid #1e2535', color: '#9ca3af', padding: '0.5rem 1.1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.88rem' },
  btnSave: { background: '#3a7bd5', color: 'white', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: '500' },
  error: { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '0.6rem 1rem', color: '#f87171', fontSize: '0.82rem', marginBottom: '1rem' },
  moduleCard: { background: '#161b27', border: '1px solid #1e2535', borderRadius: '12px', padding: '1.25rem 1.5rem', marginBottom: '1rem' },
  moduleCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  moduleCardName: { fontSize: '0.95rem', fontWeight: '500', color: '#e2e8f0' },
  moduleCardSub: { fontSize: '0.78rem', color: '#4b5563', marginTop: '2px' },
  moduleGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' },
  moduleChip: (active) => ({ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.75rem', borderRadius: '8px', border: `1px solid ${active ? '#3a7bd5' : '#1e2535'}`, background: active ? 'rgba(58,123,213,0.1)' : 'transparent', cursor: 'pointer', fontSize: '0.78rem', color: active ? '#60a5fa' : '#4b5563', transition: 'all .15s' }),
}

const TOATE_MODULELE = [
  { key: 'pacienti', label: 'Pacienți' },
  { key: 'consultatii', label: 'Consultații' },
  { key: 'programari', label: 'Programări' },
  { key: 'retete', label: 'Rețete' },
  { key: 'trimiteri', label: 'Trimiteri' },
  { key: 'concedii', label: 'Concedii' },
  { key: 'rapoarte', label: 'Rapoarte' },
]

const ROL_LABELS = { medic: 'Medic', asistent: 'Asistent', superadmin: 'Superadmin', pacient: 'Pacient' }
const emptyForm = { username: '', first_name: '', last_name: '', email: '', rol: 'medic', password: '', telefon: '', parafa: '', cod_medic: '' }

export default function SuperadminPanel({ onLogout }) {
  const [tab, setTab]             = useState('useri')
  const [useri, setUseri]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm]           = useState(emptyForm)
  const [editId, setEditId]       = useState(null)
  const [error, setError]         = useState(null)
  const [saving, setSaving]       = useState(false)
  const [module, setModule]       = useState({}) // { userId: ['pacienti', ...] }
  const [savingModule, setSavingModule] = useState({})
  const [setari, setSetari]         = useState(null)
  const [savingSetari, setSavingSetari] = useState(false)
  const [setariSaved, setSetariSaved]   = useState(false)

  const fetchUseri = () => {
    api.get('/useri/').then(res => {
      const list = res.data.results || res.data
      setUseri(list)
      setLoading(false)
    })
  }

  const fetchModule = (userId) => {
    api.get(`/module/${userId}/`).then(res => {
      setModule(prev => ({ ...prev, [userId]: res.data.active }))
    })
  }

  useEffect(() => { fetchUseri() }, [])
  useEffect(() => {
    if (tab === 'setari' && !setari) {
      api.get('/configuratie/1/').then(res => setSetari(res.data))
    }
  }, [tab])

  useEffect(() => {
    if (tab === 'module') {
      useri.filter(u => u.rol === 'medic' || u.rol === 'asistent').forEach(u => fetchModule(u.id))
    }
  }, [tab, useri])

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
      if (editId) { await api.patch(`/useri/${editId}/`, payload) }
      else { await api.post('/useri/', payload) }
      setShowModal(false)
      fetchUseri()
    } catch (e) {
      const data = e.response?.data
      if (data) {
        const msgs = Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ')
        setError(msgs)
      } else { setError('Eroare la salvare.') }
    } finally { setSaving(false) }
  }

  const handleToggleActiv = async (u) => {
    await api.post(`/useri/${u.id}/toggle_activ/`)
    fetchUseri()
  }

  const f = (field, val) => setForm(prev => ({ ...prev, [field]: val }))

  const useriMedici = useri.filter(u => u.rol === 'medic' || u.rol === 'asistent')
  const handleSaveSetari = async () => {
    setSavingSetari(true)
    await api.patch('/configuratie/1/', setari)
    setSavingSetari(false)
    setSetariSaved(true)
    setTimeout(() => setSetariSaved(false), 2500)
  }

  return (
    <div style={s.root}>
      <div style={s.header}>
        <div>
          <div style={s.headerTitle}>⚙️ Panou Administrare</div>
          <div style={s.headerSub}>MED487 — Superadmin</div>
        </div>
        <button style={s.btnLogout} onClick={onLogout}>Deconectare</button>
      </div>

      <div style={s.main}>
        {/* TABS */}
        <div style={s.tabs}>
          <button style={s.tab(tab === 'useri')} onClick={() => setTab('useri')}>Utilizatori</button>
          <button style={s.tab(tab === 'module')} onClick={() => setTab('module')}>Module</button>
          <button style={s.tab(tab === 'setari')} onClick={() => setTab('setari')}>Setări globale</button>
        </div>

        {/* TAB USERI */}
        {tab === 'useri' && <>
          <div style={s.topBar}>
            <div style={s.pageTitle}>Utilizatori</div>
            <button style={s.btnAdd} onClick={openAdd}>+ Cont nou</button>
          </div>
          {loading ? <div style={{ color: '#4b5563', padding: '2rem' }}>Se încarcă...</div> : (
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>#</th>
                  <th style={s.th}>Nume</th>
                  <th style={s.th}>Username</th>
                  <th style={s.th}>Rol</th>
                  <th style={s.th}>Status</th>
                  <th style={s.th}>Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {useri.map((u, i) => (
                  <tr key={u.id}>
                    <td style={s.tdMuted}>{i + 1}</td>
                    <td style={s.td}>{u.first_name} {u.last_name}</td>
                    <td style={s.tdMuted}>{u.username}</td>
                    <td style={s.td}><span style={s.badge(u.rol)}>{ROL_LABELS[u.rol] || u.rol}</span></td>
                    <td style={s.td}><span style={u.is_active ? s.badgeActiv : s.badgeInactiv}>{u.is_active ? 'Activ' : 'Inactiv'}</span></td>
                    <td style={s.td}>
                      <button style={s.btnAction} onClick={() => openEdit(u)}>Editează</button>
                      <button style={s.btnAction} onClick={() => handleToggleActiv(u)}>{u.is_active ? 'Dezactivează' : 'Activează'}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>}

        {/* TAB SETARI */}
        {tab === 'setari' && <>
          <div style={s.topBar}>
            <div style={s.pageTitle}>Setări globale</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {setariSaved && <span style={{ fontSize: '0.82rem', color: '#34d399' }}>✓ Salvat</span>}
              <button style={s.btnAdd} onClick={handleSaveSetari} disabled={savingSetari}>
                {savingSetari ? 'Se salvează...' : 'Salvează'}
              </button>
            </div>
          </div>
          {!setari ? <div style={{ color: '#4b5563' }}>Se încarcă...</div> : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div style={s.moduleCard}>
                <div style={{ fontSize: '0.8rem', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '1rem' }}>Identitate cabinet</div>
                <label style={s.label}>Denumire unitate</label>
                <input style={s.input} value={setari.denumire_unitate || ''} onChange={e => setSetari(p => ({ ...p, denumire_unitate: e.target.value }))} />
                <label style={s.label}>Localitate</label>
                <input style={s.input} value={setari.localitate || ''} onChange={e => setSetari(p => ({ ...p, localitate: e.target.value }))} />
                <label style={s.label}>Județ</label>
                <input style={s.input} value={setari.judet || ''} onChange={e => setSetari(p => ({ ...p, judet: e.target.value }))} />
                <label style={s.label}>Stradă</label>
                <input style={s.input} value={setari.strada || ''} onChange={e => setSetari(p => ({ ...p, strada: e.target.value }))} />
                <label style={s.label}>Număr</label>
                <input style={s.input} value={setari.numar || ''} onChange={e => setSetari(p => ({ ...p, numar: e.target.value }))} />
                <label style={s.label}>Telefon</label>
                <input style={s.input} value={setari.telefon || ''} onChange={e => setSetari(p => ({ ...p, telefon: e.target.value }))} />
                <label style={s.label}>Email cabinet</label>
                <input style={s.input} value={setari.email || ''} onChange={e => setSetari(p => ({ ...p, email: e.target.value }))} />
                <label style={s.label}>CUI</label>
                <input style={s.input} value={setari.cui || ''} onChange={e => setSetari(p => ({ ...p, cui: e.target.value }))} />
                <label style={s.label}>Cod parafă medic</label>
                <input style={s.input} value={setari['cod_parafă'] || ''} onChange={e => setSetari(p => ({ ...p, 'cod_parafă': e.target.value }))} />
              </div>
              <div>
                <div style={{ ...s.moduleCard, marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.8rem', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '1rem' }}>Programări</div>
                  <label style={s.label}>Durată slot (minute)</label>
                  <input style={s.input} type="number" min="5" max="120" value={setari.durata_slot || 30} onChange={e => setSetari(p => ({ ...p, durata_slot: parseInt(e.target.value) }))} />
                  <label style={s.label}>Max programări per zi</label>
                  <input style={s.input} type="number" min="1" max="100" value={setari.max_programari_zi || 20} onChange={e => setSetari(p => ({ ...p, max_programari_zi: parseInt(e.target.value) }))} />
                </div>
                <div style={s.moduleCard}>
                  <div style={{ fontSize: '0.8rem', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '1rem' }}>Sistem</div>
                  <label style={s.label}>Email contact support</label>
                  <input style={s.input} value={setari.email_contact || ''} onChange={e => setSetari(p => ({ ...p, email_contact: e.target.value }))} />
                  <label style={s.label}>Mod mentenanță</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div onClick={() => setSetari(p => ({ ...p, mod_mentenanta: !p.mod_mentenanta }))}
                      style={{ width: '44px', height: '24px', borderRadius: '999px', background: setari.mod_mentenanta ? '#ef4444' : '#1e2535', cursor: 'pointer', position: 'relative', transition: 'background .2s' }}>
                      <div style={{ position: 'absolute', top: '3px', left: setari.mod_mentenanta ? '22px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: 'white', transition: 'left .2s' }} />
                    </div>
                    <span style={{ fontSize: '0.85rem', color: setari.mod_mentenanta ? '#f87171' : '#4b5563' }}>
                      {setari.mod_mentenanta ? 'Activ — utilizatorii nu pot accesa aplicația' : 'Inactiv'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>}
        {/* TAB MODULE */}
        {tab === 'module' && <>
          <div style={s.topBar}>
            <div style={s.pageTitle}>Module per utilizator</div>
          </div>
          {useriMedici.length === 0 ? (
            <div style={{ color: '#4b5563', padding: '2rem' }}>Nu există utilizatori de tip medic sau asistent.</div>
          ) : useriMedici.map(u => (
            <div style={s.moduleCard} key={u.id}>
              <div style={s.moduleCardHeader}>
                <div>
                  <div style={s.moduleCardName}>{u.first_name} {u.last_name}</div>
                  <div style={s.moduleCardSub}>{u.username} · <span style={s.badge(u.rol)}>{ROL_LABELS[u.rol]}</span></div>
                </div>
                {savingModule[u.id] && <span style={{ fontSize: '0.75rem', color: '#4b5563' }}>Se salvează...</span>}
              </div>
              <div style={s.moduleGrid}>
                {TOATE_MODULELE.map(m => {
                  const active = (module[u.id] || []).includes(m.key)
                  return (
                    <div key={m.key} style={s.moduleChip(active)} onClick={() => toggleModul(u.id, m.key)}>
                      <span>{active ? '✓' : '○'}</span>
                      <span>{m.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </>}
      </div>

      {/* MODAL */}
      {showModal && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={s.modal}>
            <div style={s.modalTitle}>{editId ? 'Editează utilizator' : 'Cont nou'}</div>
            {error && <div style={s.error}>{error}</div>}
            <label style={s.label}>Prenume *</label>
            <input style={s.input} value={form.first_name} onChange={e => f('first_name', e.target.value)} />
            <label style={s.label}>Nume *</label>
            <input style={s.input} value={form.last_name} onChange={e => f('last_name', e.target.value)} />
            <label style={s.label}>Username *</label>
            <input style={s.input} value={form.username} onChange={e => f('username', e.target.value)} />
            <label style={s.label}>Email</label>
            <input style={s.input} value={form.email} onChange={e => f('email', e.target.value)} />
            <label style={s.label}>Rol *</label>
            <select style={s.select} value={form.rol} onChange={e => f('rol', e.target.value)}>
              <option value="medic">Medic</option>
              <option value="asistent">Asistent</option>
              <option value="superadmin">Superadmin</option>
            </select>
            <label style={s.label}>Parolă {editId ? '(lasă gol pentru a păstra)' : '*'}</label>
            <input style={s.input} type="password" value={form.password} onChange={e => f('password', e.target.value)} />
            {(form.rol === 'medic' || form.rol === 'asistent') && <>
              <label style={s.label}>Telefon</label>
              <input style={s.input} value={form.telefon} onChange={e => f('telefon', e.target.value)} />
              <label style={s.label}>Parafă</label>
              <input style={s.input} value={form.parafa} onChange={e => f('parafa', e.target.value)} />
              <label style={s.label}>Cod medic</label>
              <input style={s.input} value={form.cod_medic} onChange={e => f('cod_medic', e.target.value)} />
            </>}
            <div style={s.modalActions}>
              <button style={s.btnCancel} onClick={() => setShowModal(false)}>Anulează</button>
              <button style={s.btnSave} onClick={handleSave} disabled={saving}>{saving ? 'Se salvează...' : 'Salvează'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}