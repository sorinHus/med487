import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import s from '../../styles/sp.module.css'
import CookieBanner from './CookieBanner'

export default function SpLayout({ children }) {
  const navRef = useRef(null)
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Închide drawer la schimbare pagină
  useEffect(() => {
    setMenuOpen(false)
    window.scrollTo(0, 0)
    setTimeout(() => {
      const reveals = document.querySelectorAll(`.${s.reveal}`)
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add(s.visible), i * 80)
            observer.unobserve(entry.target)
          }
        })
      }, { threshold: 0.1 })
      reveals.forEach(el => observer.observe(el))
      return () => observer.disconnect()
    }, 50)
  }, [location.pathname])

  const isActive = (path) => location.pathname === path ? 'active' : ''

  return (
    <div className={s.root}>
      <nav ref={navRef} className={`${s.nav} ${scrolled ? s.navScrolled : ''}`}>
        <Link to="/" className={s.navLogo}>
          <div className={s.navLogoIcon}>✚</div>
          <div className={s.navLogoText}>
            <span className={s.navLogoName}>Cabinet Medical</span>
            <span className={s.navLogoSub}>Medicină de Familie</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <ul className={s.navLinks}>
          <li><Link to="/" className={isActive('/')}>Acasă</Link></li>
          <li><Link to="/despre" className={isActive('/despre')}>Despre</Link></li>
          <li><Link to="/servicii" className={isActive('/servicii')}>Servicii</Link></li>
          <li><Link to="/program" className={isActive('/program')}>Program & Contact</Link></li>
          <li><a href="/programare.html" className={s.btnNav} target="_blank">Programare online →</a></li>
          <li className={s.dropdownWrap}>
            <button className={s.btnNav} style={{ background: '#2563a8' }}>
              Cont ▾
            </button>
            <div className={s.dropdownMenu}>
              <div className={s.dropdownInner}>
                <Link to="/app">🔑 Login</Link>
                <a href="/inregistrare.html">📋 Înregistrare</a>
              </div>
            </div>
          </li>
        </ul>

        {/* Hamburger mobil */}
        <button
          className={s.navHamburger}
          onClick={() => setMenuOpen(prev => !prev)}
          aria-label="Meniu"
        >
          <span />
          <span />
          <span />
        </button>
      </nav>

      {/* Drawer mobil */}
      <div className={`${s.navDrawer} ${menuOpen ? s.open : ''}`}>
        <Link to="/" className={isActive('/')}>Acasă</Link>
        <Link to="/despre" className={isActive('/despre')}>Despre</Link>
        <Link to="/servicii" className={isActive('/servicii')}>Servicii</Link>
        <Link to="/program" className={isActive('/program')}>Program & Contact</Link>
        <div className={s.navDrawerCont}>
          <a href="/programare.html" className={s.btnNav} target="_blank">📅 Programare online →</a>
          <Link to="/app" className={s.btnNav} style={{ background: '#2563a8' }}>🔑 Login</Link>
          <a href="/inregistrare.html" className={s.btnSecondary}>📋 Înregistrare</a>
        </div>
      </div>

      <div className={s.page}>
        {children}
      </div>

      <footer className={s.footer}>
        <div className={s.footerLogo}>
          Cabinet Medical Dr. Ion Popescu
          <span className={s.footerLogoSub}>Medicină de Familie · Cluj-Napoca</span>
        </div>
        <div className={s.footerLinks}>
          <Link to="/politica-confidentialitate" className={s.footerLink}>
            Politică de confidențialitate
          </Link>
        </div>
        <p className={s.footerCopy}>© 2026 · Toate drepturile rezervate</p>
      </footer>

      <CookieBanner />
    </div>
  )
}