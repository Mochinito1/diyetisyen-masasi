import { useState } from 'react'
import { useAuth } from '../../app/auth'
import { DEFAULT_AVAILABILITY, type Appointment, type Availability } from '../../lib/appointments'
import { DEMO_DIETITIAN, availabilityKey, ownerOf, ownerOfClient } from '../../lib/dietitians'
import { load, save } from '../../lib/storage'

const KEY = 'dm.appointments'

/**
 * Randevular ve çalışma saatleri. Çalışma saatleri diyetisyene özeldir. Diyetisyen yalnızca kendi randevularını görür;
 * yönetici hepsini görür.
 */
export function useAppointments() {
  const { session } = useAuth()
  const owner = ownerOf(session)
  const [all, setAll] = useState<Appointment[]>(() => load<Appointment[]>(KEY, []))
  const [av, setAvState] = useState<Availability>(() => ({ ...DEFAULT_AVAILABILITY, ...load<Partial<Availability>>(availabilityKey(owner), {}) }))

  const commit = (next: Appointment[]) => {
    setAll(next)
    save(KEY, next)
  }
  // Diyetisyen yalnızca şu an kendisini seçmiş danışanların randevularını görür (danışan diyetisyen değiştirince eskisi göremez)
  const mine = session?.kind === 'diyetisyen' ? new Set(load<{ id: string; dietitian?: string }[]>('dm.clients', []).filter((c) => ownerOfClient(c) === owner).map((c) => c.id)) : null
  const aps = session?.kind === 'admin' ? all : all.filter((a) => (a.dietitian ?? DEMO_DIETITIAN) === owner && (!mine || mine.has(a.clientId)))
  return {
    aps,
    av,
    owner,
    add: (a: Appointment) => commit([...all, { ...a, dietitian: a.dietitian ?? owner }]),
    patch: (id: string, p: Partial<Appointment>) => commit(all.map((a) => (a.id === id ? { ...a, ...p } : a))),
    remove: (id: string) => commit(all.filter((a) => a.id !== id)),
    setAv: (next: Availability) => {
      setAvState(next)
      save(availabilityKey(owner), next)
    },
  }
}

export type ApApi = ReturnType<typeof useAppointments>