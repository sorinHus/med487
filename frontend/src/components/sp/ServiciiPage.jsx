import s from '../../styles/sp.module.css'

const SERVICII = [
  { icon: '🩺', title: 'Consultații generale', desc: 'Evaluare clinică completă pentru adulți și copii, diagnostic și plan de tratament personalizat.' },
  { icon: '💉', title: 'Vaccinări', desc: 'Schema completă de vaccinare conform calendarului național, pentru copii și adulți.' },
  { icon: '🔬', title: 'Investigații', desc: 'Bilete de trimitere pentru analize, imagistică și consultații de specialitate.' },
  { icon: '📄', title: 'Rețete și certificate', desc: 'Rețete compensate, certificate medicale și concedii medicale eliberate la consultație.' },
  { icon: '❤️', title: 'Monitorizare boli cronice', desc: 'Urmărire periodică pentru hipertensiune, diabet, boli respiratorii și alte afecțiuni cronice.' },
  { icon: '🛡️', title: 'Medicină preventivă', desc: 'Controale periodice, screening și sfaturi pentru un stil de viață sănătos.' },
]

export default function ServiciiPage() {
  return (
    <section className={`${s.section} ${s.servicii}`}>
      <div className={s.sectionInner}>
        <div className={s.reveal}>
          <span className={s.sectionTag}>Ce oferim</span>
          <h2 className={s.sectionTitle}>Servicii medicale complete</h2>
          <p className={s.sectionDesc}>Acoperim toate nevoile medicale de bază ale familiei tale, cu trimiteri rapide către specialiști când este necesar.</p>
        </div>
        <div className={s.serviciiGrid}>
          {SERVICII.map((serv, i) => (
            <div className={`${s.serviciuCard} ${s.reveal}`} key={i}>
              <div className={s.serviciuIcon}>{serv.icon}</div>
              <h3>{serv.title}</h3>
              <p>{serv.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}