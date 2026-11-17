import { useState } from 'react'
import { DEFAULT_AVAILABILITY, type Appointment, type Availability } from '../../lib/appointments'
import { load, save } from '../../lib/storage'

const KEY = 'dm.appointments'
const AV_KEY = 'dm.availability'

export function useAppointments() {
  const [aps, setAps] = useState<Appointment[]>(() => load<Appointment[]>(KEY, []))
  const [av, setAvState] = useState<Availability>(() => ({ ...DEFAULT_AVAILABILITY, ...load<Partial<Availability>>(AV_KEY, {}) }))

  const commit = (next: Appointment[]) => {
    setAps(next)
    save(KEY, next)
  }
  return {
    aps,
    av,
    add: (a: Appointment) => commit([...aps, a]),
    patch: (id: string, p: Partial<Appointment>) => commit(aps.map((a) => (a.id === id ? { ...a, ...p } : a))),
    remove: (id: string) => commit(aps.filter((a) => a.id !== id)),
    setAv: (next: Availability) => {
      setAvState(next)
      save(AV_KEY, next)
    },
  }
}

export type ApApi = ReturnType<typeof useAppointments>