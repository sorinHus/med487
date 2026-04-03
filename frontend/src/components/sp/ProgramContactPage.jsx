import { useEffect, useState } from 'react'

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
    <section className="sp-section sp-program-page">
      <div className="sp-section-inner">
        <div className="sp-reveal">
          <span className="sp-section-tag">Orar & Contact</span>
          <h2 className="sp-section-title">Program de lucru</h2>
          <p className="sp-section-desc">Vă recomandăm programarea online pentru a evita timpul de așteptare.</p>
        </div>
        <div className="sp-program-grid">
          <div className="sp-reveal">
            <table className="sp-program-table">
              <tbody>
                {ZILE_ORDINE.map(zi => {
                  const ziConfig = orar[zi]
                  const activ = ziConfig?.activ
                  const intervale = ziConfig?.intervale || []
                  return (
                    <tr key={zi}>
                      <td>{ZILE_NUME[zi]}</td>
                      <td className={activ ? '' : 'sp-closed'}>
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

          <div className="sp-info-box sp-reveal">
            <div className="sp-info-row"><div className="sp-info-icon">📍</div><div className="sp-info-text"><h4>Adresă cabinet</h4><p>{config?.strada ? `${config.strada} nr. ${config.numar}, ` : ''}{config?.localitate || 'Cluj-Napoca'}<br/>{config?.judet ? `Județul ${config.judet}, ` : ''}România</p></div></div>
            <div className="sp-info-row"><div className="sp-info-icon">📞</div><div className="sp-info-text"><h4>Telefon</h4><p>{config?.telefon || '–'}</p></div></div>
            <div className="sp-info-row"><div className="sp-info-icon">✉️</div><div className="sp-info-text"><h4>Email</h4><p>{config?.email_contact || config?.email || '–'}</p></div></div>
            <div className="sp-info-row"><div className="sp-info-icon">🌐</div><div className="sp-info-text"><h4>Programare online</h4><p>Disponibilă 24/7 prin formularul de pe site</p></div></div>
          </div>
        </div>
      </div>
    </section>
  )
}