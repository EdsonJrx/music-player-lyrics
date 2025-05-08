import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import ThemeSettings from './pages/ThemeSettings'
import AppSettings from './pages/AppSettings'
import Home from './pages/Home'

export default function App() {
  return (
    <MemoryRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/theme" element={<ThemeSettings />} />
        <Route path="/settings" element={<AppSettings />} />
      </Routes>
    </MemoryRouter>
  )
}
