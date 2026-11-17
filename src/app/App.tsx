import { Route, Routes } from 'react-router-dom'
import Layout from './Layout'
import Home from './Home'
import Clients from '../features/clients/Clients'
import Calculator from '../features/calculator/Calculator'
import Foods from '../features/foods/Foods'
import Menu from '../features/menu/Menu'
import Appointments from '../features/appointments/Appointments'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="danisanlar" element={<Clients />} />
        <Route path="hesaplama" element={<Calculator />} />
        <Route path="besinler" element={<Foods />} />
        <Route path="menu" element={<Menu />} />
        <Route path="randevu" element={<Appointments />} />
      </Route>
    </Routes>
  )
}