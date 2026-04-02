import { useEffect, useRef, useState } from 'react'

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@300;400;500&display=swap');

  .sp-* { box-sizing: border-box; }

  .sp-root {
    font-family: 'DM Sans', sans-serif;
    background: #faf8f4;
    color: #1a2332;
    line-height: 1.6;
    overflow-x: hidden;
    scroll-behavior: smooth;
  }

  /* NAV */
  .sp-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    background: rgba(250,248,244,0.95);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid #e2e8f0;
    padding: 0 3rem;
    height: 68px;
    display: flex; align-items: center; justify-content: space-between;
    transition: box-shadow .3s;
  }
  .sp-nav.scrolled { box-shadow: 0 8px 32px rgba(26,53,87,0.12); }
  .sp-nav-logo { display: flex; align-items: center; gap: 0.75rem; text-decoration: none; }
  .sp-nav-logo-icon {
    width: 38px; height: 38px; background: #1a3557; border-radius: 10px;
    display: flex; align-items: center; justify-content: center; color: white; font-size: 1.1rem;
  }
  .sp-nav-logo-text { display: flex; flex-direction: column; line-height: 1.2; }
  .sp-nav-logo-name { font-family: 'Playfair Display', serif; font-size: 1rem; font-weight: 600; color: #1a3557; }
  .sp-nav-logo-sub { font-size: 0.7rem; color: #718096; letter-spacing: .04em; }
  .sp-nav-links { display: flex; align-items: center; gap: 2rem; list-style: none; margin: 0; padding: 0; }
  .sp-nav-links a { text-decoration: none; color: #4a5568; font-size: 0.88rem; font-weight: 500; transition: color .2s; }
  .sp-nav-links a:hover { color: #2563a8; }
  .sp-btn-nav {
    background: #1a3557; color: white !important; padding: 0.5rem 1.25rem;
    border-radius: 8px; font-size: 0.85rem !important; font-weight: 500 !important;
    transition: background .2s, transform .15s !important;
  }
  .sp-btn-nav:hover { background: #2563a8 !important; transform: translateY(-1px); }

  /* HERO */
  .sp-hero {
    min-height: 100vh; display: flex; align-items: center;
    padding: 7rem 3rem 4rem; position: relative; overflow: hidden;
    background: linear-gradient(135deg, #faf8f4 55%, #f0f6ff 100%);
  }
  .sp-hero::before {
    content: ''; position: absolute; top: -80px; right: -80px;
    width: 500px; height: 500px; border-radius: 50%;
    background: radial-gradient(circle, rgba(37,99,168,0.08) 0%, transparent 70%);
    pointer-events: none;
  }
  .sp-hero-inner {
    max-width: 1100px; margin: 0 auto; width: 100%;
    display: grid; grid-template-columns: 1fr 1fr; gap: 5rem; align-items: center;
  }
  .sp-hero-badge {
    display: inline-flex; align-items: center; gap: 0.5rem;
    background: #f5e9cc; color: #b8892a;
    padding: 0.35rem 0.9rem; border-radius: 999px;
    font-size: 0.78rem; font-weight: 500; letter-spacing: .04em;
    margin-bottom: 1.5rem;
    animation: spFadeUp .6s ease both;
  }
  .sp-hero h1 {
    font-family: 'Playfair Display', serif;
    font-size: clamp(2.2rem, 4vw, 3.2rem); font-weight: 600; line-height: 1.2;
    color: #1a3557; margin-bottom: 1.25rem;
    animation: spFadeUp .6s .1s ease both;
  }
  .sp-hero h1 em { font-style: italic; color: #2563a8; }
  .sp-hero-desc {
    font-size: 1.05rem; color: #4a5568; font-weight: 300; line-height: 1.75;
    margin-bottom: 2.25rem; animation: spFadeUp .6s .2s ease both;
  }
  .sp-hero-actions { display: flex; gap: 1rem; flex-wrap: wrap; animation: spFadeUp .6s .3s ease both; }

  .sp-btn-primary {
    display: inline-flex; align-items: center; gap: 0.5rem;
    background: #1a3557; color: white; padding: 0.85rem 1.75rem; border-radius: 10px;
    text-decoration: none; font-weight: 500; font-size: 0.95rem;
    box-shadow: 0 8px 32px rgba(26,53,87,0.12);
    transition: background .2s, transform .15s, box-shadow .2s;
  }
  .sp-btn-primary:hover { background: #2563a8; transform: translateY(-2px); box-shadow: 0 20px 60px rgba(26,53,87,0.16); }
  .sp-btn-secondary {
    display: inline-flex; align-items: center; gap: 0.5rem;
    background: white; color: #1a3557; padding: 0.85rem 1.75rem; border-radius: 10px;
    text-decoration: none; font-weight: 500; font-size: 0.95rem;
    border: 1.5px solid #e2e8f0; transition: border-color .2s, transform .15s;
  }
  .sp-btn-secondary:hover { border-color: #2563a8; transform: translateY(-2px); }

  .sp-hero-card {
    background: white; border-radius: 20px; padding: 2rem;
    box-shadow: 0 20px 60px rgba(26,53,87,0.16);
    animation: spFadeLeft .7s .2s ease both; position: relative;
  }
  .sp-hero-card::before {
    content: ''; position: absolute; top: -3px; left: 20px; right: 20px; height: 3px;
    background: linear-gradient(90deg, #1a3557, #2563a8); border-radius: 2px 2px 0 0;
  }
  .sp-card-header {
    display: flex; align-items: center; gap: 1rem;
    padding-bottom: 1.25rem; border-bottom: 1px solid #e2e8f0; margin-bottom: 1.25rem;
  }
  .sp-doctor-avatar {
    width: 58px; height: 58px; border-radius: 50%;
    background: linear-gradient(135deg, #1a3557, #2563a8);
    display: flex; align-items: center; justify-content: center;
    color: white; font-family: 'Playfair Display', serif;
    font-size: 1.4rem; font-weight: 600; flex-shrink: 0;
  }
  .sp-card-header-info h3 { font-family: 'Playfair Display', serif; font-size: 1.05rem; color: #1a3557; }
  .sp-card-header-info p { font-size: 0.8rem; color: #718096; margin-top: 2px; }
  .sp-card-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin-bottom: 1.25rem; }
  .sp-stat-item { text-align: center; padding: 0.75rem 0.5rem; background: #f0f6ff; border-radius: 10px; }
  .sp-stat-num { font-size: 1.4rem; font-weight: 600; color: #1a3557; font-family: 'Playfair Display', serif; }
  .sp-stat-label { font-size: 0.7rem; color: #718096; margin-top: 2px; }
  .sp-card-schedule { display: flex; flex-direction: column; gap: 0.5rem; }
  .sp-schedule-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 0.45rem 0; border-bottom: 1px dashed #e2e8f0; font-size: 0.85rem;
  }
  .sp-schedule-row:last-child { border-bottom: none; }
  .sp-schedule-day { color: #4a5568; font-weight: 500; }
  .sp-schedule-hours { color: #2563a8; font-weight: 500; }
  .sp-schedule-closed { color: #718096; font-style: italic; }

  /* SECTIONS */
  .sp-section { padding: 5rem 3rem; }
  .sp-section-inner { max-width: 1100px; margin: 0 auto; }
  .sp-section-tag {
    display: inline-block; font-size: 0.75rem; font-weight: 500;
    letter-spacing: .1em; text-transform: uppercase; color: #2563a8; margin-bottom: 0.75rem;
  }
  .sp-section-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(1.7rem, 3vw, 2.4rem); color: #1a3557; line-height: 1.25; margin-bottom: 1rem;
  }
  .sp-section-desc { font-size: 1rem; color: #4a5568; font-weight: 300; max-width: 560px; line-height: 1.8; }

  /* DESPRE */
  .sp-despre { background: white; }
  .sp-despre-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5rem; align-items: center; }
  .sp-despre-img-wrap { position: relative; }
  .sp-despre-img-placeholder {
    background: linear-gradient(135deg, #f0f6ff 0%, #dbeafe 100%);
    border-radius: 20px; height: 380px;
    display: flex; align-items: center; justify-content: center;
    font-size: 5rem; box-shadow: 0 8px 32px rgba(26,53,87,0.12);
  }
  .sp-despre-badge {
    position: absolute; bottom: -16px; right: -16px;
    background: #b8892a; color: white; padding: 1rem 1.25rem;
    border-radius: 14px; box-shadow: 0 8px 32px rgba(26,53,87,0.12); text-align: center;
  }
  .sp-despre-badge-num { font-family: 'Playfair Display', serif; font-size: 1.8rem; font-weight: 600; line-height: 1; }
  .sp-despre-badge-text { font-size: 0.72rem; opacity: .9; margin-top: 3px; }
  .sp-despre-features { margin-top: 2rem; display: flex; flex-direction: column; gap: 1rem; }
  .sp-feature-item {
    display: flex; gap: 0.9rem; align-items: flex-start;
    padding: 0.9rem 1rem; border-radius: 10px; background: #f0f6ff; transition: transform .2s;
  }
  .sp-feature-item:hover { transform: translateX(4px); }
  .sp-feature-icon {
    width: 36px; height: 36px; flex-shrink: 0; background: #1a3557;
    border-radius: 8px; display: flex; align-items: center; justify-content: center;
    color: white; font-size: 1rem;
  }
  .sp-feature-text h4 { font-size: 0.9rem; font-weight: 500; color: #1a3557; }
  .sp-feature-text p { font-size: 0.8rem; color: #718096; margin-top: 2px; }

  /* SERVICII */
  .sp-servicii { background: #faf8f4; }
  .sp-servicii-grid { margin-top: 3rem; display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
  .sp-serviciu-card {
    background: white; border-radius: 16px; padding: 1.75rem 1.5rem;
    border: 1px solid #e2e8f0; transition: transform .2s, box-shadow .2s, border-color .2s;
  }
  .sp-serviciu-card:hover { transform: translateY(-4px); box-shadow: 0 8px 32px rgba(26,53,87,0.12); border-color: #dbeafe; }
  .sp-serviciu-icon {
    font-size: 1.75rem; width: 52px; height: 52px; background: #f0f6ff;
    border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem;
  }
  .sp-serviciu-card h3 { font-size: 1rem; font-weight: 500; color: #1a3557; margin-bottom: 0.5rem; }
  .sp-serviciu-card p { font-size: 0.82rem; color: #718096; line-height: 1.65; }

  /* PROGRAM */
  .sp-program { background: #1a3557; color: white; }
  .sp-program .sp-section-tag { color: #b8892a; }
  .sp-program .sp-section-title { color: white; }
  .sp-program .sp-section-desc { color: rgba(255,255,255,0.65); }
  .sp-program-grid { margin-top: 3rem; display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; align-items: start; }
  .sp-program-table { width: 100%; border-collapse: collapse; }
  .sp-program-table tr { border-bottom: 1px solid rgba(255,255,255,0.08); }
  .sp-program-table tr:last-child { border-bottom: none; }
  .sp-program-table td { padding: 0.9rem 0; font-size: 0.9rem; }
  .sp-program-table td:first-child { color: rgba(255,255,255,0.7); }
  .sp-program-table td:last-child { color: white; font-weight: 500; text-align: right; }
  .sp-program-table .sp-closed { color: rgba(255,255,255,0.3); font-style: italic; }
  .sp-program-info-box {
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 16px; padding: 2rem;
  }
  .sp-info-row { display: flex; gap: 1rem; align-items: flex-start; margin-bottom: 1.5rem; }
  .sp-info-row:last-child { margin-bottom: 0; }
  .sp-info-icon {
    width: 40px; height: 40px; flex-shrink: 0; background: rgba(255,255,255,0.1);
    border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem;
  }
  .sp-info-text h4 { font-size: 0.85rem; font-weight: 500; color: white; margin-bottom: 3px; }
  .sp-info-text p { font-size: 0.8rem; color: rgba(255,255,255,0.55); line-height: 1.5; }

  /* CONTACT */
  .sp-contact { background: #faf8f4; }
  .sp-contact-grid { margin-top: 3rem; display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; }
  .sp-contact-card { background: white; border-radius: 16px; padding: 2rem; border: 1px solid #e2e8f0; }
  .sp-contact-card h3 { font-family: 'Playfair Display', serif; font-size: 1.1rem; color: #1a3557; margin-bottom: 1.5rem; }
  .sp-contact-item { display: flex; gap: 0.9rem; align-items: flex-start; margin-bottom: 1.1rem; }
  .sp-contact-item:last-child { margin-bottom: 0; }
  .sp-contact-icon {
    width: 38px; height: 38px; flex-shrink: 0; background: #f0f6ff;
    border-radius: 9px; display: flex; align-items: center; justify-content: center;
    color: #2563a8; font-size: 1rem;
  }
  .sp-contact-label { font-size: 0.72rem; color: #718096; letter-spacing: .04em; text-transform: uppercase; }
  .sp-contact-value { font-size: 0.9rem; color: #1a2332; font-weight: 500; margin-top: 1px; }
  .sp-programare-box {
    background: #1a3557; border-radius: 16px; padding: 2.25rem; text-align: center;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
  }
  .sp-programare-box h3 { font-family: 'Playfair Display', serif; font-size: 1.35rem; color: white; margin-bottom: 0.75rem; }
  .sp-programare-box p { font-size: 0.85rem; color: rgba(255,255,255,0.6); margin-bottom: 1.75rem; line-height: 1.6; }
  .sp-btn-programare {
    display: inline-flex; align-items: center; gap: 0.5rem;
    background: #b8892a; color: white; padding: 0.9rem 2rem; border-radius: 10px;
    text-decoration: none; font-weight: 500; font-size: 0.95rem;
    box-shadow: 0 4px 20px rgba(184,137,42,0.35); transition: background .2s, transform .15s;
  }
  .sp-btn-programare:hover { background: #a07824; transform: translateY(-2px); }

  /* FOOTER */
  .sp-footer {
    background: #1a3557; color: white; padding: 2rem 3rem;
    display: flex; align-items: center; justify-content: space-between;
    border-top: 1px solid rgba(255,255,255,0.08);
  }
  .sp-footer-logo { font-family: 'Playfair Display', serif; font-size: 1rem; color: white; font-weight: 600; }
  .sp-footer-logo span {
    color: rgba(255,255,255,0.45); font-size: 0.75rem; display: block; margin-top: 2px;
    font-family: 'DM Sans', sans-serif; font-weight: 300;
  }
  .sp-footer p { font-size: 0.78rem; color: rgba(255,255,255,0.4); }

  /* ANIMATIONS */
  @keyframes spFadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes spFadeLeft {
    from { opacity: 0; transform: translateX(32px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  .sp-reveal { opacity: 0; transform: translateY(20px); transition: opacity .6s ease, transform .6s ease; }
  .sp-reveal.sp-visible { opacity: 1; transform: translateY(0); }
`

export default function SitePrezentare() {
  const navRef = useRef(null)
  const [config, setConfig] = useState(null)

  useEffect(() => {
    const API = import.meta.env.VITE_API_URL || 'https://web-production-26811.up.railway.app/api'
    fetch(`${API}/configuratie/`)
      .then(r => r.json())
      .then(data => setConfig(Array.isArray(data) ? data[0] : data))
      .catch(() => {})
  }, [])

  const ZILE_NUME = { luni: 'Luni', marti: 'Marți', miercuri: 'Miercuri', joi: 'Joi', vineri: 'Vineri', sambata: 'Sâmbătă', duminica: 'Duminică' }
  const orar = config?.orar_saptamanal || {}

  useEffect(() => {
    // Inject styles
    const styleEl = document.createElement('style')
    styleEl.textContent = styles
    document.head.appendChild(styleEl)

    // Nav scroll shadow
    const handleScroll = () => {
      navRef.current?.classList.toggle('scrolled', window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)

    // Scroll reveal
    const reveals = document.querySelectorAll('.sp-reveal')
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add('sp-visible'), i * 80)
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.1 })
    reveals.forEach(el => observer.observe(el))

    return () => {
      window.removeEventListener('scroll', handleScroll)
      document.head.removeChild(styleEl)
    }
  }, [])

  return (
    <div className="sp-root">

      {/* NAV */}
      <nav className="sp-nav" ref={navRef}>
        <a href="#" className="sp-nav-logo">
          <div className="sp-nav-logo-icon">✚</div>
          <div className="sp-nav-logo-text">
            <span className="sp-nav-logo-name">Cabinet Medical</span>
            <span className="sp-nav-logo-sub">Medicină de Familie</span>
          </div>
        </a>
        <ul className="sp-nav-links">
          <li><a href="#despre">Despre</a></li>
          <li><a href="#servicii">Servicii</a></li>
          <li><a href="#program">Program</a></li>
          <li><a href="#contact">Contact</a></li>
          <li><a href="/programare.html" className="sp-btn-nav">Programare online →</a></li>
          <li><a href="/app" className="sp-btn-nav" style={{background: '#2563a8', color: 'white', border: 'none'}}>Login</a></li>
        </ul>
      </nav>

      {/* HERO */}
      <section className="sp-hero" id="acasa">
        <div className="sp-hero-inner">
          <div>
            <div className="sp-hero-badge">✦ Cabinet acreditat · Cluj-Napoca</div>
            <h1 className="sp-hero h1">Îngrijire medicală <em>de încredere</em> pentru întreaga familie</h1>
            <p className="sp-hero-desc">
              Oferim consultații complete, urmărire continuă a stării de sănătate și o relație medicală bazată pe respect și comunicare deschisă.
            </p>
            <div className="sp-hero-actions">
              <a href="/programare.html" className="sp-btn-primary">📅 Programare online</a>
              <a href="#despre" className="sp-btn-secondary">Află mai multe →</a>
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
            <div className="sp-card-schedule">
              <div className="sp-schedule-row"><span className="sp-schedule-day">Luni – Miercuri</span><span className="sp-schedule-hours">08:00 – 16:00</span></div>
              <div className="sp-schedule-row"><span className="sp-schedule-day">Joi – Vineri</span><span className="sp-schedule-hours">09:00 – 15:00</span></div>
              <div className="sp-schedule-row"><span className="sp-schedule-day">Sâmbătă – Duminică</span><span className="sp-schedule-closed">Închis</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* DESPRE */}
      <section className="sp-section sp-despre" id="despre">
        <div className="sp-section-inner">
          <div className="sp-despre-grid">
            <div className="sp-despre-img-wrap sp-reveal">
              <div className="sp-despre-img-placeholder">🏥</div>
              <div className="sp-despre-badge">
                <div className="sp-despre-badge-num">2010</div>
                <div className="sp-despre-badge-text">Fondată în</div>
              </div>
            </div>
            <div className="sp-reveal">
              <span className="sp-section-tag">Despre noi</span>
              <h2 className="sp-section-title">Un cabinet modern, cu valori tradiționale</h2>
              <p className="sp-section-desc">Medicina de familie înseamnă continuitate — cunoaștem istoricul fiecărui pacient și ne implicăm în sănătatea întregii familii, de la copii la vârstnici.</p>
              <div className="sp-despre-features">
                <div className="sp-feature-item">
                  <div className="sp-feature-icon">🩺</div>
                  <div className="sp-feature-text"><h4>Consultații complete</h4><p>Examinare clinică amănunțită, bilet de trimitere, rețete și concedii medicale</p></div>
                </div>
                <div className="sp-feature-item">
                  <div className="sp-feature-icon">📋</div>
                  <div className="sp-feature-text"><h4>Gestionare dosar medical</h4><p>Istoricul complet al consultațiilor și investigațiilor disponibil oricând</p></div>
                </div>
                <div className="sp-feature-item">
                  <div className="sp-feature-icon">💬</div>
                  <div className="sp-feature-text"><h4>Comunicare directă</h4><p>Răspunsuri rapide la întrebări, fără liste de așteptare interminabile</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICII */}
      <section className="sp-section sp-servicii" id="servicii">
        <div className="sp-section-inner">
          <div className="sp-reveal">
            <span className="sp-section-tag">Ce oferim</span>
            <h2 className="sp-section-title">Servicii medicale complete</h2>
            <p className="sp-section-desc">Acoperim toate nevoile medicale de bază ale familiei tale, cu trimiteri rapide către specialiști când este necesar.</p>
          </div>
          <div className="sp-servicii-grid">
            {[
              { icon: '🩺', title: 'Consultații generale', desc: 'Evaluare clinică completă pentru adulți și copii, diagnostic și plan de tratament personalizat.' },
              { icon: '💉', title: 'Vaccinări', desc: 'Schema completă de vaccinare conform calendarului național, pentru copii și adulți.' },
              { icon: '🔬', title: 'Investigații', desc: 'Bilete de trimitere pentru analize, imagistică și consultații de specialitate.' },
              { icon: '📄', title: 'Rețete și certificate', desc: 'Rețete compensate, certificate medicale și concedii medicale eliberate la consultație.' },
              { icon: '❤️', title: 'Monitorizare boli cronice', desc: 'Urmărire periodică pentru hipertensiune, diabet, boli respiratorii și alte afecțiuni cronice.' },
              { icon: '🛡️', title: 'Medicină preventivă', desc: 'Controale periodice, screening și sfaturi pentru un stil de viață sănătos.' },
            ].map((s, i) => (
              <div className="sp-serviciu-card sp-reveal" key={i}>
                <div className="sp-serviciu-icon">{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROGRAM */}
      <section className="sp-section sp-program" id="program">
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
                  {['luni','marti','miercuri','joi','vineri','sambata','duminica'].map(zi => {
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
            <div className="sp-program-info-box sp-reveal">
              <div className="sp-info-row"><div className="sp-info-icon">📍</div><div className="sp-info-text"><h4>Adresă cabinet</h4><p>{config?.strada ? `${config.strada} nr. ${config.numar}, ` : ''}{config?.localitate || 'Cluj-Napoca'}<br/>{config?.judet ? `Județul ${config.judet}, ` : ''}România</p></div></div>
              <div className="sp-info-row"><div className="sp-info-icon">📞</div><div className="sp-info-text"><h4>Telefon</h4><p>{config?.telefon || '–'}</p></div></div>
              <div className="sp-info-row"><div className="sp-info-icon">✉️</div><div className="sp-info-text"><h4>Email</h4><p>{config?.email_contact || config?.email || '–'}</p></div></div>
              <div className="sp-info-row"><div className="sp-info-icon">🌐</div><div className="sp-info-text"><h4>Programare online</h4><p>Disponibilă 24/7 prin formularul de pe site</p></div></div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className="sp-section sp-contact" id="contact">
        <div className="sp-section-inner">
          <div className="sp-reveal">
            <span className="sp-section-tag">Contact</span>
            <h2 className="sp-section-title">Luați legătura cu noi</h2>
          </div>
          <div className="sp-contact-grid">
            <div className="sp-contact-card sp-reveal">
              <h3>Informații de contact</h3>
              <div className="sp-contact-item"><div className="sp-contact-icon">📍</div><div><div className="sp-contact-label">Adresă</div><div className="sp-contact-value">Str. Exemplu nr. 10, Cluj-Napoca</div></div></div>
              <div className="sp-contact-item"><div className="sp-contact-icon">📞</div><div><div className="sp-contact-label">Telefon</div><div className="sp-contact-value">0264 000 000</div></div></div>
              <div className="sp-contact-item"><div className="sp-contact-icon">✉️</div><div><div className="sp-contact-label">Email</div><div className="sp-contact-value">contact@cabinetmedical.ro</div></div></div>
              <div className="sp-contact-item"><div className="sp-contact-icon">🕐</div><div><div className="sp-contact-label">Program</div><div className="sp-contact-value">Luni–Miercuri 08–16, Joi–Vineri 09–15</div></div></div>
            </div>
            <div className="sp-programare-box sp-reveal">
              <h3>Programează o consultație</h3>
              <p>Alege data și ora convenabilă direct online, fără apeluri telefonice și fără timp de așteptare.</p>
              <a href="/programare.html" className="sp-btn-programare">📅 Programare online</a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="sp-footer">
        <div className="sp-footer-logo">
          Cabinet Medical Dr. Ion Popescu
          <span>Medicină de Familie · Cluj-Napoca</span>
        </div>
        <p>© 2026 · Toate drepturile rezervate</p>
      </footer>

    </div>
  )
}