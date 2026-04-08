import { Routes, Route } from 'react-router-dom'
import SpLayout from './sp/SpLayout'
import HomePage from './sp/HomePage'
import DesprePage from './sp/DesprePage'
import ServiciiPage from './sp/ServiciiPage'
import ProgramContactPage from './sp/ProgramContactPage'
import PoliticaPage from './sp/PoliticaPage'

export default function SitePrezentare() {
  return (
    <SpLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/despre" element={<DesprePage />} />
        <Route path="/servicii" element={<ServiciiPage />} />
        <Route path="/program" element={<ProgramContactPage />} />
        <Route path="/politica-confidentialitate" element={<PoliticaPage />} />
      </Routes>
    </SpLayout>
  )
}