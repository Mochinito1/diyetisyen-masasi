import type { ReactElement } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth'
import Layout from './Layout'
import Login from './Login'
import Home from './Home'
import { NAV } from './nav'
import { useRole } from './role'
import Clients from '../features/clients/Clients'
import Calculator from '../features/calculator/Calculator'
import Foods from '../features/foods/Foods'
import Menu from '../features/menu/Menu'
import Appointments from '../features/appointments/Appointments'
import Profile from '../features/portal/Profile'
import Admin from '../features/admin/Admin'
import Settings from '../features/settings/Settings'

const PAGES: Record<string, ReactElement> = {
  '/danisanlar': <Clients />,
  '/hesaplama': <Calculator />,
  '/besinler': <Foods />,
  '/menu': <Menu />,
  '/randevu': <Appointments />,
  '/profil': <Profile />,
  '/ayarlar': <Settings />,
  '/yonetim': <Admin />,
}

export default function App() {
  const { role } = useRole()
  const { session, ready } = useAuth()
  if (!ready) return <div className="grid min-h-screen place-items-center text-stone-500" role="status">Yükleniyor…</div>
  if (!session) return <Login />
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        {NAV.map((n) => (
          <Route
            key={n.to}
            path={n.to.slice(1)}
            element={n.roles.includes(role) ? PAGES[n.to] : <Navigate to="/" replace />}
          />
        ))}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}