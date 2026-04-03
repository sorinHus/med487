import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { spStyles } from './spStyles'

export default function SpLayout({ children }) {
  const navRef = useRef(null)
  const location = useLocation()

  useEffect(() => {
    const styleEl = document.createElement('style')
    styleEl.id = 'sp-styles'
    if (!document.getElementById('sp-styles')) {
      styleEl.textContent = spStyles
      document.head.appendChild(styleEl)
    }
    return () => {
      const el = document.getElementById('sp-styles')
      if (el) el.remove()
    }
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      navRef.current?.classList.toggle('scrolled', window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
    setTimeout(() => {
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
      return () => observer.disconnect()
    }, 50)
  }, [location.pathname])

  const isActive = (path) => location.pathname === path ? 'active' : ''

  return (
    <div className="sp-root">
      <nav className="sp-nav" ref={navRef}>
        <Link to="/" className="sp-nav-logo">
          <div className="sp-nav-logo-icon">✚</div>
          <div className="sp-nav-logo-text">
            <span className="sp-nav-logo-name">Cabinet Medical</span>
            <span className="sp-nav-logo-sub">Medicină de Familie</span>
          </div>
        </Link>
        <ul className="sp-nav-links">
          <li><Link to="/despre" className={isActive('/despre')}>Despre</Link></li>
          <li><Link to="/servicii" className={isActive('/servicii')}>Servicii</Link></li>
          <li><Link to="/program" className={isActive('/program')}>Program & Contact</Link></li>
          <li><a href="/programare.html" className="sp-btn-nav">Programare online →</a></li>
          <li><Link to="/app" className="sp-btn-nav" style={{background:'#2563a8'}}>Login</Link></li>
        </ul>
      </nav>

      <div className="sp-page">
        {children}
      </div>

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