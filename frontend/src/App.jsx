import { useState, useEffect } from 'react'
import { getToken, logout } from './auth'
import api from './api'
import Login from './components/Login'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import PacientList from './components/PacientList'
import Programari from './components/Programari'
import Consultatii from './components/Consultatii'
import Rapoarte from './components/Rapoarte'

export default function App() {
  const [loggedIn, setLoggedIn]     = useState(!!getToken())
  const [activePage, setActivePage] = useState('dashboard')
  const [user, setUser]             = useState(null)

  useEffect(() => {
    if (loggedIn) {
      api.get('/useri/me/').then(res => {
        setUser(res.data)
      }).catch(() => {})
    }
  }, [loggedIn])

  const handleLogout = () => {
    logout()
    setLoggedIn(false)
    setUser(null)
  }

  if (!loggedIn) return <Login onLogin={() => setLoggedIn(true)} />

  return (
    <Layout
      activePage={activePage}
      onNavigate={setActivePage}
      onLogout={handleLogout}
      user={user}
    >
      {activePage === 'dashboard'   && <Dashboard onNavigate={setActivePage} />}
      {activePage === 'pacienti'    && <PacientList />}
      {activePage === 'programari'  && <Programari />}
      {activePage === 'consultatii' && <Consultatii onNavigate={setActivePage} />}
      {activePage === 'rapoarte'    && <Rapoarte />}
    </Layout>
  )
}