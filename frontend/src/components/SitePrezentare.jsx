import { Routes, Route } from 'react-router-dom'
import SpLayout from './sp/SpLayout'
import HomePage from './sp/HomePage'
import DesprePage from './sp/DesprePage'
import ServiciiPage from './sp/ServiciiPage'
import ProgramContactPage from './sp/ProgramContactPage'

export default function SitePrezentare() {
  return (
    <SpLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/despre" element={<DesprePage />} />
        <Route path="/servicii" element={<ServiciiPage />} />
        <Route path="/program" element={<ProgramContactPage />} />
      </Routes>
    </SpLayout>
  )
}