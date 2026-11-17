import { useCallback, useState } from 'react'
import { EMPTY_ANAMNESIS } from '../../lib/dossier'
import { load, save } from '../../lib/storage'
import type { Client } from './types'

const KEY = 'dm.clients'

export function useClients() {
  const [clients, setClients] = useState<Client[]>(() => load<Client[]>(KEY, []).map((c) => ({ ...c, menu: c.menu ?? [], mnote: c.mnote ?? '', an: { ...EMPTY_ANAMNESIS, ...c.an }, conds: c.conds ?? [], meas: c.meas ?? [], lab: c.lab ?? [], sess: c.sess ?? [] })))

  const commit = useCallback((next: Client[]) => {
    setClients(next)
    save(KEY, next)
  }, [])

  const upsert = (c: Client) =>
    commit(clients.some((x) => x.id === c.id) ? clients.map((x) => (x.id === c.id ? c : x)) : [c, ...clients])
  const remove = (id: string) => commit(clients.filter((c) => c.id !== id))

  return { clients, upsert, remove }
}