import { useState } from 'react'
import { APPS_KEY, removeApplication, setApplicationStatus, type Application } from '../../lib/auth'
import { load } from '../../lib/storage'

export type { Application }

/** Diyetisyen başvuruları (tarayıcıda saklanır); durum değişince bağlı hesap da güncellenir */
export function useApplications() {
  const [list, setList] = useState<Application[]>(() => load<Application[]>(APPS_KEY, []))
  const refresh = () => setList(load<Application[]>(APPS_KEY, []))
  return {
    list,
    setStatus: (id: string, status: Application['status']) => { setApplicationStatus(id, status); refresh() },
    remove: (id: string) => { removeApplication(id); refresh() },
  }
}