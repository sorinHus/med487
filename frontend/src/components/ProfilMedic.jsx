import { useState, useEffect } from 'react'
import api from '../api'
import s from '../styles/ProfilMedic.module.css'

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
    <div className={s.page}>
      <div className={s.header}>
        <button onClick={onBack} className={s.btnSecondary}>← Înapoi</button>
        <h2 className={s.pageTitle}>Profilul meu</h2>
      </div>

      <div className={s.card}>
        <div className={s.cardTitle}>Date personale</div>
        <div className={s.grid}>
          <div>
            <div className={s.label}>Prenume</div>
            <input className={s.input} value={form.first_name} onChange={set('first_name')} />
          </div>
          <div>
            <div className={s.label}>Nume</div>
            <input className={s.input} value={form.last_name} onChange={set('last_name')} />
          </div>
          <div className={s.fullWidth}>
            <div className={s.label}>Email</div>
            <input className={s.input} type="email" value={form.email} onChange={set('email')} />
          </div>
          <div>
            <div className={s.label}>Telefon</div>
            <input className={s.input} value={form.telefon} onChange={set('telefon')} placeholder="07xx xxx xxx" />
          </div>
          <div>
            <div className={s.label}>Parafă</div>
            <input className={s.input} value={form.parafa} onChange={set('parafa')} />
          </div>
          <div className={s.fullWidth}>
            <div className={s.label}>Cod medic (CNAS)</div>
            <input className={s.input} value={form.cod_medic} onChange={set('cod_medic')} />
          </div>
        </div>
        <div className={s.row}>
          <button onClick={salvezaProfil} className={s.btn} disabled={loading}>
            {loading ? 'Se salvează...' : 'Salvează'}
          </button>
          {msgProfil && <span className={msgProfil.ok ? s.msgOk : s.msgErr}>{msgProfil.text}</span>}
        </div>
      </div>

      <div className={s.card}>
        <div className={s.cardTitle}>Schimbare parolă</div>
        <div className={s.passwordStack}>
          <div>
            <div className={s.label}>Parola actuală</div>
            <input className={s.input} type="password" value={parole.parola_veche} onChange={setP('parola_veche')} />
          </div>
          <div>
            <div className={s.label}>Parola nouă</div>
            <input className={s.input} type="password" value={parole.parola_noua} onChange={setP('parola_noua')} />
          </div>
          <div>
            <div className={s.label}>Confirmă parola nouă</div>
            <input className={s.input} type="password" value={parole.parola_noua2} onChange={setP('parola_noua2')} />
          </div>
        </div>
        <div className={s.row}>
          <button onClick={schimbaParola} className={s.btn}>Schimbă parola</button>
          {msgParola && <span className={msgParola.ok ? s.msgOk : s.msgErr}>{msgParola.text}</span>}
        </div>
      </div>
    </div>
  )
}