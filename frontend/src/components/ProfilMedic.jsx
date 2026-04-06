import { useState, useEffect } from 'react'
import api from '../api'

const s = {
  page: { padding: '32px', maxWidth: '600px' },
  card: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '28px', marginBottom: '24px' },
  title: { color: 'var(--text-primary)', fontSize: '20px', fontWeight: 600, marginBottom: '20px' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  label: { color: 'var(--text-muted)', fontSize: '13px', marginBottom: '4px' },
  input: { width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px', padding: '9px 12px', color: 'var(--text-primary)', fontSize: '14px', boxSizing: 'border-box' },
  inputFull: { gridColumn: '1 / -1' },
  btn: { background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 24px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 },
  btnSecondary: { background: 'var(--bg-hover)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 24px', cursor: 'pointer', fontSize: '14px' },
  msg: (ok) => ({ color: ok ? '#34d399' : '#f87171', fontSize: '13px', marginTop: '12px' }),
  row: { display: 'flex', gap: '12px', marginTop: '20px', alignItems: 'center' },
}

export default function ProfilMedic({ onBack }) {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', telefon: '', parafa: '', cod_medic: '' })
  const [parole, setParole] = useState({ parola_veche: '', parola_noua: '', parola_noua2: '' })
  const [msgProfil, setMsgProfil] = useState(null)
  const [msgParola, setMsgParola] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/profil/')
      .then(r => setForm({
        first_name: r.data.first_name || '',
        last_name: r.data.last_name || '',
        email: r.data.email || '',
        telefon: r.data.telefon || '',
        parafa: r.data.parafa || '',
        cod_medic: r.data.cod_medic || '',
      }))
      .catch(() => setMsgProfil({ ok: false, text: 'Eroare la încărcarea profilului.' }))
  }, [])

  const salvezaProfil = async () => {
    setLoading(true); setMsgProfil(null)
    try {
      await api.patch('/profil/', form)
      setMsgProfil({ ok: true, text: 'Profil salvat cu succes.' })
    } catch {
      setMsgProfil({ ok: false, text: 'Eroare la salvare.' })
    }
    setLoading(false)
  }

  const schimbaParola = async () => {
    setMsgParola(null)
    if (parole.parola_noua !== parole.parola_noua2) {
      setMsgParola({ ok: false, text: 'Parolele noi nu coincid.' }); return
    }
    try {
      await api.post('/profil/schimbare-parola/', {
        parola_veche: parole.parola_veche,
        parola_noua: parole.parola_noua,
      })
      setMsgParola({ ok: true, text: 'Parola a fost schimbată.' })
      setParole({ parola_veche: '', parola_noua: '', parola_noua2: '' })
    } catch (e) {
      setMsgParola({ ok: false, text: e.response?.data?.parola_veche || 'Eroare la schimbarea parolei.' })
    }
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))
  const setP = (k) => (e) => setParole(p => ({ ...p, [k]: e.target.value }))

  return (
    <div style={s.page}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <button onClick={onBack} style={s.btnSecondary}>← Înapoi</button>
        <h2 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '22px' }}>Profilul meu</h2>
      </div>

      <div style={s.card}>
        <div style={s.title}>Date personale</div>
        <div style={s.grid}>
          <div>
            <div style={s.label}>Prenume</div>
            <input style={s.input} value={form.first_name} onChange={set('first_name')} />
          </div>
          <div>
            <div style={s.label}>Nume</div>
            <input style={s.input} value={form.last_name} onChange={set('last_name')} />
          </div>
          <div style={s.inputFull}>
            <div style={s.label}>Email</div>
            <input style={s.input} type="email" value={form.email} onChange={set('email')} />
          </div>
          <div>
            <div style={s.label}>Telefon</div>
            <input style={s.input} value={form.telefon} onChange={set('telefon')} placeholder="07xx xxx xxx" />
          </div>
          <div>
            <div style={s.label}>Parafă</div>
            <input style={s.input} value={form.parafa} onChange={set('parafa')} />
          </div>
          <div style={s.inputFull}>
            <div style={s.label}>Cod medic (CNAS)</div>
            <input style={s.input} value={form.cod_medic} onChange={set('cod_medic')} />
          </div>
        </div>
        <div style={s.row}>
          <button onClick={salvezaProfil} style={s.btn} disabled={loading}>
            {loading ? 'Se salvează...' : 'Salvează'}
          </button>
          {msgProfil && <span style={s.msg(msgProfil.ok)}>{msgProfil.text}</span>}
        </div>
      </div>

      <div style={s.card}>
        <div style={s.title}>Schimbare parolă</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <div style={s.label}>Parola actuală</div>
            <input style={s.input} type="password" value={parole.parola_veche} onChange={setP('parola_veche')} />
          </div>
          <div>
            <div style={s.label}>Parola nouă</div>
            <input style={s.input} type="password" value={parole.parola_noua} onChange={setP('parola_noua')} />
          </div>
          <div>
            <div style={s.label}>Confirmă parola nouă</div>
            <input style={s.input} type="password" value={parole.parola_noua2} onChange={setP('parola_noua2')} />
          </div>
        </div>
        <div style={s.row}>
          <button onClick={schimbaParola} style={s.btn}>Schimbă parola</button>
          {msgParola && <span style={s.msg(msgParola.ok)}>{msgParola.text}</span>}
        </div>
      </div>
    </div>
  )
}