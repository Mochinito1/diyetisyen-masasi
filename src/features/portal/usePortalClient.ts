import { useState } from 'react'
import { useAuth } from '../../app/auth'
import { load, save } from '../../lib/storage'
import { useClients } from '../clients/useClients'
import type { Client } from '../clients/types'

const KEY = 'dm.asClient'

/** Danışan portalının danışanı: danışan hesabında kendi kaydı, yönetici görünümünde seçilen danışan */
export function usePortalClient() {
  const { session } = useAuth()
  const { clients, upsert } = useClients()
  const [sel, setSel] = useState<string>(() => load<string>(KEY, ''))
  const id = session?.kind === 'danisan' && session.clientId ? session.clientId : sel
  const client = clients.find((c) => c.id === id) ?? (session?.kind === 'danisan' ? null : clients[0] ?? null)
  return {
    clients,
    client,
    choose: (cid: string) => {
      setSel(cid)
      save(KEY, cid)
    },
    update: (patch: Partial<Client>) => client && upsert({ ...client, ...patch, updated: Date.now() }),
  }
}