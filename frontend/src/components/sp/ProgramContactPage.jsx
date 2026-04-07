import { useEffect, useState } from 'react'
import s from '../../styles/sp.module.css'

const ZILE_NUME = { luni: 'Luni', marti: 'Marți', miercuri: 'Miercuri', joi: 'Joi', vineri: 'Vineri', sambata: 'Sâmbătă', duminica: 'Duminică' }
const ZILE_ORDINE = ['luni', 'marti', 'miercuri', 'joi', 'vineri', 'sambata', 'duminica']

export default function ProgramContactPage() {
  const [config, setConfig] = useState(null)

  useEffect(() => {
    const API = import.meta.env.VITE_API_URL || 'https://web-production-26811.up.railway.app/api'
    fetch(`${API}/configuratie/`)
      .then(r => r.json())
      .then(data => setConfig(Array.isArray(data) ? data[0] : data))
      .catch(() => {})
  }, [])

  const orar = config?.orar_saptamanal || {}

  return (
    <section className={`${s.section} ${s.programPage}`}>
      <div className={s.sectionInner}>
        <div className={s.reveal}>
          <span className={s.sectionTag}>Orar & Contact</span>
          <h2 className={s.sectionTitle}>Program de lucru</h2>
          <p className={s.sectionDesc}>Vă recomandăm programarea online pentru a evita timpul de așteptare.</p>
        </div>
        <div className={s.programGrid}>
          <div className={s.reveal}>
            <table className={s.programTable}>
              <tbody>
                {ZILE_ORDINE.map(zi => {
                  const ziConfig = orar[zi]
                  const activ = ziConfig?.activ
                  const intervale = ziConfig?.intervale || []
                  return (
                    <tr key={zi}>
                      <td>{ZILE_NUME[zi]}</td>
                      <td className={activ ? '' : s.closed}>
                        {activ && intervale.length > 0
                          ? intervale.map((iv, i) => <span key={i}>{iv.start} – {iv.end}{i < intervale.length - 1 ? ', ' : ''}</span>)
                          : activ ? '–' : 'Închis'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className={`${s.infoBox} ${s.reveal}`}>
            <div className={s.infoRow}>
              <div className={s.infoIcon}>📍</div>
              <div className={s.infoText}>
                <h4>Adresă cabinet</h4>
                <p>{config?.strada ? `${config.strada} nr. ${config.numar}, ` : ''}{config?.localitate || 'Cluj-Napoca'}<br />{config?.judet ? `Județul ${config.judet}, ` : ''}România</p>
              </div>
            </div>
            <div className={s.infoRow}>
              <div className={s.infoIcon}>📞</div>
              <div className={s.infoText}><h4>Telefon</h4><p>{config?.telefon || '–'}</p></div>
            </div>
            <div className={s.infoRow}>
              <div className={s.infoIcon}>✉️</div>
              <div className={s.infoText}><h4>Email</h4><p>{config?.email_contact || config?.email || '–'}</p></div>
            </div>
            <div className={s.infoRow}>
              <div className={s.infoIcon}>🌐</div>
              <div className={s.infoText}><h4>Programare online</h4><p>Disponibilă 24/7 prin formularul de pe site</p></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}