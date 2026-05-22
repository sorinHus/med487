import { useState, useEffect, useRef, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { logout } from './auth'
import api from './api'
import Login from './components/Login'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import PacientList from './components/PacientList'
import Programari from './components/Programari'
import Consultatii from './components/Consultatii'
import Rapoarte from './components/Rapoarte'
import ProfilMedic from './components/ProfilMedic'
import SitePrezentare from './components/SitePrezentare'
import SuperadminPanel from './components/SuperadminPanel'
import CereriPacienti from './components/CereriPacienti'
import PortalPacient from './components/PortalPacient'
import MobilApp from './components/MobilApp'

const INACTIVITY_LIMIT = 2 * 60 * 60 * 1000

function AppMedic({ user, onLogout }) {
  const [theme, setTheme]               = useState(() => localStorage.getItem('theme') || 'dark')
  const [moduleActive, setModuleActive] = useState([])
  const [cereriCount, setCereriCount]   = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  useEffect(() => {
    if (user?.id) {
      api.get(`/module/${user.id}/`).then(res => {
        setModuleActive(res.data.active || [])
      }).catch(() => setModuleActive([]))
    }
  }, [user])

  const fetchCereriCount = () => {
    api.get('/useri/', { params: { rol: 'pacient', aprobat: 'false' } })
      .then(res => {
        const list = Array.isArray(res.data) ? res.data : res.data.results || []
        setCereriCount(list.length)
      })
      .catch(() => {})
  }

  useEffect(() => {
    fetchCereriCount()
    const interval = setInterval(fetchCereriCount, 60000)
    return () => clearInterval(interval)
  }, [])

  const handleNavigate = (page, data = null) => {
    if (page === 'cereri-pacienti') fetchCereriCount()
    if (page === 'pacienti' && data?.pacient) {
      navigate(`/app/pacienti/${data.pacient.id}`)
    } else {
      navigate(`/app/${page}`)
    }
  }

  return (
    <Layout onLogout={onLogout} user={user} moduleActive={moduleActive} theme={theme} onToggleTheme={toggleTheme} cereriCount={cereriCount}>
      <Routes>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard"       element={<Dashboard onNavigate={handleNavigate} />} />
        <Route path="pacienti/*"      element={<PacientList moduleActive={moduleActive} />} />
        <Route path="programari"      element={<Programari />} />
        <Route path="consultatii"     element={<Consultatii onNavigate={handleNavigate} />} />
        <Route path="rapoarte"        element={<Rapoarte />} />
        <Route path="cereri-pacienti" element={<CereriPacienti onActiune={fetchCereriCount} />} />
        <Route path="profil"          element={<ProfilMedic onBack={() => navigate('/app/dashboard')} />} />
      </Routes>
    </Layout>
  )
}

function AppInterna() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [user, setUser]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const timerRef                = useRef(null)

  const handleLogout = useCallback(async () => {
    await logout()
    setLoggedIn(false)
    setUser(null)
  }, [])

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(handleLogout, INACTIVITY_LIMIT)
  }, [handleLogout])

  useEffect(() => {
    if (!loggedIn) return
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll']
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }))
    resetTimer()
    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer))
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [loggedIn, resetTimer])

  useEffect(() => {
    const handler = () => { setLoggedIn(false); setUser(null) }
    window.addEventListener('auth:session-expired', handler)
    return () => window.removeEventListener('auth:session-expired', handler)
  }, [])

  useEffect(() => {
    api.get('/useri/me/').then(res => {
      setUser(res.data)
      setLoggedIn(true)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleLoginSuccess = () => {
    api.get('/useri/me/').then(res => {
      setUser(res.data)
      setLoggedIn(true)
    }).catch(() => handleLogout())
  }

  if (loading)   return <div style={{ minHeight: '100vh', background: '#0f1117' }} />
  if (!loggedIn) return <Login onLogin={handleLoginSuccess} />

  if (user?.rol === 'superadmin') return <SuperadminPanel onLogout={handleLogout} user={user} />
  if (user?.rol === 'pacient')    return <PortalPacient user={user} onLogout={handleLogout} />

  return <AppMedic user={user} onLogout={handleLogout} />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/mobil" element={<MobilApp />} />
        <Route path="/*"     element={<SitePrezentare />} />
        <Route path="/app/*" element={<AppInterna />} />
        <Route path="*"      element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
