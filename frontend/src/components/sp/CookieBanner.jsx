import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import s from '../../styles/sp.module.css'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const accepted = localStorage.getItem('cookies_accepted')
    if (!accepted) setVisible(true)
  }, [])

  const handleAccept = () => {
    localStorage.setItem('cookies_accepted', '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className={s.cookieBanner}>
      <p className={s.cookieText}>
        Acest site folosește cookie-uri tehnice necesare pentru funcționare.{' '}
        <Link to="/politica-confidentialitate" className={s.cookieLink}>
          Politică de confidențialitate
        </Link>
      </p>
      <button className={s.cookieBtn} onClick={handleAccept}>
        Accept
      </button>
    </div>
  )
}