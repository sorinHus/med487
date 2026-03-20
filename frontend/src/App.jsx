import { useState } from 'react'
import { getToken, logout } from './auth'
import Login from './components/Login'
import PacientList from './components/PacientList'

export default function App() {
  const [loggedIn, setLoggedIn] = useState(!!getToken())

  const handleLogout = () => {
    logout()
    setLoggedIn(false)
  }

  return loggedIn
    ? <PacientList onLogout={handleLogout} />
    : <Login onLogin={() => setLoggedIn(true)} />
}