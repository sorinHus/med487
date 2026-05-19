import { useEffect, useState } from 'react'
import api from '../api'
import s from '../styles/CereriPacienti.module.css'

export default function CereriPacienti({ onActiune }) {
  const [cereri, setCereri] = useState([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState(null)
  const [processing, setProcessing] = useState(null)

  useEffect(() => { fetchCereri() }, [])

  const fetchCereri = async () => {
    setLoading(true)
    try {
      const r = await api.get('/useri/', { params: { rol: 'pacient', aprobat: 'false' } })
      setCereri(Array.isArray(r.data) ? r.data : r.data.results || [])
    } catch {
      setCereri([])
    } finally { setLoading(false) }
  }

  const actiune = async (pk, tip) => {
    if (processing) return
    setProcessing(pk)
    try {
      if (tip === 'aprobare') {
        await api.post(`/cereri/${pk}/aprobare/`)
      } else {
        await api.delete(`/cereri/${pk}/aprobare/`)
      }
      setMsg(tip === 'aprobare' ? 'Cont aprobat. Email trimis pacientului.' : 'Cerere respinsă.')
      setCereri(prev => prev.filter(c => c.id !== pk))
      if (onActiune) onActiune()
      setTimeout(() => setMsg(null), 3000)
    } catch {
      setMsg('Eroare. Încearcă din nou.')
    } finally { setProcessing(null) }
  }

  return (
    <div className={s.root}>
      <div className={s.header}>
        <div className={s.header__title}>Cereri înregistrare pacienți</div>
        <div className={s.header__sub}>Aprobați sau respingeți cererile de cont nou</div>
      </div>

      {msg && <div className={s.msg}>{msg}</div>}

      {loading ? (
        <div className={s.loading}>Se încarcă...</div>
      ) : cereri.length === 0 ? (
        <div className={s.empty}>
          <div className={s.empty__icon}>✅</div>
          <div className={s.empty__text}>Nicio cerere în așteptare</div>
        </div>
      ) : (
        <div className={s.list}>
          {cereri.map(c => (
            <div key={c.id} className={s.card}>
              <div className={s.card__info}>
                <div className={s.card__name}>{c.last_name} {c.first_name}</div>
                <div className={s.card__contact}>
                  {c.email}{c.telefon ? ` · ${c.telefon}` : ''}
                </div>
              </div>
              <div className={s.card__actions}>
                <button
                  onClick={() => actiune(c.id, 'aprobare')}
                  disabled={processing === c.id}
                  className={s.btnAproba}
                >✓ Aprobă</button>
                <button
                  onClick={() => actiune(c.id, 'respingere')}
                  disabled={processing === c.id}
                  className={s.btnRespinge}
                >✕ Respinge</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
