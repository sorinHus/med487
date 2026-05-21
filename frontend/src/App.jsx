import { useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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
  const [activePage, setActivePage] = useState('dashboard')
  const [theme, setTheme]           = useState(() => localStorage.getItem('theme') || 'dark')
  const [pacientInitial, setPacientInitial] = useState(null)
  const [moduleActive, setModuleActive]     = useState([])
  const [cereriCount, setCereriCount]       = useState(0)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  useEffect(() => {
    if (user?.id) {
      api.get(`/module/${user.id}/`).then(res => {
        setModuleActive(res.data.active || [])
      }).catch(() => {
        setModuleActive([])
      })
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
    setPacientInitial(null)
    if (page === 'pacienti' && data?.pacient) {
      setPacientInitial(data.pacient)
    }
    if (page === 'cereri-pacienti') fetchCereriCount()
    setActivePage(page)
  }

  if (activePage === 'profil') return (
    <Layout activePage={activePage} onNavigate={handleNavigate} onLogout={onLogout} user={user} moduleActive={moduleActive} theme={theme} onToggleTheme={toggleTheme} cereriCount={cereriCount}>
      <ProfilMedic onBack={() => setActivePage('dashboard')} />
    </Layout>
  )

  return (
    <Layout activePage={activePage} onNavigate={handleNavigate} onLogout={onLogout} user={user} moduleActive={moduleActive} theme={theme} onToggleTheme={toggleTheme} cereriCount={cereriCount}>
      {activePage === 'dashboard'       && <Dashboard onNavigate={handleNavigate} />}
      {activePage === 'pacienti'        && <PacientList pacientInitial={pacientInitial} moduleActive={moduleActive} />}
      {activePage === 'programari'      && <Programari />}
      {activePage === 'consultatii'     && <Consultatii onNavigate={handleNavigate} />}
      {activePage === 'rapoarte'        && <Rapoarte />}
      {activePage === 'cereri-pacienti' && <CereriPacienti onActiune={fetchCereriCount} />}
    </Layout>
  )
}

function AppInterna() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [user, setUser]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const timerRef                = useRef(null)

  const handleLogout = async () => {
    await logout()
    setLoggedIn(false)
    setUser(null)
  }

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      handleLogout()
    }, INACTIVITY_LIMIT)
  }

  useEffect(() => {
    if (!loggedIn) return
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll']
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }))
    resetTimer()
    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer))
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [loggedIn])

  useEffect(() => {
    const handler = () => { setLoggedIn(false); setUser(null) }
    window.addEventListener('auth:session-expired', handler)
    return () => window.removeEventListener('auth:session-expired', handler)
  }, [])

  // Check existing cookie session on mount
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
        <Route path="/app"   element={<AppInterna />} />
        <Route path="*"      element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}