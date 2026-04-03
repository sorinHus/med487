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
    <>
      {/* PROGRAM */}
      <section className="sp-section sp-program-page">
        <div className="sp-section-inner">
          <div className="sp-reveal">
            <span className="sp-section-tag">Orar</span>
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

      {/* CONTACT */}
      <section className="sp-section sp-contact-page">
        <div className="sp-section-inner">
          <div className="sp-reveal">
            <span className="sp-section-tag">Contact</span>
            <h2 className="sp-section-title">Luați legătura cu noi</h2>
          </div>
          <div className="sp-contact-grid">
            <div className="sp-contact-card sp-reveal">
              <h3>Informații de contact</h3>
              <div className="sp-contact-item"><div className="sp-contact-icon">📍</div><div><div className="sp-contact-label">Adresă</div><div className="sp-contact-value">{config?.strada ? `${config.strada} nr. ${config.numar}, ` : 'Str. Exemplu nr. 10, '}{config?.localitate || 'Cluj-Napoca'}</div></div></div>
              <div className="sp-contact-item"><div className="sp-contact-icon">📞</div><div><div className="sp-contact-label">Telefon</div><div className="sp-contact-value">{config?.telefon || '0264 000 000'}</div></div></div>
              <div className="sp-contact-item"><div className="sp-contact-icon">✉️</div><div><div className="sp-contact-label">Email</div><div className="sp-contact-value">{config?.email_contact || config?.email || 'contact@cabinetmedical.ro'}</div></div></div>
            </div>
            <div className="sp-programare-box sp-reveal">
              <h3>Programează o consultație</h3>
              <p>Alege data și ora convenabilă direct online, fără apeluri telefonice și fără timp de așteptare.</p>
              <a href="/programare.html" className="sp-btn-programare">📅 Programare online</a>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}