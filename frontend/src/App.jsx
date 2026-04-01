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

function AppInterna() {
  const [loggedIn, setLoggedIn]     = useState(!!getToken())
  const [activePage, setActivePage] = useState('dashboard')
  const [user, setUser]             = useState(null)

  useEffect(() => {
    if (loggedIn) {
      api.get('/useri/me/').then(res => setUser(res.data)).catch(() => {})
    }
  }, [loggedIn])

  const handleLogout = () => {
    logout()
    setLoggedIn(false)
    setUser(null)
  }

  if (!loggedIn) return <Login onLogin={() => setLoggedIn(true)} />

  if (activePage === 'profil') return (
    <Layout activePage={activePage} onNavigate={setActivePage} onLogout={handleLogout} user={user}>
      <ProfilMedic onBack={() => setActivePage('dashboard')} />
    </Layout>
  )

  return (
    <Layout activePage={activePage} onNavigate={setActivePage} onLogout={handleLogout} user={user}>
      {activePage === 'dashboard'   && <Dashboard onNavigate={setActivePage} />}
      {activePage === 'pacienti'    && <PacientList />}
      {activePage === 'programari'  && <Programari />}
      {activePage === 'consultatii' && <Consultatii onNavigate={setActivePage} />}
      {activePage === 'rapoarte'    && <Rapoarte />}
    </Layout>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"     element={<SitePrezentare />} />
        <Route path="/app"  element={<AppInterna />} />
        <Route path="*"     element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}