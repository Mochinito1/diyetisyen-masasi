import { useRole } from '../../app/role'
import { useClients } from '../clients/useClients'
import ClientView from './ClientView'
import DietitianView from './DietitianView'
import { useAppointments } from './useAppointments'

export default function Appointments() {
  const { role } = useRole()
  const { clients } = useClients()
  const api = useAppointments()
  return role === 'danisan' ? <ClientView api={api} clients={clients} /> : <DietitianView api={api} clients={clients} />
}