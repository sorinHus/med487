import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <section className="sp-hero" id="acasa">
      <div className="sp-hero-inner">
        <div>
          <div className="sp-hero-badge">✦ Cabinet acreditat · Cluj-Napoca</div>
          <h1>Îngrijire medicală <em>de încredere</em> pentru întreaga familie</h1>
          <p className="sp-hero-desc">
            Oferim consultații complete, urmărire continuă a stării de sănătate și o relație medicală bazată pe respect și comunicare deschisă.
          </p>
          <div className="sp-hero-actions">
            <a href="/programare.html" className="sp-btn-primary">📅 Programare online</a>
            <Link to="/despre" className="sp-btn-secondary">Află mai multe →</Link>
          </div>
        </div>

        <div className="sp-hero-card">
          <div className="sp-card-header">
            <div className="sp-doctor-avatar">M</div>
            <div className="sp-card-header-info">
              <h3>Dr. Ion Popescu</h3>
              <p>Medic de familie · Specialist în medicina preventivă</p>
            </div>
          </div>
          <div className="sp-card-stats">
            <div className="sp-stat-item"><div className="sp-stat-num">15+</div><div className="sp-stat-label">Ani experiență</div></div>
            <div className="sp-stat-item"><div className="sp-stat-num">800+</div><div className="sp-stat-label">Pacienți activi</div></div>
            <div className="sp-stat-item"><div className="sp-stat-num">4.9★</div><div className="sp-stat-label">Recenzii</div></div>
          </div>
          <div style={{fontSize:'0.82rem', color:'#718096', textAlign:'center', padding:'0.5rem 0'}}>
            <Link to="/program" style={{color:'#2563a8', fontWeight:500, textDecoration:'none'}}>
              📅 Vezi programul complet →
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}