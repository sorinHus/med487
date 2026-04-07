import { useEffect, useState } from 'react'
import s from '../styles/CereriPacienti.module.css'

const API = import.meta.env.VITE_API_URL || 'https://web-production-26811.up.railway.app/api'

export default function CereriPacienti({ onActiune }) {
  const [cereri, setCereri] = useState([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState(null)
  const [processing, setProcessing] = useState(null)

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
    if (processing) return
    setProcessing(pk)
    const token = localStorage.getItem('access')
    try {
      const r = await fetch(`${API}/cereri/${pk}/aprobare/`, {
        method: tip === 'aprobare' ? 'POST' : 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      console.log('status:', r.status, 'ok:', r.ok)
      const body = await r.json()
      console.log('body:', body)
      if (r.ok) {
        setMsg(tip === 'aprobare' ? 'Cont aprobat. Email trimis pacientului.' : 'Cerere respinsă.')
        setCereri(prev => prev.filter(c => c.id !== pk))
        if (onActiune) onActiune()
        setTimeout(() => setMsg(null), 3000)
      } else {
        setMsg('Eroare. Încearcă din nou.')
      }
    } catch (e) {
      console.log('catch error:', e)
      setMsg('Eroare. Încearcă din nou.')
    }
    finally { setProcessing(null) }
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