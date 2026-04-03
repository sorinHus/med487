import { useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { getToken, logout } from './auth'
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

const INACTIVITY_LIMIT = 2 * 60 * 60 * 1000 // 2 ore in ms

function AppMedic({ user, onLogout }) {
  const [activePage, setActivePage] = useState('dashboard')
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  // Aplica tema salvata imediat la mount
  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'dark'
    document.documentElement.setAttribute('data-theme', saved)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
import { useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { getToken, logout } from './auth'
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

const INACTIVITY_LIMIT = 2 * 60 * 60 * 1000

function AppMedic({ user, onLogout }) {
  const [activePage, setActivePage] = useState('dashboard')
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')
  const [pacientInitial, setPacientInitial] = useState(null)
  const [moduleActive, setModuleActive] = useState([])

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

  const handleNavigate = (page, data = null) => {
    setPacientInitial(null)
    if (page === 'pacienti' && data?.pacient) {
      setPacientInitial(data.pacient)
    }
    setActivePage(page)
  }

  if (activePage === 'profil') return (
    <Layout activePage={activePage} onNavigate={handleNavigate} onLogout={onLogout} user={user} moduleActive={moduleActive} theme={theme} onToggleTheme={toggleTheme}>
      <ProfilMedic onBack={() => setActivePage('dashboard')} />
    </Layout>
  )

  return (
    <Layout activePage={activePage} onNavigate={handleNavigate} onLogout={onLogout} user={user} moduleActive={moduleActive} theme={theme} onToggleTheme={toggleTheme}>
      {activePage === 'dashboard'   && <Dashboard onNavigate={handleNavigate} />}
      {activePage === 'pacienti'    && <PacientList pacientInitial={pacientInitial} moduleActive={moduleActive} />}
      {activePage === 'programari'  && <Programari />}
      {activePage === 'consultatii' && <Consultatii onNavigate={handleNavigate} />}
      {activePage === 'rapoarte'    && <Rapoarte />}
    </Layout>
  )
}

function PortalPlaceholder({ onLogout }) {
  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ color: '#60a5fa', fontSize: '3rem' }}>🏥</div>
      <h2 style={{ color: '#e2e8f0', fontFamily: 'serif' }}>Portal Pacient</h2>
      <p style={{ color: '#9ca3af' }}>În curând — portalul pentru pacienți este în dezvoltare.</p>
      <button onClick={onLogout} style={{ marginTop: '1rem', padding: '0.5rem 1.5rem', background: '#1e2535', color: '#e2e8f0', border: '1px solid #1e2535', borderRadius: '8px', cursor: 'pointer' }}>
        Deconectare
      </button>
    </div>
  )
}

function AppInterna() {
  const [loggedIn, setLoggedIn] = useState(!!getToken())
  const [user, setUser]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const timerRef                = useRef(null)

  const handleLogout = () => {
    logout()
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
    if (loggedIn) {
      api.get('/useri/me/').then(res => {
        setUser(res.data)
        setLoading(false)
      }).catch(() => {
        logout()
        setLoggedIn(false)
        setLoading(false)
      })
    } else {
      setLoading(false)
    }
  }, [loggedIn])

  if (!loggedIn) return <Login onLogin={() => setLoggedIn(true)} />
  if (loading)   return <div style={{ minHeight: '100vh', background: '#0f1117' }} />

  if (user?.rol === 'superadmin') return <SuperadminPanel onLogout={handleLogout} />
  if (user?.rol === 'pacient')    return <PortalPlaceholder onLogout={handleLogout} />

  return <AppMedic user={user} onLogout={handleLogout} />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"    element={<SitePrezentare />} />
        <Route path="/app" element={<AppInterna />} />
        <Route path="*"    element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');
  const [pacientInitial, setPacientInitial] = useState(null)
  const [moduleActive, setModuleActive] = useState([])

  useEffect(() => {
    if (user?.id) {
      api.get(`/module/${user.id}/`).then(res => {
        setModuleActive(res.data.active || [])
      }).catch(() => {
        setModuleActive([])
      })
    }
  }, [user])

  const handleNavigate = (page, data = null) => {
    setPacientInitial(null)
    if (page === 'pacienti' && data?.pacient) {
      setPacientInitial(data.pacient)
    }
    setActivePage(page)
  }

  if (activePage === 'profil') return (
    <Layout activePage={activePage} onNavigate={handleNavigate} onLogout={onLogout} user={user} moduleActive={moduleActive} theme={theme} onToggleTheme={toggleTheme}>
      <ProfilMedic onBack={() => setActivePage('dashboard')} />
    </Layout>
  )

  return (
    <Layout activePage={activePage} onNavigate={handleNavigate} onLogout={onLogout} user={user} moduleActive={moduleActive} theme={theme} onToggleTheme={toggleTheme}>
      {activePage === 'dashboard'   && <Dashboard onNavigate={handleNavigate} />}
      {activePage === 'pacienti'    && <PacientList pacientInitial={pacientInitial} moduleActive={moduleActive} />}
      {activePage === 'programari'  && <Programari />}
      {activePage === 'consultatii' && <Consultatii onNavigate={handleNavigate} />}
      {activePage === 'rapoarte'    && <Rapoarte />}
    </Layout>
  )

function PortalPlaceholder({ onLogout }) {
  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ color: '#60a5fa', fontSize: '3rem' }}>🏥</div>
      <h2 style={{ color: '#e2e8f0', fontFamily: 'serif' }}>Portal Pacient</h2>
      <p style={{ color: '#9ca3af' }}>În curând — portalul pentru pacienți este în dezvoltare.</p>
      <button onClick={onLogout} style={{ marginTop: '1rem', padding: '0.5rem 1.5rem', background: '#1e2535', color: '#e2e8f0', border: '1px solid #1e2535', borderRadius: '8px', cursor: 'pointer' }}>
        Deconectare
      </button>
    </div>
  )
}

function AppInterna() {
  const [loggedIn, setLoggedIn] = useState(!!getToken())
  const [user, setUser]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const timerRef                = useRef(null)

  const handleLogout = () => {
    logout()
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
    if (loggedIn) {
      api.get('/useri/me/').then(res => {
        setUser(res.data)
        setLoading(false)
      }).catch(() => {
        logout()
        setLoggedIn(false)
        setLoading(false)
      })
    } else {
      setLoading(false)
    }
  }, [loggedIn])

  if (!loggedIn) return <Login onLogin={() => setLoggedIn(true)} />
  if (loading)   return <div style={{ minHeight: '100vh', background: '#0f1117' }} />

  if (user?.rol === 'superadmin') return <SuperadminPanel onLogout={handleLogout} />
  if (user?.rol === 'pacient')    return <PortalPlaceholder onLogout={handleLogout} />

  return <AppMedic user={user} onLogout={handleLogout} />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"    element={<SitePrezentare />} />
        <Route path="/app" element={<AppInterna />} />
        <Route path="*"    element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}