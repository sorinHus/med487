import { useState, useEffect } from 'react'
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

function AppMedic({ user, onLogout }) {
  const [activePage, setActivePage] = useState('dashboard')
  const [pacientInitial, setPacientInitial] = useState(null)

  if (activePage === 'profil') return (
    <Layout activePage={activePage} onNavigate={handleNavigate} onLogout={onLogout} user={user}>
      <ProfilMedic onBack={() => setActivePage('dashboard')} />
    </Layout>
  )

  return (
    <Layout activePage={activePage} onNavigate={handleNavigate} onLogout={onLogout} user={user}>
      {activePage === 'dashboard'   && <Dashboard onNavigate={handleNavigate} />}
      {activePage === 'pacienti'    && <PacientList pacientInitial={pacientInitial} />}
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

function SuperadminPlaceholder({ onLogout }) {
  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ color: '#60a5fa', fontSize: '3rem' }}>⚙️</div>
      <h2 style={{ color: '#e2e8f0', fontFamily: 'serif' }}>Panou Administrare</h2>
      <p style={{ color: '#9ca3af' }}>În curând — panoul de administrare este în dezvoltare.</p>
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

  useEffect(() => {
    if (loggedIn) {
      api.get('/useri/me/').then(res => {
        console.log('user data:', res.data)
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

  const handleNavigate = (page, data = null) => {
    setPacientInitial(null)
    if (page === 'pacienti' && data?.pacient) {
      setPacientInitial(data.pacient)
    }
    setActivePage(page)
  }
  
  const handleLogout = () => {
    logout()
    setLoggedIn(false)
    setUser(null)
  }

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