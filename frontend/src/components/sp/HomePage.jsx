import { Link } from 'react-router-dom'
import s from '../../styles/sp.module.css'

export default function HomePage() {
  return (
    <section className={s.hero} id="acasa">
      <div className={s.heroInner}>
        <div>
          <div className={s.heroBadge}>✦ Cabinet acreditat · Cluj-Napoca</div>
          <h1 className={s.heroH1}>Îngrijire medicală <em>de încredere</em> pentru întreaga familie</h1>
          <p className={s.heroDesc}>
            Oferim consultații complete, urmărire continuă a stării de sănătate și o relație medicală bazată pe respect și comunicare deschisă.
          </p>
          <div className={s.heroActions}>
            <a href="/programare.html" className={s.btnPrimary}>📅 Programare online</a>
            <Link to="/despre" className={s.btnSecondary}>Află mai multe →</Link>
          </div>
        </div>

        <div className={s.heroCard}>
          <div className={s.cardHeader}>
            <div className={s.doctorAvatar}>M</div>
            <div className={s.cardHeaderInfo}>
              <h3>Dr. Ion Popescu</h3>
              <p>Medic de familie · Specialist în medicina preventivă</p>
            </div>
          </div>
          <div className={s.cardStats}>
            <div className={s.statItem}><div className={s.statNum}>15+</div><div className={s.statLabel}>Ani experiență</div></div>
            <div className={s.statItem}><div className={s.statNum}>800+</div><div className={s.statLabel}>Pacienți activi</div></div>
            <div className={s.statItem}><div className={s.statNum}>4.9★</div><div className={s.statLabel}>Recenzii</div></div>
          </div>
          <div className={s.cardProgramLink}>
            <Link to="/program">📅 Vezi programul complet →</Link>
          </div>
        </div>
      </div>
    </section>
  )
}