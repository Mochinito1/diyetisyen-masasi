import { useState } from 'react'
import { load, save } from '../../lib/storage'

/** Diyetisyen olmak isteyenlerin başvuruları (tarayıcıda saklanır) */
export interface Application {
  id: string
  name: string
  title: string
  note: string
  status: 'pending' | 'approved' | 'rejected'
  ts: number
}

const KEY = 'dm.applications'

export function useApplications() {
  const [list, setList] = useState<Application[]>(() => load<Application[]>(KEY, []))
  const commit = (next: Application[]) => {
    setList(next)
    save(KEY, next)
  }
  return {
    list,
    add: (a: Omit<Application, 'id' | 'status' | 'ts'>) => commit([{ ...a, id: crypto.randomUUID(), status: 'pending', ts: Date.now() }, ...list]),
    setStatus: (id: string, status: Application['status']) => commit(list.map((a) => (a.id === id ? { ...a, status } : a))),
    remove: (id: string) => commit(list.filter((a) => a.id !== id)),
  }
}